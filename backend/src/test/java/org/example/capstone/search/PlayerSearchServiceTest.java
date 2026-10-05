package org.example.capstone.search;

import org.example.capstone.player.Position;
import org.example.capstone.stats.MetricKey;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/** Esegue davvero la query sul DB di sviluppo: verifica che i filtri combinati e gli ordinamenti siano SQL valido. */
@SpringBootTest
class PlayerSearchServiceTest {

    @Autowired
    PlayerSearchService service;

    private static SearchCriteria criteria(String q, String teamName, String leagueName, String sort,
                                           List<MetricFilter> filters) {
        return new SearchCriteria(q, Position.ATT, 18, 40, null, null, teamName, leagueName, 2024, 100, filters,
                sort, true);
    }

    @Test
    void allFiltersTogetherProduceValidQuery() {
        var filters = List.of(new MetricFilter(MetricKey.RATING, FilterType.PERCENTILE,
                BigDecimal.TEN, null));

        var page = service.search(criteria("a%_\\", "x%", "y_", "appearances", filters), 0, 20);

        assertNotNull(page.content());
        assertEquals(20, page.size());
    }

    @Test
    void everyBasicSortProducesValidQuery() {
        for (String sort : List.of("name", "age", "minutes", "appearances", "rating", "goals", "assists")) {
            assertNotNull(service.search(criteria(null, null, null, sort, List.of()), 0, 5).content(), sort);
        }
    }

    @Test
    void teamAndLeagueNameFiltersProduceValidQuery() {
        var page = service.search(new SearchCriteria(null, null, null, null, null, null, "INTER", "serie a", 2024, 0,
                List.of(), "minutes", true), 0, 50);

        assertNotNull(page.content());
    }
}
