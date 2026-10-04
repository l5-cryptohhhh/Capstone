package org.example.capstone.player;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "player")
@Getter
@Setter
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_id", nullable = false, unique = true)
    private Integer apiId;

    @Column(nullable = false)
    private String name;

    private String firstname;
    private String lastname;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    private String nationality;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "weight_kg")
    private Integer weightKg;

    @Column(name = "photo_url")
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    private Position position;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;
}
