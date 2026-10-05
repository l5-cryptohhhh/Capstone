package org.example.capstone.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Protegge gli endpoint /api/v1/admin/** con l'header X-Admin-Key. Se la chiave non è configurata, sono tutti chiusi. */
@Component
public class AdminKeyInterceptor implements HandlerInterceptor {

    static final String HEADER = "X-Admin-Key";

    private final byte[] expected;

    public AdminKeyInterceptor(SecurityProperties properties) {
        String key = properties.adminKey();
        this.expected = key == null || key.isBlank() ? null : key.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Il preflight CORS del browser non porta header personalizzati: lo gestisce la configurazione CORS
        if (CorsUtils.isPreFlightRequest(request)) {
            return true;
        }
        if (expected == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED, "Endpoint admin disabilitati: ADMIN_API_KEY non configurata");
        }
        String provided = request.getHeader(HEADER);
        // Confronto a tempo costante per non rivelare la chiave tramite i tempi di risposta
        boolean valid = provided != null
                && MessageDigest.isEqual(expected, provided.getBytes(StandardCharsets.UTF_8));
        if (!valid) {
            throw new ApiException(ErrorCode.UNAUTHORIZED, "Chiave admin mancante o non valida");
        }
        return true;
    }
}
