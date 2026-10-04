package org.example.capstone.ingestion.source;

import java.time.LocalDate;
import java.util.List;

/** Giocatore nel formato neutro della nostra applicazione. I valori assenti sono null. */
public record SourcePlayer(
        int apiId,
        String name,
        String firstname,
        String lastname,
        LocalDate birthDate,
        String nationality,
        Integer heightCm,
        Integer weightKg,
        String photoUrl,
        List<SourceStat> stats) {
}
