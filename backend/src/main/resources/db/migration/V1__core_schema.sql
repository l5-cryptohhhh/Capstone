-- Schema di base: campionati, squadre, giocatori e statistiche stagionali.
-- Ogni entità importata conserva l'id di API-Football (api_id) per rendere l'import idempotente.

CREATE TABLE league (
    id        BIGSERIAL PRIMARY KEY,
    api_id    INTEGER      NOT NULL UNIQUE,
    name      VARCHAR(100) NOT NULL,
    country   VARCHAR(100),
    logo_url  VARCHAR(255),
    enabled   BOOLEAN      NOT NULL DEFAULT FALSE,
    priority  INTEGER      NOT NULL DEFAULT 100
);

CREATE TABLE team (
    id        BIGSERIAL PRIMARY KEY,
    api_id    INTEGER      NOT NULL UNIQUE,
    name      VARCHAR(100) NOT NULL,
    country   VARCHAR(100),
    logo_url  VARCHAR(255)
);

CREATE TABLE player (
    id             BIGSERIAL PRIMARY KEY,
    api_id         INTEGER      NOT NULL UNIQUE,
    name           VARCHAR(150) NOT NULL,
    firstname      VARCHAR(150),
    lastname       VARCHAR(150),
    birth_date     DATE,
    nationality    VARCHAR(100),
    height_cm      INTEGER,
    weight_kg      INTEGER,
    photo_url      VARCHAR(255),
    position       VARCHAR(3),
    last_synced_at TIMESTAMPTZ,
    CONSTRAINT chk_player_position CHECK (position IN ('GK', 'DEF', 'MID', 'ATT'))
);

CREATE TABLE player_season_stat (
    id                  BIGSERIAL PRIMARY KEY,
    player_id           BIGINT   NOT NULL REFERENCES player (id),
    team_id             BIGINT   NOT NULL REFERENCES team (id),
    league_id           BIGINT   NOT NULL REFERENCES league (id),
    season              INTEGER  NOT NULL,
    position            VARCHAR(3),

    appearances         INTEGER,
    lineups             INTEGER,
    minutes             INTEGER,
    rating              NUMERIC(4, 2),

    goals               INTEGER,
    assists             INTEGER,
    goals_conceded      INTEGER,
    saves               INTEGER,

    shots_total         INTEGER,
    shots_on            INTEGER,
    passes_total        INTEGER,
    passes_key          INTEGER,

    tackles_total       INTEGER,
    tackles_blocks      INTEGER,
    tackles_interceptions INTEGER,
    duels_total         INTEGER,
    duels_won           INTEGER,
    dribbles_attempts   INTEGER,
    dribbles_success    INTEGER,

    fouls_drawn         INTEGER,
    fouls_committed     INTEGER,
    yellow_cards        INTEGER,
    red_cards           INTEGER,

    synced_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_player_season UNIQUE (player_id, team_id, league_id, season),
    CONSTRAINT chk_stat_position CHECK (position IN ('GK', 'DEF', 'MID', 'ATT')),
    CONSTRAINT chk_stat_minutes CHECK (minutes IS NULL OR minutes >= 0)
);

CREATE INDEX idx_stat_league_season ON player_season_stat (league_id, season);
CREATE INDEX idx_stat_player ON player_season_stat (player_id);
CREATE INDEX idx_stat_team ON player_season_stat (team_id);
CREATE INDEX idx_player_position_birth ON player (position, birth_date);
