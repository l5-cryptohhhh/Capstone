package org.example.capstone.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/** Client minimale di OpenRouter (API compatibile OpenAI /chat/completions). */
@Component
public class OpenRouterClient {

    private final RestClient client;
    private final String model;
    private final boolean keyConfigured;

    public OpenRouterClient(OpenRouterProperties props) {
        this.model = props.model();
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
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("model", model);
        body.put("temperature", 0.2);
        body.put("messages", List.of(
                Map.of("role", "system", "content", system),
                Map.of("role", "user", "content", user)));
        if (json) {
            body.put("response_format", Map.of("type", "json_object"));
        }

        ChatResponse response;
        try {
            response = client.post().uri("/chat/completions").body(body).retrieve().body(ChatResponse.class);
        } catch (RestClientException e) {
            throw new ApiException(ErrorCode.AI_UNAVAILABLE, "Servizio AI non raggiungibile", e);
        }
        if (response == null || response.choices() == null || response.choices().isEmpty()
                || response.choices().get(0).message() == null
                || response.choices().get(0).message().content() == null) {
            throw new ApiException(ErrorCode.AI_UNAVAILABLE, "Risposta vuota dal servizio AI");
        }
        return response.choices().get(0).message().content();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChatResponse(List<Choice> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Choice(Message message) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Message(String content) {
    }
}
