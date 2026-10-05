package org.example.capstone.stats;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlayerSeasonStatRepository
        extends JpaRepository<PlayerSeasonStat, Long>, JpaSpecificationExecutor<PlayerSeasonStat> {

    Optional<PlayerSeasonStat> findByPlayerIdAndTeamIdAndLeagueIdAndSeason(
            Long playerId, Long teamId, Long leagueId, Integer season);

    /** Carica subito giocatore, squadra e campionato per evitare query aggiuntive nei risultati. */
    @Override
    @EntityGraph(attributePaths = {"player", "team", "league"})
    Page<PlayerSeasonStat> findAll(Specification<PlayerSeasonStat> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"team", "league"})
    List<PlayerSeasonStat> findByPlayerIdOrderBySeasonDesc(Long playerId);

    @EntityGraph(attributePaths = {"team", "league"})
    List<PlayerSeasonStat> findByPlayerIdOrderBySeasonDescIdAsc(Long playerId);

    @Query("select s from PlayerSeasonStat s join fetch s.player where s.league.id = :leagueId and s.season = :season")
    List<PlayerSeasonStat> findForRecompute(@Param("leagueId") long leagueId, @Param("season") int season);

    @Query("select max(s.season) from PlayerSeasonStat s")
    Integer findMaxSeason();

    @Query("select distinct s.season from PlayerSeasonStat s where s.league.id = :leagueId order by s.season desc")
    List<Integer> findSeasonsByLeague(@Param("leagueId") long leagueId);
}
