package org.example.capstone.watchlist;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.Player;
import org.example.capstone.player.PlayerMapper;
import org.example.capstone.player.PlayerRepository;
import org.example.capstone.player.Position;
import org.example.capstone.player.dto.LeagueRefDto;
import org.example.capstone.player.dto.TeamRefDto;
import org.example.capstone.stats.PlayerSeasonStat;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Liste private: ogni operazione è limitata all'utente che la chiede. */
@Service
public class WatchlistService {

    static final int MAX_LISTS = 20;
    static final int MAX_PLAYERS = 200;
    static final int MAX_NAME = 80;

    /** contains: la lista ha già il giocatore indicato in ?playerId (false se non è stato indicato). */
    public record WatchlistDto(Long id, String name, int playerCount, boolean contains) {
    }

    /** Il giocatore con la sua ultima stagione; squadra, campionato e numeri sono null se non ne ha. */
    public record WatchlistPlayerDto(Long id, String name, Integer age, Position position, String photoUrl,
                                     TeamRefDto team, LeagueRefDto league, Integer season, Integer minutes,
                                     BigDecimal rating) {
    }

    public record WatchlistDetailDto(Long id, String name, List<WatchlistPlayerDto> players) {
    }

    private final WatchlistRepository lists;
    private final PlayerRepository players;
    private final PlayerSeasonStatRepository stats;

    public WatchlistService(WatchlistRepository lists, PlayerRepository players, PlayerSeasonStatRepository stats) {
        this.lists = lists;
        this.players = players;
        this.stats = stats;
    }

    @Transactional(readOnly = true)
    public List<WatchlistDto> list(Long userId, Long playerId) {
        return lists.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(w -> new WatchlistDto(w.getId(), w.getName(), w.getPlayerIds().size(),
                        playerId != null && w.getPlayerIds().contains(playerId)))
                .toList();
    }

    @Transactional
    public WatchlistDto create(Long userId, String name) {
        String clean = cleanName(name);
        if (lists.countByUserId(userId) >= MAX_LISTS) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Hai raggiunto il limite di " + MAX_LISTS + " liste");
        }
        if (lists.existsByUserIdAndNameIgnoreCase(userId, clean)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Hai già una lista con questo nome");
        }
        Watchlist w = new Watchlist();
        w.setUserId(userId);
        w.setName(clean);
        Watchlist saved = lists.save(w);
        return new WatchlistDto(saved.getId(), saved.getName(), 0, false);
    }

    @Transactional
    public void delete(Long userId, Long listId) {
        lists.delete(own(userId, listId));
    }

    @Transactional(readOnly = true)
    public WatchlistDetailDto detail(Long userId, Long listId) {
        Watchlist w = own(userId, listId);
        if (w.getPlayerIds().isEmpty()) {
            return new WatchlistDetailDto(w.getId(), w.getName(), List.of());
        }
        // Per ogni giocatore l'ultima stagione: la query arriva già ordinata dalla più recente
        Map<Long, PlayerSeasonStat> latest = new LinkedHashMap<>();
        for (PlayerSeasonStat s : stats.findForPlayers(w.getPlayerIds())) {
            latest.putIfAbsent(s.getPlayer().getId(), s);
        }
        List<WatchlistPlayerDto> rows = players.findAllById(w.getPlayerIds()).stream()
                .map(p -> toDto(p, latest.get(p.getId())))
                .sorted(Comparator.comparing(WatchlistPlayerDto::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new WatchlistDetailDto(w.getId(), w.getName(), rows);
    }

    /** Idempotente: aggiungere due volte lo stesso giocatore non cambia nulla. */
    @Transactional
    public void addPlayer(Long userId, Long listId, Long playerId) {
        Watchlist w = own(userId, listId);
        if (!players.existsById(playerId)) {
            throw new ApiException(ErrorCode.PLAYER_NOT_FOUND, "Giocatore non trovato");
        }
        if (!w.getPlayerIds().contains(playerId) && w.getPlayerIds().size() >= MAX_PLAYERS) {
            throw new ApiException(ErrorCode.INVALID_REQUEST,
                    "La lista ha raggiunto il limite di " + MAX_PLAYERS + " giocatori");
        }
        w.getPlayerIds().add(playerId);
        lists.save(w);
    }

    @Transactional
    public void removePlayer(Long userId, Long listId, Long playerId) {
        Watchlist w = own(userId, listId);
        w.getPlayerIds().remove(playerId);
        lists.save(w);
    }

    /** Una lista di un altro utente risponde come se non esistesse. */
    private Watchlist own(Long userId, Long listId) {
        return lists.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.WATCHLIST_NOT_FOUND, "Lista non trovata"));
    }

    private static String cleanName(String name) {
        String clean = name == null ? "" : name.trim();
        if (clean.isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Il nome non può essere vuoto");
        }
        if (clean.length() > MAX_NAME) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Il nome è troppo lungo (massimo " + MAX_NAME + ")");
        }
        return clean;
    }

    private static WatchlistPlayerDto toDto(Player p, PlayerSeasonStat s) {
        Position position = s != null && s.getPosition() != null ? s.getPosition() : p.getPosition();
        return new WatchlistPlayerDto(p.getId(), p.getName(), PlayerMapper.age(p.getBirthDate()), position,
                p.getPhotoUrl(), s == null ? null : PlayerMapper.team(s.getTeam()),
                s == null ? null : PlayerMapper.league(s.getLeague()), s == null ? null : s.getSeason(),
                s == null ? null : s.getMinutes(), s == null ? null : s.getRating());
    }
}
