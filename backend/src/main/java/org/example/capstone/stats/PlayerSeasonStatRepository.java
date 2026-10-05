package org.example.capstone.stats;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface PlayerSeasonStatRepository
        extends JpaRepository<PlayerSeasonStat, Long>, JpaSpecificationExecutor<PlayerSeasonStat> {

    Optional<PlayerSeasonStat> findByPlayerIdAndTeamIdAndLeagueIdAndSeason(
            Long playerId, Long teamId, Long leagueId, Integer season);

    @Override
    @EntityGraph(attributePaths = {"player", "team", "league"})
    Page<PlayerSeasonStat> findAll(Specification<PlayerSeasonStat> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"team", "league"})
    List<PlayerSeasonStat> findByPlayerIdOrderBySeasonDescIdAsc(Long playerId);
}
