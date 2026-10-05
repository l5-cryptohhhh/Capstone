package org.example.capstone.stats;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PlayerSeasonMetricRepository extends JpaRepository<PlayerSeasonMetric, Long> {

    List<PlayerSeasonMetric> findByStatIdIn(Collection<Long> statIds);

    List<PlayerSeasonMetric> findByStatIdInAndMetricIn(Collection<Long> statIds, Collection<MetricKey> metrics);
}
