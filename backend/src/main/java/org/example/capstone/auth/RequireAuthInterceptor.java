package org.example.capstone.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;

/** Rifiuta con 401 le richieste senza un utente autenticato (va registrato dopo AuthInterceptor). */
@Component
public class RequireAuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Il preflight CORS non porta credenziali: lo gestisce il layer CORS
        if (CorsUtils.isPreFlightRequest(request)) return true;
        if (AuthInterceptor.currentUser(request) == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED, "Accedi per vedere questo contenuto");
        }
        return true;
    }
}
