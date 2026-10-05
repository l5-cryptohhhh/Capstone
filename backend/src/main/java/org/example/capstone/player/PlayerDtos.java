package org.example.capstone.player;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Forme di risposta dell'API giocatori. */
public final class PlayerDtos {

    private PlayerDtos() {
    }

    public record PageDto<T>(List<T> items, int page, int size, long total) {
    }

    /** Una riga di ricerca: giocatore + stagione/squadra/campionato con le statistiche chiave. */
    public record PlayerSummaryDto(Long playerId, String name, Integer age, String nationality, String photoUrl,
                                   Position position, String team, String teamLogoUrl, String league, Integer season,
                                   Integer appearances, Integer minutes, BigDecimal rating, Integer goals,
                                   Integer assists) {
    }

    public record SeasonStatDto(String team, String league, Integer season, Position position,
                                Integer appearances, Integer lineups, Integer minutes, BigDecimal rating,
                                Integer goals, Integer assists, Integer goalsConceded, Integer saves,
                                Integer shotsTotal, Integer shotsOn, Integer passesTotal, Integer passesKey,
                                Integer tacklesTotal, Integer tacklesBlocks, Integer tacklesInterceptions,
                                Integer duelsTotal, Integer duelsWon, Integer dribblesAttempts,
                                Integer dribblesSuccess, Integer foulsDrawn, Integer foulsCommitted,
                                Integer yellowCards, Integer redCards) {
    }

    public record PlayerDetailDto(Long id, String name, String firstname, String lastname, LocalDate birthDate,
                                  Integer age, String nationality, Integer heightCm, Integer weightKg,
                                  String photoUrl, Position position, List<SeasonStatDto> seasons) {
    }
}
