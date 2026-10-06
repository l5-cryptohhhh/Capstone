package org.example.capstone.ingestion;

import org.example.capstone.ingestion.quota.QuotaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/import")
public class AdminImportController {

    private final ImportRunner runner;
    private final ImportService service;
    private final QuotaService quota;

    public AdminImportController(ImportRunner runner, ImportService service, QuotaService quota) {
        this.runner = runner;
        this.service = service;
        this.quota = quota;
    }

    /** Avvia l'import in background. 409 se ce n'è già uno in corso. */
    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> run() {
        if (!runner.start()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("started", false, "reason", "Import già in corso"));
        }
        return ResponseEntity.accepted().body(Map.of("started", true));
    }

    @GetMapping("/status")
    public ImportStatusDto status() {
        List<TaskDto> tasks = service.allTasks().stream().map(TaskDto::from).toList();
        return new ImportStatusDto(runner.isRunning(), runner.lastResult(), quota.usedToday(), quota.budget(), tasks);
    }

    public record ImportStatusDto(boolean running, ImportRunResult lastResult, int requestsUsedToday,
                                  int dailyBudget, List<TaskDto> tasks) {
    }

    /** teamApiId 0 = elenco squadre del campionato. */
    public record TaskDto(String league, int season, int teamApiId, TaskStatus status, int nextPage, Integer totalPages,
                          int playersImported, String lastError) {

        static TaskDto from(ImportTask t) {
            return new TaskDto(t.getLeague().getName(), t.getSeason(), t.getTeamApiId(), t.getStatus(), t.getNextPage(),
                    t.getTotalPages(), t.getPlayersImported(), t.getLastError());
        }
    }
}
