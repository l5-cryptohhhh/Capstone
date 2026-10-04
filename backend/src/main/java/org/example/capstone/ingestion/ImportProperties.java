package org.example.capstone.ingestion;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

/**
 * @param dailyBudget richieste massime al giorno che l'import può usare
 * @param seasons     stagioni da importare, in ordine di priorità (la prima viene completata per tutti i campionati)
 * @param autoEnabled se true, un job giornaliero (00:05 UTC) rilancia l'import da solo
 */
@ConfigurationProperties("scoutai.import")
public record ImportProperties(
        @DefaultValue("90") int dailyBudget,
        @DefaultValue({"2024", "2023"}) List<Integer> seasons,
        @DefaultValue("false") boolean autoEnabled) {
}
