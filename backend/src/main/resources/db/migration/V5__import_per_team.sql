-- Il piano Free di API-Football accetta solo le pagine 1-3 di /players per richiesta, quindi un campionato intero
-- non è importabile in un colpo solo. L'unità di import diventa (campionato, stagione, squadra).
-- team_api_id = 0 è il task "elenco squadre" del campionato: scarica le squadre e crea i task per squadra.
ALTER TABLE import_task ADD COLUMN team_api_id INTEGER NOT NULL DEFAULT 0;

ALTER TABLE import_task DROP CONSTRAINT uq_import_task;
ALTER TABLE import_task ADD CONSTRAINT uq_import_task UNIQUE (league_id, season, team_api_id);

-- I vecchi task erano per campionato intero: si ripartono dall'elenco squadre (i giocatori già salvati restano,
-- l'import è un upsert).
UPDATE import_task
SET status = 'PENDING', next_page = 1, total_pages = NULL, last_error = NULL, updated_at = now();
