package org.example.capstone.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("scoutai.security")
public record SecurityProperties(String adminKey, String corsAllowedOrigin) {

    /** La chiave admin non deve mai finire nei log. */
    @Override
    public String toString() {
        return "SecurityProperties[adminKey=***, corsAllowedOrigin=" + corsAllowedOrigin + "]";
    }
}
