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

5. Admin: per importare i dati (limite API-Football: 100 richieste/giorno) `POST /api/v1/admin/import/run` con header `X-Admin-Key`; lo stato è su `GET /api/v1/admin/import/status`.
6. Test: `cd backend && ./mvnw test` e `cd frontend && npm test`.

Il file `.env` è ignorato da git: non committare mai le chiavi. Le variabili del database hanno prefisso `SCOUTAI_` per non collidere con quelle di sistema.

## Design

Contesto di prodotto in [PRODUCT.md](PRODUCT.md), sistema visivo ("Dossier dello scout") in [DESIGN.md](DESIGN.md). Il frontend è in italiano e inglese, con tema chiaro e scuro.
