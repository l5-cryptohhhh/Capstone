#!/usr/bin/env bash
# Copia i dati importati (campionati, squadre, giocatori, statistiche, metriche e percentili) dal database locale
# a quello online. Gli utenti, le note e le liste NON si copiano: online ognuno si registra da sé.
#
# Va lanciato DOPO il primo avvio del backend online, che crea le tabelle con Flyway. Sostituisce il contenuto
# delle tabelle di destinazione: in una transazione sola, quindi se qualcosa va storto non cambia nulla.
#
# Uso:
#   SOURCE_URL='postgresql://utente:password@localhost:5432/scoutai' \
#   TARGET_URL='postgresql://utente:password@host/db?sslmode=require' \
#   ./scripts/copy-data.sh
#
# Variabili facoltative:
#   PG_BIN         cartella dei programmi PostgreSQL, se psql e pg_dump non sono nel PATH
#                  (su Windows: "/c/Program Files/PostgreSQL/18/bin")
#   TARGET_SCHEMA  schema di destinazione (default: public)

set -euo pipefail

: "${SOURCE_URL:?Imposta SOURCE_URL (database locale)}"
: "${TARGET_URL:?Imposta TARGET_URL (database online, indirizzo esterno)}"
SCHEMA="${TARGET_SCHEMA:-public}"
PSQL="${PG_BIN:+$PG_BIN/}psql"
PG_DUMP="${PG_BIN:+$PG_BIN/}pg_dump"

# Ordine non importante per il dump (pg_dump rispetta le chiavi esterne), ma qui sono tutte e sole le tabelle dei dati
TABLES=(league team player player_season_stat player_season_metric import_task api_quota_log)

dump_args=()
truncate_list=""
in_list=""
for table in "${TABLES[@]}"; do
  dump_args+=(-t "public.${table}")
  truncate_list+="${truncate_list:+, }${SCHEMA}.${table}"
  in_list+="${in_list:+, }'${table}'"
done

echo "Copio ${#TABLES[@]} tabelle verso lo schema '${SCHEMA}'..."

# Prima il dump su un file temporaneo: se fallisce, la destinazione non è ancora stata toccata.
# - lo schema d'origine è sempre public: se la destinazione è diversa si riscrive il nome nei COPY
# - "SET transaction_timeout" esiste solo da PostgreSQL 17: toglierla permette di caricare anche su un server 16
DUMP_FILE="$(mktemp)"
trap 'rm -f "$DUMP_FILE"' EXIT
"$PG_DUMP" --data-only --no-owner "${dump_args[@]}" "$SOURCE_URL" \
  | sed -e "s/^COPY public\./COPY ${SCHEMA}./" -e '/^SET transaction_timeout/d' > "$DUMP_FILE"

# Poi lo scambio, in una transazione sola
{
  echo "BEGIN;"
  echo "TRUNCATE ${truncate_list} RESTART IDENTITY CASCADE;"
  cat "$DUMP_FILE"
  # Le sequenze degli id ripartono dal valore massimo caricato, altrimenti i nuovi inserimenti andrebbero in conflitto
  cat <<SQL
DO \$\$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name, column_name,
           pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name) AS seq
    FROM information_schema.columns
    WHERE table_schema = '${SCHEMA}' AND table_name IN (${in_list})
  LOOP
    IF r.seq IS NOT NULL THEN
      EXECUTE format('SELECT setval(%L, max(%I)) FROM %I.%I HAVING max(%I) IS NOT NULL',
                     r.seq, r.column_name, '${SCHEMA}', r.table_name, r.column_name);
    END IF;
  END LOOP;
END \$\$;
COMMIT;
SQL
} | "$PSQL" --quiet --set ON_ERROR_STOP=1 --output /dev/null "$TARGET_URL"

echo "Righe presenti ora nella destinazione:"
for table in "${TABLES[@]}"; do
  count=$("$PSQL" --no-align --tuples-only "$TARGET_URL" -c "SELECT count(*) FROM ${SCHEMA}.${table}")
  printf '  %-24s %s\n' "$table" "$count"
done
