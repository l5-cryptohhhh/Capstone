package org.example.capstone.league;

import org.example.capstone.player.dto.TeamRefDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leagues")
public class LeagueController {

    private final LeagueService service;

    public LeagueController(LeagueService service) {
        this.service = service;
    }

    @GetMapping
    public List<LeagueService.LeagueDto> list() {
        return service.listWithData();
    }

    @GetMapping("/{id}/teams")
    public List<TeamRefDto> teams(@PathVariable Long id, @RequestParam(required = false) Integer season) {
        return service.teams(id, season);
    }
}
