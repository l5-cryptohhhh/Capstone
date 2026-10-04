package org.example.capstone.team;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "team")
@Getter
@Setter
public class Team {

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
}
