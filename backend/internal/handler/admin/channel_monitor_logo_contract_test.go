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
