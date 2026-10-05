package org.example.capstone.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableScheduling
public class WebConfig implements WebMvcConfigurer {

    private final AdminKeyInterceptor adminKeyInterceptor;
    private final AiRateLimitInterceptor aiRateLimitInterceptor;
    private final SecurityProperties security;

    public WebConfig(AdminKeyInterceptor adminKeyInterceptor, AiRateLimitInterceptor aiRateLimitInterceptor,
                     SecurityProperties security) {
        this.adminKeyInterceptor = adminKeyInterceptor;
        this.aiRateLimitInterceptor = aiRateLimitInterceptor;
        this.security = security;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminKeyInterceptor).addPathPatterns("/api/v1/admin/**");
        registry.addInterceptor(aiRateLimitInterceptor).addPathPatterns("/api/v1/ai/**");
    }

    /** Solo il frontend configurato può chiamare l'API dal browser. */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(security.corsAllowedOrigin())
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type", "X-Admin-Key");
    }
}
