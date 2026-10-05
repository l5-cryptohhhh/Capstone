package org.example.capstone.player;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.PlayerDtos.PageDto;
import org.example.capstone.player.PlayerDtos.PlayerDetailDto;
import org.example.capstone.player.PlayerDtos.PlayerSummaryDto;
import org.example.capstone.player.PlayerDtos.SeasonStatDto;
import org.example.capstone.stats.PlayerSeasonStat;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class PlayerService {

    /** Campi per cui è consentito ordinare (sempre dal valore più alto; i null in fondo). */
    public static final Set<String> SORTABLE = Set.of("rating", "goals", "assists", "minutes", "appearances");

    static final int MAX_PAGE_SIZE = 50;
    static final int DEFAULT_PAGE_SIZE = 20;

    private final PlayerRepository players;
    private final PlayerSeasonStatRepository stats;

    public PlayerService(PlayerRepository players, PlayerSeasonStatRepository stats) {
        this.players = players;
        this.stats = stats;
    }

    public PageDto<PlayerSummaryDto> search(PlayerSearchCriteria c) {
        String sortKey = PlayerSearchCriteria.notBlank(c.sort()) ? c.sort() : "rating";
        if (!SORTABLE.contains(sortKey)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Ordinamento non supportato: " + sortKey);
        }
        int page = c.page() == null ? 0 : Math.max(0, c.page());
        int size = c.size() == null ? DEFAULT_PAGE_SIZE : Math.min(MAX_PAGE_SIZE, Math.max(1, c.size()));
        Sort sort = Sort.by(new Sort.Order(Sort.Direction.DESC, sortKey).nullsLast(), Sort.Order.asc("id"));

        Page<PlayerSeasonStat> result = stats.findAll(toSpec(c), PageRequest.of(page, size, sort));
        return new PageDto<>(result.map(PlayerService::toSummary).getContent(), page, size, result.getTotalElements());
    }

    public PlayerDetailDto detail(Long id) {
        Player p = players.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.PLAYER_NOT_FOUND, "Giocatore non trovato: " + id));
        List<SeasonStatDto> seasons = stats.findByPlayerIdOrderBySeasonDescIdAsc(id).stream()
                .map(PlayerService::toSeasonStat).toList();
        return new PlayerDetailDto(p.getId(), p.getName(), p.getFirstname(), p.getLastname(), p.getBirthDate(),
                age(p.getBirthDate()), p.getNationality(), p.getHeightCm(), p.getWeightKg(), p.getPhotoUrl(),
                p.getPosition(), seasons);
    }

    private static Specification<PlayerSeasonStat> toSpec(PlayerSearchCriteria c) {
        return (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            Join<?, ?> player = root.join("player");

            if (PlayerSearchCriteria.notBlank(c.name())) where.add(contains(cb, player.get("name"), c.name()));
            if (PlayerSearchCriteria.notBlank(c.team()))
                where.add(contains(cb, root.join("team").get("name"), c.team()));
            if (PlayerSearchCriteria.notBlank(c.league()))
                where.add(contains(cb, root.join("league").get("name"), c.league()));
            if (c.position() != null) where.add(cb.equal(root.get("position"), c.position()));
            if (c.season() != null) where.add(cb.equal(root.get("season"), c.season()));
            if (c.minMinutes() != null)
                where.add(cb.greaterThanOrEqualTo(root.<Integer>get("minutes"), c.minMinutes()));

            LocalDate today = LocalDate.now();
            if (c.minAge() != null)
                where.add(cb.lessThanOrEqualTo(player.<LocalDate>get("birthDate"), today.minusYears(c.minAge())));
            if (c.maxAge() != null)
                where.add(cb.greaterThan(player.<LocalDate>get("birthDate"), today.minusYears(c.maxAge() + 1L)));
            return cb.and(where.toArray(Predicate[]::new));
        };
    }

    /** LIKE case-insensitive con i caratteri jolly dell'input neutralizzati. */
    private static Predicate contains(CriteriaBuilder cb, Expression<String> field, String value) {
        String escaped = value.trim().toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return cb.like(cb.lower(field), "%" + escaped + "%", '\\');
    }

    private static Integer age(LocalDate birthDate) {
        return birthDate == null ? null : Period.between(birthDate, LocalDate.now()).getYears();
    }

    private static PlayerSummaryDto toSummary(PlayerSeasonStat s) {
        Player p = s.getPlayer();
        return new PlayerSummaryDto(p.getId(), p.getName(), age(p.getBirthDate()), p.getNationality(),
                p.getPhotoUrl(), s.getPosition(), s.getTeam().getName(), s.getTeam().getLogoUrl(),
                s.getLeague().getName(), s.getSeason(), s.getAppearances(), s.getMinutes(), s.getRating(),
                s.getGoals(), s.getAssists());
    }

    private static SeasonStatDto toSeasonStat(PlayerSeasonStat s) {
        return new SeasonStatDto(s.getTeam().getName(), s.getLeague().getName(), s.getSeason(), s.getPosition(),
                s.getAppearances(), s.getLineups(), s.getMinutes(), s.getRating(), s.getGoals(), s.getAssists(),
                s.getGoalsConceded(), s.getSaves(), s.getShotsTotal(), s.getShotsOn(), s.getPassesTotal(),
                s.getPassesKey(), s.getTacklesTotal(), s.getTacklesBlocks(), s.getTacklesInterceptions(),
                s.getDuelsTotal(), s.getDuelsWon(), s.getDribblesAttempts(), s.getDribblesSuccess(),
                s.getFoulsDrawn(), s.getFoulsCommitted(), s.getYellowCards(), s.getRedCards());
    }
}
