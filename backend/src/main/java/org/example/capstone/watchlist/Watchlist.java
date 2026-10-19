package org.example.capstone.watchlist;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/** Lista privata di giocatori di un utente. I giocatori sono solo i loro id (la colonna added_at ha il default). */
@Entity
@Table(name = "watchlist")
@Getter
@Setter
public class Watchlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "watchlist_player", joinColumns = @JoinColumn(name = "watchlist_id"))
    @Column(name = "player_id")
    private Set<Long> playerIds = new HashSet<>();
}
