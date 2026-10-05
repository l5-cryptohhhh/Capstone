package org.example.capstone.search;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.example.capstone.player.Player;
import org.example.capstone.stats.MetricKey;
import org.example.capstone.stats.PlayerSeasonMetric;
import org.example.capstone.stats.PlayerSeasonStat;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Traduce i criteri di ricerca in una query sul database: sono i dati reali a decidere chi è compatibile. */
final class PlayerSearchSpecs {

    private PlayerSearchSpecs() {
    }

    static Specification<PlayerSeasonStat> from(SearchCriteria c, int season, int minMinutes, LocalDate today) {
        return (root, query, cb) -> {
            Join<PlayerSeasonStat, Player> player = root.join("player");
            List<Predicate> where = new ArrayList<>();

            where.add(cb.equal(root.get("season"), season));
            where.add(cb.greaterThanOrEqualTo(root.<Integer>get("minutes"), minMinutes));
            if (c.leagueId() != null) {
                where.add(cb.equal(root.get("league").get("id"), c.leagueId()));
            }
            if (c.teamId() != null) {
                where.add(cb.equal(root.get("team").get("id"), c.teamId()));
            }
            if (c.position() != null) {
                where.add(cb.equal(root.get("position"), c.position()));
            }

            // età <= maxAge  <=>  nato dopo (oggi - (maxAge+1) anni)
            if (c.minAge() != null) {
                where.add(cb.lessThanOrEqualTo(player.<LocalDate>get("birthDate"), today.minusYears(c.minAge())));
            }
            if (c.maxAge() != null) {
                where.add(cb.greaterThan(player.<LocalDate>get("birthDate"), today.minusYears(c.maxAge() + 1L)));
            }

            if (hasText(c.q())) {
                where.add(contains(cb, player.get("name"), c.q()));
            }
            if (hasText(c.teamName())) {
                where.add(contains(cb, root.join("team").get("name"), c.teamName()));
            }
            if (hasText(c.leagueName())) {
                where.add(contains(cb, root.join("league").get("name"), c.leagueName()));
            }

            for (MetricFilter f : c.filters()) {
                where.add(metricFilter(f, root, query, cb));
            }

            if (!isCountQuery(query.getResultType())) {
                query.orderBy(order(c, root, player, query, cb, where));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
    }

    private static Predicate metricFilter(MetricFilter f, Root<PlayerSeasonStat> root,
                                          CriteriaQuery<?> query, CriteriaBuilder cb) {
        Subquery<Long> sq = query.subquery(Long.class);
        Root<PlayerSeasonMetric> m = sq.from(PlayerSeasonMetric.class);
        List<Predicate> conditions = new ArrayList<>();
        conditions.add(cb.equal(m.get("statId"), root.get("id")));
        conditions.add(cb.equal(m.get("metric"), f.metric()));

        if (f.type() == FilterType.PERCENTILE) {
            if (f.min() != null) {
                conditions.add(cb.greaterThanOrEqualTo(m.<Integer>get("percentile"), f.min().intValue()));
            }
            if (f.max() != null) {
                conditions.add(cb.lessThanOrEqualTo(m.<Integer>get("percentile"), f.max().intValue()));
            }
        } else {
            if (f.min() != null) {
                conditions.add(cb.greaterThanOrEqualTo(m.<BigDecimal>get("value"), f.min()));
            }
            if (f.max() != null) {
                conditions.add(cb.lessThanOrEqualTo(m.<BigDecimal>get("value"), f.max()));
            }
        }
        sq.select(m.<Long>get("id")).where(conditions.toArray(Predicate[]::new));
        return cb.exists(sq);
    }

    private static List<Order> order(SearchCriteria c, Root<PlayerSeasonStat> root, Join<PlayerSeasonStat, Player> player,
                                     CriteriaQuery<?> query, CriteriaBuilder cb, List<Predicate> where) {
        String sort = c.sort() == null ? "minutes" : c.sort();
        boolean desc = c.descending();
        List<Order> orders = new ArrayList<>();

        switch (sort) {
            case "name" -> orders.add(direction(cb, cb.lower(player.get("name")), desc));
            // il più giovane ha la data di nascita più recente: l'ordine è invertito
            case "age" -> orders.add(direction(cb, player.<LocalDate>get("birthDate"), !desc));
            case "minutes" -> orders.add(direction(cb, root.<Integer>get("minutes"), desc));
            case "appearances" -> orders.add(direction(cb, cb.coalesce(root.<Integer>get("appearances"), 0), desc));
            case "rating" -> orders.add(direction(cb, cb.coalesce(root.<BigDecimal>get("rating"), BigDecimal.ZERO), desc));
            case "goals" -> orders.add(direction(cb, cb.coalesce(root.<Integer>get("goals"), 0), desc));
            case "assists" -> orders.add(direction(cb, cb.coalesce(root.<Integer>get("assists"), 0), desc));
            default -> {
                MetricKey metric = MetricKey.fromKey(sort).orElseThrow();
                // L'ordinamento per metrica mostra solo chi ha quella metrica calcolata
                Subquery<BigDecimal> sq = query.subquery(BigDecimal.class);
                Root<PlayerSeasonMetric> m = sq.from(PlayerSeasonMetric.class);
                sq.select(m.<BigDecimal>get("value")).where(
                        cb.equal(m.get("statId"), root.get("id")), cb.equal(m.get("metric"), metric));
                where.add(cb.isNotNull(sq));
                orders.add(direction(cb, sq, desc));
            }
        }
        orders.add(cb.asc(root.get("id"))); // tie-breaker: paginazione stabile
        return orders;
    }

    private static Order direction(CriteriaBuilder cb, Expression<?> expression, boolean desc) {
        return desc ? cb.desc(expression) : cb.asc(expression);
    }

    private static boolean isCountQuery(Class<?> resultType) {
        return resultType == Long.class || resultType == long.class;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    /** LIKE "contiene", senza distinzione di maiuscole e accenti, con i caratteri jolly dell'input neutralizzati. */
    private static Predicate contains(CriteriaBuilder cb, Expression<String> field, String text) {
        String pattern = "%" + escapeLike(text.trim().toLowerCase(Locale.ROOT)) + "%";
        Expression<String> column = cb.function("unaccent", String.class, cb.lower(field));
        Expression<String> wanted = cb.function("unaccent", String.class, cb.literal(pattern));
        return cb.like(column, wanted, '\\');
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
