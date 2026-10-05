package org.example.capstone.stats;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PercentileCalculatorTest {

    private static Map<Long, BigDecimal> values(double... v) {
        Map<Long, BigDecimal> map = new LinkedHashMap<>();
        for (int i = 0; i < v.length; i++) map.put((long) i + 1, BigDecimal.valueOf(v[i]));
        return map;
    }

    @Test
    void lowestGetsZeroAndHighestGetsHundred() {
        Map<Long, Integer> pct = PercentileCalculator.rank(values(1, 2, 3, 4, 5), true, 2);

        assertThat(pct.get(1L)).isEqualTo(0);
        assertThat(pct.get(3L)).isEqualTo(50);
        assertThat(pct.get(5L)).isEqualTo(100);
    }

    @Test
    void tiesShareTheAveragePercentile() {
        Map<Long, Integer> pct = PercentileCalculator.rank(values(1, 2, 2, 3), true, 2);

        assertThat(pct.get(2L)).isEqualTo(pct.get(3L)).isEqualTo(50);
    }

    @Test
    void lowerIsBetterInvertsTheScale() {
        Map<Long, Integer> pct = PercentileCalculator.rank(values(1, 2, 3), false, 2);

        assertThat(pct.get(1L)).isEqualTo(100); // il valore più basso è il migliore
        assertThat(pct.get(3L)).isEqualTo(0);
    }

    @Test
    void cohortTooSmallProducesNoPercentiles() {
        assertThat(PercentileCalculator.rank(values(1, 2, 3), true, 10)).isEmpty();
    }

    @Test
    void singlePlayerCohortNeverProducesPercentiles() {
        assertThat(PercentileCalculator.rank(values(5), true, 1)).isEmpty();
    }

    @Test
    void allEqualValuesGiveMiddlePercentile() {
        Map<Long, Integer> pct = PercentileCalculator.rank(values(2, 2, 2), true, 2);

        assertThat(pct.values()).containsOnly(50);
    }
}
