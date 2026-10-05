package org.example.capstone.search;

import org.example.capstone.league.League;
import org.example.capstone.player.Player;
import org.example.capstone.player.dto.PlayerSummaryDto;
import org.example.capstone.stats.PlayerSeasonMetricRepository;
import org.example.capstone.stats.PlayerSeasonStat;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.example.capstone.stats.StatsProperties;
import org.example.capstone.team.Team;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Il visitatore vede solo i primi di ogni campionato; delle altre righe non deve trapelare nulla. */
class PlayerSearchPreviewTest {

    private final PlayerSeasonStatRepository stats = mock(PlayerSeasonStatRepository.class);
    private final PlayerSeasonMetricRepository metrics = mock(PlayerSeasonMetricRepository.class);
    private final PlayerSearchService service =
            new PlayerSearchService(stats, metrics, new StatsProperties(450, 10));

    private static final SearchCriteria ALL =
            new SearchCriteria(null, null, null, null, null, null, null, null, null, null, List.of(), "rating", true);

    private static PlayerSeasonStat row(long id) {
        League league = new League();
        league.setId(1L);
        league.setName("Serie A");
        Team team = new Team();
        team.setId(7L);
        team.setName("Inter");
        Player player = new Player();
        player.setId(100 + id);
        player.setName("Giocatore " + id);
        player.setNationality("Italy");
        PlayerSeasonStat s = new PlayerSeasonStat();
        s.setId(id);
        s.setPlayer(player);
        s.setTeam(team);
        s.setLeague(league);
        s.setSeason(2024);
        s.setGoals(9);
        return s;
    }

    private void givenRowsAndTopIds(List<Long> topIds) {
        when(stats.findMaxSeason()).thenReturn(2024);
        when(stats.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(row(1), row(2), row(3), row(4), row(5))));
        when(stats.findTopIds(anyLong(), anyInt(), anyInt(), any(Pageable.class))).thenReturn(topIds);
    }

    @Test
    void visitorSeesTopRowsAndTheRestLocked() {
        givenRowsAndTopIds(List.of(1L, 2L, 3L));

        List<PlayerSummaryDto> rows = service.searchPreview(ALL, 0, 20).content();

        assertThat(rows).extracting(PlayerSummaryDto::locked).containsExactly(false, false, false, true, true);
        assertThat(rows.getFirst().name()).isEqualTo("Giocatore 1");
    }

    @Test
    void lockedRowsExposeNoPlayerData() {
        givenRowsAndTopIds(List.of(1L, 2L, 3L));

        PlayerSummaryDto locked = service.searchPreview(ALL, 0, 20).content().get(3);

        assertThat(locked.id()).isNull();
        assertThat(locked.name()).isNull();
        assertThat(locked.nationality()).isNull();
        assertThat(locked.photoUrl()).isNull();
        assertThat(locked.goals()).isNull();
        assertThat(locked.metrics()).isEmpty();
        assertThat(locked.team().name()).isEqualTo("Inter");
    }

    @Test
    void fullSearchNeverLocksAnything() {
        givenRowsAndTopIds(List.of(1L));

        assertThat(service.search(ALL, 0, 20).content()).noneMatch(PlayerSummaryDto::locked);
    }
}
