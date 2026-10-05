package org.example.capstone.player.dto;

import org.example.capstone.stats.MetricUnit;

import java.math.BigDecimal;

/** Valore di una metrica e posizione rispetto ai pari ruolo. percentile è null se la coorte è troppo piccola. */
public record MetricValueDto(String key, String label, MetricUnit unit, BigDecimal value, Integer percentile,
                             Integer cohortSize) {
}
