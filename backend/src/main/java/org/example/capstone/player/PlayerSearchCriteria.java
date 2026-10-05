package org.example.capstone.player;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Filtri di ricerca giocatori. Usato sia dai parametri REST sia come output strutturato dell'AI:
 * l'AI può solo compilare questi campi, non scrivere query.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PlayerSearchCriteria(String name, Position position, String team, String league, Integer season,
                                   Integer minAge, Integer maxAge, Integer minMinutes, String sort,
                                   Integer page, Integer size) {

    /** True se c'è almeno un filtro (paginazione e ordinamento non contano). */
    public boolean hasFilters() {
        return notBlank(name) || position != null || notBlank(team) || notBlank(league) || season != null
                || minAge != null || maxAge != null || minMinutes != null;
    }

    static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
