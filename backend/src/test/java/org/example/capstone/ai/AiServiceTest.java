package org.example.capstone.ai;

import org.example.capstone.ai.AiService.AiFilters;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.common.PageResponse;
import org.example.capstone.player.PlayerQueryService;
import org.example.capstone.player.Position;
import org.example.capstone.player.dto.PlayerDetailDto;
import org.example.capstone.player.dto.SeasonDto;
import org.example.capstone.search.PlayerSearchService;
import org.example.capstone.search.SearchCriteria;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiServiceTest {

    private final OpenRouterClient llm = mock(OpenRouterClient.class);
    private final PlayerSearchService searchService = mock(PlayerSearchService.class);
    private final PlayerQueryService players = mock(PlayerQueryService.class);
    private final AiService service = new AiService(llm, searchService, players,
            JsonMapper.builder().build());

    private void llmReplies(String content) {
        when(llm.complete(anyString(), anyString(), anyBoolean())).thenReturn(content);
    }

    @Test
    void interpretsFiltersAndIgnoresEverythingElse() {
        llmReplies("{\"position\":\"ATT\",\"maxAge\":21,\"sort\":\"goals\",\"size\":9999,\"page\":5}");

        AiFilters f = service.interpret("giovani attaccanti");

        assertEquals(Position.ATT, f.position());
        assertEquals(21, f.maxAge());
        assertEquals("goals", f.sort());
    }

    @Test
    void acceptsJsonWrappedInMarkdownFences() {
        llmReplies("```json\n{\"league\":\"Serie A\"}\n```");

        assertEquals("Serie A", service.interpret("serie a").league());
    }

    @Test
    void dropsSortOutsideWhitelist() {
        llmReplies("{\"name\":\"Rossi\",\"sort\":\"id; DROP TABLE player\"}");

        assertNull(service.interpret("rossi").sort());
    }

    @Test
    void rejectsGarbageAndEmptyFilters() {
        llmReplies("non è json");
        assertEquals(ErrorCode.QUERY_NOT_INTERPRETABLE,
                assertThrows(ApiException.class, () -> service.interpret("x")).getCode());

        llmReplies("{}");
        assertEquals(ErrorCode.QUERY_NOT_INTERPRETABLE,
                assertThrows(ApiException.class, () -> service.interpret("x")).getCode());

        llmReplies("{\"position\":\"WINGER\"}");
        assertEquals(ErrorCode.QUERY_NOT_INTERPRETABLE,
                assertThrows(ApiException.class, () -> service.interpret("x")).getCode());
    }

    private static PlayerDetailDto player(long id, String name, int... seasons) {
        List<SeasonDto> list = java.util.Arrays.stream(seasons)
                .mapToObj(s -> new SeasonDto(s, null, null, Position.MID, null, List.of())).toList();
        return new PlayerDetailDto(id, name, null, null, null, null, null, null, null, null, Position.MID, null, list);
    }

    @Test
    void compareNeedsTwoOrThreeDifferentPlayers() {
        for (List<Long> ids : List.of(List.of(1L), List.of(1L, 1L), List.of(1L, 2L, 3L, 4L))) {
            assertEquals(ErrorCode.INVALID_REQUEST,
                    assertThrows(ApiException.class, () -> service.compare(ids, null)).getCode());
        }
    }

    @Test
    void compareUsesTheLatestCommonSeasonAndOnlyRealData() {
        when(players.detail(1L, null)).thenReturn(player(1, "Rossi", 2024, 2023));
        when(players.detail(2L, null)).thenReturn(player(2, "Bianchi", 2023, 2022));
        when(players.detail(1L, 2023)).thenReturn(player(1, "Rossi", 2023));
        when(players.detail(2L, 2023)).thenReturn(player(2, "Bianchi", 2023));
        llmReplies("Verdetto di prova");

        AiService.CompareVerdict result = service.compare(List.of(1L, 2L), null);

        assertEquals(2023, result.season());
        assertEquals("Verdetto di prova", result.verdict());
        ArgumentCaptor<String> data = ArgumentCaptor.forClass(String.class);
        verify(llm).complete(anyString(), data.capture(), eq(false));
        assertTrue(data.getValue().contains("Rossi") && data.getValue().contains("Bianchi"));
    }

    @Test
    void compareRefusesWhenPlayersShareNoSeason() {
        when(players.detail(1L, null)).thenReturn(player(1, "Rossi", 2024));
        when(players.detail(2L, null)).thenReturn(player(2, "Bianchi", 2022));

        assertEquals(ErrorCode.INSUFFICIENT_DATA,
                assertThrows(ApiException.class, () -> service.compare(List.of(1L, 2L), null)).getCode());
    }

    @Test
    void searchRunsTheRegularSearchWithTheInterpretedFilters() {
        llmReplies("{\"name\":\"Rossi\",\"team\":\"Inter\",\"league\":\"Serie A\",\"position\":\"MID\","
                + "\"season\":2024,\"minAge\":18,\"maxAge\":25,\"minMinutes\":900}");
        when(searchService.search(any(), anyInt(), anyInt())).thenReturn(PageResponse.empty(0, 20));

        AiService.AiSearchResult result = service.search("centrocampisti dell'Inter");

        ArgumentCaptor<SearchCriteria> captor = ArgumentCaptor.forClass(SearchCriteria.class);
        verify(searchService).search(captor.capture(), eq(0), eq(20));
        SearchCriteria c = captor.getValue();
        assertEquals("Rossi", c.q());
        assertEquals("Inter", c.teamName());
        assertEquals("Serie A", c.leagueName());
        assertEquals(Position.MID, c.position());
        assertEquals(2024, c.season());
        assertEquals(18, c.minAge());
        assertEquals(25, c.maxAge());
        assertEquals(900, c.minMinutes());
        assertEquals("rating", c.sort(), "senza ordinamento richiesto si ordina per voto");
        assertTrue(c.descending());
        assertEquals("Rossi", result.interpreted().name());
    }
}
