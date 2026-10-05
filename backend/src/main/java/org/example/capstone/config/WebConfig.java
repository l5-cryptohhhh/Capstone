package org.example.capstone.config;

import org.example.capstone.auth.AuthInterceptor;
import org.example.capstone.auth.RequireAuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableScheduling
public class WebConfig implements WebMvcConfigurer {

    private final AdminKeyInterceptor adminKeyInterceptor;
    private final AuthInterceptor authInterceptor;
    private final RequireAuthInterceptor requireAuthInterceptor;
    private final AiRateLimitInterceptor aiRateLimitInterceptor;
    private final SecurityProperties security;

    public WebConfig(AdminKeyInterceptor adminKeyInterceptor, AuthInterceptor authInterceptor,
                     RequireAuthInterceptor requireAuthInterceptor, AiRateLimitInterceptor aiRateLimitInterceptor,
                     SecurityProperties security) {
        this.adminKeyInterceptor = adminKeyInterceptor;
        this.authInterceptor = authInterceptor;
        this.requireAuthInterceptor = requireAuthInterceptor;
        this.aiRateLimitInterceptor = aiRateLimitInterceptor;
        this.security = security;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminKeyInterceptor).addPathPatterns("/api/v1/admin/**");
        registry.addInterceptor(authInterceptor).addPathPatterns("/api/v1/**");
        // La scheda con le statistiche e l'AI sono per gli utenti registrati. La ricerca (/players) è pubblica ma
        // per i visitatori mostra solo i primi giocatori di ogni campionato (vedi PlayerSearchService).
        registry.addInterceptor(requireAuthInterceptor)
                .addPathPatterns("/api/v1/players/*", "/api/v1/ai/**", "/api/v1/auth/me");
        registry.addInterceptor(aiRateLimitInterceptor).addPathPatterns("/api/v1/ai/**");
    }

    /** Solo il frontend configurato può chiamare l'API dal browser. */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(security.corsAllowedOrigin())
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization", "X-Admin-Key");
    }
}
