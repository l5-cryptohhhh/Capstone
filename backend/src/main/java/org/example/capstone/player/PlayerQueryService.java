package org.example.capstone.player;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.dto.MetricValueDto;
import org.example.capstone.player.dto.PlayerDetailDto;
import org.example.capstone.player.dto.SeasonDto;
import org.example.capstone.stats.PlayerSeasonMetric;
import org.example.capstone.stats.PlayerSeasonMetricRepository;
import org.example.capstone.stats.PlayerSeasonStat;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class PlayerQueryService {

    private final PlayerRepository players;
    private final PlayerSeasonStatRepository stats;
    private final PlayerSeasonMetricRepository metrics;

    public PlayerQueryService(PlayerRepository players, PlayerSeasonStatRepository stats,
                              PlayerSeasonMetricRepository metrics) {
        this.players = players;
        this.stats = stats;
        this.metrics = metrics;
    }

    /** Profilo completo; con season valorizzata restituisce solo quella stagione. */
    public PlayerDetailDto detail(Long id, Integer season) {
        Player player = players.findById(id).orElseThrow(
                () -> new ApiException(ErrorCode.PLAYER_NOT_FOUND, "Giocatore " + id + " non trovato"));

        List<PlayerSeasonStat> rows = stats.findByPlayerIdOrderBySeasonDesc(id).stream()
                .filter(s -> season == null || s.getSeason().equals(season))
                .toList();

        Map<Long, List<MetricValueDto>> metricsByStat = loadMetrics(rows);
        List<SeasonDto> seasons = rows.stream()
                .map(s -> new SeasonDto(s.getSeason(), PlayerMapper.team(s.getTeam()), PlayerMapper.league(s.getLeague()),
                        s.getPosition(), PlayerMapper.statLine(s), metricsByStat.getOrDefault(s.getId(), List.of())))
                .toList();

        return new PlayerDetailDto(player.getId(), player.getName(), player.getFirstname(), player.getLastname(),
                PlayerMapper.age(player.getBirthDate()), player.getBirthDate(), player.getNationality(),
                player.getHeightCm(), player.getWeightKg(), player.getPhotoUrl(), player.getPosition(),
                player.getLastSyncedAt(), seasons);
    }

    private Map<Long, List<MetricValueDto>> loadMetrics(List<PlayerSeasonStat> rows) {
        if (rows.isEmpty()) return Map.of();
        Map<Long, List<PlayerSeasonMetric>> grouped = new HashMap<>();
        for (PlayerSeasonMetric m : metrics.findByStatIdIn(rows.stream().map(PlayerSeasonStat::getId).toList())) {
            grouped.computeIfAbsent(m.getStatId(), k -> new java.util.ArrayList<>()).add(m);
        }
        Map<Long, List<MetricValueDto>> result = new HashMap<>();
        grouped.forEach((statId, list) -> result.put(statId, list.stream()
                .sorted(Comparator.comparing(PlayerSeasonMetric::getMetric)) // ordine del catalogo
                .map(PlayerMapper::metric).toList()));
        return result;
    }
}
