-- Add optional custom logo URLs for visual labels in admin/user tables.
ALTER TABLE channels ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';
