package org.example.capstone.league;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeagueRepository extends JpaRepository<League, Long> {

    Optional<League> findByApiId(Integer apiId);

    List<League> findByEnabledTrueOrderByPriorityAsc();
}
