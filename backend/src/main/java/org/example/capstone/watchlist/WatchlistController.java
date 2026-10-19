package org.example.capstone.watchlist;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.capstone.auth.AuthInterceptor;
import org.example.capstone.config.OpenApiConfig;
import org.example.capstone.watchlist.WatchlistService.WatchlistDetailDto;
import org.example.capstone.watchlist.WatchlistService.WatchlistDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Liste private dell'utente connesso (vedi WebConfig: richiedono la sessione). */
@Tag(name = "Liste", description = "Liste (watchlist) private di giocatori")
@SecurityRequirement(name = OpenApiConfig.SESSION)
@RestController
@RequestMapping("/api/v1/watchlists")
public class WatchlistController {

    public record CreateRequest(@NotBlank @Size(max = 80) String name) {
    }

    private final WatchlistService service;

    public WatchlistController(WatchlistService service) {
        this.service = service;
    }

    @GetMapping
    public List<WatchlistDto> list(HttpServletRequest request, @RequestParam(required = false) Long playerId) {
        return service.list(userId(request), playerId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WatchlistDto create(HttpServletRequest request, @Valid @RequestBody CreateRequest r) {
        return service.create(userId(request), r.name());
    }

    @GetMapping("/{id}")
    public WatchlistDetailDto detail(HttpServletRequest request, @PathVariable Long id) {
        return service.detail(userId(request), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(HttpServletRequest request, @PathVariable Long id) {
        service.delete(userId(request), id);
    }

    @PutMapping("/{id}/players/{playerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addPlayer(HttpServletRequest request, @PathVariable Long id, @PathVariable Long playerId) {
        service.addPlayer(userId(request), id, playerId);
    }

    @DeleteMapping("/{id}/players/{playerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removePlayer(HttpServletRequest request, @PathVariable Long id, @PathVariable Long playerId) {
        service.removePlayer(userId(request), id, playerId);
    }

    private static Long userId(HttpServletRequest request) {
        return AuthInterceptor.currentUser(request).id();
    }
}
