package org.example.capstone.ingestion;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.ingestion.quota.QuotaService;
import org.example.capstone.ingestion.source.PlayerDataSource;
import org.example.capstone.ingestion.source.SourcePlayerPage;
import org.example.capstone.league.League;
import org.example.capstone.league.LeagueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImportServiceTest {

    private PlayerDataSource source;
    private PagePersister persister;
    private QuotaService quota;
    private ImportService service;
    private ImportTask task;

    @BeforeEach
    void setUp() {
        source = mock(PlayerDataSource.class);
        persister = mock(PagePersister.class);
        quota = mock(QuotaService.class);
        ImportTaskRepository tasks = mock(ImportTaskRepository.class);
        LeagueRepository leagues = mock(LeagueRepository.class);
        ImportProperties properties = new ImportProperties(90, List.of(2024), false);
        service = new ImportService(source, persister, quota, tasks, leagues, properties);

        League league = new League();
        league.setApiId(135);
        league.setName("Serie A");
        task = new ImportTask();
        task.setLeague(league);
        task.setSeason(2024);
        when(tasks.findPending(any())).thenReturn(List.of(task));
    }

    @Test
    void importsAllPagesAndCompletes() {
        when(quota.remainingToday()).thenReturn(50);
        when(source.fetchPlayersPage(135, 2024, 1)).thenReturn(new SourcePlayerPage(1, 2, List.of()));
        when(source.fetchPlayersPage(135, 2024, 2)).thenReturn(new SourcePlayerPage(2, 2, List.of()));
        when(persister.persistPage(any(), any())).thenReturn(TaskStatus.IN_PROGRESS, TaskStatus.DONE);

        ImportRunResult result = service.run();

        assertThat(result.outcome()).isEqualTo(RunOutcome.COMPLETED);
        assertThat(result.pagesFetched()).isEqualTo(2);
    }

    @Test
    void stopsWithoutCallingTheApiWhenBudgetIsExhausted() {
        when(quota.remainingToday()).thenReturn(0);

        ImportRunResult result = service.run();

        assertThat(result.outcome()).isEqualTo(RunOutcome.QUOTA_REACHED);
        verify(source, never()).fetchPlayersPage(anyInt(), anyInt(), anyInt());
    }

    @Test
    void stopsWhenBudgetRunsOutMidTaskAndKeepsProgress() {
        when(quota.remainingToday()).thenReturn(1, 0);
        when(source.fetchPlayersPage(135, 2024, 1)).thenReturn(new SourcePlayerPage(1, 54, List.of()));
        when(persister.persistPage(any(), any())).thenReturn(TaskStatus.IN_PROGRESS);

        ImportRunResult result = service.run();

        assertThat(result.outcome()).isEqualTo(RunOutcome.QUOTA_REACHED);
        assertThat(result.pagesFetched()).isEqualTo(1);
        assertThat(task.getNextPage()).isEqualTo(2);
    }

    @Test
    void sourceErrorStopsImportAndRecordsMessage() {
        when(quota.remainingToday()).thenReturn(50);
        when(source.fetchPlayersPage(anyInt(), anyInt(), anyInt()))
                .thenThrow(new ApiException(ErrorCode.UPSTREAM_FOOTBALL_API_ERROR, "non raggiungibile"));

        ImportRunResult result = service.run();

        assertThat(result.outcome()).isEqualTo(RunOutcome.ERROR);
        verify(persister).markError(any(), eq("non raggiungibile"));
        verify(persister, never()).persistPage(any(), any());
    }

    @Test
    void quotaErrorFromApiIsTreatedAsQuotaReached() {
        when(quota.remainingToday()).thenReturn(50);
        when(source.fetchPlayersPage(anyInt(), anyInt(), anyInt()))
                .thenThrow(new ApiException(ErrorCode.QUOTA_EXCEEDED, "limite raggiunto"));

        assertThat(service.run().outcome()).isEqualTo(RunOutcome.QUOTA_REACHED);
    }
}
