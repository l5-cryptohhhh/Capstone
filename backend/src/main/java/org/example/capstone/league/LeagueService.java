package org.example.capstone.league;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.dto.TeamRefDto;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.example.capstone.team.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class LeagueService {

    private final LeagueRepository leagues;
    private final PlayerSeasonStatRepository stats;
    private final TeamRepository teams;

    public LeagueService(LeagueRepository leagues, PlayerSeasonStatRepository stats, TeamRepository teams) {
        this.leagues = leagues;
        this.stats = stats;
        this.teams = teams;
    }

    /** Campionati abilitati che hanno almeno una stagione di dati, con le stagioni disponibili. */
    public List<LeagueDto> listWithData() {
        return leagues.findByEnabledTrueOrderByPriorityAsc().stream()
                .map(l -> new LeagueDto(l.getId(), l.getName(), l.getCountry(), l.getLogoUrl(),
                        stats.findSeasonsByLeague(l.getId())))
                .filter(l -> !l.seasons().isEmpty())
                .toList();
    }

    public List<TeamRefDto> teams(Long leagueId, Integer season) {
        if (!leagues.existsById(leagueId)) {
            throw new ApiException(ErrorCode.LEAGUE_NOT_FOUND, "Campionato " + leagueId + " non trovato");
        }
        var result = season == null ? teams.findByLeague(leagueId) : teams.findByLeagueAndSeason(leagueId, season);
        return result.stream().map(t -> new TeamRefDto(t.getId(), t.getName(), t.getLogoUrl())).toList();
    }

    public record LeagueDto(Long id, String name, String country, String logoUrl, List<Integer> seasons) {
    }
}
