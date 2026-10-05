package org.example.capstone.stats;

import org.example.capstone.league.League;
import org.example.capstone.league.LeagueRepository;
import org.example.capstone.player.Position;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Calcola metriche per 90 minuti e percentili. I percentili confrontano ogni giocatore con i pari ruolo
 * dello stesso campionato e della stessa stagione, considerando solo chi ha giocato abbastanza minuti.
 * Il calcolo è interamente deterministico: l'AI userà questi numeri, non li produce.
 */
@Service
public class StatsService {

    private static final Logger log = LoggerFactory.getLogger(StatsService.class);

    private final PlayerSeasonStatRepository stats;
    private final LeagueRepository leagues;
    private final StatsProperties properties;
    private final JdbcTemplate jdbc;

    public StatsService(PlayerSeasonStatRepository stats, LeagueRepository leagues, StatsProperties properties,
                        JdbcTemplate jdbc) {
        this.stats = stats;
        this.leagues = leagues;
        this.properties = properties;
        this.jdbc = jdbc;
    }

    /** Ricalcola tutto per i campionati abilitati nella stagione indicata. */
    public int recomputeSeason(int season) {
        int total = 0;
        for (League league : leagues.findByEnabledTrueOrderByPriorityAsc()) {
            total += recompute(league.getId(), season);
        }
        return total;
    }

    /** Sostituisce le metriche di un campionato e una stagione. @return numero di metriche scritte */
    @Transactional
    public int recompute(long leagueId, int season) {
        List<PlayerSeasonStat> rows = stats.findForRecompute(leagueId, season);

        // 1. Valori delle metriche per ogni riga (solo metriche applicabili al ruolo e con dati sufficienti)
        Map<Long, Position> positionOf = new HashMap<>();
        Map<Long, Map<MetricKey, BigDecimal>> valuesOf = new HashMap<>();
        Map<Position, List<PlayerSeasonStat>> cohorts = new EnumMap<>(Position.class);

        for (PlayerSeasonStat s : rows) {
            Position position = s.getPosition() != null ? s.getPosition() : s.getPlayer().getPosition();
            if (position == null) {
                continue; // senza ruolo non è possibile confrontare il giocatore
            }
            positionOf.put(s.getId(), position);
            cohorts.computeIfAbsent(position, p -> new ArrayList<>()).add(s);

            Map<MetricKey, BigDecimal> values = new EnumMap<>(MetricKey.class);
            for (MetricKey metric : MetricKey.values()) {
                if (!metric.appliesTo(position)) continue;
                BigDecimal value = metric.compute(s);
                if (value != null) values.put(metric, value);
            }
            valuesOf.put(s.getId(), values);
        }

        // 2. Percentili per coorte (ruolo) e metrica, solo tra chi ha minuti sufficienti
        Map<Long, Map<MetricKey, Integer>> percentileOf = new HashMap<>();
        Map<Long, Map<MetricKey, Integer>> cohortSizeOf = new HashMap<>();
        for (List<PlayerSeasonStat> cohort : cohorts.values()) {
            for (MetricKey metric : MetricKey.values()) {
                Map<Long, BigDecimal> eligible = new HashMap<>();
                for (PlayerSeasonStat s : cohort) {
                    BigDecimal value = valuesOf.get(s.getId()).get(metric);
                    if (value != null && s.getMinutes() != null && s.getMinutes() >= properties.minMinutes()) {
                        eligible.put(s.getId(), value);
                    }
                }
                Map<Long, Integer> ranks = PercentileCalculator.rank(eligible, metric.higherIsBetter(),
                        properties.minCohortSize());
                for (Map.Entry<Long, Integer> r : ranks.entrySet()) {
                    percentileOf.computeIfAbsent(r.getKey(), k -> new EnumMap<>(MetricKey.class)).put(metric, r.getValue());
                    cohortSizeOf.computeIfAbsent(r.getKey(), k -> new EnumMap<>(MetricKey.class)).put(metric, eligible.size());
                }
            }
        }

        // 3. Scrittura: si cancella e si reinserisce in batch
        jdbc.update("""
                DELETE FROM player_season_metric
                WHERE stat_id IN (SELECT id FROM player_season_stat WHERE league_id = ? AND season = ?)
                """, leagueId, season);

        List<Object[]> batch = new ArrayList<>();
        for (Map.Entry<Long, Map<MetricKey, BigDecimal>> entry : valuesOf.entrySet()) {
            Long statId = entry.getKey();
            for (Map.Entry<MetricKey, BigDecimal> m : entry.getValue().entrySet()) {
                batch.add(new Object[]{
                        statId, m.getKey().name(), m.getValue(),
                        percentileOf.getOrDefault(statId, Map.of()).get(m.getKey()),
                        cohortSizeOf.getOrDefault(statId, Map.of()).get(m.getKey())});
            }
        }
        jdbc.batchUpdate("""
                INSERT INTO player_season_metric (stat_id, metric, metric_value, percentile, cohort_size)
                VALUES (?, ?, ?, ?, ?)
                """, batch);

        log.info("Metriche ricalcolate per lega {} stagione {}: {} righe da {} statistiche", leagueId, season,
                batch.size(), rows.size());
        return batch.size();
    }
}
