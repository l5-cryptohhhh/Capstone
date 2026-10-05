package org.example.capstone.stats;

import org.example.capstone.player.Position;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

/** Catalogo delle metriche interrogabili: il frontend lo usa per costruire filtri ed etichette. */
@RestController
@RequestMapping("/api/v1/metrics")
public class MetricController {

    @GetMapping
    public List<MetricInfoDto> list() {
        return Arrays.stream(MetricKey.values())
                .map(m -> new MetricInfoDto(m.key(), m.label(), m.description(), m.unit(), m.higherIsBetter(),
                        m.positions()))
                .toList();
    }

    public record MetricInfoDto(String key, String label, String description, MetricUnit unit,
                                boolean higherIsBetter, Set<Position> positions) {
    }
}
