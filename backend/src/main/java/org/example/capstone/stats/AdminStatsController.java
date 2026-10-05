package org.example.capstone.stats;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/stats")
public class AdminStatsController {

    private final StatsService statsService;

    public AdminStatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    /** Ricalcola metriche e percentili. Senza leagueId lo fa per tutti i campionati abilitati. */
    @PostMapping("/recompute")
    public Map<String, Integer> recompute(@RequestParam int season, @RequestParam(required = false) Long leagueId) {
        if (season < 1900 || season > 2100) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "season non valida");
        }
        int written = leagueId != null ? statsService.recompute(leagueId, season) : statsService.recomputeSeason(season);
        return Map.of("metricsWritten", written);
    }
}
