package org.example.capstone.valuation;

import org.example.capstone.player.PlayerQueryService;
import org.example.capstone.player.Position;
import org.example.capstone.player.dto.MetricValueDto;
import org.example.capstone.player.dto.PlayerDetailDto;
import org.example.capstone.player.dto.SeasonDto;
import org.example.capstone.stats.StatsProperties;
import org.example.capstone.valuation.ValuationModel.Point;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/** Stima di valore e traiettoria di crescita di un giocatore, a partire dalla sua scheda. */
@Service
public class ProjectionService {

    /** Perché la stima non c'è: il frontend lo traduce in una frase. */
    public enum Reason {
        NO_SEASON, NO_AGE, MINUTES, PERCENTILES
    }

    public record ProjectionDto(boolean available, Reason reason, Integer season, Integer age, Double score,
                                Double currentValueM, List<Point> points) {

        static ProjectionDto unavailable(Reason reason, Integer season) {
            return new ProjectionDto(false, reason, season, null, null, null, List.of());
        }
    }

    private final PlayerQueryService players;
    private final StatsProperties stats;

    public ProjectionService(PlayerQueryService players, StatsProperties stats) {
        this.players = players;
        this.stats = stats;
    }

    /** Senza season usa la più recente; con più squadre nella stessa stagione, quella con più minuti. */
    public ProjectionDto projection(Long playerId, Integer season) {
        PlayerDetailDto player = players.detail(playerId, season);
        SeasonDto entry = player.seasons().stream()
                .max(Comparator.comparingInt(SeasonDto::season)
                        .thenComparingInt(s -> s.stats().minutes() == null ? 0 : s.stats().minutes()))
                .orElse(null);
        if (entry == null) {
            return ProjectionDto.unavailable(Reason.NO_SEASON, season);
        }
        Integer age = player.age();
        if (age == null) {
            return ProjectionDto.unavailable(Reason.NO_AGE, entry.season());
        }
        int minutes = entry.stats().minutes() == null ? 0 : entry.stats().minutes();
        if (minutes < stats.minMinutes()) {
            return ProjectionDto.unavailable(Reason.MINUTES, entry.season());
        }
        Double score = ValuationModel.score(entry.metrics().stream().map(MetricValueDto::percentile).toList());
        if (score == null) {
            return ProjectionDto.unavailable(Reason.PERCENTILES, entry.season());
        }
        Position position = entry.position() != null ? entry.position() : player.position();
        String country = entry.league().country();
        List<Point> points = ValuationModel.trajectory(score, age, country, minutes, position);
        return new ProjectionDto(true, null, entry.season(), age, ValuationModel.round(score),
                points.get(0).midM(), points);
    }
}
