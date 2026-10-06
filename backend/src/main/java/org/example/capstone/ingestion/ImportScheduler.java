package org.example.capstone.ingestion;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Rilancia l'import ogni giorno subito dopo il reset della quota (00:05 UTC). Attivo solo con scoutai.import.auto-enabled=true. */
@Component
@ConditionalOnProperty(name = "scoutai.import.auto-enabled", havingValue = "true")
public class ImportScheduler {

    private final ImportRunner runner;

    public ImportScheduler(ImportRunner runner) {
        this.runner = runner;
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "UTC")
    public void runDaily() {
        runner.start();
    }

    /** Recupero: se il backend era spento alle 00:05 UTC, importa all'avvio con la quota rimasta (si ferma da solo a budget finito). */
    @EventListener(ApplicationReadyEvent.class)
    public void runOnStartup() {
        runner.start();
    }
}
