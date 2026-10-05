package org.example.capstone.player;

import org.example.capstone.league.League;
import org.example.capstone.player.dto.LeagueRefDto;
import org.example.capstone.player.dto.MetricValueDto;
import org.example.capstone.player.dto.StatLineDto;
import org.example.capstone.player.dto.TeamRefDto;
import org.example.capstone.stats.PlayerSeasonMetric;
import org.example.capstone.stats.PlayerSeasonStat;
import org.example.capstone.team.Team;

import java.time.LocalDate;
import java.time.Period;

/** Conversioni da entità a DTO: le entità JPA non vengono mai esposte dall'API. */
public final class PlayerMapper {

    private PlayerMapper() {
    }

    public static Integer age(LocalDate birthDate) {
        return birthDate == null ? null : Period.between(birthDate, LocalDate.now()).getYears();
    }

    public static TeamRefDto team(Team t) {
        return new TeamRefDto(t.getId(), t.getName(), t.getLogoUrl());
    }

    public static LeagueRefDto league(League l) {
        return new LeagueRefDto(l.getId(), l.getName(), l.getCountry(), l.getLogoUrl());
    }

    public static MetricValueDto metric(PlayerSeasonMetric m) {
        return new MetricValueDto(m.getMetric().key(), m.getMetric().label(), m.getMetric().unit(), m.getValue(),
                m.getPercentile(), m.getCohortSize());
    }

    public static StatLineDto statLine(PlayerSeasonStat s) {
        return new StatLineDto(s.getAppearances(), s.getLineups(), s.getMinutes(), s.getRating(), s.getGoals(),
                s.getAssists(), s.getGoalsConceded(), s.getSaves(), s.getShotsTotal(), s.getShotsOn(),
                s.getPassesTotal(), s.getPassesKey(), s.getTacklesTotal(), s.getTacklesBlocks(),
                s.getTacklesInterceptions(), s.getDuelsTotal(), s.getDuelsWon(), s.getDribblesAttempts(),
                s.getDribblesSuccess(), s.getFoulsDrawn(), s.getFoulsCommitted(), s.getYellowCards(), s.getRedCards());
    }
}
