package org.example.capstone.ingestion.apifootball;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/** Forma grezza della risposta di API-Football (GET /players). Non esce mai da questo package. */
final class ApiFootballDto {

    private ApiFootballDto() {
    }

    /** "errors" è [] se tutto ok, oppure un oggetto {chiave: messaggio}. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record PlayersEnvelope(Object errors, Paging paging, List<PlayerEntry> response) {
    }

    /** Forma grezza di GET /teams. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record TeamsEnvelope(Object errors, List<TeamEntry> response) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TeamEntry(TeamRef team) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Paging(int current, int total) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record PlayerEntry(PlayerInfo player, List<StatEntry> statistics) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record PlayerInfo(Integer id, String name, String firstname, String lastname, Birth birth,
                      String nationality, String height, String weight, String photo) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Birth(String date) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record StatEntry(TeamRef team, LeagueRef league, Games games, Shots shots, Goals goals, Passes passes,
                     Tackles tackles, Duels duels, Dribbles dribbles, Fouls fouls, Cards cards) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TeamRef(Integer id, String name, String logo) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record LeagueRef(Integer id) {
    }

    /** "appearences" è il nome (errato) usato dall'API. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Games(Integer appearences, Integer lineups, Integer minutes, String position, String rating) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Shots(Integer total, Integer on) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Goals(Integer total, Integer conceded, Integer assists, Integer saves) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Passes(Integer total, Integer key) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Tackles(Integer total, Integer blocks, Integer interceptions) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Duels(Integer total, Integer won) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Dribbles(Integer attempts, Integer success) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Fouls(Integer drawn, Integer committed) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Cards(Integer yellow, Integer red) {
    }
}
