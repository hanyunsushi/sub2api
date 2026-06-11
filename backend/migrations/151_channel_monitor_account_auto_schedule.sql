-- Channel monitor account auto scheduling support.

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS schedule_locked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_accounts_schedule_locked
    ON accounts (schedule_locked)
    WHERE deleted_at IS NULL;

COMMENT ON COLUMN accounts.schedule_locked IS
    'When true, channel monitor automation must not change this account schedulable flag.';

ALTER TABLE channel_monitors
    ADD COLUMN IF NOT EXISTS account_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'channel_monitors_account_id_fkey'
          AND table_name = 'channel_monitors'
    ) THEN
        ALTER TABLE channel_monitors
            ADD CONSTRAINT channel_monitors_account_id_fkey
            FOREIGN KEY (account_id)
            REFERENCES accounts(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_channel_monitors_account_id
    ON channel_monitors (account_id)
    WHERE account_id IS NOT NULL;
