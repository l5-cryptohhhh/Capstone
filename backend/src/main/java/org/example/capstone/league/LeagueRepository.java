package org.example.capstone.league;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeagueRepository extends JpaRepository<League, Long> {

    List<League> findByEnabledTrueOrderByPriorityAsc();
}
