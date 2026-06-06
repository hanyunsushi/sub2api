package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestLiustSubscriptionService_GetStatusAggregatesActiveSubscriptions(t *testing.T) {
	var requestedPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath = r.URL.Path
		require.Equal(t, "Bearer liust-secret", r.Header.Get("Authorization"))

		_, _ = w.Write([]byte(`{
			"code": 0,
			"message": "success",
			"data": [
				{
					"id": 25,
					"group_id": 18,
					"status": "active",
					"daily_usage_usd": 1.5,
					"weekly_usage_usd": 6.5,
					"monthly_usage_usd": 14.25,
					"expires_at": "2026-09-10T00:00:00Z",
					"group": {
						"id": 18,
						"name": "liust Pro",
						"daily_limit_usd": 10,
						"weekly_limit_usd": 40,
						"monthly_limit_usd": 90
					}
				}
			]
		}`))
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyLiustSubscriptionEnabled:    "true",
		SettingKeyLiustSubscriptionAPIBaseURL: server.URL,
		SettingKeyLiustSubscriptionAPIToken:   "liust-secret",
	}}
	svc := NewLiustSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, "/api/v1/subscriptions/active", requestedPath)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "liust", got.Provider)
	require.Equal(t, server.URL, got.SiteURL)
	require.Equal(t, 1, got.ActiveCount)
	require.NotNil(t, got.TotalLimitUSD)
	require.InDelta(t, 90, *got.TotalLimitUSD, 0.0001)
	require.InDelta(t, 14.25, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 75.75, *got.RemainingUSD, 0.0001)
	require.NotNil(t, got.ExpiresAt)
	require.Equal(t, "2026-09-10T00:00:00Z", got.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"))
	require.Len(t, got.Subscriptions, 1)
	require.Equal(t, "liust Pro", got.Subscriptions[0].GroupName)
	require.Equal(t, "monthly", got.Subscriptions[0].Window)
}

func TestLiustSubscriptionService_GetStatusSkipsUpstreamWhenDisabled(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		http.Error(w, "unexpected", http.StatusInternalServerError)
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyLiustSubscriptionEnabled:    "false",
		SettingKeyLiustSubscriptionAPIBaseURL: server.URL,
		SettingKeyLiustSubscriptionAPIToken:   "liust-secret",
	}}
	svc := NewLiustSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.False(t, got.Enabled)
	require.True(t, got.Configured)
	require.False(t, called)
	require.Equal(t, "https://liust.xyz", normalizeLiustSubscriptionAPIBaseURL(""))
}
