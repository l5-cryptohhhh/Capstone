# Database

PostgreSQL. Lo schema è gestito da Flyway (`backend/src/main/resources/db/migration`) e Hibernate è in modalità `validate`: non modifica mai lo schema. Una migration già applicata non va modificata, altrimenti cambia il suo checksum: ogni cambiamento richiede una nuova migration.

| Tabella | Contenuto |
|---|---|
| `league` | Campionati. Solo quelli con `enabled = true` vengono importati, in ordine di `priority`. La V2 inserisce i primi cinque campionati, la V7 aggiunge Liga Portugal ed Eredivisie. |
| `team` | Squadre |
| `player` | Giocatori, con ruolo normalizzato (`GK`, `DEF`, `MID`, `ATT`) |
| `player_season_stat` | Statistiche di un giocatore con una squadra, in un campionato e in una stagione. Chiave unica su `(player_id, team_id, league_id, season)`. I valori assenti restano `NULL`, non diventano 0. |
| `player_season_metric` | Valore calcolato di una metrica per una riga di statistiche, con percentile e dimensione della coorte. Una riga per `(statistica, metrica)`: aggiungere una metrica non richiede migration. |
| `app_user` | Utenti registrati: email, nome, password (hash BCrypt) e dati facoltativi del profilo (`bio`, `location`, `favorite_team`, `favorite_position`). `avatar_updated_at` dice se c'è una foto e versiona il suo indirizzo |
| `auth_session` | Sessioni di accesso: del token si salva solo l'hash SHA-256, con scadenza a 30 giorni. Si cancellano insieme all'utente |
| `user_avatar` | Foto profilo (una per utente) come `BYTEA`. Sta in una tabella a parte per non caricarla a ogni lettura della sessione |
| `player_note` | Note private di un utente su un giocatore (`user_id`, `player_id`, `body` fino a 2000 caratteri). Spariscono con l'utente o con il giocatore |
| `watchlist` | Liste private di un utente (`user_id`, `name`). Il nome è unico per utente senza distinguere le maiuscole. Spariscono con l'utente |
| `watchlist_player` | Giocatori di una lista, con la data di aggiunta (`added_at`). Chiave `(watchlist_id, player_id)`: un giocatore non può comparire due volte nella stessa lista |
| `api_quota_log` | Richieste effettuate a API-Football per giorno (UTC) |
| `import_task` | Avanzamento dell'import per `(league_id, season)`: stato, `next_page`, pagine totali, giocatori importati, ultimo errore |

Le entità importate (`league`, `team`, `player`) conservano il proprio `api_id` di API-Football, così l'importazione è idempotente: rilanciarla aggiorna i dati senza duplicarli.

La V3 abilita l'estensione `unaccent`, usata per cercare i nomi senza accenti ("Pulisic" trova "Pulišić").
