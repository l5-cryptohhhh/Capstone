package org.example.capstone.valuation;

import org.example.capstone.player.PlayerQueryService;
import org.example.capstone.player.Position;
import org.example.capstone.player.dto.LeagueRefDto;
import org.example.capstone.player.dto.MetricValueDto;
import org.example.capstone.player.dto.PlayerDetailDto;
import org.example.capstone.player.dto.SeasonDto;
import org.example.capstone.player.dto.StatLineDto;
import org.example.capstone.player.dto.TeamRefDto;
import org.example.capstone.stats.MetricUnit;
import org.example.capstone.stats.StatsProperties;
import org.example.capstone.valuation.ProjectionService.ProjectionDto;
import org.example.capstone.valuation.ProjectionService.Reason;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProjectionServiceTest {

    private final PlayerQueryService players = mock(PlayerQueryService.class);
    private final ProjectionService service = new ProjectionService(players, new StatsProperties(450, 10));

    private static StatLineDto stats(Integer minutes) {
        return new StatLineDto(null, null, minutes, null, null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null);
    }

    private static MetricValueDto metric(String key, Integer percentile) {
        return new MetricValueDto(key, key, MetricUnit.PER_90, BigDecimal.ONE, percentile, 20);
    }

    private static SeasonDto season(int year, Integer minutes, Integer... percentiles) {
        List<MetricValueDto> metrics = new java.util.ArrayList<>();
        for (int i = 0; i < percentiles.length; i++) {
            metrics.add(metric("m" + i, percentiles[i]));
        }
        return new SeasonDto(year, new TeamRefDto(1L, "Roma", null), new LeagueRefDto(1L, "Serie A", "Italy", null),
                Position.MID, stats(minutes), metrics);
    }

    private static PlayerDetailDto player(Integer age, SeasonDto... seasons) {
        LocalDate born = age == null ? null : LocalDate.now().minusYears(age).minusDays(10);
        return new PlayerDetailDto(1L, "Rossi", null, null, age, born, null, null, null, null, Position.MID, null,
                List.of(seasons));
    }

    @Test
    void usesTheLatestSeasonAndComputesValueAndTrajectory() {
        when(players.detail(1L, null))
                .thenReturn(player(22, season(2023, 3000, 10, 10, 10), season(2024, 2700, 60, 70, 80)));

        ProjectionDto result = service.projection(1L, null);

        assertTrue(result.available());
        assertEquals(2024, result.season());
        assertEquals(22, result.age());
        assertEquals(70.0, result.score());
        // 0.2 * 2^(70/10) * 1.35 (22 anni) * 1.0 (Italia) * 1.0 (oltre 1800 minuti il fattore resta 1)
        double expected = ValuationModel.round(0.2 * Math.pow(2, 70 / 10.0) * 1.35);
        assertEquals(expected, result.currentValueM());
        assertEquals(ValuationModel.HORIZON_YEARS + 1, result.points().size());
    }

    @Test
    void withTwoTeamsInTheSameSeasonTheOneWithMoreMinutesCounts() {
        when(players.detail(1L, 2024))
                .thenReturn(player(25, season(2024, 500, 10, 10, 10), season(2024, 2000, 50, 50, 50)));

        assertEquals(50.0, service.projection(1L, 2024).score());
    }

    @Test
    void saysWhyTheEstimateIsMissing() {
        when(players.detail(1L, null)).thenReturn(player(25));
        assertReason(Reason.NO_SEASON);

        when(players.detail(1L, null)).thenReturn(player(null, season(2024, 3000, 50, 50, 50)));
        assertReason(Reason.NO_AGE);

        when(players.detail(1L, null)).thenReturn(player(25, season(2024, 300, 50, 50, 50)));
        assertReason(Reason.MINUTES);

        when(players.detail(1L, null)).thenReturn(player(25, season(2024, null, 50, 50, 50)));
        assertReason(Reason.MINUTES);

        when(players.detail(1L, null)).thenReturn(player(25, season(2024, 3000, 50, null, null)));
        assertReason(Reason.PERCENTILES);
    }

    private void assertReason(Reason expected) {
        ProjectionDto result = service.projection(1L, null);

        assertFalse(result.available());
        assertEquals(expected, result.reason());
        assertNull(result.currentValueM());
        assertTrue(result.points().isEmpty());
    }
}
