package org.example.capstone.note;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.capstone.auth.AuthInterceptor;
import org.example.capstone.config.OpenApiConfig;
import org.example.capstone.note.NoteService.NoteDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Note private dell'utente connesso sui giocatori (vedi WebConfig: richiedono la sessione). */
@Tag(name = "Note", description = "Note private dell'utente sulla scheda di un giocatore")
@SecurityRequirement(name = OpenApiConfig.SESSION)
@RestController
@RequestMapping("/api/v1")
public class NoteController {

    public record NoteRequest(@NotBlank @Size(max = 2000) String body) {
    }

    private final NoteService notes;

    public NoteController(NoteService notes) {
        this.notes = notes;
    }

    @GetMapping("/players/{playerId}/notes")
    public List<NoteDto> list(HttpServletRequest request, @PathVariable Long playerId) {
        return notes.list(userId(request), playerId);
    }

    @PostMapping("/players/{playerId}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public NoteDto create(HttpServletRequest request, @PathVariable Long playerId,
                          @Valid @RequestBody NoteRequest r) {
        return notes.create(userId(request), playerId, r.body());
    }

    @PutMapping("/notes/{noteId}")
    public NoteDto update(HttpServletRequest request, @PathVariable Long noteId, @Valid @RequestBody NoteRequest r) {
        return notes.update(userId(request), noteId, r.body());
    }

    @DeleteMapping("/notes/{noteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(HttpServletRequest request, @PathVariable Long noteId) {
        notes.delete(userId(request), noteId);
    }

    private static Long userId(HttpServletRequest request) {
        return AuthInterceptor.currentUser(request).id();
    }
}
