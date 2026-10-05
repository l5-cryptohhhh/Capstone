package org.example.capstone.league;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leagues")
public class LeagueController {

    private final LeagueRepository leagues;

    public LeagueController(LeagueRepository leagues) {
        this.leagues = leagues;
    }

    public record LeagueDto(Long id, String name, String country, String logoUrl) {
    }

    /** Campionati abilitati, per popolare i filtri del frontend. */
    @GetMapping
    public List<LeagueDto> list() {
        return leagues.findByEnabledTrueOrderByPriorityAsc().stream()
                .map(l -> new LeagueDto(l.getId(), l.getName(), l.getCountry(), l.getLogoUrl()))
                .toList();
    }
}
