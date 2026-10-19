package org.example.capstone.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Descrizione dell'API per Swagger UI (/swagger-ui.html) e per lo schema OpenAPI (/v3/api-docs). */
@Configuration
public class OpenApiConfig {

    public static final String SESSION = "sessione";
    public static final String ADMIN_KEY = "chiaveAdmin";

    @Bean
    OpenAPI scoutAiApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Scout AI API")
                        .version("v1")
                        .description("""
                                Dati reali sui giocatori dei principali campionati, percentili per ruolo, confronto, \
                                analisi con intelligenza artificiale e profilo utente. \
                                Per le rotte protette: esegui `POST /auth/login`, copia il `token` e premi Authorize."""))
                .components(new Components()
                        .addSecuritySchemes(SESSION, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .description("Token di sessione restituito da login o registrazione"))
                        .addSecuritySchemes(ADMIN_KEY, new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-Admin-Key")
                                .description("Chiave amministratore (ADMIN_API_KEY) per le rotte /admin")));
    }
}
