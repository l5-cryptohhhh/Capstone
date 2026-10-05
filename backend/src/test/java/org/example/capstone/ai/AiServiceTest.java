package org.example.capstone.ai;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.PlayerSearchCriteria;
import org.example.capstone.player.PlayerService;
import org.example.capstone.player.Position;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiServiceTest {

    private final OpenRouterClient llm = mock(OpenRouterClient.class);
    private final AiService service = new AiService(llm, mock(PlayerService.class), JsonMapper.builder().build());

    private void llmReplies(String content) {
        when(llm.complete(anyString(), anyString(), anyBoolean())).thenReturn(content);
    }

    @Test
    void interpretsFiltersAndForcesPagination() {
        llmReplies("{\"position\":\"ATT\",\"maxAge\":21,\"sort\":\"goals\",\"size\":9999,\"page\":5}");

        PlayerSearchCriteria c = service.interpret("giovani attaccanti");

        assertEquals(Position.ATT, c.position());
        assertEquals(21, c.maxAge());
        assertEquals("goals", c.sort());
        assertEquals(20, c.size());
        assertEquals(0, c.page());
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
}
