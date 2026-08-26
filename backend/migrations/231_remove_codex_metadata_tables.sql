-- Remove the retired CPA/Codex management metadata tables.
-- Keep migration 108 immutable for databases that already recorded it.

DROP TABLE IF EXISTS codex_account_metadata;
DROP TABLE IF EXISTS codex_groups;
