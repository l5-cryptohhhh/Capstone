# Database

PostgreSQL 17. Lo schema è gestito da Flyway (`backend/src/main/resources/db/migration`) e Hibernate è in modalità `validate`: non modifica mai lo schema. Una migration già applicata non va modificata, altrimenti cambia il suo checksum: ogni cambiamento richiede una nuova migration.

| Tabella | Contenuto |
|---|---|
| `league` | Campionati. Solo quelli con `enabled = true` vengono importati, in ordine di `priority`. La V2 inserisce i top 5 europei. |
| `team` | Squadre |
| `player` | Giocatori, con ruolo normalizzato (`GK`, `DEF`, `MID`, `ATT`) |
| `player_season_stat` | Statistiche di un giocatore con una squadra, in un campionato e in una stagione. Chiave unica su `(player_id, team_id, league_id, season)`. I valori assenti restano `NULL`, non diventano 0. |
| `player_season_metric` | Valore calcolato di una metrica per una riga di statistiche, con percentile e dimensione della coorte. Una riga per `(statistica, metrica)`: aggiungere una metrica non richiede migration. |
| `api_quota_log` | Richieste effettuate a API-Football per giorno (UTC) |
| `import_task` | Avanzamento dell'import per `(league_id, season)`: stato, `next_page`, pagine totali, giocatori importati, ultimo errore |

Le entità importate (`league`, `team`, `player`) conservano il proprio `api_id` di API-Football, così l'importazione è idempotente: rilanciarla aggiorna i dati senza duplicarli.

La V3 abilita l'estensione `unaccent`, usata per cercare i nomi senza accenti ("Pulisic" trova "Pulišić").
