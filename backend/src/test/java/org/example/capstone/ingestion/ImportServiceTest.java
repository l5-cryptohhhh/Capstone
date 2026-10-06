package org.example.capstone.ingestion;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.ingestion.quota.QuotaService;
import org.example.capstone.ingestion.source.PlayerDataSource;
import org.example.capstone.ingestion.source.SourcePlayerPage;
import org.example.capstone.league.League;
import org.example.capstone.league.LeagueRepository;
import org.example.capstone.stats.StatsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImportServiceTest {

    private static final int TEAM = 492;

    private PlayerDataSource source;
    private PagePersister persister;
    private QuotaService quota;
    private ImportTaskRepository tasks;
    private ImportService service;
    private StatsService statsService;
    private League league;
    /** Task "in archivio": findPending restituisce quelli non ancora DONE, come farebbe il database. */
    private final List<ImportTask> store = new ArrayList<>();

    @BeforeEach
    void setUp() {
        source = mock(PlayerDataSource.class);
        persister = mock(PagePersister.class);
        quota = mock(QuotaService.class);
        tasks = mock(ImportTaskRepository.class);
        LeagueRepository leagues = mock(LeagueRepository.class);
        ImportProperties properties = new ImportProperties(90, List.of(2024), false);
        statsService = mock(StatsService.class);
        service = new ImportService(source, persister, quota, tasks, leagues, properties, statsService);

        league = new League();
        league.setId(7L);
        league.setApiId(135);
        league.setName("Serie A");

        when(tasks.findPending(any())).thenAnswer(i -> store.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE).toList());
        when(tasks.countByLeagueIdAndSeasonAndStatusNot(anyLong(), anyInt(), eq(TaskStatus.DONE)))
                .thenAnswer(i -> store.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count());
        // persistTeams: chiude il task elenco e crea quello della squadra
        doAnswer(i -> {
            store.get(0).setStatus(TaskStatus.DONE);
            store.add(task(TEAM));
            return null;
        }).when(persister).persistTeams(any(), any());
    }

    private ImportTask task(int teamApiId) {
        ImportTask t = new ImportTask();
        t.setLeague(league);
        t.setSeason(2024);
        t.setTeamApiId(teamApiId);
        return t;
    }

    /** Fa comportare il persister come quello vero: la pagina `total` chiude il task della squadra. */
    private void persistingPagesUpTo(int total) {
        when(persister.persistPage(any(), any())).thenAnswer(i -> {
            ImportTask t = store.get(1);
            SourcePlayerPage p = i.getArgument(1);
            t.setStatus(p.page() >= total ? TaskStatus.DONE : TaskStatus.IN_PROGRESS);
            t.setNextPage(p.page() + 1);
            return t.getStatus();
        });
    }

    @Test
    void fetchesTeamsThenEachRosterAndCompletes() {
        store.add(task(ImportTask.LEAGUE_TEAMS));
        when(quota.remainingToday()).thenReturn(50);
        when(source.fetchTeamIds(135, 2024)).thenReturn(List.of(TEAM));
        when(source.fetchPlayersPage(135, 2024, TEAM, 1)).thenReturn(new SourcePlayerPage(1, 2, List.of()));
        when(source.fetchPlayersPage(135, 2024, TEAM, 2)).thenReturn(new SourcePlayerPage(2, 2, List.of()));
        persistingPagesUpTo(2);

        ImportRunResult result = service.run();

        assertThat(result.outcome()).isEqualTo(RunOutcome.COMPLETED);
        assertThat(result.pagesFetched()).isEqualTo(3); // elenco squadre + 2 pagine di rosa
        verify(statsService).recompute(7L, 2024); // metriche ricalcolate quando il campionato è completo
    }

    @Test
    void doesNotRecomputeStatsWhileTheLeagueStillHasPendingTasks() {
        store.add(task(ImportTask.LEAGUE_TEAMS));
        when(quota.remainingToday()).thenReturn(2, 1, 0);
        when(source.fetchTeamIds(135, 2024)).thenReturn(List.of(TEAM));
        when(source.fetchPlayersPage(135, 2024, TEAM, 1)).thenReturn(new SourcePlayerPage(1, 2, List.of()));
        persistingPagesUpTo(2);

        service.run();

        verify(statsService, never()).recompute(anyLong(), anyInt());
    }

    @Test
    void stopsWithoutCallingTheApiWhenBudgetIsExhausted() {
        store.add(task(ImportTask.LEAGUE_TEAMS));
        when(quota.remainingToday()).thenReturn(0);

        ImportRunResult result = service.run();

        assertThat(result.outcome()).isEqualTo(RunOutcome.QUOTA_REACHED);
        verify(source, never()).fetchTeamIds(anyInt(), anyInt());
        verify(source, never()).fetchPlayersPage(anyInt(), anyInt(), anyInt(), anyInt());
    }

    @Test
    void stopsWhenBudgetRunsOutMidRosterAndKeepsProgress() {
        store.add(task(ImportTask.LEAGUE_TEAMS));
        when(quota.remainingToday()).thenReturn(2, 1, 0);
        when(source.fetchTeamIds(135, 2024)).thenReturn(List.of(TEAM));
        when(source.fetchPlayersPage(135, 2024, TEAM, 1)).thenReturn(new SourcePlayerPage(1, 2, List.of()));
        persistingPagesUpTo(2);

        ImportRunResult result = service.run();

        assertThat(result.outcome()).isEqualTo(RunOutcome.QUOTA_REACHED);
        assertThat(result.pagesFetched()).isEqualTo(2);
        assertThat(store.get(1).getNextPage()).isEqualTo(2);
    }

    @Test
    void sourceErrorStopsImportAndRecordsMessage() {
        store.add(task(ImportTask.LEAGUE_TEAMS));
        when(quota.remainingToday()).thenReturn(50);
        when(source.fetchTeamIds(anyInt(), anyInt()))
                .thenThrow(new ApiException(ErrorCode.UPSTREAM_FOOTBALL_API_ERROR, "non raggiungibile"));

        ImportRunResult result = service.run();

        assertThat(result.outcome()).isEqualTo(RunOutcome.ERROR);
        verify(persister).markError(any(), eq("non raggiungibile"));
        verify(persister, never()).persistPage(any(), any());
    }

    @Test
    void quotaErrorFromApiIsTreatedAsQuotaReached() {
        store.add(task(ImportTask.LEAGUE_TEAMS));
        when(quota.remainingToday()).thenReturn(50);
        when(source.fetchTeamIds(anyInt(), anyInt()))
                .thenThrow(new ApiException(ErrorCode.QUOTA_EXCEEDED, "limite raggiunto"));

        assertThat(service.run().outcome()).isEqualTo(RunOutcome.QUOTA_REACHED);
    }
}
