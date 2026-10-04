package org.example.capstone.ingestion.quota;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface ApiQuotaLogRepository extends JpaRepository<ApiQuotaLog, LocalDate> {

    /** Incremento atomico: crea la riga del giorno se non esiste. */
    @Modifying
    @Query(value = """
            INSERT INTO api_quota_log (day, requests_used) VALUES (:day, 1)
            ON CONFLICT (day) DO UPDATE SET requests_used = api_quota_log.requests_used + 1
            """, nativeQuery = true)
    void increment(@Param("day") LocalDate day);
}
