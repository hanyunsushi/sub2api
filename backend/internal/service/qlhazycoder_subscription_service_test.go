package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestQLHazyCoderSubscriptionService_GetStatusAggregatesActiveSubscriptions(t *testing.T) {
	var requestedPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath = r.URL.Path
		require.Equal(t, "Bearer qlhazycoder-secret", r.Header.Get("Authorization"))

		_, _ = w.Write([]byte(`{
			"code": 0,
			"message": "success",
			"data": [
				{
					"id": 21,
					"group_id": 3,
					"status": "active",
					"daily_usage_usd": 0.75,
					"weekly_usage_usd": 5,
					"monthly_usage_usd": 22.5,
					"expires_at": "2026-08-09T00:00:00Z",
					"group": {
						"name": "QL Pro",
						"monthly_limit_usd": 120
					}
				}
			]
		}`))
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyQLHazyCoderSubscriptionEnabled:    "true",
		SettingKeyQLHazyCoderSubscriptionAPIBaseURL: server.URL,
		SettingKeyQLHazyCoderSubscriptionAPIToken:   "qlhazycoder-secret",
	}}
	svc := NewQLHazyCoderSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, "/api/v1/subscriptions/active", requestedPath)
	require.Equal(t, "qlhazycoder", got.Provider)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, server.URL, got.SiteURL)
	require.Equal(t, 1, got.ActiveCount)
	require.NotNil(t, got.TotalLimitUSD)
	require.InDelta(t, 120, *got.TotalLimitUSD, 0.0001)
	require.InDelta(t, 22.5, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 97.5, *got.RemainingUSD, 0.0001)
	require.NotNil(t, got.ExpiresAt)
	require.Equal(t, "2026-08-09T00:00:00Z", got.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"))
	require.Len(t, got.Subscriptions, 1)
	require.Equal(t, "QL Pro", got.Subscriptions[0].GroupName)
}

func TestQLHazyCoderSubscriptionService_GetStatusRefreshesExpiredAccessToken(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/api/v1/subscriptions/active":
			if len(requestedPaths) == 1 {
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(`{"code":"TOKEN_EXPIRED","message":"Token expired"}`))
				return
			}
			require.Equal(t, "Bearer fresh-ql-access", r.Header.Get("Authorization"))
			_, _ = w.Write([]byte(`{"code":0,"message":"success","data":[]}`))
		case "/api/v1/auth/refresh":
			var payload map[string]string
			require.NoError(t, json.NewDecoder(r.Body).Decode(&payload))
			require.Equal(t, "saved-ql-refresh", payload["refresh_token"])
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": {
					"access_token": "fresh-ql-access",
					"refresh_token": "fresh-ql-refresh"
				}
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyQLHazyCoderSubscriptionEnabled:      "true",
		SettingKeyQLHazyCoderSubscriptionAPIBaseURL:   server.URL,
		SettingKeyQLHazyCoderSubscriptionAPIToken:     "expired-ql-access",
		SettingKeyQLHazyCoderSubscriptionRefreshToken: "saved-ql-refresh",
	}}
	svc := NewQLHazyCoderSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, []string{
		"/api/v1/subscriptions/active",
		"/api/v1/auth/refresh",
		"/api/v1/subscriptions/active",
	}, requestedPaths)
	require.Empty(t, got.ErrorCode)
	require.Equal(t, 0, got.ActiveCount)
	require.Equal(t, "fresh-ql-access", repo.values[SettingKeyQLHazyCoderSubscriptionAPIToken])
	require.Equal(t, "fresh-ql-refresh", repo.values[SettingKeyQLHazyCoderSubscriptionRefreshToken])
}

func TestQLHazyCoderSubscriptionService_GetStatusSkipsUpstreamWhenDisabled(t *testing.T) {
	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyQLHazyCoderSubscriptionEnabled: "false",
	}}
	svc := NewQLHazyCoderSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, "qlhazycoder", got.Provider)
	require.False(t, got.Enabled)
	require.False(t, got.Configured)
	require.Equal(t, DefaultQLHazyCoderSubscriptionAPIBaseURL, got.SiteURL)
}
