package org.example.capstone.auth;

import org.example.capstone.auth.AuthService.UserDto;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

/** Profilo dell'utente: dati, foto, credenziali e chiusura dell'account. */
@Service
public class ProfileService {

    /** Dimensione massima della foto (il browser la ridimensiona a 256 px prima di inviarla). */
    static final int MAX_AVATAR_BYTES = 256 * 1024;
    static final Set<String> AVATAR_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> POSITIONS = Set.of("GK", "DEF", "MID", "ATT");

    public record Avatar(String contentType, byte[] data, Instant updatedAt) {
    }

    private final AppUserRepository users;
    private final AuthSessionRepository sessions;
    private final UserAvatarRepository avatars;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public ProfileService(AppUserRepository users, AuthSessionRepository sessions, UserAvatarRepository avatars) {
        this.users = users;
        this.sessions = sessions;
        this.avatars = avatars;
    }

    @Transactional
    public UserDto updateProfile(Long userId, String displayName, String bio, String location, String favoriteTeam,
                                 String favoritePosition) {
        AppUser user = load(userId);
        String name = displayName == null ? "" : displayName.trim();
        if (name.isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Il nome non può essere vuoto");
        }
        String position = blankToNull(favoritePosition);
        if (position != null && !POSITIONS.contains(position)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Ruolo non valido");
        }
        user.setDisplayName(name);
        user.setBio(blankToNull(bio));
        user.setLocation(blankToNull(location));
        user.setFavoriteTeam(blankToNull(favoriteTeam));
        user.setFavoritePosition(position);
        return AuthService.toDto(users.save(user));
    }

    @Transactional
    public UserDto changeEmail(Long userId, String newEmail, String currentPassword) {
        AppUser user = load(userId);
        requirePassword(user, currentPassword);
        String normalized = AuthService.normalize(newEmail);
        if (!normalized.equals(user.getEmail()) && users.existsByEmail(normalized)) {
            throw new ApiException(ErrorCode.EMAIL_ALREADY_REGISTERED, "Esiste già un account con questa email");
        }
        user.setEmail(normalized);
        return AuthService.toDto(users.save(user));
    }

    /** Cambia la password e chiude le altre sessioni: chi aveva la vecchia password non resta dentro. */
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword, String currentToken) {
        AppUser user = load(userId);
        requirePassword(user, currentPassword);
        if (encoder.matches(newPassword, user.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "La nuova password deve essere diversa da quella attuale");
        }
        user.setPasswordHash(encoder.encode(newPassword));
        users.save(user);
        sessions.deleteOthers(userId, AuthService.hash(currentToken));
    }

    @Transactional
    public int revokeOtherSessions(Long userId, String currentToken) {
        return sessions.deleteOthers(userId, AuthService.hash(currentToken));
    }

    @Transactional
    public void deleteAccount(Long userId, String password) {
        AppUser user = load(userId);
        requirePassword(user, password);
        // Sessioni e foto spariscono con l'utente (ON DELETE CASCADE)
        users.delete(user);
    }

    @Transactional
    public UserDto setAvatar(Long userId, String contentType, byte[] data) {
        String type = contentType == null ? "" : contentType.split(";")[0].trim().toLowerCase();
        if (!AVATAR_TYPES.contains(type)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Formato non supportato: usa JPEG, PNG o WEBP");
        }
        if (data == null || data.length == 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Immagine vuota");
        }
        if (data.length > MAX_AVATAR_BYTES) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Immagine troppo pesante (massimo 256 KB)");
        }
        if (!matchesType(type, data)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Il file non è un'immagine valida");
        }
        AppUser user = load(userId);
        Instant now = Instant.now();
        UserAvatar avatar = avatars.findById(userId).orElseGet(UserAvatar::new);
        avatar.setUserId(userId);
        avatar.setContentType(type);
        avatar.setData(data);
        avatar.setUpdatedAt(now);
        avatars.save(avatar);
        user.setAvatarUpdatedAt(now);
        return AuthService.toDto(users.save(user));
    }

    @Transactional
    public UserDto removeAvatar(Long userId) {
        AppUser user = load(userId);
        avatars.findById(userId).ifPresent(avatars::delete);
        user.setAvatarUpdatedAt(null);
        return AuthService.toDto(users.save(user));
    }

    @Transactional(readOnly = true)
    public Optional<Avatar> avatar(Long userId) {
        return avatars.findById(userId).map(a -> new Avatar(a.getContentType(), a.getData(), a.getUpdatedAt()));
    }

    private AppUser load(Long userId) {
        return users.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED, "Accedi di nuovo"));
    }

    private void requirePassword(AppUser user, String password) {
        if (password == null || !encoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(ErrorCode.WRONG_PASSWORD, "La password attuale non è corretta");
        }
    }

    /** Controlla i primi byte: il tipo dichiarato dal client da solo non basta. */
    static boolean matchesType(String type, byte[] d) {
        return switch (type) {
            case "image/jpeg" -> d.length > 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF;
            case "image/png" -> d.length > 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G';
            case "image/webp" -> d.length > 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                    && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P';
            default -> false;
        };
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
