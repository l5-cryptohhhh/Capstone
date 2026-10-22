package org.example.capstone.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("scoutai.openrouter")
public record OpenRouterProperties(String baseUrl, String key, String model, String reasoningEffort) {

    /** La chiave non deve mai finire nei log. */
    @Override
    public String toString() {
        return "OpenRouterProperties[baseUrl=" + baseUrl + ", model=" + model + ", reasoningEffort=" + reasoningEffort + ", key=***]";
    }
}
