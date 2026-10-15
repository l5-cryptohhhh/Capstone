-- Profilo utente: dati facoltativi e foto. La foto sta in una tabella a parte per non caricarla a ogni sessione.

ALTER TABLE app_user
    ADD COLUMN bio                VARCHAR(280),
    ADD COLUMN location           VARCHAR(80),
    ADD COLUMN favorite_team      VARCHAR(80),
    ADD COLUMN favorite_position  VARCHAR(3),
    ADD COLUMN avatar_updated_at  TIMESTAMPTZ;

CREATE TABLE user_avatar (
    user_id       BIGINT PRIMARY KEY REFERENCES app_user (id) ON DELETE CASCADE,
    content_type  VARCHAR(40) NOT NULL,
    data          BYTEA       NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
