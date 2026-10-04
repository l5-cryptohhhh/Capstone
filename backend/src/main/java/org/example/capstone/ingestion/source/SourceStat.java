package org.example.capstone.ingestion.source;

import org.example.capstone.player.Position;

import java.math.BigDecimal;

/** Statistiche stagionali di un giocatore con una squadra in un campionato. */
public record SourceStat(
        int leagueApiId,
        int teamApiId,
        String teamName,
        String teamLogoUrl,
        Position position,
        Integer appearances,
        Integer lineups,
        Integer minutes,
        BigDecimal rating,
        Integer goals,
        Integer assists,
        Integer goalsConceded,
        Integer saves,
        Integer shotsTotal,
        Integer shotsOn,
        Integer passesTotal,
        Integer passesKey,
        Integer tacklesTotal,
        Integer tacklesBlocks,
        Integer tacklesInterceptions,
        Integer duelsTotal,
        Integer duelsWon,
        Integer dribblesAttempts,
        Integer dribblesSuccess,
        Integer foulsDrawn,
        Integer foulsCommitted,
        Integer yellowCards,
        Integer redCards) {
}
