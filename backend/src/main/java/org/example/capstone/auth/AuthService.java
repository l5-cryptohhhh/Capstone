package org.example.capstone.auth;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class AuthService {

    static final Duration SESSION_TTL = Duration.ofDays(30);

    public record UserDto(Long id, String email, String displayName) {
    }

    public record AuthResponse(String token, UserDto user) {
    }

    private final AppUserRepository users;
    private final AuthSessionRepository sessions;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();
    /** Hash di confronto usato quando l'email non esiste, così login riuscito e fallito costano uguale. */
    private final String dummyHash = encoder.encode("scoutai-dummy-password");

    public AuthService(AppUserRepository users, AuthSessionRepository sessions) {
        this.users = users;
        this.sessions = sessions;
    }

    @Transactional
    public AuthResponse register(String email, String displayName, String password) {
        String normalized = normalize(email);
        if (users.existsByEmail(normalized)) {
            throw new ApiException(ErrorCode.EMAIL_ALREADY_REGISTERED, "Esiste già un account con questa email");
        }
        AppUser user = new AppUser();
        user.setEmail(normalized);
        user.setDisplayName(displayName.trim());
        user.setPasswordHash(encoder.encode(password));
        return openSession(users.save(user));
    }

    @Transactional
    public AuthResponse login(String email, String password) {
        Optional<AppUser> user = users.findByEmail(normalize(email));
        boolean valid = encoder.matches(password, user.map(AppUser::getPasswordHash).orElse(dummyHash));
        if (user.isEmpty() || !valid) {
            throw new ApiException(ErrorCode.UNAUTHORIZED, "Email o password errate");
        }
        return openSession(user.get());
    }

    @Transactional
    public void logout(String token) {
        sessions.findById(hash(token)).ifPresent(sessions::delete);
    }

    /** Utente della sessione, se il token è valido e non scaduto. */
    @Transactional(readOnly = true)
    public Optional<UserDto> authenticate(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return sessions.findWithUser(hash(token))
                .filter(s -> s.getExpiresAt().isAfter(Instant.now()))
                .map(s -> toDto(s.getUser()));
    }

    private AuthResponse openSession(AppUser user) {
        byte[] raw = new byte[32];
        random.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

        AuthSession session = new AuthSession();
        session.setTokenHash(hash(token));
        session.setUser(user);
        session.setExpiresAt(Instant.now().plus(SESSION_TTL));
        sessions.save(session);
        return new AuthResponse(token, toDto(user));
    }

    private static UserDto toDto(AppUser u) {
        return new UserDto(u.getId(), u.getEmail(), u.getDisplayName());
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase();
    }

    private static String hash(String token) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
