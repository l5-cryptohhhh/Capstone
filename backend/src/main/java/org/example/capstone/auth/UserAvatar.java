package org.example.capstone.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Foto profilo di un utente, già ridimensionata dal browser. Una sola per utente. */
@Entity
@Table(name = "user_avatar")
@Getter
@Setter
public class UserAvatar {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
