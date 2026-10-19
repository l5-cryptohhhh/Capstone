package org.example.capstone.stats;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.config.OpenApiConfig;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Admin - Statistiche", description = "Ricalcolo di metriche e percentili")
@SecurityRequirement(name = OpenApiConfig.ADMIN_KEY)
@RestController
@RequestMapping("/api/v1/admin/stats")
public class AdminStatsController {

    private final StatsService statsService;

    public AdminStatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    /** Ricalcola metriche e percentili. Senza leagueId lo fa per tutti i campionati abilitati. */
    @PostMapping("/recompute")
    public Map<String, Integer> recompute(@RequestParam int season, @Parameter(schema = @Schema(type = "integer")) @RequestParam(required = false) Long leagueId) {
        if (season < 1900 || season > 2100) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "season non valida");
        }
        int written = leagueId != null ? statsService.recompute(leagueId, season) : statsService.recomputeSeason(season);
        return Map.of("metricsWritten", written);
    }
}
