package org.example.capstone.stats;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/** Calcolo dei percentili all'interno di una coorte (stesso ruolo, campionato e stagione). */
public final class PercentileCalculator {

    private PercentileCalculator() {
    }

    /**
     * @param values         valore della metrica per ogni statistica della coorte
     * @param higherIsBetter se false la scala è invertita (es. falli commessi: il valore più basso = 100)
     * @param minCohortSize  sotto questa dimensione i percentili non sono significativi e il risultato è vuoto
     * @return percentile 0-100 per ogni statistica. Il valore minore ottiene 0 e il maggiore 100; i pari merito ricevono la media.
     */
    public static Map<Long, Integer> rank(Map<Long, BigDecimal> values, boolean higherIsBetter, int minCohortSize) {
        int n = values.size();
        Map<Long, Integer> result = new HashMap<>();
        if (n < Math.max(2, minCohortSize)) {
            return result;
        }
        for (Map.Entry<Long, BigDecimal> entry : values.entrySet()) {
            int less = 0;
            int equalOthers = 0;
            for (Map.Entry<Long, BigDecimal> other : values.entrySet()) {
                if (other == entry) continue;
                int cmp = other.getValue().compareTo(entry.getValue());
                if (cmp < 0) less++;
                else if (cmp == 0) equalOthers++;
            }
            double pct = (less + 0.5 * equalOthers) / (n - 1) * 100.0;
            int rounded = (int) Math.round(pct);
            result.put(entry.getKey(), higherIsBetter ? rounded : 100 - rounded);
        }
        return result;
    }
}
