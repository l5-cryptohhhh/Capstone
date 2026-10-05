# API

Base path: `/api/v1`. Il CORS è aperto solo all'origine indicata da `CORS_ALLOWED_ORIGIN` (default `http://localhost:5173`), con i metodi `GET` e `POST`.

## Giocatori

`GET /players` cerca i giocatori. Ogni riga è un giocatore in una stagione: chi ha cambiato squadra compare una volta per squadra.

| Parametro | Significato |
|---|---|
| `q` | Parte del nome (max 100 caratteri), senza distinzione di accenti |
| `position` | `GK`, `DEF`, `MID` o `ATT` |
| `minAge`, `maxAge` | Età in anni |
| `leagueId`, `teamId` | Campionato e squadra |
| `season` | Anno di inizio stagione. Se assente, la più recente disponibile |
| `minMinutes` | Minuti minimi. Se assente, `scoutai.stats.min-minutes` (450) |
| `pct.<metrica>.min`, `pct.<metrica>.max` | Filtro sul percentile (0-100) rispetto ai pari ruolo |
| `val.<metrica>.min`, `val.<metrica>.max` | Filtro sul valore della metrica |
| `sort` | `name`, `age`, `minutes` (default), `rating`, `goals`, `assists` oppure la chiave di una metrica |
| `order` | `desc` (default) o `asc` |
| `page`, `size` | Pagina (da 0) e dimensione (da 1 a 50, default 20) |

Esempio: `/players?position=ATT&maxAge=23&pct.goals_p90.min=80&sort=goals_p90`.

La risposta è `{content, page, size, totalElements, totalPages}`. `GET /players/{id}?season=` restituisce la scheda con le statistiche e le metriche di ogni stagione.

## Campionati e metriche

| Metodo | Percorso | Risposta |
|---|---|---|
| `GET` | `/leagues` | Campionati abilitati che hanno dati, con le stagioni disponibili |
| `GET` | `/leagues/{id}/teams?season=` | Squadre del campionato, anche per stagione |
| `GET` | `/metrics` | Catalogo delle metriche: chiave, etichetta, descrizione, unità, direzione e ruoli |

## AI

Servono `OPENROUTER_API_KEY` e un limite di 20 chiamate al minuto per IP. Senza chiave rispondono `503 AI_UNAVAILABLE`.

| Metodo | Percorso | Risposta |
|---|---|---|
| `POST` | `/ai/search` con `{"query": "..."}` (max 300 caratteri) | `{interpreted, results}`: i filtri interpretati e i risultati, che hanno lo stesso formato e la stessa logica di `/players` (stagione più recente e minuti minimi se non indicati). Senza ordinamento richiesto, per voto |
| `GET` | `/ai/players/{id}/report` | Report testuale basato solo sulle statistiche reali del giocatore |

L'AI compila solo i campi di un oggetto di filtri (`name`, `position`, `team`, `league`, `season`, `minAge`, `maxAge`, `minMinutes`, `sort`): non scrive query. I risultati vengono sempre dal database. Il report riceve la scheda completa del giocatore, con statistiche e percentili.

## Admin

Richiedono l'header `X-Admin-Key` uguale a `ADMIN_API_KEY`. Se la variabile non è configurata, tutti gli endpoint admin rispondono `401`.

| Metodo | Percorso | Risposta |
|---|---|---|
| `POST` | `/admin/import/run` | `202 {"started": true}` se l'import parte, `409` se ce n'è già uno in corso |
| `GET` | `/admin/import/status` | `running`, `lastResult`, `requestsUsedToday`, `dailyBudget` e i task per campionato e stagione |
| `POST` | `/admin/stats/recompute?season=&leagueId=` | Ricalcola metriche e percentili. Senza `leagueId` lo fa per tutti i campionati abilitati |

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

`details` è presente solo per gli errori di validazione. Gli errori inattesi non espongono mai dettagli interni.

| `code` | HTTP |
|---|---|
| `INVALID_REQUEST` | 400 |
| `UNAUTHORIZED` | 401 |
| `PLAYER_NOT_FOUND`, `LEAGUE_NOT_FOUND` | 404 |
| `INSUFFICIENT_DATA`, `QUERY_NOT_INTERPRETABLE` | 422 |
| `RATE_LIMITED`, `QUOTA_EXCEEDED` | 429 |
| `UPSTREAM_FOOTBALL_API_ERROR` | 502 |
| `AI_UNAVAILABLE` | 503 |
| `DATABASE_ERROR`, `INTERNAL_ERROR` | 500 |

## Account e accesso

Le sessioni usano un token casuale nell'header `Authorization: Bearer <token>` (nel database resta solo il suo hash SHA-256, validità 30 giorni). Le password sono salvate con BCrypt.

| Metodo | Percorso | Descrizione |
|---|---|---|
| `POST` | `/auth/register` con `{email, displayName, password}` (password 8 to 72 caratteri) | Crea l'account e apre la sessione: `{token, user}`. `409 EMAIL_ALREADY_REGISTERED` se l'email esiste |
| `POST` | `/auth/login` con `{email, password}` | `{token, user}`, oppure `401 UNAUTHORIZED` |
| `POST` | `/auth/logout` | Chiude la sessione (204) |
| `GET` | `/auth/me` | Utente corrente, 401 se non autenticato |

**Cosa vede chi non ha fatto l'accesso:** `GET /players` è pubblico ma restituisce in chiaro solo i primi 3 giocatori per voto di ogni campionato; le altre righe hanno `locked: true` e nessun dato oltre a ruolo, squadra, campionato e stagione. `GET /players/{id}` e `/ai/**` rispondono `401` senza login.
