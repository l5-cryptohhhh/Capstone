package org.example.capstone.note;

import org.example.capstone.auth.AuthInterceptor;
import org.example.capstone.auth.AuthService.UserDto;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.common.GlobalExceptionHandler;
import org.example.capstone.note.NoteService.NoteDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NoteControllerTest {

    private static final UserDto USER = new UserDto(7L, "a@b.it", "Anna", null, null, null, null, null, null);

    private NoteService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(NoteService.class);
        mvc = MockMvcBuilders.standaloneSetup(new NoteController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private static NoteDto dto(String body) {
        return new NoteDto(1L, 10L, body, Instant.parse("2026-10-19T10:00:00Z"), Instant.parse("2026-10-19T10:00:00Z"));
    }

    @Test
    void listReturnsTheUsersNotes() throws Exception {
        when(service.list(7L, 10L)).thenReturn(List.of(dto("ciao")));

        mvc.perform(get("/api/v1/players/10/notes").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].body").value("ciao"))
                .andExpect(jsonPath("$[0].playerId").value(10));
    }

    @Test
    void createReturns201() throws Exception {
        when(service.create(7L, 10L, "nuova")).thenReturn(dto("nuova"));

        mvc.perform(post("/api/v1/players/10/notes").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"nuova\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.body").value("nuova"));
    }

    @Test
    void emptyBodyIsABadRequest() throws Exception {
        mvc.perform(post("/api/v1/players/10/notes").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void updateAndDeleteUseTheNoteId() throws Exception {
        when(service.update(eq(7L), eq(1L), eq("cambiata"))).thenReturn(dto("cambiata"));

        mvc.perform(put("/api/v1/notes/1").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"cambiata\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("cambiata"));

        mvc.perform(delete("/api/v1/notes/1").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER))
                .andExpect(status().isNoContent());
        verify(service).delete(7L, 1L);
    }

    @Test
    void someoneElsesNoteIs404() throws Exception {
        when(service.update(eq(7L), eq(5L), eq("x")))
                .thenThrow(new ApiException(ErrorCode.NOTE_NOT_FOUND, "Nota non trovata"));

        mvc.perform(put("/api/v1/notes/5").requestAttr(AuthInterceptor.USER_ATTRIBUTE, USER)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"x\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOTE_NOT_FOUND"));
    }
}
