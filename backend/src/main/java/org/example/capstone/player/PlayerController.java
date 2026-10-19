package org.example.capstone.player;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.example.capstone.auth.AuthInterceptor;
import org.example.capstone.common.PageResponse;
import org.example.capstone.player.dto.PlayerDetailDto;
import org.example.capstone.player.dto.PlayerSummaryDto;
import org.example.capstone.player.dto.SimilarPlayerDto;
import org.example.capstone.search.PlayerSearchService;
import org.example.capstone.search.SearchCriteria;
import org.example.capstone.search.SearchParamParser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "Giocatori", description = "Ricerca, scheda e giocatori simili")
@RestController
@RequestMapping("/api/v1/players")
public class PlayerController {

    private final PlayerSearchService searchService;
    private final PlayerQueryService queryService;
    private final SimilarPlayerService similarService;

    public PlayerController(PlayerSearchService searchService, PlayerQueryService queryService,
                            SimilarPlayerService similarService) {
        this.searchService = searchService;
        this.queryService = queryService;
        this.similarService = similarService;
    }

    /**
     * Ricerca con filtri. Oltre ai parametri elencati accetta filtri sulle metriche:
     * pct.&lt;metrica&gt;.min|max (percentile) e val.&lt;metrica&gt;.min|max (valore).
     * I visitatori non registrati vedono solo i primi giocatori di ogni campionato, gli altri risultano bloccati.
     * Senza season usa la stagione più recente disponibile; senza minMinutes non esclude nessuno.
     */
    @GetMapping
    @Operation(summary = "Cerca giocatori",
            description = "Filtri sulle metriche, oltre ai parametri elencati: `pct.<metrica>.min|max` (percentile) e "
                    + "`val.<metrica>.min|max` (valore), per esempio `pct.goals_p90.min=80`. I visitatori non "
                    + "registrati vedono solo i primi giocatori di ogni campionato.")
    public PageResponse<PlayerSummaryDto> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Position position,
            @RequestParam(required = false) Integer minAge,
            @RequestParam(required = false) Integer maxAge,
            // Senza formato: Swagger UI valida male i campi int64 lasciati vuoti
            @Parameter(schema = @Schema(type = "integer")) @RequestParam(required = false) Long leagueId,
            @Parameter(schema = @Schema(type = "integer")) @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) Integer season,
            @RequestParam(required = false) Integer minMinutes,
            @RequestParam(defaultValue = "minutes") String sort,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            // Raccoglie i filtri sulle metriche (pct.* e val.*): non è un campo da compilare
            @Parameter(hidden = true) @RequestParam Map<String, String> params,
            HttpServletRequest request) {

        SearchCriteria criteria = SearchParamParser.parse(new SearchParamParser.Request(
                q, position, minAge, maxAge, leagueId, teamId, season, minMinutes, sort, order, page, size, params));
        return AuthInterceptor.currentUser(request) != null
                ? searchService.search(criteria, page, size)
                : searchService.searchPreview(criteria, page, size);
    }

    /** Giocatori statisticamente vicini (stesso ruolo e stagione, profilo dei percentili). */
    @GetMapping("/{id}/similar")
    public List<SimilarPlayerDto> similar(@PathVariable Long id, @RequestParam(required = false) Integer season,
                                          @RequestParam(defaultValue = "6") int limit) {
        return similarService.similar(id, season, limit);
    }

    @GetMapping("/{id}")
    public PlayerDetailDto detail(@PathVariable Long id, @RequestParam(required = false) Integer season) {
        return queryService.detail(id, season);
    }
}
