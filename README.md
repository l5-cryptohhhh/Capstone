# ScoutAI

Piattaforma di scouting calcistico con AI: l'AI interpreta i dati reali (API-Football), non li inventa.

## Struttura

| Cartella | Contenuto |
|---|---|
| `backend/` | Spring Boot (Java 25), REST API, PostgreSQL |
| `frontend/` | React + Vite + TypeScript |
| `docs/` | Architettura, database, API, decisioni |

## Setup locale

1. `cp .env.example .env` e inserisci le tue chiavi (`API_FOOTBALL_KEY`, `OPENROUTER_API_KEY`, `ADMIN_API_KEY`).
2. `docker compose up -d` per avviare PostgreSQL.
3. Backend: `cd backend && ./mvnw spring-boot:run`
4. Frontend: `cd frontend && npm install && npm run dev`

## API backend

| Endpoint | Descrizione |
|---|---|
| `GET /api/v1/players?name&position&team&league&season&minAge&maxAge&minMinutes&sort&page&size` | Ricerca giocatori (`sort`: rating, goals, assists, minutes, appearances) |
| `GET /api/v1/players/{id}` | Scheda giocatore con statistiche per stagione |
| `GET /api/v1/leagues` | Campionati abilitati |
| `POST /api/v1/ai/search` `{"query": "..."}` | Ricerca in linguaggio naturale (l'AI produce i filtri, i dati vengono dal DB) |
| `GET /api/v1/ai/players/{id}/report` | Report AI basato solo sulle statistiche reali |
| `POST /api/v1/admin/import/run`, `GET /api/v1/admin/import/status` | Import da API-Football (header `X-Admin-Key`) |

Le chiamate `/api/v1/ai/**` sono limitate a 20 al minuto per IP.

Il file `.env` è ignorato da git: non committare mai le chiavi.
