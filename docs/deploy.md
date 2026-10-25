# Deploy su Render

Tutto a costo zero e tutto su **Render**: il backend, il frontend e il database PostgreSQL. L'import giornaliero da API-Football lo lancia **GitHub Actions**.

```
Browser ──> Render "scoutai-web" (file statici)
   │
   └──────> Render "scoutai-api" (Spring Boot in Docker) ──> Render "scoutai-db" (PostgreSQL)
                  ▲
GitHub Actions ───┘  ogni giorno 00:10 UTC: POST /api/v1/admin/import/run
```

Cosa c'è nel repository per questo:

| File | A cosa serve |
|---|---|
| [`render.yaml`](../render.yaml) | Blueprint: descrive database e servizi Render e le variabili da compilare |
| [`backend/Dockerfile`](../backend/Dockerfile) | Compila il backend con Maven (JDK 25) e lo esegue con il solo JRE |
| [`backend/scripts/copy-data.sh`](../backend/scripts/copy-data.sh) | Copia i dati importati dal database locale a quello online |
| [`.github/workflows/daily-import.yml`](../.github/workflows/daily-import.yml) | Import giornaliero (sveglia anche il servizio) |

## Prima di cominciare

- Il progetto deve essere su **GitHub** (Render e GitHub Actions leggono da lì). Il file `.env` è già escluso da git: non deve mai finire nel repository.
- Servono gli account gratuiti di Render e GitHub, la chiave di API-Football e quella di OpenRouter (le stesse del `.env`).

## 1. Database, backend e frontend

1. Su Render: **New > Blueprint**, scegli il repository. Render legge `render.yaml` e propone tre risorse: il database `scoutai-db` e i servizi `scoutai-api` e `scoutai-web`.
2. Compila le variabili del backend. Il collegamento al database (host, porta, nome, utente, password) arriva **da solo** dal database, tramite l'indirizzo interno di Render: non devi inserire nulla.

   | Variabile | Valore |
   |---|---|
   | `API_FOOTBALL_KEY` | la chiave di API-Football |
   | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | la chiave di OpenRouter e il modello (quello del tuo `.env`) |
   | `CORS_ALLOWED_ORIGIN` | l'indirizzo del frontend, per esempio `https://scoutai-web.onrender.com` (senza barra finale) |

   `ADMIN_API_KEY` la genera Render da sola. Le altre (`SCOUTAI_IMPORT_AUTO_ENABLED=false`, `SERVER_FORWARD_HEADERS_STRATEGY=native`) sono già nel blueprint.
3. Compila la variabile del frontend: `VITE_API_BASE_URL` = indirizzo del backend + `/api/v1`, per esempio `https://scoutai-api.onrender.com/api/v1`.
4. Crea tutto. Se un nome è già preso Render aggiunge un suffisso: in quel caso correggi `CORS_ALLOWED_ORIGIN` e `VITE_API_BASE_URL` con gli indirizzi veri. La seconda va **ricostruita** (Manual Deploy), perché entra nel codice durante il build.
5. Al primo avvio il backend crea le tabelle da solo (Flyway). Controlla nei log di `scoutai-api` la riga *"Successfully applied 11 migrations"*.

## 2. Copiare i dati già importati

Senza questo passaggio il sito parte vuoto e l'import da API-Football (90 richieste al giorno) ci metterebbe giorni. I dati pesano circa 25 MB; il database gratuito ha 1 GB.

1. Nella dashboard Render apri `scoutai-db` e copia l'**External Database URL** (quello che comincia con `postgresql://`). Se non finisce con `?sslmode=require`, aggiungilo.
2. Da Git Bash, nella cartella del progetto:

```bash
SOURCE_URL='postgresql://scoutai:<password>@localhost:5432/scoutai' \
TARGET_URL='<External Database URL>?sslmode=require' \
PG_BIN='/c/Program Files/PostgreSQL/18/bin' \
./backend/scripts/copy-data.sh
```

Lo script copia campionati, squadre, giocatori, statistiche e percentili (non utenti, note e liste), in una transazione sola, e alla fine stampa le righe presenti. Se `psql` e `pg_dump` sono già nel PATH, `PG_BIN` non serve. Non occorre riavviare il backend.

## 3. Import giornaliero

Il servizio gratuito di Render si addormenta dopo 15 minuti senza richieste, quindi lo scheduler interno non è affidabile: l'import lo lancia GitHub Actions ogni giorno alle 00:10 UTC (la quota di API-Football si azzera a mezzanotte UTC).

1. Nel repository GitHub: **Settings > Secrets and variables > Actions**, aggiungi:
   - `SCOUTAI_API_URL`: l'indirizzo del backend, senza barra finale;
   - `ADMIN_API_KEY`: il valore generato da Render (variabile `ADMIN_API_KEY` di `scoutai-api`, nella dashboard).
2. Per provarlo subito: **Actions > Import giornaliero > Run workflow**. Deve finire in verde (risposta 202, oppure 409 se un import è già in corso).

GitHub sospende i workflow programmati dopo 60 giorni di inattività del repository: se succede, basta riattivarlo dalla scheda Actions.

## 4. Controlli finali

- [ ] `https://<backend>/api/v1/leagues` risponde con i campionati.
- [ ] Il frontend si apre, la registrazione e l'accesso funzionano (se il browser mostra un errore di rete, controlla `CORS_ALLOWED_ORIGIN`).
- [ ] Apri direttamente un indirizzo interno, per esempio `/giocatore/38`, e ricarica: deve restare nella pagina (la regola di riscrittura del blueprint).
- [ ] Ricerca, scheda, confronto, note, liste, stima e PDF.
- [ ] Il report AI risponde (se il modello gratuito è instabile può servire un secondo tentativo).
- [ ] `GET /api/v1/admin/import/status` senza `X-Admin-Key` risponde 401.

## Cose da sapere

- **Il database gratuito scade.** Render cancella il PostgreSQL gratuito 30 giorni dopo la creazione (con un breve periodo di grazia e avvisi via email). Segnati la data di creazione di `scoutai-db` e controlla che la consegna e l'eventuale presentazione cadano prima. Se serve andare oltre: crea un nuovo database (anche a pagamento, se vuoi tenerlo), cambia le variabili del backend e rilancia `backend/scripts/copy-data.sh`. Gli utenti registrati, le note e le liste non si copiano e andrebbero rifatti.
- **Risveglio lento.** Dopo 15 minuti di inattività il backend si addormenta e la prima richiesta può metterci 30-60 secondi. Prima di una presentazione apri il sito qualche minuto prima. Per tenerlo sveglio nei giorni della consegna puoi far chiamare `/api/v1/leagues` ogni 5 minuti da un servizio di monitoraggio gratuito (per esempio UptimeRobot); le 750 ore mensili del piano gratuito bastano per un servizio sempre acceso.
- **Memoria.** Il piano gratuito ha 512 MB; il Dockerfile limita l'heap al 70% e usa un garbage collector leggero.
- **Swagger** (`/swagger-ui.html`) è raggiungibile anche online: è la documentazione delle API e non espone dati.
- **Chiavi.** Nessuna chiave sta nel codice: sono solo variabili su Render e secrets su GitHub. Per cambiare la chiave admin aggiorna `ADMIN_API_KEY` su Render e il secret su GitHub.
- **Nuova versione.** Con `autoDeploy: true` ogni push sul ramo principale ricostruisce i servizi. Le nuove migrazioni di Flyway partono da sole all'avvio.
