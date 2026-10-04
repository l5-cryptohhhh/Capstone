package org.example.capstone.ingestion.apifootball;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("scoutai.api-football")
public record ApiFootballProperties(String baseUrl, String key) {

    /** La chiave non deve mai finire nei log. */
    @Override
    public String toString() {
        return "ApiFootballProperties[baseUrl=" + baseUrl + ", key=***]";
    }
}
