package org.example.capstone.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "app_user")
@Getter
@Setter
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    private String bio;

    private String location;

    @Column(name = "favorite_team")
    private String favoriteTeam;

    @Column(name = "favorite_position")
    private String favoritePosition;

    /** Quando è stata cambiata la foto (null = nessuna foto): serve a invalidare la cache del browser. */
    @Column(name = "avatar_updated_at")
    private Instant avatarUpdatedAt;
}
