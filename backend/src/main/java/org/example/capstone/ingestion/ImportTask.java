package org.example.capstone.ingestion;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.capstone.league.League;

import java.time.Instant;

/** Avanzamento dell'import di un campionato in una stagione. */
@Entity
@Table(name = "import_task")
@Getter
@Setter
public class ImportTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id")
    private League league;

    @Column(nullable = false)
    private Integer season;

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
