package org.example.capstone.player;

import org.example.capstone.player.PlayerDtos.PageDto;
import org.example.capstone.player.PlayerDtos.PlayerDetailDto;
import org.example.capstone.player.PlayerDtos.PlayerSummaryDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/players")
public class PlayerController {

    private final PlayerService service;

    public PlayerController(PlayerService service) {
        this.service = service;
    }

    /** Ricerca per filtri: name, position, team, league, season, minAge, maxAge, minMinutes, sort, page, size. */
    @GetMapping
    public PageDto<PlayerSummaryDto> search(@ModelAttribute PlayerSearchCriteria criteria) {
        return service.search(criteria);
    }

    @GetMapping("/{id}")
    public PlayerDetailDto detail(@PathVariable Long id) {
        return service.detail(id);
    }
}
