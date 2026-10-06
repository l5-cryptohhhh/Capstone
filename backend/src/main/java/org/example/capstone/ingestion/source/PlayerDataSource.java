package org.example.capstone.ingestion.source;

import java.util.List;

/**
 * Fonte dei dati dei giocatori. L'import dipende solo da questa interfaccia,
 * così API-Football può essere sostituita (o affiancata, es. da un CSV) senza toccare il resto.
 */
public interface PlayerDataSource {

    /** Id delle squadre che partecipano al campionato nella stagione. */
    List<Integer> fetchTeamIds(int leagueApiId, int season);

    /** Una pagina di giocatori di una squadra con le statistiche della stagione per il campionato richiesto. */
    SourcePlayerPage fetchPlayersPage(int leagueApiId, int season, int teamApiId, int page);
}
