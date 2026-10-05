# ScoutAI

Piattaforma di scouting calcistico con AI: l'AI interpreta i dati reali (API-Football), non li inventa.

## Struttura

| Cartella | Contenuto |
|---|---|
| `backend/` | Spring Boot (Java 25), REST API, PostgreSQL |
| `frontend/` | React + Vite + TypeScript |
| `docs/` | [Architettura](docs/architettura.md), [database](docs/database.md), [API](docs/api.md), [decisioni](docs/decisioni.md) |

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
| `POST /api/v1/ai/search` `{"query": "..."}` | Ricerca in linguaggio naturale (l'AI produce i filtri, i dati vengono dal DB) |
| `GET /api/v1/ai/players/{id}/report` | Report AI basato solo sulle statistiche reali |
| `POST /api/v1/admin/import/run`, `GET /api/v1/admin/import/status`, `POST /api/v1/admin/stats/recompute` | Import da API-Football e ricalcolo dei percentili (header `X-Admin-Key`) |

Le chiamate `/api/v1/ai/**` sono limitate a 20 al minuto per IP. I dettagli sono in [`docs/api.md`](docs/api.md).

## Test

- Backend: `cd backend && ./mvnw test` (alcuni test usano il database locale, quindi `docker compose up -d` deve essere attivo)
- Frontend: `cd frontend && npm run lint && npm test && npm run build`

Il file `.env` è ignorato da git: non committare mai le chiavi.
