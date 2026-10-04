package org.example.capstone.league;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "league")
@Getter
@Setter
public class League {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_id", nullable = false, unique = true)
    private Integer apiId;

    @Column(nullable = false)
    private String name;

    private String country;

    @Column(name = "logo_url")
    private String logoUrl;

    /** Solo i campionati abilitati vengono importati. */
    @Column(nullable = false)
    private boolean enabled;

    /** Ordine di import: valori bassi per primi. */
    @Column(nullable = false)
    private int priority = 100;
}
