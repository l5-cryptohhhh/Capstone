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
    private final SecurityProperties securityProperties;

    public WebConfig(AdminKeyInterceptor adminKeyInterceptor, SecurityProperties securityProperties) {
        this.adminKeyInterceptor = adminKeyInterceptor;
        this.securityProperties = securityProperties;
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

    /** Solo il frontend configurato può chiamare l'API dal browser; nessun "*". */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(securityProperties.corsAllowedOrigin())
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");
    }
}
