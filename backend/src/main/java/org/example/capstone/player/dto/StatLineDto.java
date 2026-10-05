package org.example.capstone.player.dto;

import java.math.BigDecimal;

/** Statistiche stagionali grezze, come importate. I valori mancanti sono null, non 0. */
public record StatLineDto(
        Integer appearances, Integer lineups, Integer minutes, BigDecimal rating,
        Integer goals, Integer assists, Integer goalsConceded, Integer saves,
        Integer shotsTotal, Integer shotsOn, Integer passesTotal, Integer passesKey,
        Integer tacklesTotal, Integer tacklesBlocks, Integer tacklesInterceptions,
        Integer duelsTotal, Integer duelsWon, Integer dribblesAttempts, Integer dribblesSuccess,
        Integer foulsDrawn, Integer foulsCommitted, Integer yellowCards, Integer redCards) {
}
