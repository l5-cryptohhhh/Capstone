package org.example.capstone.note;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Nota privata di un utente su un giocatore. Gli id restano semplici numeri: non servono relazioni caricate. */
@Entity
@Table(name = "player_note")
@Getter
@Setter
public class PlayerNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
