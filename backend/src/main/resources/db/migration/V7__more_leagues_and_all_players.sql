-- Nuovi campionati da scoutare (id API-Football): Liga Portugal ed Eredivisie.
INSERT INTO league (api_id, name, country, enabled, priority) VALUES
    (94, 'Liga Portugal', 'Portugal',    TRUE, 6),
    (88, 'Eredivisie',    'Netherlands', TRUE, 7);

-- Prima si scartavano i giocatori con meno di 450 minuti; per lo scouting servono anche i giovani che giocano poco.
-- Le rose già importate si rifanno (upsert: i dati esistenti restano). L'elenco squadre (team_api_id = 0) è già a posto.
UPDATE import_task
SET status = 'PENDING', next_page = 1, total_pages = NULL, players_imported = 0, last_error = NULL, updated_at = now()
WHERE team_api_id <> 0;
