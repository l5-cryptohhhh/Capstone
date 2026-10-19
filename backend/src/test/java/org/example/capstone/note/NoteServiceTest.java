package org.example.capstone.note;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NoteServiceTest {

    private final PlayerNoteRepository notes = mock(PlayerNoteRepository.class);
    private final PlayerRepository players = mock(PlayerRepository.class);
    private final NoteService service = new NoteService(notes, players);

    @BeforeEach
    void setUp() {
        when(players.existsById(10L)).thenReturn(true);
        when(notes.save(any(PlayerNote.class))).thenAnswer(i -> i.getArgument(0));
    }

    private static ErrorCode codeOf(Runnable action) {
        return assertThrows(ApiException.class, action::run).getCode();
    }

    private static PlayerNote note(long id, long userId, String body) {
        PlayerNote n = new PlayerNote();
        n.setId(id);
        n.setUserId(userId);
        n.setPlayerId(10L);
        n.setBody(body);
        return n;
    }

    @Test
    void createTrimsTheBodyAndBindsItToTheUser() {
        var dto = service.create(7L, 10L, "  Ottimo primo controllo  ");

        assertEquals("Ottimo primo controllo", dto.body());
        assertEquals(10L, dto.playerId());
        verify(notes).save(any(PlayerNote.class));
    }

    @Test
    void createRejectsBlankAndTooLongBodies() {
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.create(7L, 10L, "   ")));
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.create(7L, 10L, null)));
        assertEquals(ErrorCode.INVALID_REQUEST,
                codeOf(() -> service.create(7L, 10L, "x".repeat(NoteService.MAX_BODY + 1))));
        verify(notes, never()).save(any());
    }

    @Test
    void createRejectsUnknownPlayer() {
        assertEquals(ErrorCode.PLAYER_NOT_FOUND, codeOf(() -> service.create(7L, 99L, "ciao")));
    }

    @Test
    void createRespectsThePerPlayerLimit() {
        when(notes.countByUserIdAndPlayerId(7L, 10L)).thenReturn((long) NoteService.MAX_PER_PLAYER);

        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.create(7L, 10L, "ancora una")));
        verify(notes, never()).save(any());
    }

    @Test
    void listReturnsOnlyTheUsersNotes() {
        when(notes.findByUserIdAndPlayerIdOrderByCreatedAtDesc(7L, 10L)).thenReturn(List.of(note(1, 7, "mia")));

        var result = service.list(7L, 10L);

        assertEquals(1, result.size());
        assertEquals("mia", result.get(0).body());
    }

    @Test
    void updateChangesTheBodyOfAnOwnNote() {
        when(notes.findByIdAndUserId(1L, 7L)).thenReturn(Optional.of(note(1, 7, "vecchia")));

        assertEquals("nuova", service.update(7L, 1L, " nuova ").body());
    }

    @Test
    void someoneElsesNoteIsNotFound() {
        when(notes.findByIdAndUserId(1L, 8L)).thenReturn(Optional.empty());

        assertEquals(ErrorCode.NOTE_NOT_FOUND, codeOf(() -> service.update(8L, 1L, "x")));
        assertEquals(ErrorCode.NOTE_NOT_FOUND, codeOf(() -> service.delete(8L, 1L)));
        verify(notes, never()).delete(any());
    }

    @Test
    void deleteRemovesAnOwnNote() {
        PlayerNote mine = note(1, 7, "da togliere");
        when(notes.findByIdAndUserId(1L, 7L)).thenReturn(Optional.of(mine));

        service.delete(7L, 1L);

        verify(notes).delete(mine);
    }
}
