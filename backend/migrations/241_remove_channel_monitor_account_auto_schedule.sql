-- Remove retired channel-monitor-driven account scheduling state.
DROP INDEX IF EXISTS idx_accounts_schedule_locked;

ALTER TABLE accounts
    DROP COLUMN IF EXISTS schedule_locked;

ALTER TABLE channel_monitors
    DROP COLUMN IF EXISTS account_ids;
