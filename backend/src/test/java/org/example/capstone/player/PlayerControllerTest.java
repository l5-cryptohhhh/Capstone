package org.example.capstone.player;

import org.example.capstone.auth.AuthInterceptor;
import org.example.capstone.auth.AuthService.UserDto;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.common.GlobalExceptionHandler;
import org.example.capstone.common.PageResponse;
import org.example.capstone.search.PlayerSearchService;
import org.example.capstone.search.SearchCriteria;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PlayerControllerTest {

    private PlayerSearchService searchService;
    private PlayerQueryService queryService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        searchService = mock(PlayerSearchService.class);
        queryService = mock(PlayerQueryService.class);
        mvc = MockMvcBuilders.standaloneSetup(new PlayerController(searchService, queryService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void searchPassesParsedCriteriaToTheService() throws Exception {
        when(searchService.search(any(), anyInt(), anyInt())).thenReturn(PageResponse.empty(0, 20));

        mvc.perform(get("/api/v1/players")
                        .requestAttr(AuthInterceptor.USER_ATTRIBUTE, new UserDto(1L, "a@b.it", "Anna"))
                        .param("position", "MID").param("maxAge", "22").param("season", "2024")
                        .param("pct.def_actions_p90.min", "70").param("sort", "def_actions_p90"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(0));

        ArgumentCaptor<SearchCriteria> captor = ArgumentCaptor.forClass(SearchCriteria.class);
        verify(searchService).search(captor.capture(), eq(0), eq(20));
        SearchCriteria c = captor.getValue();
        assertThat(c.position()).isEqualTo(Position.MID);
        assertThat(c.maxAge()).isEqualTo(22);
        assertThat(c.season()).isEqualTo(2024);
        assertThat(c.filters()).hasSize(1);
        assertThat(c.sort()).isEqualTo("def_actions_p90");
    }

    @Test
    void visitorsGetThePreviewWithLockedRows() throws Exception {
        when(searchService.searchPreview(any(), anyInt(), anyInt())).thenReturn(PageResponse.empty(0, 20));

        mvc.perform(get("/api/v1/players")).andExpect(status().isOk());

        verify(searchService).searchPreview(any(), eq(0), eq(20));
        verify(searchService, never()).search(any(), anyInt(), anyInt());
    }

    @Test
    void unknownMetricIsRejectedBeforeReachingTheService() throws Exception {
        mvc.perform(get("/api/v1/players").param("pct.inventata.min", "50"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));

        verify(searchService, never()).search(any(), anyInt(), anyInt());
    }

    @Test
    void invalidPositionIsABadRequest() throws Exception {
        mvc.perform(get("/api/v1/players").param("position", "ALA"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void oversizedPageIsRejected() throws Exception {
        mvc.perform(get("/api/v1/players").param("size", "1000"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void detailOfMissingPlayerIs404() throws Exception {
        when(queryService.detail(eq(99L), any()))
                .thenThrow(new ApiException(ErrorCode.PLAYER_NOT_FOUND, "Giocatore 99 non trovato"));

        mvc.perform(get("/api/v1/players/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PLAYER_NOT_FOUND"));
    }
}
