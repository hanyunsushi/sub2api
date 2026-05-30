package migrations

import (
	"strings"
	"testing"
)

func TestChannelMonitorLogoMigrationExists(t *testing.T) {
	body, err := FS.ReadFile("145_add_channel_monitor_logo_url.sql")
	if err != nil {
		t.Fatalf("read migration: %v", err)
	}
	sql := string(body)
	if !strings.Contains(sql, "ALTER TABLE channel_monitors ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT ''") {
		t.Fatalf("migration does not add channel_monitors.logo_url safely:\n%s", sql)
	}
}
