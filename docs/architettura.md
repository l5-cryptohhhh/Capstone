# Architettura

ScoutAI è un frontend React che interroga un backend Spring Boot. Il backend legge da PostgreSQL i dati importati da API-Football.

```
frontend (React, :5173) --/api--> backend (Spring Boot, :8080) --> PostgreSQL (:5432)
                                      |
                                      +--> API-Football (importazione, a quota limitata)
                                      +--> OpenRouter (solo per le funzioni AI)
```

In sviluppo Vite inoltra le richieste `/api` al backend (`frontend/vite.config.ts`), quindi il browser non incontra problemi di CORS. In produzione il frontend viene servito da un'altra origine, che va indicata in `CORS_ALLOWED_ORIGIN`.

## Backend

Package sotto `org.example.capstone`, organizzati per dominio:

| Package | Responsabilità |
|---|---|
| `common` | Formato unico di errore (`ApiError`, `ErrorCode`, `ApiException`), `GlobalExceptionHandler` e `PageResponse` |
| `config` | Chiave admin, limite di richieste AI, CORS e scheduling (`WebConfig`) |
| `league`, `team`, `player`, `stats` | Entità JPA, repository e DTO. `stats` contiene anche il catalogo delle metriche (`MetricKey`) e il calcolo dei percentili |
| `search` | Ricerca giocatori: lettura e validazione dei parametri, filtri su metriche e percentili, query |
| `ingestion` | Importazione dei giocatori: orchestrazione, avanzamento per campionato e stagione, endpoint admin |
| `ingestion.source` | Modello neutro (`SourcePlayer`, `SourceStat`, ...) e interfaccia `PlayerDataSource` |
| `ingestion.apifootball` | Client di API-Football e trasformazione nel modello neutro |
| `ingestion.quota` | Conteggio giornaliero delle richieste a API-Football |
| `ai` | Client di OpenRouter, ricerca in linguaggio naturale e report del giocatore |

## Flusso di importazione

1. `ImportRunner` avvia `ImportService.run()` in un thread virtuale, una sola esecuzione alla volta. Parte da `POST /api/v1/admin/import/run` o, con `scoutai.import.auto-enabled=true`, da `ImportScheduler` ogni giorno alle 00:05 UTC.
2. `ImportService` crea i task mancanti (uno per campionato abilitato e stagione configurata) e li percorre partendo dalla stagione più recente, campionati in ordine di priorità.
3. Per ogni pagina controlla il budget con `QuotaService`, la richiede a `PlayerDataSource` e la salva con `PagePersister`, che scrive dati e avanzamento nella stessa transazione.
4. Quando un task è completo, `StatsService` ricalcola metriche e percentili di quel campionato e stagione.
5. L'import si ferma quando i task sono completi, il budget è finito o la fonte risponde con un errore. Il nuovo avvio riprende da `next_page`.

## Ricerca e percentili

`PlayerSearchSpecs` traduce i criteri in una query sul database: sono i dati a decidere chi è compatibile. Le metriche sono definite una sola volta in `MetricKey`, che fa da whitelist per filtri e ordinamenti. I percentili confrontano ogni giocatore con i pari ruolo dello stesso campionato e della stessa stagione, considerando solo chi ha giocato almeno `scoutai.stats.min-minutes` minuti.

## Frontend

React, TypeScript e Vite, con TanStack Query per le chiamate e React Router per le pagine.

| Cartella | Contenuto |
|---|---|
| `src/api` | Client HTTP, tipi dei DTO e query |
| `src/app` | Radice dell'app e tema chiaro/scuro |
| `src/features` | Pagine: ricerca, scheda giocatore, confronto, metodo |
| `src/components` | Componenti condivisi |
| `src/i18n` | Traduzioni italiano e inglese |
| `src/lib` | Funzioni di utilità (formattazione, paesi, gruppi di metriche) |
| `src/styles` | CSS: token, base, struttura, ricerca, scheda |
