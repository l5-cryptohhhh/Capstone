-- Liste (watchlist) private dell'utente con i giocatori che ci ha messo. Spariscono con l'utente.

CREATE TABLE watchlist (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    name        VARCHAR(80) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stesso nome due volte non ha senso, nemmeno cambiando maiuscole
CREATE UNIQUE INDEX uq_watchlist_user_name ON watchlist (user_id, lower(name));

CREATE TABLE watchlist_player (
    watchlist_id  BIGINT      NOT NULL REFERENCES watchlist (id) ON DELETE CASCADE,
    player_id     BIGINT      NOT NULL REFERENCES player (id) ON DELETE CASCADE,
    added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (watchlist_id, player_id)
);
