package org.example.capstone.ingestion;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.capstone.league.League;

import java.time.Instant;

/** Avanzamento dell'import della rosa di una squadra in una stagione (o dell'elenco squadre di un campionato). */
@Entity
@Table(name = "import_task")
@Getter
@Setter
public class ImportTask {

    public static final int LEAGUE_TEAMS = 0;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id")
    private League league;

    @Column(nullable = false)
    private Integer season;

    /** Squadra (id API-Football) di cui importare la rosa; {@link #LEAGUE_TEAMS} = task che elenca le squadre del campionato. */
    @Column(name = "team_api_id", nullable = false)
    private int teamApiId = LEAGUE_TEAMS;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(name = "next_page", nullable = false)
    private int nextPage = 1;

    @Column(name = "total_pages")
    private Integer totalPages;

    @Column(name = "players_imported", nullable = false)
    private int playersImported;

    @Column(name = "last_error")
    private String lastError;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
