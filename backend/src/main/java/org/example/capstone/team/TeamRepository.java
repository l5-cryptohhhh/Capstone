package org.example.capstone.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByApiId(Integer apiId);

    @Query("select distinct t from PlayerSeasonStat s join s.team t where s.league.id = :leagueId order by t.name")
    List<Team> findByLeague(@Param("leagueId") Long leagueId);

    @Query("""
            select distinct t from PlayerSeasonStat s join s.team t
            where s.league.id = :leagueId and s.season = :season order by t.name
            """)
    List<Team> findByLeagueAndSeason(@Param("leagueId") Long leagueId, @Param("season") Integer season);
}
