package org.example.capstone.note;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.PlayerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/** Note private: ogni operazione è limitata all'utente che la chiede. */
@Service
public class NoteService {

    static final int MAX_BODY = 2000;
    static final int MAX_PER_PLAYER = 50;

    public record NoteDto(Long id, Long playerId, String body, Instant createdAt, Instant updatedAt) {
    }

    private final PlayerNoteRepository notes;
    private final PlayerRepository players;

    public NoteService(PlayerNoteRepository notes, PlayerRepository players) {
        this.notes = notes;
        this.players = players;
    }

    @Transactional(readOnly = true)
    public List<NoteDto> list(Long userId, Long playerId) {
        return notes.findByUserIdAndPlayerIdOrderByCreatedAtDesc(userId, playerId).stream()
                .map(NoteService::toDto).toList();
    }

    @Transactional
    public NoteDto create(Long userId, Long playerId, String body) {
        String text = clean(body);
        if (!players.existsById(playerId)) {
            throw new ApiException(ErrorCode.PLAYER_NOT_FOUND, "Giocatore non trovato");
        }
        if (notes.countByUserIdAndPlayerId(userId, playerId) >= MAX_PER_PLAYER) {
            throw new ApiException(ErrorCode.INVALID_REQUEST,
                    "Hai raggiunto il limite di " + MAX_PER_PLAYER + " note per giocatore");
        }
        PlayerNote note = new PlayerNote();
        note.setUserId(userId);
        note.setPlayerId(playerId);
        note.setBody(text);
        return toDto(notes.save(note));
    }

    @Transactional
    public NoteDto update(Long userId, Long noteId, String body) {
        String text = clean(body);
        PlayerNote note = own(userId, noteId);
        note.setBody(text);
        note.setUpdatedAt(Instant.now());
        return toDto(notes.save(note));
    }

    @Transactional
    public void delete(Long userId, Long noteId) {
        notes.delete(own(userId, noteId));
    }

    /** Una nota di un altro utente risponde come se non esistesse. */
    private PlayerNote own(Long userId, Long noteId) {
        return notes.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOTE_NOT_FOUND, "Nota non trovata"));
    }

    private static String clean(String body) {
        String text = body == null ? "" : body.trim();
        if (text.isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "La nota non può essere vuota");
        }
        if (text.length() > MAX_BODY) {
            throw new ApiException(ErrorCode.INVALID_REQUEST,
                    "La nota è troppo lunga (massimo " + MAX_BODY + " caratteri)");
        }
        return text;
    }

    private static NoteDto toDto(PlayerNote n) {
        return new NoteDto(n.getId(), n.getPlayerId(), n.getBody(), n.getCreatedAt(), n.getUpdatedAt());
    }
}
