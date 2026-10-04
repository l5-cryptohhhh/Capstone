package org.example.capstone.ingestion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImportTaskRepository extends JpaRepository<ImportTask, Long> {

    boolean existsByLeagueIdAndSeason(Long leagueId, Integer season);

    /** Task da completare: prima la stagione più recente, poi i campionati per priorità. */
    @Query("""
            select t from ImportTask t join fetch t.league l
            where t.status <> org.example.capstone.ingestion.TaskStatus.DONE
              and l.enabled = true and t.season in :seasons
            order by t.season desc, l.priority asc
            """)
    List<ImportTask> findPending(@Param("seasons") List<Integer> seasons);

    @Query("select t from ImportTask t join fetch t.league l order by t.season desc, l.priority asc")
    List<ImportTask> findAllWithLeague();
}
