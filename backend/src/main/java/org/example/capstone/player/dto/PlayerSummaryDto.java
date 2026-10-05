package org.example.capstone.player.dto;

import org.example.capstone.player.Position;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Giocatore in una stagione (una riga per squadra: chi ha cambiato squadra compare con ciascuna).
 * metrics contiene i valori delle metriche usate per filtrare o ordinare la ricerca.
 * locked: riga riservata agli utenti registrati; ne restano solo ruolo, squadra, campionato e stagione.
 */
public record PlayerSummaryDto(
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
        Integer appearances,
        Integer goals,
        Integer assists,
        BigDecimal rating,
        Map<String, MetricValueDto> metrics,
        boolean locked) {
}
