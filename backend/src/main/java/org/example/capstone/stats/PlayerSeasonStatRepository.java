package org.example.capstone.stats;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlayerSeasonStatRepository extends JpaRepository<PlayerSeasonStat, Long> {

    Optional<PlayerSeasonStat> findByPlayerIdAndTeamIdAndLeagueIdAndSeason(
            Long playerId, Long teamId, Long leagueId, Integer season);
}
