package org.example.capstone.ingestion;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.ingestion.quota.QuotaService;
import org.example.capstone.ingestion.source.PlayerDataSource;
import org.example.capstone.ingestion.source.SourcePlayerPage;
import org.example.capstone.league.League;
import org.example.capstone.league.LeagueRepository;
import org.example.capstone.stats.StatsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Importa i giocatori dei campionati abilitati, una pagina per volta, fermandosi quando finisce il budget
 * giornaliero di richieste. L'avanzamento è salvato a ogni pagina, quindi un nuovo avvio riprende da dove era rimasto.
 */
@Service
public class ImportService {

    private static final Logger log = LoggerFactory.getLogger(ImportService.class);

    private final PlayerDataSource source;
    private final PagePersister persister;
    private final QuotaService quota;
    private final ImportTaskRepository tasks;
    private final LeagueRepository leagues;
    private final ImportProperties properties;
    private final StatsService statsService;

    public ImportService(PlayerDataSource source, PagePersister persister, QuotaService quota,
                         ImportTaskRepository tasks, LeagueRepository leagues, ImportProperties properties,
                         StatsService statsService) {
        this.source = source;
        this.persister = persister;
        this.quota = quota;
        this.tasks = tasks;
        this.leagues = leagues;
        this.properties = properties;
        this.statsService = statsService;
    }

    public ImportRunResult run() {
        ensureTasks();
        int pages = 0;

        for (ImportTask task : tasks.findPending(properties.seasons())) {
            TaskStatus status = task.getStatus();
            while (status != TaskStatus.DONE) {
                if (quota.remainingToday() <= 0) {
                    return result(RunOutcome.QUOTA_REACHED, pages, "Budget giornaliero raggiunto");
                }

                SourcePlayerPage page;
                try {
                    page = source.fetchPlayersPage(task.getLeague().getApiId(), task.getSeason(), task.getNextPage());
                } catch (ApiException e) {
                    persister.markError(task.getId(), e.getMessage());
                    if (e.getCode() == ErrorCode.QUOTA_EXCEEDED) {
                        return result(RunOutcome.QUOTA_REACHED, pages, e.getMessage());
                    }
                    log.warn("Import fermato: {}", e.getMessage());
                    return result(RunOutcome.ERROR, pages, e.getMessage());
                }

                status = persister.persistPage(task.getId(), page);
                if (status == TaskStatus.DONE) {
                    statsService.recompute(task.getLeague().getId(), task.getSeason());
                }
                task.setNextPage(page.page() + 1);
                pages++;
                log.info("Importato {} {} pagina {}/{}", task.getLeague().getName(), task.getSeason(),
                        page.page(), page.totalPages());
            }
        }
        return result(RunOutcome.COMPLETED, pages, "Import completato");
    }

    /** Crea i task mancanti per ogni campionato abilitato e stagione configurata. */
    void ensureTasks() {
        for (League league : leagues.findByEnabledTrueOrderByPriorityAsc()) {
            for (Integer season : properties.seasons()) {
                if (!tasks.existsByLeagueIdAndSeason(league.getId(), season)) {
                    ImportTask task = new ImportTask();
                    task.setLeague(league);
                    task.setSeason(season);
                    tasks.save(task);
                }
            }
        }
    }

    public List<ImportTask> allTasks() {
        return tasks.findAllWithLeague();
    }

    private static ImportRunResult result(RunOutcome outcome, int pages, String message) {
        return new ImportRunResult(outcome, pages, message, Instant.now());
    }
}
