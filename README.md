# ScoutAI

Piattaforma di scouting calcistico con AI: l'AI interpreta i dati reali (API-Football), non li inventa.

## Cosa fa

- **Cerca** tra tutti i giocatori dei campionati importati, con filtri per ruolo, età, squadra, minuti e metriche, oppure con una frase (ricerca con AI).
- **Scheda** del giocatore con statistiche per 90 minuti, percentili sui pari ruolo, giocatori simili e report AI.
- **Radar e mappa per zone**: i percentili del ruolo in un grafico a ragnatela e il profilo per fase di gioco (attacco, costruzione, difesa), anche nel confronto. La mappa non mostra posizioni reali: i dati dell'API non hanno coordinate.
- **Stima di valore e crescita**: una formula spiegata nella pagina Metodo dà un valore indicativo e una traiettoria a 5 anni (minimo, medio, massimo). È sempre etichettata come stima, non è un valore di mercato.
- **Note e liste private**: ogni utente scrive note sui giocatori e li raccoglie in liste (watchlist); nessun altro le vede.
- **Scheda in PDF**: scaricabile dalla scheda del giocatore, con radar, zone, stima e note.
- **Confronto** fino a 3 giocatori affiancati, con verdetto AI.
- **Partitella**: una simulazione 3 contro 3 con portieri tra due squadre di giocatori reali, in cui contano i loro percentili.
- **Profilo**: foto, dati personali, email, password, sessioni ed eliminazione dell'account.
- Italiano e inglese, tema scuro e chiaro, versione mobile.

## Struttura

| Cartella | Contenuto |
|---|---|
| `backend/` | Spring Boot (Java 25), REST API, PostgreSQL |
| `frontend/` | React + Vite + TypeScript |
| `docs/` | [Architettura](docs/architettura.md), [database](docs/database.md), [API](docs/api.md), [decisioni](docs/decisioni.md) |

## Documentazione API interattiva (Swagger)

Con il backend acceso: `http://localhost:8080/swagger-ui.html` (schema OpenAPI su `/v3/api-docs`). Per le rotte protette fai `POST /auth/login`, copia il token e usa **Authorize**.

## Setup locale

1. `cp .env.example .env` e inserisci le tue chiavi (`API_FOOTBALL_KEY`, `OPENROUTER_API_KEY`, `ADMIN_API_KEY`).
2. `docker compose up -d` per avviare PostgreSQL.
3. Backend: `cd backend && ./mvnw spring-boot:run`
4. Frontend: `cd frontend && npm install && npm run dev`

## API backend

| Endpoint | Descrizione |
|---|---|
| `GET /api/v1/players` | Ricerca giocatori con filtri (`q`, `position`, `minAge`, `maxAge`, `leagueId`, `teamId`, `season`, `minMinutes`), filtri sulle metriche (`pct.<metrica>.min`, `val.<metrica>.min`), ordinamento e paginazione |
| `GET /api/v1/players/{id}` | Scheda giocatore con statistiche e percentili per stagione |
| `GET /api/v1/leagues`, `GET /api/v1/leagues/{id}/teams` | Campionati con dati e squadre |
| `GET /api/v1/metrics` | Catalogo delle metriche |
| `GET /api/v1/players/{id}/similar` | Giocatori simili: stesso ruolo e stagione, vicini sul profilo dei percentili |
| `POST /api/v1/ai/search` `{"query": "..."}` | Ricerca in linguaggio naturale (l'AI produce i filtri, i dati vengono dal DB) |
| `GET /api/v1/ai/players/{id}/report` | Report AI basato solo sulle statistiche reali |
| `GET /api/v1/ai/compare?ids=1,2,3` | Verdetto AI su 2-3 giocatori |
| `GET /api/v1/players/{id}/projection` | Stima euristica di valore e traiettoria di crescita |
| `GET`, `POST /api/v1/players/{id}/notes`, `PUT`, `DELETE /api/v1/notes/{id}` | Note private dell'utente sul giocatore |
| `GET`, `POST /api/v1/watchlists`, `GET`, `DELETE /api/v1/watchlists/{id}`, `PUT`, `DELETE /api/v1/watchlists/{id}/players/{playerId}` | Liste private di giocatori |
| `POST /api/v1/auth/register`, `/login`, `/logout`, `GET /auth/me` | Account e sessioni |
| `PATCH /api/v1/auth/me` e `/auth/me/**` | Profilo: dati, foto, email, password, sessioni, eliminazione account |
| `POST /api/v1/admin/import/run`, `GET /api/v1/admin/import/status`, `POST /api/v1/admin/stats/recompute` | Import da API-Football e ricalcolo dei percentili (header `X-Admin-Key`) |

Le chiamate `/api/v1/ai/**` sono limitate a 20 al minuto per IP. I dettagli sono in [`docs/api.md`](docs/api.md).

## Test

- Backend: `cd backend && ./mvnw test` (alcuni test usano il database locale, quindi `docker compose up -d` deve essere attivo)
- Frontend: `cd frontend && npm run lint && npm test && npm run build`

Il file `.env` è ignorato da git: non committare mai le chiavi.
