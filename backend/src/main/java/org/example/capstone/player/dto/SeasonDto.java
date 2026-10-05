package org.example.capstone.player.dto;

import org.example.capstone.player.Position;

import java.util.List;

public record SeasonDto(int season, TeamRefDto team, LeagueRefDto league, Position position, StatLineDto stats,
                        List<MetricValueDto> metrics) {
}
