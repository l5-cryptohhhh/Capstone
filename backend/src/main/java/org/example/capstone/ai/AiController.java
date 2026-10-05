package org.example.capstone.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.capstone.ai.AiService.AiSearchResult;
import org.example.capstone.ai.AiService.PlayerReport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final AiService service;

    public AiController(AiService service) {
        this.service = service;
    }

    public record AiSearchRequest(@NotBlank @Size(max = 300) String query) {
    }

    /** Ricerca in linguaggio naturale: l'AI produce i filtri, i risultati vengono dal DB. */
    @PostMapping("/search")
    public AiSearchResult search(@Valid @RequestBody AiSearchRequest request) {
        return service.search(request.query());
    }

    /** Report testuale basato solo sulle statistiche reali del giocatore. */
    @GetMapping("/players/{id}/report")
    public PlayerReport report(@PathVariable Long id) {
        return service.report(id);
    }
}
