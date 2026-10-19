package org.example.capstone.valuation;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.capstone.config.OpenApiConfig;
import org.example.capstone.valuation.ProjectionService.ProjectionDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Stima", description = "Stima euristica di valore e traiettoria di crescita")
@SecurityRequirement(name = OpenApiConfig.SESSION)
@RestController
@RequestMapping("/api/v1/players")
public class ProjectionController {

    private final ProjectionService service;

    public ProjectionController(ProjectionService service) {
        this.service = service;
    }

    @GetMapping("/{id}/projection")
    @Operation(summary = "Stima di valore e crescita",
            description = "Stima euristica in milioni di euro, calcolata al volo da percentili, età, minuti, "
                    + "campionato e ruolo. Non è un valore di mercato. Senza `season` usa la stagione più recente. "
                    + "Se i dati non bastano risponde `available: false` con il motivo.")
    public ProjectionDto projection(@PathVariable Long id, @RequestParam(required = false) Integer season) {
        return service.projection(id, season);
    }
}
