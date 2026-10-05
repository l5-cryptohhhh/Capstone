package org.example.capstone.stats;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * @param minMinutes    minuti minimi per entrare nella coorte dei percentili (sotto, il campione è troppo piccolo)
 * @param minCohortSize dimensione minima della coorte per calcolare i percentili
 */
@ConfigurationProperties("scoutai.stats")
public record StatsProperties(@DefaultValue("450") int minMinutes, @DefaultValue("10") int minCohortSize) {
}
