package org.example.capstone.player;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.league.League;
import org.example.capstone.player.dto.SimilarPlayerDto;
import org.example.capstone.stats.MetricKey;
import org.example.capstone.stats.PlayerSeasonMetric;
import org.example.capstone.stats.PlayerSeasonMetricRepository;
import org.example.capstone.stats.PlayerSeasonStat;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.example.capstone.stats.StatsProperties;
import org.example.capstone.team.Team;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SimilarPlayerServiceTest {

    private static final MetricKey[] SIX = {MetricKey.GOALS_P90, MetricKey.ASSISTS_P90, MetricKey.SHOTS_P90,
            MetricKey.KEY_PASSES_P90, MetricKey.DUELS_WON_P90, MetricKey.RATING};

    private static Map<MetricKey, Integer> profile(int... values) {
        Map<MetricKey, Integer> m = new EnumMap<>(MetricKey.class);
        for (int i = 0; i < values.length; i++) {
            m.put(SIX[i], values[i]);
        }
        return m;
    }

    @Test
    void identicalProfilesAreFullySimilar() {
        var d = SimilarPlayerService.distance(profile(90, 80, 70, 60, 50, 40), profile(90, 80, 70, 60, 50, 40));

        assertEquals(0.0, d.rms());
        assertEquals(6, d.common());
        assertEquals(100, SimilarPlayerService.similarity(d.rms()));
    }

    @Test
    void distanceIsTheRootMeanSquareOfTheGaps() {
        var d = SimilarPlayerService.distance(profile(50, 50, 50, 50, 50, 50), profile(60, 60, 60, 60, 60, 60));

        assertEquals(10.0, d.rms(), 1e-9);
        assertEquals(90, SimilarPlayerService.similarity(d.rms()));
    }

    @Test
    void tooFewCommonMetricsAreNotComparable() {
        assertNull(SimilarPlayerService.distance(profile(50, 50, 50, 50, 50), profile(50, 50, 50, 50, 50)));
    }

    // --- servizio con repository simulati

    private final PlayerRepository players = mock(PlayerRepository.class);
    private final PlayerSeasonStatRepository stats = mock(PlayerSeasonStatRepository.class);
    private final PlayerSeasonMetricRepository metrics = mock(PlayerSeasonMetricRepository.class);
    private final SimilarPlayerService service = new SimilarPlayerService(players, stats, metrics,
            new StatsProperties(450, 10));

    private PlayerSeasonStat stat(long statId, long playerId, String name, int minutes) {
        Player p = new Player();
        p.setId(playerId);
        p.setName(name);
        Team t = new Team();
        t.setId(1L);
        t.setName("Squadra");
        League l = new League();
        l.setId(1L);
        l.setName("Campionato");
        PlayerSeasonStat s = new PlayerSeasonStat();
        s.setId(statId);
        s.setPlayer(p);
        s.setTeam(t);
        s.setLeague(l);
        s.setSeason(2024);
        s.setPosition(Position.MID);
        s.setMinutes(minutes);
        return s;
    }

    private static List<PlayerSeasonMetric> metricsOf(long statId, int... values) {
        List<PlayerSeasonMetric> list = new ArrayList<>();
        for (int i = 0; i < values.length; i++) {
            PlayerSeasonMetric m = new PlayerSeasonMetric();
            m.setStatId(statId);
            m.setMetric(SIX[i]);
            m.setValue(BigDecimal.ONE);
            m.setPercentile(values[i]);
            list.add(m);
        }
        return list;
    }

    @Test
    void returnsTheClosestPlayersAndExcludesTheTarget() {
        PlayerSeasonStat me = stat(1, 10, "Io", 2000);
        PlayerSeasonStat near = stat(2, 11, "Vicino", 1500);
        PlayerSeasonStat far = stat(3, 12, "Lontano", 1800);
        when(players.existsById(10L)).thenReturn(true);
        when(stats.findByPlayerIdOrderBySeasonDesc(10L)).thenReturn(List.of(me));
        when(stats.findCohort(anyInt(), any(), anyInt())).thenReturn(List.of(me, near, far));
        List<PlayerSeasonMetric> all = new ArrayList<>();
        all.addAll(metricsOf(1, 80, 80, 80, 80, 80, 80));
        all.addAll(metricsOf(2, 78, 82, 80, 79, 81, 80));
        all.addAll(metricsOf(3, 20, 30, 10, 40, 20, 30));
        when(metrics.findByStatIdIn(any())).thenReturn(all);

        List<SimilarPlayerDto> result = service.similar(10L, null, 6);

        assertEquals(2, result.size(), "il giocatore stesso non compare");
        assertEquals("Vicino", result.get(0).name());
        assertEquals("Lontano", result.get(1).name());
        assertTrue(result.get(0).similarity() > result.get(1).similarity());
        assertEquals(6, result.get(0).commonMetrics());
    }

    @Test
    void unknownPlayerIsNotFound() {
        when(players.existsById(99L)).thenReturn(false);

        assertEquals(ErrorCode.PLAYER_NOT_FOUND,
                assertThrows(ApiException.class, () -> service.similar(99L, null, 6)).getCode());
    }

    @Test
    void playerWithoutStatsHasNoSimilarPlayers() {
        when(players.existsById(10L)).thenReturn(true);
        when(stats.findByPlayerIdOrderBySeasonDesc(10L)).thenReturn(List.of());

        assertTrue(service.similar(10L, null, 6).isEmpty());
    }
}
