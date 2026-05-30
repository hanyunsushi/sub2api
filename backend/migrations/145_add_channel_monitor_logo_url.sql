-- Add optional custom logo URL for channel monitor cards and admin rows.
ALTER TABLE channel_monitors ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';
