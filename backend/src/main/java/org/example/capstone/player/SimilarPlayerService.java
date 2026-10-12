package org.example.capstone.player;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.dto.SimilarPlayerDto;
import org.example.capstone.stats.MetricKey;
import org.example.capstone.stats.PlayerSeasonMetric;
import org.example.capstone.stats.PlayerSeasonMetricRepository;
import org.example.capstone.stats.PlayerSeasonStat;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.example.capstone.stats.StatsProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Giocatori simili: stesso ruolo e stessa stagione, vicini sul profilo dei percentili.
 * Nessuna AI: è un calcolo sui dati già presenti, ripetibile e spiegabile.
 */
@Service
@Transactional(readOnly = true)
public class SimilarPlayerService {

    /** Metriche in comune necessarie per dire che due profili sono confrontabili. */
    static final int MIN_COMMON_METRICS = 6;
    static final int MAX_LIMIT = 10;
    private static final int CHUNK = 1000;

    private final PlayerRepository players;
    private final PlayerSeasonStatRepository stats;
    private final PlayerSeasonMetricRepository metrics;
    private final StatsProperties properties;

    public SimilarPlayerService(PlayerRepository players, PlayerSeasonStatRepository stats,
                                PlayerSeasonMetricRepository metrics, StatsProperties properties) {
        this.players = players;
        this.stats = stats;
        this.metrics = metrics;
        this.properties = properties;
    }

    /** Punteggio di vicinanza: scarto quadratico medio tra i percentili in comune (0 = identici). */
    record Distance(double rms, int common) {
    }

    /** Null se le metriche in comune sono troppo poche per un confronto affidabile. */
    static Distance distance(Map<MetricKey, Integer> a, Map<MetricKey, Integer> b) {
        double sum = 0;
        int common = 0;
        for (Map.Entry<MetricKey, Integer> e : a.entrySet()) {
            Integer other = b.get(e.getKey());
            if (other != null) {
                double d = e.getValue() - other;
                sum += d * d;
                common++;
            }
        }
        return common < MIN_COMMON_METRICS ? null : new Distance(Math.sqrt(sum / common), common);
    }

    /** Vicinanza 0-100: 100 = percentili identici, 0 = in media agli estremi opposti. */
    static int similarity(double rms) {
        return (int) Math.max(0, Math.min(100, Math.round(100 - rms)));
    }

    public List<SimilarPlayerDto> similar(Long playerId, Integer season, int limit) {
        if (!players.existsById(playerId)) {
            throw new ApiException(ErrorCode.PLAYER_NOT_FOUND, "Giocatore " + playerId + " non trovato");
        }
        List<PlayerSeasonStat> own = stats.findByPlayerIdOrderBySeasonDesc(playerId).stream()
                .filter(s -> season == null || s.getSeason().equals(season))
                .toList();
        if (own.isEmpty()) {
            return List.of();
        }
        int targetSeason = own.get(0).getSeason();
        PlayerSeasonStat target = own.stream().filter(s -> s.getSeason() == targetSeason)
                .max(Comparator.comparing(s -> s.getMinutes() == null ? 0 : s.getMinutes())).orElseThrow();
        if (target.getPosition() == null) {
            return List.of();
        }

        List<PlayerSeasonStat> cohort = stats.findCohort(targetSeason, target.getPosition(), properties.minMinutes())
                .stream().filter(s -> !s.getPlayer().getId().equals(playerId)).toList();

        List<Long> ids = new ArrayList<>();
        ids.add(target.getId());
        cohort.forEach(s -> ids.add(s.getId()));
        Map<Long, Map<MetricKey, Integer>> percentiles = loadPercentiles(ids);

        Map<MetricKey, Integer> mine = percentiles.getOrDefault(target.getId(), Map.of());
        // un solo risultato per giocatore: la riga più vicina (chi ha cambiato squadra compare più volte)
        Map<Long, Scored> best = new HashMap<>();
        for (PlayerSeasonStat candidate : cohort) {
            Distance d = distance(mine, percentiles.getOrDefault(candidate.getId(), Map.of()));
            if (d == null) {
                continue;
            }
            best.merge(candidate.getPlayer().getId(), new Scored(candidate, d),
                    (x, y) -> y.distance.rms() < x.distance.rms() ? y : x);
        }

        int size = Math.max(1, Math.min(limit, MAX_LIMIT));
        return best.values().stream()
                .sorted(Comparator.comparingDouble((Scored s) -> s.distance.rms())
                        .thenComparing(s -> s.stat.getPlayer().getId()))
                .limit(size)
                .map(s -> toDto(s.stat, s.distance))
                .toList();
    }

    private record Scored(PlayerSeasonStat stat, Distance distance) {
    }

    private Map<Long, Map<MetricKey, Integer>> loadPercentiles(List<Long> statIds) {
        Map<Long, Map<MetricKey, Integer>> result = new HashMap<>();
        for (int from = 0; from < statIds.size(); from += CHUNK) {
            List<Long> chunk = statIds.subList(from, Math.min(statIds.size(), from + CHUNK));
            for (PlayerSeasonMetric m : metrics.findByStatIdIn(chunk)) {
                if (m.getPercentile() != null) {
                    result.computeIfAbsent(m.getStatId(), k -> new EnumMap<>(MetricKey.class))
                            .put(m.getMetric(), m.getPercentile());
                }
            }
        }
        return result;
    }

    private static SimilarPlayerDto toDto(PlayerSeasonStat s, Distance d) {
        Player p = s.getPlayer();
        return new SimilarPlayerDto(p.getId(), p.getName(), PlayerMapper.age(p.getBirthDate()), p.getNationality(),
                s.getPosition(), p.getPhotoUrl(), PlayerMapper.team(s.getTeam()), PlayerMapper.league(s.getLeague()),
                s.getSeason(), s.getMinutes(), similarity(d.rms()), d.common());
    }
}
