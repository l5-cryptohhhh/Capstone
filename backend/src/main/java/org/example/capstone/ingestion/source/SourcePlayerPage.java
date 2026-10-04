package org.example.capstone.ingestion.source;

import java.util.List;

/** Pagina di risultati indipendente dalla fonte. */
public record SourcePlayerPage(int page, int totalPages, List<SourcePlayer> players) {
}
