package org.example.capstone.ingestion.source;

/**
 * Fonte dei dati dei giocatori. L'import dipende solo da questa interfaccia,
 * così API-Football può essere sostituita (o affiancata, es. da un CSV) senza toccare il resto.
 */
public interface PlayerDataSource {

    /** Una pagina di giocatori con le statistiche della stagione per il campionato richiesto. */
    SourcePlayerPage fetchPlayersPage(int leagueApiId, int season, int page);
}
