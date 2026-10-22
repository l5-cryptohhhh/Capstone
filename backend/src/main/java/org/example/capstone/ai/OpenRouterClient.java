package org.example.capstone.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Client minimale di OpenRouter (API compatibile OpenAI /chat/completions). */
@Component
public class OpenRouterClient {

    private static final int ATTEMPTS = 3;
    private static final long RETRY_DELAY_MS = 1500;
    /** Dopo un 429 il limite è al minuto: si aspetta quanto indica il servizio, ma mai più di così. */
    private static final long MAX_RATE_LIMIT_WAIT_MS = 15_000;
    private static final long DEFAULT_RATE_LIMIT_WAIT_MS = 8_000;

    private final RestClient client;
    private final String model;
    private final String reasoningEffort;
    private final boolean keyConfigured;

    public OpenRouterClient(OpenRouterProperties props) {
        this.model = props.model();
        this.reasoningEffort = props.reasoningEffort() == null ? "" : props.reasoningEffort().strip();
        this.keyConfigured = props.key() != null && !props.key().isBlank();

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
        factory.setReadTimeout(Duration.ofSeconds(60));

        this.client = RestClient.builder()
                .baseUrl(props.baseUrl())
                .defaultHeader("Authorization", "Bearer " + (keyConfigured ? props.key() : ""))
                .requestFactory(factory)
                .build();
    }

    /** Una sola domanda, una sola risposta di testo. {@code json=true} chiede output JSON. */
    public String complete(String system, String user, boolean json) {
        if (!keyConfigured) {
            throw new ApiException(ErrorCode.AI_UNAVAILABLE, "OPENROUTER_API_KEY non configurata");
        }
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("temperature", 0.2);
        body.put("messages", List.of(
                Map.of("role", "system", "content", system),
                Map.of("role", "user", "content", user)));
        if (!reasoningEffort.isEmpty()) {
            body.put("reasoning_effort", reasoningEffort);
        }
        if (json) {
            body.put("response_format", Map.of("type", "json_object"));
        }

        // I modelli gratuiti vanno spesso in sovraccarico (anche con HTTP 200 e un campo "error"): si riprova
        // qualche volta prima di arrendersi.
        ApiException last = null;
        for (int attempt = 1; attempt <= ATTEMPTS; attempt++) {
            try {
                return callOnce(body);
            } catch (RateLimitedException e) {
                last = e;
                if (attempt < ATTEMPTS) {
                    pause(e.waitMillis);
                }
            } catch (ApiException e) {
                last = e;
                // Timeout o rete assente: riprovare farebbe solo aspettare di più
                if (e.getCause() != null) {
                    throw e;
                }
                if (attempt < ATTEMPTS) {
                    pause(RETRY_DELAY_MS * attempt);
                }
            }
        }
        throw last;
    }

    private String callOnce(Map<String, Object> body) {
        ChatResponse response;
        try {
            response = client.post().uri("/chat/completions").body(body).retrieve().body(ChatResponse.class);
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new RateLimitedException(waitFor(e));
        } catch (RestClientException e) {
            throw new ApiException(ErrorCode.AI_UNAVAILABLE, "Servizio AI non raggiungibile", e);
        }
        if (response != null && response.error() != null) {
            throw new ApiException(ErrorCode.AI_UNAVAILABLE,
                    "Il modello AI è sovraccarico o non disponibile: riprova tra poco");
        }
        if (response == null || response.choices() == null || response.choices().isEmpty()
                || response.choices().get(0).message() == null
                || response.choices().get(0).message().content() == null
                || response.choices().get(0).message().content().isBlank()) {
            throw new ApiException(ErrorCode.AI_UNAVAILABLE, "Risposta vuota dal servizio AI");
        }
        return response.choices().get(0).message().content();
    }

    /** Secondi indicati da Retry-After, se presenti e sensati; altrimenti un'attesa di default. */
    private static long waitFor(HttpClientErrorException e) {
        String header = e.getResponseHeaders() == null ? null : e.getResponseHeaders().getFirst("retry-after");
        if (header != null) {
            try {
                double seconds = Double.parseDouble(header.strip());
                return Math.min(MAX_RATE_LIMIT_WAIT_MS, Math.max(1000, (long) Math.ceil(seconds * 1000)));
            } catch (NumberFormatException ignored) {
                // intestazione non numerica: vale l'attesa di default
            }
        }
        return DEFAULT_RATE_LIMIT_WAIT_MS;
    }

    /** Limite di richieste o di token al minuto raggiunto: va riprovato dopo {@code waitMillis}. */
    private static final class RateLimitedException extends ApiException {
        private final long waitMillis;

        RateLimitedException(long waitMillis) {
            super(ErrorCode.AI_UNAVAILABLE, "Il servizio AI ha raggiunto il limite di richieste: riprova tra poco");
            this.waitMillis = waitMillis;
        }
    }

    private static void pause(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChatResponse(List<Choice> choices, Map<String, Object> error) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Choice(Message message) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Message(String content) {
    }
}
