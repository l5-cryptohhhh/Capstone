package org.example.capstone.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.capstone.auth.AuthService.UserDto;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Legge "Authorization: Bearer ..." e, se la sessione è valida, mette l'utente nella richiesta. Non blocca nessuno. */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ATTRIBUTE = "scoutai.user";

    private final AuthService auth;

    public AuthInterceptor(AuthService auth) {
        this.auth = auth;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = bearerToken(request);
        if (token != null) {
            auth.authenticate(token).ifPresent(u -> request.setAttribute(USER_ATTRIBUTE, u));
        }
        return true;
    }

    public static String bearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return header != null && header.startsWith("Bearer ") ? header.substring(7).trim() : null;
    }

    /** Utente autenticato, o null per un visitatore anonimo. */
    public static UserDto currentUser(HttpServletRequest request) {
        return (UserDto) request.getAttribute(USER_ATTRIBUTE);
    }
}
