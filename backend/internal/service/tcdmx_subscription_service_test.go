package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestTCDMXSubscriptionService_GetStatusAggregatesActiveSubscriptions(t *testing.T) {
	var requestedPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath = r.URL.Path
		require.Equal(t, "Bearer tcdmx-secret", r.Header.Get("Authorization"))

		_, _ = w.Write([]byte(`{
			"code": 0,
			"message": "success",
			"data": [
				{
					"id": 9,
					"group_id": 7,
					"status": "active",
					"daily_usage_usd": 1.5,
					"weekly_usage_usd": 3.5,
					"monthly_usage_usd": 12.25,
					"expires_at": "2026-07-08T00:00:00Z",
					"group": {
						"id": 7,
						"name": "Claude Pro",
						"daily_limit_usd": 10,
						"weekly_limit_usd": 40,
						"monthly_limit_usd": 100
					}
				}
			]
		}`))
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyTCDMXSubscriptionEnabled:    "true",
		SettingKeyTCDMXSubscriptionAPIBaseURL: server.URL,
		SettingKeyTCDMXSubscriptionAPIToken:   "tcdmx-secret",
	}}
	svc := NewTCDMXSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, "/api/v1/subscriptions/active", requestedPath)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "tcdmx", got.Provider)
	require.Equal(t, server.URL+"/subscriptions", got.SiteURL)
	require.Equal(t, 1, got.ActiveCount)
	require.NotNil(t, got.TotalLimitUSD)
	require.InDelta(t, 100, *got.TotalLimitUSD, 0.0001)
	require.InDelta(t, 12.25, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 87.75, *got.RemainingUSD, 0.0001)
	require.NotNil(t, got.ExpiresAt)
	require.Equal(t, "2026-07-08T00:00:00Z", got.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"))
	require.Len(t, got.Subscriptions, 1)
	require.Equal(t, "Claude Pro", got.Subscriptions[0].GroupName)
	require.Equal(t, "monthly", got.Subscriptions[0].Window)
}

func TestTCDMXSubscriptionService_GetStatusAcceptsStringSuccessCode(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "Bearer tcdmx-secret", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(`{
			"code": "0",
			"message": "success",
			"data": []
		}`))
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyTCDMXSubscriptionEnabled:    "true",
		SettingKeyTCDMXSubscriptionAPIBaseURL: server.URL,
		SettingKeyTCDMXSubscriptionAPIToken:   "tcdmx-secret",
	}}
	svc := NewTCDMXSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, 0, got.ActiveCount)
	require.Empty(t, got.Subscriptions)
}

func TestTCDMXSubscriptionService_GetStatusSkipsUpstreamWhenDisabled(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		http.Error(w, "unexpected", http.StatusInternalServerError)
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyTCDMXSubscriptionEnabled:    "false",
		SettingKeyTCDMXSubscriptionAPIBaseURL: server.URL,
		SettingKeyTCDMXSubscriptionAPIToken:   "tcdmx-secret",
	}}
	svc := NewTCDMXSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.False(t, got.Enabled)
	require.True(t, got.Configured)
	require.False(t, called)
}
