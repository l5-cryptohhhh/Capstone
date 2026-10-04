-- Tracciamento dell'import: quota giornaliera di API-Football e avanzamento per campionato/stagione.

-- Richieste effettuate per giorno (UTC, come il reset della quota di API-Football).
CREATE TABLE api_quota_log (
    day            DATE PRIMARY KEY,
    requests_used  INTEGER NOT NULL DEFAULT 0
);

-- Un task per ogni (campionato, stagione). next_page permette di riprendere dove ci si era fermati.
CREATE TABLE import_task (
    id                BIGSERIAL PRIMARY KEY,
    league_id         BIGINT      NOT NULL REFERENCES league (id),
    season            INTEGER     NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    next_page         INTEGER     NOT NULL DEFAULT 1,
    total_pages       INTEGER,
    players_imported  INTEGER     NOT NULL DEFAULT 0,
    last_error        VARCHAR(500),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_import_task UNIQUE (league_id, season),
    CONSTRAINT chk_import_task_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DONE'))
);

-- Top 5 campionati europei, in ordine di priorità di import (id API-Football).
INSERT INTO league (api_id, name, country, enabled, priority) VALUES
    (135, 'Serie A',        'Italy',   TRUE, 1),
    (61,  'Ligue 1',        'France',  TRUE, 2),
    (78,  'Bundesliga',     'Germany', TRUE, 3),
    (39,  'Premier League', 'England', TRUE, 4),
    (140, 'La Liga',        'Spain',   TRUE, 5);
