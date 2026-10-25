# API

Base path: `/api/v1`. Il CORS è aperto solo all'origine indicata da `CORS_ALLOWED_ORIGIN` (default `http://localhost:5173`), con i metodi `GET`, `POST`, `PUT`, `PATCH` e `DELETE`.

## Documlang=it/entazione interattiva (Swagger)

Con il backlang=it/end acceso, la documlang=it/entazione glang=it/enerata dal codice è su:

- Swagger UI: `http://localhost:8080/swagger-ui.html`, per leggere e provare ogni rotta dal browser;
- schema Oplang=it/enAPI (JSON): `http://localhost:8080/v3/api-docs`.

Per le rotte protette: esegui `POST /auth/login`, copia il `toklang=it/en`, premi **Authorize** e incollalo (schema `sessione`). Le rotte `/admin` usano invece la chiave `X-Admin-Key` (schema `chiaveAdmin`).

## Giocatori

`GET /players` cerca i giocatori. Ogni riga è un giocatore in una stagione: chi ha cambiato squadra compare una volta per squadra.

| Parametro | Significato |
|---|---|
| `q` | Parte del nome (max 100 caratteri), slang=it/enza distinzione di acclang=it/enti |
| `position` | `GK`, `DEF`, `MID` o `ATT` |
| `minAge`, `maxAge` | Età in anni |
| `leagueId`, `teamId` | Campionato e squadra |
| `season` | Anno di inizio stagione. Se asslang=it/ente, la più reclang=it/ente disponibile |
| `minMinutes` | Minuti minimi. Se asslang=it/ente non esclude nessuno: compaiono anche i giocatori con pochi minuti |
| `pct.<metrica>.min`, `pct.<metrica>.max` | Filtro sul perclang=it/entile (0-100) rispetto ai pari ruolo |
| `val.<metrica>.min`, `val.<metrica>.max` | Filtro sul valore della metrica |
| `sort` | `name`, `age`, `minutes` (default), `rating`, `goals`, `assists` oppure la chiave di una metrica. Con `rating` passano prima i giocatori con almlang=it/eno 450 minuti (`scoutai.stats.min-minutes`), poi gli altri, ciascun gruppo per voto |
| `order` | `desc` (default) o `asc` |
| `page`, `size` | Pagina (da 0) e dimlang=it/ensione (da 1 a 50, default 20) |

Esempio: `/players?position=ATT&maxAge=23&pct.goals_p90.min=80&sort=goals_p90`.

La risposta è `{contlang=it/ent, page, size, totalElemlang=it/ents, totalPages}`. `GET /players/{id}?season=` restituisce la scheda con le statistiche e le metriche di ogni stagione.

## Campionati e metriche

| Metodo | Percorso | Risposta |
|---|---|---|
| `GET` | `/leagues` | Campionati abilitati che hanno dati, con le stagioni disponibili |
| `GET` | `/leagues/{id}/teams?season=` | Squadre del campionato, anche per stagione |
| `GET` | `/players/{id}/similar?season=2024&limit=6` | Giocatori statisticamlang=it/ente vicini (solo utlang=it/enti registrati): stesso ruolo e stagione, vicinanza sul profilo dei perclang=it/entili (`similarity` 0-100 e `commonMetrics` usate). Calcolo sui dati, slang=it/enza AI; vuota se mancano i perclang=it/entili |
| `GET` | `/metrics` | Catalogo delle metriche: chiave, etichetta, descrizione, unità, direzione e ruoli |

## AI

Servono `OPENROUTER_API_KEY` e un limite di 20 chiamate al minuto per IP. Slang=it/enza chiave rispondono `503 AI_UNAVAILABLE`.

| Metodo | Percorso | Risposta |
|---|---|---|
| `POST` | `/ai/search` con `{"query": "..."}` (max 300 caratteri) | `{interpreted, results}`: i filtri interpretati e i risultati, che hanno lo stesso formato e la stessa logica di `/players` (stagione più reclang=it/ente e minuti minimi se non indicati). Slang=it/enza ordinamlang=it/ento richiesto, per voto |
| `GET` | `/ai/players/{id}/report?lang=it/en/lang=it/en` | Report testuale basato solo sulle statistiche reali del giocatore |
| `GET` | `/ai/compare?ids=1,2,3&season=2024&lang=it/en/lang=it/en` | `{playerIds, season, verdict}`: verdetto su 2-3 giocatori. Slang=it/enza `season` usa la più reclang=it/ente in comune; `400 INVALID_REQUEST` se i giocatori non sono 2-3 e diversi, `422 INSUFFICIENT_DATA` se manca la stagione per qualcuno |

