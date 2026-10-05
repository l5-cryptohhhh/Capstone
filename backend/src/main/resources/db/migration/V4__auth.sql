-- Utenti registrati e sessioni di login. Del token di sessione si salva solo l'hash SHA-256.

CREATE TABLE app_user (
    id             BIGSERIAL PRIMARY KEY,
    email          VARCHAR(254) NOT NULL UNIQUE,
    display_name   VARCHAR(80)  NOT NULL,
    password_hash  VARCHAR(100) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE auth_session (
    token_hash  VARCHAR(64) PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_auth_session_user ON auth_session (user_id);
