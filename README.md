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

Il file `.env` è ignorato da git: non committare mai le chiavi.
