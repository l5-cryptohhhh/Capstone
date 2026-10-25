# ScoutAI

Piattaforma di scouting calcistico con AI: l'AI interpreta i dati reali (API-Football), non li inventa.

- Sito online: <https://scoutai-web-l0yu.onrender.com>
- API online: <https://scoutai-api-xp4z.onrender.com/api/v1> (documentazione Swagger su `/swagger-ui.html`)

Il sito gira sul piano gratuito di Render: dopo 15 minuti senza richieste il backend si addormenta e la prima
richiesta può metterci fino a un minuto.

## Dati

Sette campionati (Serie A, Premier League, La Liga, Bundesliga, Ligue 1, Liga Portugal, Eredivisie), stagioni 2022,
2023 e 2024, circa 6.100 giocatori. I dati arrivano da API-Football (piano gratuito, 100 richieste al giorno) e sono
già importati: online l'import automatico è spento. Il ruolo viene normalizzato in portiere, difensore,
centrocampista e attaccante (l'API manda gli attaccanti come "Attacker" oppure "Forward"). Le metriche si calcolano
per 90 minuti e i percentili sono confrontati tra giocatori dello stesso ruolo.

## Cosa fa

- **Cerca** tra tutti i giocatori dei campionati importati, con filtri per ruolo, età, squadra, minuti e metriche, oppure con una frase (ricerca con AI).
- **Accesso**: chi non ha un account vede solo un'anteprima bloccata dei risultati; registrandosi si sbloccano nomi, schede e strumenti.
- **Scheda** del giocatore con statistiche per 90 minuti, percentili sui pari ruolo, giocatori simili e report AI.
- **Radar e mappa per zone**: i percentili del ruolo in un grafico a ragnatela e il profilo per fase di gioco (attacco, costruzione, difesa), anche nel confronto. La mappa non mostra posizioni reali: i dati dell'API non hanno coordinate.
- **Stima di valore e crescita**: una formula spiegata nella pagina Metodo dà un valore indicativo e una traiettoria a 5 anni (minimo, medio, massimo). È sempre etichettata come stima, non è un valore di mercato.
- **Note e liste private**: ogni utente scrive note sui giocatori e li raccoglie in liste (watchlist); nessun altro le vede.
- **Scheda in PDF**: scaricabile dalla scheda del giocatore, con radar, zone, stima e note.
- **Confronto** fino a 3 giocatori affiancati, con verdetto AI. Report e verdetto vengono scritti nella lingua scelta per il sito (italiano o inglese).
- **Partitella**: una simulazione 3 contro 3 con portieri tra due squadre di giocatori reali, in cui contano i loro percentili.
- **Profilo**: foto, dati personali, email, password, sessioni ed eliminazione dell'account.
- **Pagina Metodo**: spiega come si calcolano metriche, percentili, stima di valore e come lavora l'AI.
- Italiano e inglese, tema scuro e chiaro, versione mobile.

## Tecnologie

| Livello | Tecnologie |
|---|---|
| Backend | Java 25, Spring Boot 4 (web, JPA, validation), Flyway (11 migrazioni), springdoc OpenAPI, Lombok, spring-security-crypto per le password |
| Database | PostgreSQL 18 |
| Frontend | React 19, TypeScript, Vite, React Router, TanStack Query, three.js (pallone 3D), jsPDF (scheda in PDF), react-markdown, Phosphor Icons |
| AI | Modello `openai/gpt-oss-120b` su Groq tramite API compatibile OpenAI; la configurazione (`OPENROUTER_*`) funziona anche con OpenRouter |
| Dati | API-Football |
| Test | JUnit e Mockito (backend), Vitest e Testing Library (frontend), oxlint |
| Deploy | Render (backend in Docker, sito statico, PostgreSQL) e GitHub Actions per l'import giornaliero |

## Struttura

| Cartella | Contenuto |
|---|---|
| `backend/` | Spring Boot (Java 25), REST API, PostgreSQL |
| `frontend/` | React + Vite + TypeScript |
| `scripts/` | Script di supporto: copia dei dati verso il database online |
| `docs/` | [Architettura](docs/architettura.md), [database](docs/database.md), [API](docs/api.md), [decisioni](docs/decisioni.md) |

## Documentazione API interattiva (Swagger)

Con il backend acceso: `http://localhost:8080/swagger-ui.html` (schema OpenAPI su `/v3/api-docs`). Per le rotte protette fai `POST /auth/login`, copia il token e usa **Authorize**.

## Setup locale

1. `cp .env.example .env` e inserisci le tue chiavi: `API_FOOTBALL_KEY`, `ADMIN_API_KEY` e quelle dell'AI (`OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL`, `OPENROUTER_REASONING_EFFORT`).
2. `docker compose up -d` per avviare PostgreSQL.
3. Backend: `cd backend && ./mvnw spring-boot:run`
4. Frontend: `cd frontend && npm install && npm run dev`

## Deploy

Backend, frontend e database su Render, import giornaliero con GitHub Actions: tutto gratuito. La guida
passo-passo è in [`docs/deploy.md`](docs/deploy.md); la configurazione è in [`render.yaml`](render.yaml) e
[`backend/Dockerfile`](backend/Dockerfile).

Limiti del piano gratuito da tenere presenti:
- Render cancella il database PostgreSQL gratuito 30 giorni dopo la creazione, e permette un solo database gratuito per account.
- Le variabili segrete (`API_FOOTBALL_KEY`, chiavi AI, `CORS_ALLOWED_ORIGIN`) e `VITE_API_BASE_URL` vanno controllate a mano nella dashboard dopo il Blueprint.
- Utenti, note e liste non si copiano dal database locale: online ci si registra da zero.

## API backend

| Endpoint | Descrizione |
|---|---|
| `GET /api/v1/players` | Ricerca giocatori con filtri (`q`, `position`, `minAge`, `maxAge`, `leagueId`, `teamId`, `season`, `minMinutes`), filtri sulle metriche (`pct.<metrica>.min`, `val.<metrica>.min`), ordinamento e paginazione |
| `GET /api/v1/players/{id}` | Scheda giocatore con statistiche e percentili per stagione |
| `GET /api/v1/leagues`, `GET /api/v1/leagues/{id}/teams` | Campionati con dati e squadre |
| `GET /api/v1/metrics` | Catalogo delle metriche |
| `GET /api/v1/players/{id}/similar` | Giocatori simili: stesso ruolo e stagione, vicini sul profilo dei percentili |
| `POST /api/v1/ai/search` `{"query": "..."}` | Ricerca in linguaggio naturale (l'AI produce i filtri, i dati vengono dal DB) |
| `GET /api/v1/ai/players/{id}/report?lang=it\|en` | Report AI basato solo sulle statistiche reali, nella lingua indicata |
| `GET /api/v1/ai/compare?ids=1,2,3&lang=it\|en` | Verdetto AI su 2-3 giocatori, nella lingua indicata |
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
