-- Metriche derivate (per 90 minuti, percentuali) e percentili per ruolo/campionato/stagione.
-- Una riga per (statistica, metrica): aggiungere una metrica non richiede migrazioni.

-- Per la ricerca per nome senza accenti ("Pulisic" trova "Pulišić").
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE player_season_metric (
    id            BIGSERIAL PRIMARY KEY,
    stat_id       BIGINT         NOT NULL REFERENCES player_season_stat (id) ON DELETE CASCADE,
    metric        VARCHAR(40)    NOT NULL,
    metric_value  NUMERIC(10, 3) NOT NULL,
    percentile    INTEGER,
    cohort_size   INTEGER,
    CONSTRAINT uq_stat_metric UNIQUE (stat_id, metric),
    CONSTRAINT chk_metric_percentile CHECK (percentile IS NULL OR percentile BETWEEN 0 AND 100)
);

CREATE INDEX idx_metric_value ON player_season_metric (metric, metric_value);
CREATE INDEX idx_metric_percentile ON player_season_metric (metric, percentile);
