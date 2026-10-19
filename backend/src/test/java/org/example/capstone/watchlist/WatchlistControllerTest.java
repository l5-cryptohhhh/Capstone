package org.example.capstone.watchlist;

import org.example.capstone.auth.AuthInterceptor;
import org.example.capstone.auth.AuthService.UserDto;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.common.GlobalExceptionHandler;
import org.example.capstone.watchlist.WatchlistService.WatchlistDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class WatchlistControllerTest {

    private static final UserDto USER = new UserDto(7L, "a@b.it", "Anna", null, null, null, null, null, null);

    private WatchlistService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(WatchlistService.class);
        mvc = MockMvcBuilders.standaloneSetup(new WatchlistController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listPassesTheOptionalPlayerId() throws Exception {
        when(service.list(7L, 10L)).thenReturn(List.of(new WatchlistDto(1L, "A", 3, true)));

        mvc.perform(get("/api/v1/watchlists?playerId=10").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].playerCount").value(3))
                .andExpect(jsonPath("$[0].contains").value(true));
    }

    @Test
    void createReturns201AndRejectsABlankName() throws Exception {
        when(service.create(7L, "Nuova")).thenReturn(new WatchlistDto(1L, "Nuova", 0, false));

        mvc.perform(post("/api/v1/watchlists").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Nuova\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Nuova"));

        mvc.perform(post("/api/v1/watchlists").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void addRemovePlayerAndDeleteReturn204() throws Exception {
        mvc.perform(put("/api/v1/watchlists/1/players/10").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/v1/watchlists/1/players/10").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/v1/watchlists/1").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER))
                .andExpect(status().isNoContent());

        verify(service).addPlayer(7L, 1L, 10L);
        verify(service).removePlayer(7L, 1L, 10L);
        verify(service).delete(7L, 1L);
    }

    @Test
    void someoneElsesListIs404() throws Exception {
        when(service.detail(7L, 5L)).thenThrow(new ApiException(ErrorCode.WATCHLIST_NOT_FOUND, "Lista non trovata"));

        mvc.perform(get("/api/v1/watchlists/5").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("WATCHLIST_NOT_FOUND"));
    }
}
