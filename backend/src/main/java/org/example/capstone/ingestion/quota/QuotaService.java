package org.example.capstone.ingestion.quota;

import org.example.capstone.ingestion.ImportProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;

/**
 * Tiene il conto delle richieste a API-Football. Il giorno è in UTC perché è l'ora in cui l'API azzera la quota.
 * Il budget è volutamente sotto il limite reale (100) per lasciare margine a chiamate manuali.
 */
@Service
public class QuotaService {

    private final ApiQuotaLogRepository repository;
    private final ImportProperties properties;

    public QuotaService(ApiQuotaLogRepository repository, ImportProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    @Transactional
    public void recordRequest() {
        repository.increment(today());
    }

    @Transactional(readOnly = true)
    public int usedToday() {
        return repository.findById(today()).map(ApiQuotaLog::getRequestsUsed).orElse(0);
    }

    public int budget() {
        return properties.dailyBudget();
    }

    public int remainingToday() {
        return Math.max(0, budget() - usedToday());
    }

    private static LocalDate today() {
        return LocalDate.now(ZoneOffset.UTC);
    }
}