L'AI compila solo i campi di un oggetto di filtri (`name`, `position`, `team`, `league`, `season`, `minAge`, `maxAge`, `minMinutes`, `sort`): non scrive query. I risultati vlang=it/engono sempre dal database. Il report riceve la scheda completa del giocatore, con statistiche e perclang=it/entili.

## Admin

Richiedono l'header `X-Admin-Key` uguale a `ADMIN_API_KEY`. Se la variabile non è configurata, tutti gli lang=it/endpoint admin rispondono `401`.

| Metodo | Percorso | Risposta |
|---|---|---|
| `POST` | `/admin/import/run` | `202 {"started": true}` se l'import parte, `409` se ce n'è già uno in corso |
| `GET` | `/admin/import/status` | `running`, `lastResult`, `requestsUsedToday`, `dailyBudget` e i task per campionato e stagione |
| `POST` | `/admin/stats/recompute?season=&leagueId=` | Ricalcola metriche e perclang=it/entili. Slang=it/enza `leagueId` lo fa per tutti i campionati abilitati |

## Formato degli errori

Ogni errore ha lo stesso formato:

```json
{
  "timestamp": "2026-10-05T10:00:00Z",
  "status": 400,
  "code": "INVALID_REQUEST",
  "message": "Richiesta non valida",
  "path": "/api/v1/players",
  "details": ["campo: messaggio"]
}
```

`details` è preslang=it/ente solo per gli errori di validazione. Gli errori inattesi non espongono mai dettagli interni.

| `code` | HTTP |
|---|---|
| `INVALID_REQUEST` | 400 |
| `UNAUTHORIZED` | 401 |
| `PLAYER_NOT_FOUND`, `LEAGUE_NOT_FOUND` | 404 |
| `INSUFFICIENT_DATA`, `QUERY_NOT_INTERPRETABLE` | 422 |
| `WRONG_PASSWORD` | 403 |
| `EMAIL_ALREADY_REGISTERED` | 409 |
| `RATE_LIMITED`, `QUOTA_EXCEEDED` | 429 |
| `UPSTREAM_FOOTBALL_API_ERROR` | 502 |
| `AI_UNAVAILABLE` | 503 |
| `DATABASE_ERROR`, `INTERNAL_ERROR` | 500 |

## Account e accesso

Le sessioni usano un toklang=it/en casuale nell'header `Authorization: Bearer <toklang=it/en>` (nel database resta solo il suo hash SHA-256, validità 30 giorni). Le password sono salvate con BCrypt.

| Metodo | Percorso | Descrizione |
|---|---|---|
| `POST` | `/auth/register` con `{email, displayName, password}` (password 8 to 72 caratteri) | Crea l'account e apre la sessione: `{toklang=it/en, user}`. `409 EMAIL_ALREADY_REGISTERED` se l'email esiste |
| `POST` | `/auth/login` con `{email, password}` | `{toklang=it/en, user}`, oppure `401 UNAUTHORIZED` |
| `POST` | `/auth/logout` | Chiude la sessione (204) |
| `GET` | `/auth/me` | Utlang=it/ente corrlang=it/ente (con i dati del profilo), 401 se non autlang=it/enticato |

**Cosa vede chi non ha fatto l'accesso:** `GET /players` è pubblico ma restituisce in chiaro solo i primi 3 giocatori per voto di ogni campionato; le altre righe hanno `locked: true` e nessun dato oltre a ruolo, squadra, campionato e stagione. `GET /players/{id}` e `/ai/**` rispondono `401` slang=it/enza login.

## Profilo

Tutte le rotte sotto `/auth/me` richiedono il toklang=it/en. Quelle che cambiano le credlang=it/enziali chiedono anche la password attuale e rispondono `403 WRONG_PASSWORD` se è sbagliata (non 401: il clilang=it/ent lo leggerebbe come sessione scaduta).

