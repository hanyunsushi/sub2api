-- Codex management metadata tables.
-- Stores global admin metadata only; external CPA auth data remains outside Sub2API.

CREATE TABLE IF NOT EXISTS codex_groups (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    color      VARCHAR(32) NOT NULL DEFAULT '#d97757',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_codex_groups_sort_name
    ON codex_groups(sort_order, name);

CREATE TABLE IF NOT EXISTS codex_account_metadata (
    id           BIGSERIAL PRIMARY KEY,
    auth_name    VARCHAR(255) NOT NULL UNIQUE,
    group_id     BIGINT REFERENCES codex_groups(id) ON DELETE SET NULL,
    display_name VARCHAR(255) NOT NULL DEFAULT '',
    note         TEXT NOT NULL DEFAULT '',
    local_tags   JSONB NOT NULL DEFAULT '[]'::jsonb,
    settings     JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_codex_account_metadata_group_id
    ON codex_account_metadata(group_id);

CREATE INDEX IF NOT EXISTS idx_codex_account_metadata_sort_auth_name
    ON codex_account_metadata(sort_order, auth_name);
