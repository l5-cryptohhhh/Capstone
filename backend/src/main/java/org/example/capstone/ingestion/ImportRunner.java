package org.example.capstone.ingestion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;

/** Esegue l'import in background, una sola esecuzione alla volta. */
@Component
public class ImportRunner {

    private static final Logger log = LoggerFactory.getLogger(ImportRunner.class);

    private final ImportService service;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private volatile ImportRunResult lastResult;

    public ImportRunner(ImportService service) {
        this.service = service;
    }

    /** @return false se un import è già in corso */
    public boolean start() {
        if (!running.compareAndSet(false, true)) {
            return false;
        }
        Thread.ofVirtual().name("import-run").start(() -> {
            try {
                lastResult = service.run();
                log.info("Import terminato: {} ({} pagine)", lastResult.outcome(), lastResult.pagesFetched());
            } catch (Exception e) {
                log.error("Import fallito", e);
                lastResult = new ImportRunResult(RunOutcome.ERROR, 0, e.getMessage(), Instant.now());
            } finally {
                running.set(false);
            }
        });
        return true;
    }

    public boolean isRunning() {
        return running.get();
    }

    public ImportRunResult lastResult() {
        return lastResult;
    }
}
