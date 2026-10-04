package org.example.capstone.ingestion;

import java.time.Instant;

public record ImportRunResult(RunOutcome outcome, int pagesFetched, String message, Instant finishedAt) {
}
