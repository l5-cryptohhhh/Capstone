package org.example.capstone.search;

import org.example.capstone.stats.MetricKey;

import java.math.BigDecimal;

/** Vincolo su una metrica: almeno uno tra min e max è valorizzato. */
public record MetricFilter(MetricKey metric, FilterType type, BigDecimal min, BigDecimal max) {
}
