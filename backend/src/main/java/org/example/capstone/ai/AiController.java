package org.example.capstone.ai;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.capstone.ai.AiService.AiSearchResult;
import org.example.capstone.ai.AiService.CompareVerdict;
import org.example.capstone.ai.AiService.PlayerReport;
import org.example.capstone.config.OpenApiConfig;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Intelligenza artificiale", description = "Ricerca in linguaggio naturale, report sul giocatore e verdetto sul confronto")
@SecurityRequirement(name = OpenApiConfig.SESSION)
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

    /** Verdetto su 2-3 giocatori, basato solo sulle loro statistiche reali nella stessa stagione. */
    @GetMapping("/compare")
    public CompareVerdict compare(@RequestParam List<Long> ids, @RequestParam(required = false) Integer season,
                                  @RequestParam(defaultValue = "it") String lang) {
        return service.compare(ids, season, lang);
    }

    /** Report testuale basato solo sulle statistiche reali del giocatore. */
    @GetMapping("/players/{id}/report")
    public PlayerReport report(@PathVariable Long id, @RequestParam(defaultValue = "it") String lang) {
        return service.report(id, lang);
    }
}
