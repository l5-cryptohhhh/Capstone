package org.example.capstone.player.dto;

import org.example.capstone.player.Position;

/**
 * Giocatore statisticamente vicino a un altro. similarity va da 0 a 100 (100 = stessi percentili);
 * commonMetrics è il numero di metriche su cui è stato calcolato il confronto.
 */
public record SimilarPlayerDto(
        Long id,
        String name,
        Integer age,
        String nationality,
        Position position,
        String photoUrl,
        TeamRefDto team,
        LeagueRefDto league,
        int season,
        Integer minutes,
        int similarity,
        int commonMetrics) {
}
