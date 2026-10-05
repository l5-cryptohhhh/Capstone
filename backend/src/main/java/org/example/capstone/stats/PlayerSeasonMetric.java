package org.example.capstone.stats;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Valore calcolato di una metrica per una riga di statistiche, con il suo percentile (se la coorte è sufficiente). */
@Entity
@Table(name = "player_season_metric")
@Getter
@Setter
public class PlayerSeasonMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stat_id", nullable = false)
    private Long statId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MetricKey metric;

    @Column(name = "metric_value", nullable = false)
    private BigDecimal value;

    private Integer percentile;

    @Column(name = "cohort_size")
    private Integer cohortSize;
}
