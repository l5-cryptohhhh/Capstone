package org.example.capstone.auth;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfileServiceTest {

    private static final String PASSWORD = "password-attuale";

    private final AppUserRepository users = mock(AppUserRepository.class);
    private final AuthSessionRepository sessions = mock(AuthSessionRepository.class);
    private final UserAvatarRepository avatars = mock(UserAvatarRepository.class);
    private final ProfileService service = new ProfileService(users, sessions, avatars);
    private AppUser user;

    @BeforeEach
    void setUp() {
        user = new AppUser();
        user.setId(7L);
        user.setEmail("anna@example.com");
        user.setDisplayName("Anna");
        user.setPasswordHash(new BCryptPasswordEncoder().encode(PASSWORD));
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(users.save(any(AppUser.class))).thenAnswer(i -> i.getArgument(0));
    }

    private static ErrorCode codeOf(Runnable action) {
        return assertThrows(ApiException.class, action::run).getCode();
    }

    @Test
    void updateProfileTrimsAndClearsBlankFields() {
        var dto = service.updateProfile(7L, "  Anna Rossi ", "  ", "Roma", "", "ATT");

        assertEquals("Anna Rossi", dto.displayName());
        assertNull(dto.bio());
        assertEquals("Roma", dto.location());
        assertNull(dto.favoriteTeam());
        assertEquals("ATT", dto.favoritePosition());
    }

    @Test
    void updateProfileRejectsEmptyNameAndUnknownPosition() {
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.updateProfile(7L, "  ", null, null, null, null)));
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.updateProfile(7L, "Anna", null, null, null, "XX")));
    }

    @Test
    void changeEmailNeedsCurrentPassword() {
        assertEquals(ErrorCode.WRONG_PASSWORD,
                codeOf(() -> service.changeEmail(7L, "nuova@example.com", "sbagliata")));
        verify(users, never()).save(any());
    }

    @Test
    void changeEmailRejectsAddressAlreadyInUse() {
        when(users.existsByEmail("occupata@example.com")).thenReturn(true);

        assertEquals(ErrorCode.EMAIL_ALREADY_REGISTERED,
                codeOf(() -> service.changeEmail(7L, "Occupata@Example.com", PASSWORD)));
    }

    @Test
    void changeEmailNormalizesAndSaves() {
        var dto = service.changeEmail(7L, "  Nuova@Example.com ", PASSWORD);

        assertEquals("nuova@example.com", dto.email());
    }

    @Test
    void changePasswordChecksCurrentOneAndClosesOtherSessions() {
        assertEquals(ErrorCode.WRONG_PASSWORD,
                codeOf(() -> service.changePassword(7L, "sbagliata", "nuova-password", "tok")));
        verify(sessions, never()).deleteOthers(anyLong(), any());

        service.changePassword(7L, PASSWORD, "nuova-password", "tok");

        assertTrue(new BCryptPasswordEncoder().matches("nuova-password", user.getPasswordHash()));
        verify(sessions).deleteOthers(eq(7L), eq(AuthService.hash("tok")));
    }

    @Test
    void changePasswordRejectsSamePassword() {
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.changePassword(7L, PASSWORD, PASSWORD, "tok")));
    }

    @Test
    void deleteAccountNeedsPassword() {
        assertEquals(ErrorCode.WRONG_PASSWORD, codeOf(() -> service.deleteAccount(7L, "sbagliata")));
        verify(users, never()).delete(any());

        service.deleteAccount(7L, PASSWORD);
        verify(users).delete(user);
    }

    @Test
    void avatarMustBeSmallRealImageOfAllowedType() {
        byte[] jpeg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01, 0x02};

        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.setAvatar(7L, "image/gif", jpeg)));
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.setAvatar(7L, "image/jpeg", new byte[0])));
        // dichiara JPEG ma non lo è
        assertEquals(ErrorCode.INVALID_REQUEST,
                codeOf(() -> service.setAvatar(7L, "image/jpeg", new byte[]{1, 2, 3, 4, 5, 6})));
        byte[] big = new byte[ProfileService.MAX_AVATAR_BYTES + 1];
        big[0] = (byte) 0xFF;
        big[1] = (byte) 0xD8;
        big[2] = (byte) 0xFF;
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.setAvatar(7L, "image/jpeg", big)));
    }

    @Test
    void validAvatarIsStoredAndExposedWithVersionedUrl() {
        byte[] jpeg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01, 0x02};
        when(avatars.findById(7L)).thenReturn(Optional.empty());

        var dto = service.setAvatar(7L, "image/jpeg; charset=binary", jpeg);

        assertNotNull(dto.avatarUrl());
        assertTrue(dto.avatarUrl().startsWith("/api/v1/users/7/avatar?v="));
        verify(avatars).save(any(UserAvatar.class));
    }

    @Test
    void removeAvatarClearsVersion() {
        user.setAvatarUpdatedAt(java.time.Instant.now());
        when(avatars.findById(7L)).thenReturn(Optional.of(new UserAvatar()));

        var dto = service.removeAvatar(7L);

        assertNull(dto.avatarUrl());
        verify(avatars).delete(any(UserAvatar.class));
    }

    @Test
    void webpSignatureIsRecognized() {
        byte[] webp = {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P', 0};
        assertTrue(ProfileService.matchesType("image/webp", webp));
        assertTrue(!ProfileService.matchesType("image/png", webp));
    }
}
