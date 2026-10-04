package org.example.capstone.stats;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlayerSeasonStatRepository extends JpaRepository<PlayerSeasonStat, Long> {

    Optional<PlayerSeasonStat> findByPlayerIdAndTeamIdAndLeagueIdAndSeason(
            Long playerId, Long teamId, Long leagueId, Integer season);
}
