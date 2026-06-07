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

func TestXHYAPISubscriptionService_GetStatusUsesExternalSubscriptionsEndpoint(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		require.Equal(t, "Bearer xhy-subscription-token", r.Header.Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/api/v1/subscriptions/active":
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": [
					{
						"id": 19,
						"group_id": 17,
						"status": "active",
						"daily_usage_usd": 2.25,
						"weekly_usage_usd": 4.5,
						"monthly_usage_usd": 13.5,
						"expires_at": "2026-08-09T00:00:00Z",
						"group": {
							"id": 17,
							"name": "XHYAPI Pro",
							"daily_limit_usd": 20,
							"weekly_limit_usd": 60,
							"monthly_limit_usd": 80
						}
					}
				]
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyXHYAPISubscriptionEnabled:    "true",
		SettingKeyXHYAPISubscriptionAPIBaseURL: server.URL,
		SettingKeyXHYAPISubscriptionAPIToken:   "xhy-subscription-token",
	}}
	svc := NewXHYAPISubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, []string{"/api/v1/subscriptions/active"}, requestedPaths)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "xhyapi", got.Provider)
	require.Equal(t, "USD", got.Currency)
	require.Equal(t, server.URL, got.SiteURL)
	require.Equal(t, 1, got.ActiveCount)
	require.NotNil(t, got.TotalLimitUSD)
	require.InDelta(t, 80, *got.TotalLimitUSD, 0.0001)
	require.InDelta(t, 13.5, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 66.5, *got.RemainingUSD, 0.0001)
	require.NotNil(t, got.ExpiresAt)
	require.Equal(t, "2026-08-09T00:00:00Z", got.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"))
	require.Len(t, got.Subscriptions, 1)
	require.Equal(t, "XHYAPI Pro", got.Subscriptions[0].GroupName)
	require.Equal(t, "monthly", got.Subscriptions[0].Window)
}

func TestXHYAPISubscriptionService_GetStatusRefreshesExpiredSubscriptionToken(t *testing.T) {
	var requestedPaths []string
	var activeAuthorization []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/api/v1/subscriptions/active":
			activeAuthorization = append(activeAuthorization, r.Header.Get("Authorization"))
			if len(activeAuthorization) == 1 {
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(`{"code":"INVALID_TOKEN","message":"Invalid token"}`))
				return
			}
			require.Equal(t, "Bearer fresh-xhy-token", r.Header.Get("Authorization"))
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": [
					{
						"id": 20,
						"group_id": 18,
						"status": "active",
						"monthly_usage_usd": 1,
						"group": {
							"name": "XHY refreshed",
							"monthly_limit_usd": 10
						}
					}
				]
			}`))
		case "/api/v1/auth/refresh":
			var payload map[string]string
			require.NoError(t, json.NewDecoder(r.Body).Decode(&payload))
			require.Equal(t, "xhy-refresh-token", payload["refresh_token"])
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": {
					"access_token": "fresh-xhy-token",
					"refresh_token": "fresh-xhy-refresh",
					"expires_in": 3600
				}
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyXHYAPISubscriptionEnabled:      "true",
		SettingKeyXHYAPISubscriptionAPIBaseURL:   server.URL,
		SettingKeyXHYAPISubscriptionAPIToken:     "expired-xhy-token",
		SettingKeyXHYAPISubscriptionRefreshToken: "xhy-refresh-token",
	}}
	svc := NewXHYAPISubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, []string{
		"/api/v1/subscriptions/active",
		"/api/v1/auth/refresh",
		"/api/v1/subscriptions/active",
	}, requestedPaths)
	require.Equal(t, []string{
		"Bearer expired-xhy-token",
		"Bearer fresh-xhy-token",
	}, activeAuthorization)
	require.Empty(t, got.ErrorCode)
	require.Equal(t, 1, got.ActiveCount)
	require.Equal(t, "fresh-xhy-token", repo.values[SettingKeyXHYAPISubscriptionAPIToken])
	require.Equal(t, "fresh-xhy-refresh", repo.values[SettingKeyXHYAPISubscriptionRefreshToken])
}

func TestXHYAPISubscriptionService_GetStatusSkipsUpstreamWhenDisabled(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		http.Error(w, "unexpected", http.StatusInternalServerError)
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyXHYAPISubscriptionEnabled:    "false",
		SettingKeyXHYAPISubscriptionAPIBaseURL: server.URL,
		SettingKeyXHYAPISubscriptionAPIToken:   "xhy-secret",
	}}
	svc := NewXHYAPISubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.False(t, got.Enabled)
	require.True(t, got.Configured)
	require.False(t, called)
}
