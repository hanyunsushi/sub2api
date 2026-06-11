-- Support binding one channel monitor to multiple accounts.
ALTER TABLE channel_monitors
  ADD COLUMN IF NOT EXISTS account_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE channel_monitors
SET account_ids = jsonb_build_array(account_id)
WHERE account_id IS NOT NULL
  AND (
    account_ids IS NULL
    OR jsonb_typeof(account_ids) <> 'array'
    OR account_ids = '[]'::jsonb
  );
