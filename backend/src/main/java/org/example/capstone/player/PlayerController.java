package org.example.capstone.player;

import jakarta.servlet.http.HttpServletRequest;
import org.example.capstone.auth.AuthInterceptor;
import org.example.capstone.common.PageResponse;
import org.example.capstone.player.dto.PlayerDetailDto;
import org.example.capstone.player.dto.PlayerSummaryDto;
import org.example.capstone.search.PlayerSearchService;
import org.example.capstone.search.SearchCriteria;
import org.example.capstone.search.SearchParamParser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/players")
public class PlayerController {

    private final PlayerSearchService searchService;
    private final PlayerQueryService queryService;

    public PlayerController(PlayerSearchService searchService, PlayerQueryService queryService) {
        this.searchService = searchService;
        this.queryService = queryService;
    }

    /**
     * Ricerca con filtri. Oltre ai parametri elencati accetta filtri sulle metriche:
     * pct.&lt;metrica&gt;.min|max (percentile) e val.&lt;metrica&gt;.min|max (valore).
     * I visitatori non registrati vedono solo i primi giocatori di ogni campionato, gli altri risultano bloccati.
     * Senza season usa la stagione più recente disponibile; senza minMinutes esclude chi ha giocato troppo poco.
     */
    @GetMapping
    public PageResponse<PlayerSummaryDto> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Position position,
            @RequestParam(required = false) Integer minAge,
            @RequestParam(required = false) Integer maxAge,
            @RequestParam(required = false) Long leagueId,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) Integer season,
            @RequestParam(required = false) Integer minMinutes,
            @RequestParam(defaultValue = "minutes") String sort,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam Map<String, String> params,
            HttpServletRequest request) {

        SearchCriteria criteria = SearchParamParser.parse(new SearchParamParser.Request(
                q, position, minAge, maxAge, leagueId, teamId, season, minMinutes, sort, order, page, size, params));
        return AuthInterceptor.currentUser(request) != null
                ? searchService.search(criteria, page, size)
                : searchService.searchPreview(criteria, page, size);
    }

    @GetMapping("/{id}")
    public PlayerDetailDto detail(@PathVariable Long id, @RequestParam(required = false) Integer season) {
        return queryService.detail(id, season);
    }
}
