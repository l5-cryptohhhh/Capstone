-- Note private dell'utente sui giocatori. Spariscono con l'utente o con il giocatore.

CREATE TABLE player_note (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    player_id   BIGINT        NOT NULL REFERENCES player (id) ON DELETE CASCADE,
    body        VARCHAR(2000) NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_note_user_player ON player_note (user_id, player_id);
