package org.example.capstone.search;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.Position;
import org.example.capstone.stats.MetricKey;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Converte i parametri della query string in SearchCriteria validati.
 * Filtri sulle metriche: {@code pct.<metrica>.min|max} (percentile) e {@code val.<metrica>.min|max} (valore),
 * ad esempio {@code pct.def_actions_p90.min=70}.
 */
public final class SearchParamParser {

    public static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_QUERY_LENGTH = 100;
    private static final Set<String> BASIC_SORTS = Set.of("name", "age", "minutes", "appearances", "rating", "goals", "assists");

    private SearchParamParser() {
    }

    public record Request(String q, Position position, Integer minAge, Integer maxAge, Long leagueId, Long teamId,
                          Integer season, Integer minMinutes, String sort, String order, int page, int size,
                          Map<String, String> params) {
    }

    public static SearchCriteria parse(Request r) {
        if (r.page() < 0) {
            throw invalid("page deve essere >= 0");
        }
        if (r.size() < 1 || r.size() > MAX_PAGE_SIZE) {
            throw invalid("size deve essere tra 1 e " + MAX_PAGE_SIZE);
        }
        if (r.q() != null && r.q().length() > MAX_QUERY_LENGTH) {
            throw invalid("q troppo lunga (max " + MAX_QUERY_LENGTH + ")");
        }
        if (r.minAge() != null && r.minAge() < 0) {
            throw invalid("minAge non valido");
        }
        if (r.maxAge() != null && r.maxAge() < 0) {
            throw invalid("maxAge non valido");
        }
        if (r.minAge() != null && r.maxAge() != null && r.minAge() > r.maxAge()) {
            throw invalid("minAge maggiore di maxAge");
        }
        if (r.minMinutes() != null && r.minMinutes() < 0) {
            throw invalid("minMinutes non valido");
        }

        String order = r.order() == null ? "desc" : r.order().toLowerCase();
        if (!order.equals("asc") && !order.equals("desc")) {
            throw invalid("order deve essere asc o desc");
        }

        String sort = r.sort() == null ? "minutes" : r.sort();
        if (!BASIC_SORTS.contains(sort) && MetricKey.fromKey(sort).isEmpty()) {
            throw invalid("sort non valido: " + sort);
        }

        return new SearchCriteria(r.q(), r.position(), r.minAge(), r.maxAge(), r.leagueId(), r.teamId(), null, null,
                r.season(), r.minMinutes(), parseFilters(r.params()), sort, order.equals("desc"));
    }

    private static List<MetricFilter> parseFilters(Map<String, String> params) {
        // (tipo, metrica) -> [min, max]
        Map<String, BigDecimal[]> bounds = new LinkedHashMap<>();
        for (Map.Entry<String, String> e : params.entrySet()) {
            String name = e.getKey();
            if (!name.startsWith("pct.") && !name.startsWith("val.")) {
                continue;
            }

            String[] parts = name.split("\\.");
            if (parts.length != 3 || !(parts[2].equals("min") || parts[2].equals("max"))) {
                throw invalid("Filtro non valido: " + name);
            }
            MetricKey metric = MetricKey.fromKey(parts[1]).orElseThrow(() -> invalid("Metrica sconosciuta: " + parts[1]));
            BigDecimal value = number(name, e.getValue());
            BigDecimal[] range = bounds.computeIfAbsent(parts[0] + "." + metric.key(), k -> new BigDecimal[2]);
            range[parts[2].equals("min") ? 0 : 1] = value;
        }

        List<MetricFilter> filters = new ArrayList<>();
        bounds.forEach((id, range) -> {
            String[] parts = id.split("\\.", 2);
            FilterType type = parts[0].equals("pct") ? FilterType.PERCENTILE : FilterType.VALUE;
            MetricKey metric = MetricKey.fromKey(parts[1]).orElseThrow();
            if (type == FilterType.PERCENTILE) {
                for (BigDecimal b : range) {
                    if (b != null && (b.compareTo(BigDecimal.ZERO) < 0 || b.compareTo(BigDecimal.valueOf(100)) > 0)) {
                        throw invalid("I percentili devono essere tra 0 e 100");
                    }
                }
            }
            filters.add(new MetricFilter(metric, type, range[0], range[1]));
        });
        return filters;
    }

    private static BigDecimal number(String name, String raw) {
        try {
            return new BigDecimal(raw);
        } catch (NumberFormatException | NullPointerException ex) {
            throw invalid("Valore numerico non valido per " + name);
        }
    }

    private static ApiException invalid(String message) {
        return new ApiException(ErrorCode.INVALID_REQUEST, message);
    }
}