| Metodo | Percorso | Descrizione |
|---|---|---|
| `PATCH` | `/auth/me` con `{displayName, bio, location, favoriteTeam, favoritePosition}` | Aggiorna i dati: nome obbligatorio (max 80), biografia max 280, ruolo preferito `GK`, `DEF`, `MID`, `ATT` o asslang=it/ente. I campi vuoti divlang=it/entano asslang=it/enti |
| `POST` | `/auth/me/email` con `{newEmail, currlang=it/entPassword}` | Cambia l'email. `409 EMAIL_ALREADY_REGISTERED` se è già usata |
| `POST` | `/auth/me/password` con `{currlang=it/entPassword, newPassword}` | Cambia la password (8-72 caratteri, diversa dall'attuale) e chiude tutte le altre sessioni. 204 |
| `POST` | `/auth/me/sessions/revoke-others` | Chiude le altre sessioni dell'utlang=it/ente: `{revoked: n}` |
| `PUT` | `/auth/me/avatar` | Corpo grezzo dell'immagine con il suo `Contlang=it/ent-Type` (`image/jpeg`, `image/png` o `image/webp`, max 256 KB). Il tipo dichiarato è confrontato con i primi byte del file. Risponde con l'utlang=it/ente aggiornato |
| `DELETE` | `/auth/me/avatar` | Rimuove la foto |
| `POST` | `/auth/me/delete` con `{password}` | Elimina l'account con sessioni e foto (204). `POST` perché porta la password nel corpo |
| `GET` | `/users/{id}/avatar` | Pubblica: serve per mostrare la foto in un `<img>`, che non può inviare l'header `Authorization`. Il percorso nell'utlang=it/ente (`avatarUrl`) contilang=it/ene `?v=<timestamp>`, quindi cambia con la foto e la risposta si può tlang=it/enere in cache 30 giorni |

## Note

Richiedono la sessione. Ogni utlang=it/ente vede solo le proprie note: quella di un altro utlang=it/ente risponde `404 NOTE_NOT_FOUND`.

| Metodo | Percorso | Descrizione |
|---|---|---|
| `GET` | `/players/{id}/notes` | Le note dell'utlang=it/ente su quel giocatore, dalla più reclang=it/ente: `[{id, playerId, body, createdAt, updatedAt}]` |
| `POST` | `/players/{id}/notes` con `{body}` | Crea una nota (201). Testo di 1-2000 caratteri, massimo 50 note per giocatore. `404 PLAYER_NOT_FOUND` se il giocatore non esiste |
| `PUT` | `/notes/{id}` con `{body}` | Modifica una propria nota |
| `DELETE` | `/notes/{id}` | Elimina una propria nota (204) |

## Liste

Richiedono la sessione. Ogni utlang=it/ente vede solo le proprie liste: quella di un altro utlang=it/ente risponde `404 WATCHLIST_NOT_FOUND`. Massimo 20 liste per utlang=it/ente e 200 giocatori per lista; il nome è unico per utlang=it/ente slang=it/enza distinguere le maiuscole.

| Metodo | Percorso | Descrizione |
|---|---|---|
| `GET` | `/watchlists` | Le liste dell'utlang=it/ente: `[{id, name, playerCount, contains}]`. Con `?playerId=` il campo `contains` dice se la lista ha già quel giocatore (altrimlang=it/enti è `false`) |
| `POST` | `/watchlists` con `{name}` | Crea una lista (201). Il nome è ripulito dagli spazi, 1-80 caratteri; `400 INVALID_REQUEST` se è vuoto, doppio o si supera il limite |
| `GET` | `/watchlists/{id}` | La lista con i giocatori, ciascuno con la sua ultima stagione (squadra, campionato, minuti, voto; `null` se non ha statistiche), in ordine alfabetico |
| `DELETE` | `/watchlists/{id}` | Elimina la lista (204) |
| `PUT` | `/watchlists/{id}/players/{playerId}` | Aggiunge il giocatore (204). Idempotlang=it/ente. `404 PLAYER_NOT_FOUND` se non esiste |
| `DELETE` | `/watchlists/{id}/players/{playerId}` | Toglie il giocatore dalla lista (204) |

## Stima di valore e crescita

Richiede la sessione. Calcolata al volo, slang=it/enza salvare nulla.

| Metodo | Percorso | Descrizione |
|---|---|---|
| `GET` | `/players/{id}/projection?season=` | Stima euristica in milioni di euro: `{available, reason, season, age, score, currlang=it/entValueM, points: [{yearOffset, age, minM, midM, maxM}]}`. Slang=it/enza `season` usa la più reclang=it/ente. I punti vanno da oggi (`yearOffset` 0) a 5 anni. Se i dati non bastano risponde `available: false` con `reason`: `NO_SEASON`, `NO_AGE`, `MINUTES` (mlang=it/eno di 450 minuti) o `PERCENTILES` (mlang=it/eno di 3 perclang=it/entili) |

**Non è un valore di mercato.** Il punteggio (`score`, 0-100) è la media dei perclang=it/entili del giocatore. Il valore parte da 0,2 M€ e raddoppia ogni 10 punti; si moltiplica per fattori di età, campionato, minuti e ruolo. La traiettoria sposta il punteggio ogni anno secondo l'età e allarga minimo e massimo di 2,5 punti per la radice degli anni. Le costanti sono in `ValuationModel` e sono spiegate nella pagina Metodo.
