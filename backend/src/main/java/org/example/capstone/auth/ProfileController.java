package org.example.capstone.auth;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.example.capstone.auth.AuthService.UserDto;
import org.example.capstone.config.OpenApiConfig;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

/** Profilo dell'utente connesso. Tutte le rotte sotto /auth/me richiedono la sessione (vedi WebConfig). */
@Tag(name = "Profilo", description = "Dati del profilo, foto, email, password, sessioni ed eliminazione dell'account")
@SecurityRequirement(name = OpenApiConfig.SESSION)
@RestController
@RequestMapping("/api/v1")
public class ProfileController {

    public record UpdateProfileRequest(@NotBlank @Size(max = 80) String displayName,
                                       @Size(max = 280) String bio,
                                       @Size(max = 80) String location,
                                       @Size(max = 80) String favoriteTeam,
                                       @Pattern(regexp = "GK|DEF|MID|ATT") String favoritePosition) {
    }

    public record ChangeEmailRequest(@NotBlank @Email @Size(max = 254) String newEmail,
                                     @NotBlank @Size(max = 72) String currentPassword) {
    }

    public record ChangePasswordRequest(@NotBlank @Size(max = 72) String currentPassword,
                                        @NotBlank @Size(min = 8, max = 72) String newPassword) {
    }

    public record PasswordRequest(@NotBlank @Size(max = 72) String password) {
    }

    private final ProfileService profile;

    public ProfileController(ProfileService profile) {
        this.profile = profile;
    }

    @PatchMapping("/auth/me")
    public UserDto update(HttpServletRequest request, @Valid @RequestBody UpdateProfileRequest r) {
        return profile.updateProfile(userId(request), r.displayName(), r.bio(), r.location(), r.favoriteTeam(),
                r.favoritePosition());
    }

    @PostMapping("/auth/me/email")
    public UserDto changeEmail(HttpServletRequest request, @Valid @RequestBody ChangeEmailRequest r) {
        return profile.changeEmail(userId(request), r.newEmail(), r.currentPassword());
    }

    @PostMapping("/auth/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(HttpServletRequest request, @Valid @RequestBody ChangePasswordRequest r) {
        profile.changePassword(userId(request), r.currentPassword(), r.newPassword(),
                AuthInterceptor.bearerToken(request));
    }

    @PostMapping("/auth/me/sessions/revoke-others")
    public Map<String, Integer> revokeOthers(HttpServletRequest request) {
        return Map.of("revoked", profile.revokeOtherSessions(userId(request), AuthInterceptor.bearerToken(request)));
    }

    /** Eliminazione definitiva dell'account (POST perché porta la password nel corpo). */
    @PostMapping("/auth/me/delete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(HttpServletRequest request, @Valid @RequestBody PasswordRequest r) {
        profile.deleteAccount(userId(request), r.password());
    }

    /** La foto arriva come corpo grezzo dell'immagine, con il suo Content-Type. */
    @PutMapping(value = "/auth/me/avatar", consumes = MediaType.ALL_VALUE)
    public UserDto setAvatar(HttpServletRequest request, @RequestHeader("Content-Type") String contentType,
                             @RequestBody byte[] body) {
        return profile.setAvatar(userId(request), contentType, body);
    }

    @DeleteMapping("/auth/me/avatar")
    public UserDto removeAvatar(HttpServletRequest request) {
        return profile.removeAvatar(userId(request));
    }

    /** Pubblica: serve per mostrare la foto in un <img>, che non può inviare l'header Authorization. */
    @SecurityRequirements
    @GetMapping("/users/{id}/avatar")
    public ResponseEntity<byte[]> avatar(@PathVariable Long id) {
        return profile.avatar(id)
                .map(a -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(a.contentType()))
                        // L'URL porta ?v=<timestamp>: cambia con la foto, quindi si può tenere in cache
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                        .body(a.data()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private static Long userId(HttpServletRequest request) {
        return AuthInterceptor.currentUser(request).id();
    }
}
