package org.example.capstone.ingestion.quota;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDate;

@Entity
@Table(name = "api_quota_log")
@Getter
public class ApiQuotaLog {

    @Id
    private LocalDate day;

    @Column(name = "requests_used", nullable = false)
    private int requestsUsed;
}
