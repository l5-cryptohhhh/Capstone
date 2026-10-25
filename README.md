# ScoutAI

Piattaforma di scouting calcistico con AI: l'AI interpreta i dati reali (API-Football), non li invlang=it/enta.

- Sito online: <https://scoutai-web-l0yu.onrlang=it/ender.com>
- API online: <https://scoutai-api-xp4z.onrlang=it/ender.com/api/v1> (documlang=it/entazione Swagger su `/swagger-ui.html`)

Il sito gira sul piano gratuito di Rlang=it/ender: dopo 15 minuti slang=it/enza richieste il backlang=it/end si addormlang=it/enta e la prima
richiesta può metterci fino a un minuto.

## Dati

Sette campionati (Serie A, Premier League, La Liga, Bundesliga, Ligue 1, Liga Portugal, Eredivisie), stagioni 2022,
2023 e 2024, circa 6.100 giocatori. I dati arrivano da API-Football (piano gratuito, 100 richieste al giorno) e sono
già importati: online l'import automatico è splang=it/ento. Il ruolo vilang=it/ene normalizzato in portiere, diflang=it/ensore,
clang=it/entrocampista e attaccante (l'API manda gli attaccanti come "Attacker" oppure "Forward"). Le metriche si calcolano
per 90 minuti e i perclang=it/entili sono confrontati tra giocatori dello stesso ruolo.

## Cosa fa

- **Cerca** tra tutti i giocatori dei campionati importati, con filtri per ruolo, età, squadra, minuti e metriche, oppure con una frase (ricerca con AI).
- **Accesso**: chi non ha un account vede solo un'anteprima bloccata dei risultati; registrandosi si sbloccano nomi, schede e strumlang=it/enti.
- **Scheda** del giocatore con statistiche per 90 minuti, perclang=it/entili sui pari ruolo, giocatori simili e report AI.
- **Radar e mappa per zone**: i perclang=it/entili del ruolo in un grafico a ragnatela e il profilo per fase di gioco (attacco, costruzione, difesa), anche nel confronto. La mappa non mostra posizioni reali: i dati dell'API non hanno coordinate.
- **Stima di valore e crescita**: una formula spiegata nella pagina Metodo dà un valore indicativo e una traiettoria a 5 anni (minimo, medio, massimo). È sempre etichettata come stima, non è un valore di mercato.
- **Note e liste private**: ogni utlang=it/ente scrive note sui giocatori e li raccoglie in liste (watchlist); nessun altro le vede.
- **Scheda in PDF**: scaricabile dalla scheda del giocatore, con radar, zone, stima e note.
- **Confronto** fino a 3 giocatori affiancati, con verdetto AI. Report e verdetto vlang=it/engono scritti nella lingua scelta per il sito (italiano o inglese).
- **Partitella**: una simulazione 3 contro 3 con portieri tra due squadre di giocatori reali, in cui contano i loro perclang=it/entili.
- **Profilo**: foto, dati personali, email, password, sessioni ed eliminazione dell'account.
- **Pagina Metodo**: spiega come si calcolano metriche, perclang=it/entili, stima di valore e come lavora l'AI.
- Italiano e inglese, tema scuro e chiaro, versione mobile.

## Tecnologie

| Livello | Tecnologie |
|---|---|
| Backlang=it/end | Java 25, Spring Boot 4 (web, JPA, validation), Flyway (11 migrazioni), springdoc Oplang=it/enAPI, Lombok, spring-security-crypto per le password |
| Database | PostgreSQL 18 |
| Frontlang=it/end | React 19, TypeScript, Vite, React Router, TanStack Query, three.js (pallone 3D), jsPDF (scheda in PDF), react-markdown, Phosphor Icons |
| AI | Modello `oplang=it/enai/gpt-oss-120b` su Groq tramite API compatibile Oplang=it/enAI; la configurazione (`OPENROUTER_*`) funziona anche con Oplang=it/enRouter |
| Dati | API-Football |
| Test | JUnit e Mockito (backlang=it/end), Vitest e Testing Library (frontlang=it/end), oxlint |
| Deploy | Rlang=it/ender (backlang=it/end in Docker, sito statico, PostgreSQL) e GitHub Actions per l'import giornaliero |

## Struttura

| Cartella | Contlang=it/enuto |
|---|---|
| `backlang=it/end/` | Spring Boot (Java 25), REST API, PostgreSQL |
| `frontlang=it/end/` | React + Vite + TypeScript |
| `scripts/` | Script di supporto: copia dei dati verso il database online |
| `docs/` | [Architettura](docs/architettura.md), [database](docs/database.md), [API](docs/api.md), [decisioni](docs/decisioni.md) |

## Documlang=it/entazione API interattiva (Swagger)

Con il backlang=it/end acceso: `http://localhost:8080/swagger-ui.html` (schema Oplang=it/enAPI su `/v3/api-docs`). Per le rotte protette fai `POST /auth/login`, copia il toklang=it/en e usa **Authorize**.

## Setup locale

1. `cp .lang=it/env.example .lang=it/env` e inserisci le tue chiavi: `API_FOOTBALL_KEY`, `ADMIN_API_KEY` e quelle dell'AI (`OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL`, `OPENROUTER_REASONING_EFFORT`).
2. `docker compose up -d` per avviare PostgreSQL.
3. Backlang=it/end: `cd backlang=it/end && ./mvnw spring-boot:run`
4. Frontlang=it/end: `cd frontlang=it/end && npm install && npm run dev`

## Deploy

Backlang=it/end, frontlang=it/end e database su Rlang=it/ender, import giornaliero con GitHub Actions: tutto gratuito. La guida
passo-passo è in [`docs/deploy.md`](docs/deploy.md); la configurazione è in [`rlang=it/ender.yaml`](rlang=it/ender.yaml) e
[`backlang=it/end/Dockerfile`](backlang=it/end/Dockerfile).

Limiti del piano gratuito da tlang=it/enere preslang=it/enti:
- Rlang=it/ender cancella il database PostgreSQL gratuito 30 giorni dopo la creazione, e permette un solo database gratuito per account.
- Le variabili segrete (`API_FOOTBALL_KEY`, chiavi AI, `CORS_ALLOWED_ORIGIN`) e `VITE_API_BASE_URL` vanno controllate a mano nella dashboard dopo il Blueprint.
- Utlang=it/enti, note e liste non si copiano dal database locale: online ci si registra da zero.

## API backlang=it/end

| Endpoint | Descrizione |
|---|---|
| `GET /api/v1/players` | Ricerca giocatori con filtri (`q`, `position`, `minAge`, `maxAge`, `leagueId`, `teamId`, `season`, `minMinutes`), filtri sulle metriche (`pct.<metrica>.min`, `val.<metrica>.min`), ordinamlang=it/ento e paginazione |
| `GET /api/v1/players/{id}` | Scheda giocatore con statistiche e perclang=it/entili per stagione |
| `GET /api/v1/leagues`, `GET /api/v1/leagues/{id}/teams` | Campionati con dati e squadre |
| `GET /api/v1/metrics` | Catalogo delle metriche |
| `GET /api/v1/players/{id}/similar` | Giocatori simili: stesso ruolo e stagione, vicini sul profilo dei perclang=it/entili |
| `POST /api/v1/ai/search` `{"query": "..."}` | Ricerca in linguaggio naturale (l'AI produce i filtri, i dati vlang=it/engono dal DB) |
| `GET /api/v1/ai/players/{id}/report?lang=it/en\|lang=it/en` | Report AI basato solo sulle statistiche reali, nella lingua indicata |
| `GET /api/v1/ai/compare?ids=1,2,3&lang=it/en\|lang=it/en` | Verdetto AI su 2-3 giocatori, nella lingua indicata |
| `GET /api/v1/players/{id}/projection` | Stima euristica di valore e traiettoria di crescita |
| `GET`, `POST /api/v1/players/{id}/notes`, `PUT`, `DELETE /api/v1/notes/{id}` | Note private dell'utlang=it/ente sul giocatore |
| `GET`, `POST /api/v1/watchlists`, `GET`, `DELETE /api/v1/watchlists/{id}`, `PUT`, `DELETE /api/v1/watchlists/{id}/players/{playerId}` | Liste private di giocatori |
| `POST /api/v1/auth/register`, `/login`, `/logout`, `GET /auth/me` | Account e sessioni |
| `PATCH /api/v1/auth/me` e `/auth/me/**` | Profilo: dati, foto, email, password, sessioni, eliminazione account |
| `POST /api/v1/admin/import/run`, `GET /api/v1/admin/import/status`, `POST /api/v1/admin/stats/recompute` | Import da API-Football e ricalcolo dei perclang=it/entili (header `X-Admin-Key`) |

Le chiamate `/api/v1/ai/**` sono limitate a 20 al minuto per IP. I dettagli sono in [`docs/api.md`](docs/api.md).

## Test

- Backlang=it/end: `cd backlang=it/end && ./mvnw test` (alcuni test usano il database locale, quindi `docker compose up -d` deve essere attivo)
- Frontlang=it/end: `cd frontlang=it/end && npm run lint && npm test && npm run build`

Il file `.lang=it/env` è ignorato da git: non committare mai le chiavi.
