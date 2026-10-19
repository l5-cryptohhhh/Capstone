package org.example.capstone.watchlist;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.player.Player;
import org.example.capstone.player.PlayerRepository;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WatchlistServiceTest {

    private final WatchlistRepository lists = mock(WatchlistRepository.class);
    private final PlayerRepository players = mock(PlayerRepository.class);
    private final PlayerSeasonStatRepository stats = mock(PlayerSeasonStatRepository.class);
    private final WatchlistService service = new WatchlistService(lists, players, stats);

    @BeforeEach
    void setUp() {
        when(lists.save(any(Watchlist.class))).thenAnswer(i -> i.getArgument(0));
        when(players.existsById(10L)).thenReturn(true);
    }

    private static ErrorCode codeOf(Runnable action) {
        return assertThrows(ApiException.class, action::run).getCode();
    }

    private static Watchlist list(long id, long userId, String name, Long... playerIds) {
        Watchlist w = new Watchlist();
        w.setId(id);
        w.setUserId(userId);
        w.setName(name);
        w.getPlayerIds().addAll(Set.of(playerIds));
        return w;
    }

    private static Player player(long id, String name) {
        Player p = new Player();
        p.setId(id);
        p.setName(name);
        return p;
    }

    @Test
    void createTrimsTheNameAndStartsEmpty() {
        var dto = service.create(7L, "  Terzini da seguire ");

        assertEquals("Terzini da seguire", dto.name());
        assertEquals(0, dto.playerCount());
    }

    @Test
    void createRejectsBlankLongDuplicateAndOverLimit() {
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.create(7L, "  ")));
        assertEquals(ErrorCode.INVALID_REQUEST,
                codeOf(() -> service.create(7L, "x".repeat(WatchlistService.MAX_NAME + 1))));

        when(lists.existsByUserIdAndNameIgnoreCase(7L, "Under 20")).thenReturn(true);
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.create(7L, "Under 20")));

        when(lists.countByUserId(7L)).thenReturn((long) WatchlistService.MAX_LISTS);
        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.create(7L, "Una in più")));
        verify(lists, never()).save(any());
    }

    @Test
    void listCountsPlayersAndFlagsTheOnesContainingThePlayer() {
        when(lists.findByUserIdOrderByCreatedAtDesc(7L))
                .thenReturn(List.of(list(1, 7, "A", 10L, 11L), list(2, 7, "B")));

        var withPlayer = service.list(7L, 10L);
        assertEquals(2, withPlayer.get(0).playerCount());
        assertTrue(withPlayer.get(0).contains());
        assertFalse(withPlayer.get(1).contains());

        assertFalse(service.list(7L, null).get(0).contains());
    }

    @Test
    void addPlayerIsIdempotentAndChecksThePlayerExists() {
        Watchlist mine = list(1, 7, "A");
        when(lists.findByIdAndUserId(1L, 7L)).thenReturn(Optional.of(mine));

        service.addPlayer(7L, 1L, 10L);
        service.addPlayer(7L, 1L, 10L);

        assertEquals(Set.of(10L), mine.getPlayerIds());
        assertEquals(ErrorCode.PLAYER_NOT_FOUND, codeOf(() -> service.addPlayer(7L, 1L, 99L)));
    }

    @Test
    void addPlayerRespectsTheLimitButAllowsAnExistingOne() {
        Watchlist full = list(1, 7, "Piena");
        for (long i = 100; i < 100 + WatchlistService.MAX_PLAYERS; i++) {
            full.getPlayerIds().add(i);
        }
        when(lists.findByIdAndUserId(1L, 7L)).thenReturn(Optional.of(full));

        assertEquals(ErrorCode.INVALID_REQUEST, codeOf(() -> service.addPlayer(7L, 1L, 10L)));
        when(players.existsById(100L)).thenReturn(true);
        service.addPlayer(7L, 1L, 100L);
    }

    @Test
    void removePlayerTakesItOut() {
        Watchlist mine = list(1, 7, "A", 10L);
        when(lists.findByIdAndUserId(1L, 7L)).thenReturn(Optional.of(mine));

        service.removePlayer(7L, 1L, 10L);

        assertTrue(mine.getPlayerIds().isEmpty());
    }

    @Test
    void someoneElsesListIsNotFound() {
        when(lists.findByIdAndUserId(1L, 8L)).thenReturn(Optional.empty());

        assertEquals(ErrorCode.WATCHLIST_NOT_FOUND, codeOf(() -> service.detail(8L, 1L)));
        assertEquals(ErrorCode.WATCHLIST_NOT_FOUND, codeOf(() -> service.delete(8L, 1L)));
        assertEquals(ErrorCode.WATCHLIST_NOT_FOUND, codeOf(() -> service.addPlayer(8L, 1L, 10L)));
        assertEquals(ErrorCode.WATCHLIST_NOT_FOUND, codeOf(() -> service.removePlayer(8L, 1L, 10L)));
        verify(lists, never()).delete(any());
    }

    @Test
    void detailListsPlayersByNameEvenWithoutStats() {
        Watchlist mine = list(1, 7, "A", 10L, 11L);
        when(lists.findByIdAndUserId(1L, 7L)).thenReturn(Optional.of(mine));
        when(stats.findForPlayers(any())).thenReturn(List.of());
        when(players.findAllById(any())).thenReturn(List.of(player(10, "Zeta"), player(11, "alfa")));

        var detail = service.detail(7L, 1L);

        assertEquals(List.of("alfa", "Zeta"), detail.players().stream().map(p -> p.name()).toList());
        assertNull(detail.players().get(0).team());
        assertNull(detail.players().get(0).season());
    }

    @Test
    void detailOfAnEmptyListDoesNotQueryStats() {
        when(lists.findByIdAndUserId(1L, 7L)).thenReturn(Optional.of(list(1, 7, "Vuota")));

        assertTrue(service.detail(7L, 1L).players().isEmpty());
        verify(stats, never()).findForPlayers(any());
    }
}
