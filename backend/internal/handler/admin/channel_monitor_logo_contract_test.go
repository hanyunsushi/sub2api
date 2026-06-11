package admin

import (
	"strings"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/service"
)

func TestChannelMonitorResponseIncludesLogoURL(t *testing.T) {
	monitor := &service.ChannelMonitor{
		ID:              1,
		Name:            "Mimo",
		Provider:        "openai",
		APIMode:         service.MonitorAPIModeChatCompletions,
		Endpoint:        "https://ai.example.com",
		APIKey:          "sk-test",
		PrimaryModel:    "gpt-5.4",
		LogoURL:         " https://cdn.example.com/mimo.png ",
		IntervalSeconds: 60,
		Enabled:         true,
	}

	resp := channelMonitorToResponse(monitor)
	if resp.LogoURL != strings.TrimSpace(monitor.LogoURL) {
		t.Fatalf("expected response logo_url %q, got %q", strings.TrimSpace(monitor.LogoURL), resp.LogoURL)
	}
}

func TestChannelMonitorResponseIncludesLinkedAccountID(t *testing.T) {
	accountID := int64(123)
	monitor := &service.ChannelMonitor{
		ID:              1,
		Name:            "Claude monitor",
		Provider:        "anthropic",
		APIMode:         service.MonitorAPIModeChatCompletions,
		Endpoint:        "https://api.anthropic.com",
		APIKey:          "sk-test",
		PrimaryModel:    "claude-sonnet-4",
		IntervalSeconds: 60,
		Enabled:         true,
		AccountID:       &accountID,
	}

	resp := channelMonitorToResponse(monitor)
	if resp.AccountID == nil || *resp.AccountID != accountID {
		t.Fatalf("expected response account_id %d, got %#v", accountID, resp.AccountID)
	}
}
