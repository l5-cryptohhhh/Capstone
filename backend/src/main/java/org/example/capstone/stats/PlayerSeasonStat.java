package org.example.capstone.stats;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.capstone.league.League;
import org.example.capstone.player.Player;
import org.example.capstone.player.Position;
import org.example.capstone.team.Team;

import java.math.BigDecimal;
import java.time.Instant;

/** Statistiche di un giocatore in una squadra, campionato e stagione. Valori assenti restano null. */
@Entity
@Table(name = "player_season_stat")
@Getter
@Setter
public class PlayerSeasonStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id")
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id")
    private League league;

    @Column(nullable = false)
    private Integer season;

    @Enumerated(EnumType.STRING)
    private Position position;

    private Integer appearances;
    private Integer lineups;
    private Integer minutes;
    private BigDecimal rating;

    private Integer goals;
    private Integer assists;

    @Column(name = "goals_conceded")
    private Integer goalsConceded;

    private Integer saves;

    @Column(name = "shots_total")
    private Integer shotsTotal;

    @Column(name = "shots_on")
    private Integer shotsOn;

    @Column(name = "passes_total")
    private Integer passesTotal;

    @Column(name = "passes_key")
    private Integer passesKey;

    @Column(name = "tackles_total")
    private Integer tacklesTotal;

    @Column(name = "tackles_blocks")
    private Integer tacklesBlocks;

    @Column(name = "tackles_interceptions")
    private Integer tacklesInterceptions;

    @Column(name = "duels_total")
    private Integer duelsTotal;

    @Column(name = "duels_won")
    private Integer duelsWon;

    @Column(name = "dribbles_attempts")
    private Integer dribblesAttempts;

    @Column(name = "dribbles_success")
    private Integer dribblesSuccess;

    @Column(name = "fouls_drawn")
    private Integer foulsDrawn;

    @Column(name = "fouls_committed")
    private Integer foulsCommitted;

    @Column(name = "yellow_cards")
    private Integer yellowCards;

    @Column(name = "red_cards")
    private Integer redCards;

    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt = Instant.now();
}
