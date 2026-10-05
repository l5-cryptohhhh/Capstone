package org.example.capstone.player;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** Esegue davvero la query sul DB di sviluppo: verifica che i filtri combinati e l'ordinamento siano SQL valido. */
@SpringBootTest
class PlayerServiceSearchTest {

    @Autowired
    PlayerService service;

    @Test
    void allFiltersTogetherProduceValidQuery() {
        var page = service.search(new PlayerSearchCriteria("a%_\\", Position.ATT, "x", "y", 2024, 18, 40, 100,
                "goals", 0, 500));

        assertNotNull(page.items());
        assertEquals(50, page.size(), "size è limitata a 50");
    }

    @Test
    void emptyCriteriaUsesDefaults() {
        var page = service.search(new PlayerSearchCriteria(null, null, null, null, null, null, null, null, null,
                null, null));

        assertEquals(20, page.size());
    }

    @Test
    void unknownSortAndUnknownPlayerAreRejected() {
        assertEquals(ErrorCode.INVALID_REQUEST, assertThrows(ApiException.class, () -> service.search(
                new PlayerSearchCriteria(null, null, null, null, null, null, null, null, "id; DROP", null, null)))
                .getCode());
        assertEquals(ErrorCode.PLAYER_NOT_FOUND, assertThrows(ApiException.class, () -> service.detail(-1L)).getCode());
    }
}
