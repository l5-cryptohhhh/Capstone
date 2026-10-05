package org.example.capstone.search;

import org.example.capstone.player.Position;

import java.util.List;

/**
 * Criteri strutturati di ricerca. Sono prodotti dai parametri della GET /players
 * e dall'interpretazione AI della ricerca in linguaggio naturale.
 *
 * @param teamName   parte del nome della squadra (usato dall'AI, che non conosce gli id)
 * @param leagueName parte del nome del campionato (usato dall'AI, che non conosce gli id)
 * @param sort       campo di ordinamento: name, age, minutes, appearances, rating, goals, assists oppure la chiave di una metrica
 */
public record SearchCriteria(
        String q,
        Position position,
        Integer minAge,
        Integer maxAge,
        Long leagueId,
        Long teamId,
        String teamName,
        String leagueName,
        Integer season,
        Integer minMinutes,
        List<MetricFilter> filters,
        String sort,
        boolean descending) {

    public SearchCriteria {
        filters = filters == null ? List.of() : List.copyOf(filters);
    }
}
