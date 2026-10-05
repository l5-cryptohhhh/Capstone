package org.example.capstone.search;

import org.example.capstone.common.PageResponse;
import org.example.capstone.player.PlayerMapper;
import org.example.capstone.player.dto.MetricValueDto;
import org.example.capstone.player.dto.PlayerSummaryDto;
import org.example.capstone.stats.MetricKey;
import org.example.capstone.stats.PlayerSeasonMetric;
import org.example.capstone.stats.PlayerSeasonMetricRepository;
import org.example.capstone.stats.PlayerSeasonStat;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.example.capstone.stats.StatsProperties;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class PlayerSearchService {

    private final PlayerSeasonStatRepository stats;
    private final PlayerSeasonMetricRepository metrics;
    private final StatsProperties statsProperties;

    public PlayerSearchService(PlayerSeasonStatRepository stats, PlayerSeasonMetricRepository metrics,
                               StatsProperties statsProperties) {
        this.stats = stats;
        this.metrics = metrics;
        this.statsProperties = statsProperties;
    }

    public PageResponse<PlayerSummaryDto> search(SearchCriteria criteria, int page, int size) {
        Integer season = criteria.season() != null ? criteria.season() : stats.findMaxSeason();
        if (season == null) {
            return PageResponse.empty(page, size); // nessun dato ancora importato
        }
        int minMinutes = criteria.minMinutes() != null ? criteria.minMinutes() : statsProperties.minMinutes();

        Page<PlayerSeasonStat> result = stats.findAll(
                PlayerSearchSpecs.from(criteria, season, minMinutes, LocalDate.now()), PageRequest.of(page, size));

        Map<Long, Map<String, MetricValueDto>> extra = relevantMetrics(criteria, result.getContent());
        return PageResponse.of(result, s -> toSummary(s, extra.getOrDefault(s.getId(), Map.of())));
    }

    /** Valori delle metriche coinvolte nella ricerca (filtri e ordinamento), per mostrarli nei risultati. */
    private Map<Long, Map<String, MetricValueDto>> relevantMetrics(SearchCriteria criteria, List<PlayerSeasonStat> rows) {
        Set<MetricKey> keys = EnumSet.noneOf(MetricKey.class);
        keys.add(MetricKey.RATING); // sempre presente: alimenta la scala del registro
        criteria.filters().forEach(f -> keys.add(f.metric()));
        if (criteria.sort() != null) {
            MetricKey.fromKey(criteria.sort()).ifPresent(keys::add);
        }
        if (keys.isEmpty() || rows.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = rows.stream().map(PlayerSeasonStat::getId).toList();
        Map<Long, Map<String, MetricValueDto>> byStat = new HashMap<>();
        for (PlayerSeasonMetric m : metrics.findByStatIdInAndMetricIn(ids, keys)) {
            byStat.computeIfAbsent(m.getStatId(), k -> new HashMap<>()).put(m.getMetric().key(), PlayerMapper.metric(m));
        }
        return byStat;
    }

    private static PlayerSummaryDto toSummary(PlayerSeasonStat s, Map<String, MetricValueDto> metricValues) {
        var p = s.getPlayer();
        return new PlayerSummaryDto(p.getId(), p.getName(), PlayerMapper.age(p.getBirthDate()), p.getNationality(),
                s.getPosition() != null ? s.getPosition() : p.getPosition(), p.getPhotoUrl(),
                PlayerMapper.team(s.getTeam()), PlayerMapper.league(s.getLeague()), s.getSeason(), s.getMinutes(),
                s.getAppearances(), s.getGoals(), s.getAssists(), s.getRating(), metricValues);
    }
}
