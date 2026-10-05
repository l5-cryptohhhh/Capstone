package org.example.capstone.stats;

import org.example.capstone.player.Position;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class MetricKeyTest {

    private static PlayerSeasonStat stat(int minutes) {
        PlayerSeasonStat s = new PlayerSeasonStat();
        s.setMinutes(minutes);
        return s;
    }

    @Test
    void per90ScalesByMinutesPlayed() {
        PlayerSeasonStat s = stat(900);
        s.setGoals(5);

        assertThat(MetricKey.GOALS_P90.compute(s)).isEqualByComparingTo(new BigDecimal("0.500"));
    }

    @Test
    void missingValueOrMinutesGivesNullNotZero() {
        PlayerSeasonStat noGoals = stat(900);
        assertThat(MetricKey.GOALS_P90.compute(noGoals)).isNull();

        PlayerSeasonStat noMinutes = new PlayerSeasonStat();
        noMinutes.setGoals(3);
        assertThat(MetricKey.GOALS_P90.compute(noMinutes)).isNull();

        PlayerSeasonStat zeroMinutes = stat(0);
        zeroMinutes.setGoals(3);
        assertThat(MetricKey.GOALS_P90.compute(zeroMinutes)).isNull();
    }

    @Test
    void defensiveActionsSumTacklesAndInterceptions() {
        PlayerSeasonStat s = stat(1800);
        s.setTacklesTotal(40);
        s.setTacklesInterceptions(20);

        assertThat(MetricKey.DEF_ACTIONS_P90.compute(s)).isEqualByComparingTo(new BigDecimal("3.000"));
    }

    @Test
    void defensiveActionsNeedBothInputs() {
        PlayerSeasonStat s = stat(1800);
        s.setTacklesTotal(40);

        assertThat(MetricKey.DEF_ACTIONS_P90.compute(s)).isNull();
    }

    @Test
    void percentageMetricsRequireEnoughAttempts() {
        PlayerSeasonStat few = stat(900);
        few.setDribblesAttempts(5);
        few.setDribblesSuccess(4);
        assertThat(MetricKey.DRIBBLES_SUCCESS_PCT.compute(few)).isNull();

        PlayerSeasonStat enough = stat(900);
        enough.setDribblesAttempts(40);
        enough.setDribblesSuccess(10);
        assertThat(MetricKey.DRIBBLES_SUCCESS_PCT.compute(enough)).isEqualByComparingTo(new BigDecimal("25.000"));
    }

    @Test
    void metricsApplyOnlyToTheirPositions() {
        assertThat(MetricKey.SAVES_P90.appliesTo(Position.GK)).isTrue();
        assertThat(MetricKey.SAVES_P90.appliesTo(Position.MID)).isFalse();
        assertThat(MetricKey.DRIBBLES_SUCCESS_P90.appliesTo(Position.GK)).isFalse();
        assertThat(MetricKey.DRIBBLES_SUCCESS_P90.appliesTo(Position.ATT)).isTrue();
        assertThat(MetricKey.RATING.appliesTo(Position.GK)).isTrue();
        assertThat(MetricKey.RATING.appliesTo(null)).isFalse();
    }

    @Test
    void lookupByKeyIsExact() {
        assertThat(MetricKey.fromKey("def_actions_p90")).contains(MetricKey.DEF_ACTIONS_P90);
        assertThat(MetricKey.fromKey("inventata")).isEmpty();
    }

    @Test
    void publicKeysAreUnique() {
        long distinct = java.util.Arrays.stream(MetricKey.values()).map(MetricKey::key).distinct().count();

        assertThat(distinct).isEqualTo(MetricKey.values().length);
    }
}
