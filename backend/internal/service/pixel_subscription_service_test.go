package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestPixelSubscriptionService_GetActiveSubscriptionsStatusUsesExternalSubscriptionsEndpoint(t *testing.T) {
	var requestedPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath = r.URL.Path
		require.Equal(t, "Bearer pixel-subscription-token", r.Header.Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"code": 0,
			"message": "success",
			"data": [
				{
					"id": 26,
					"group_id": 12,
					"status": "active",
					"daily_usage_usd": 1.25,
					"weekly_usage_usd": 5,
					"monthly_usage_usd": 18.5,
					"expires_at": "2026-10-11T00:00:00Z",
					"group": {
						"id": 12,
						"name": "Pixel Pro",
						"daily_limit_usd": 20,
						"weekly_limit_usd": 80,
						"monthly_limit_usd": 120
					}
				}
			]
		}`))
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyPixelSubscriptionEnabled:    "true",
		SettingKeyPixelSubscriptionAPIBaseURL: server.URL,
		SettingKeyPixelSubscriptionAPIToken:   "pixel-subscription-token",
	}}
	svc := NewPixelSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.ExternalSubscriptionService.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, "/api/v1/subscriptions/active", requestedPath)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "pixel", got.Provider)
	require.Equal(t, "USD", got.Currency)
	require.Equal(t, server.URL, got.SiteURL)
	require.Equal(t, 1, got.ActiveCount)
	require.NotNil(t, got.TotalLimitUSD)
	require.InDelta(t, 120, *got.TotalLimitUSD, 0.0001)
	require.InDelta(t, 18.5, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 101.5, *got.RemainingUSD, 0.0001)
	require.NotNil(t, got.ExpiresAt)
	require.Equal(t, "2026-10-11T00:00:00Z", got.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"))
	require.Len(t, got.Subscriptions, 1)
	require.Equal(t, "Pixel Pro", got.Subscriptions[0].GroupName)
	require.Equal(t, "monthly", got.Subscriptions[0].Window)
}

func TestPixelSubscriptionService_GetStatusUsesWalletBalanceInsteadOfActiveSubscriptionCount(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		require.Equal(t, "Bearer pixel-subscription-token", r.Header.Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/api/v1/auth/me":
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": {
					"id": 88,
					"balance": 9.82210284,
					"points_balance": 0,
					"total_recharged": 10
				}
			}`))
		case "/api/v1/subscriptions/active":
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": [
					{"id":1,"group_id":1,"status":"active","group":{"name":"A"}},
					{"id":2,"group_id":2,"status":"active","group":{"name":"B"}},
					{"id":3,"group_id":3,"status":"active","group":{"name":"C"}},
					{"id":4,"group_id":4,"status":"active","group":{"name":"D"}}
				]
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyPixelSubscriptionEnabled:    "true",
		SettingKeyPixelSubscriptionAPIBaseURL: server.URL,
		SettingKeyPixelSubscriptionAPIToken:   "pixel-subscription-token",
	}}
	svc := NewPixelSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, []string{"/api/v1/auth/me"}, requestedPaths)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "pixel", got.Provider)
	require.Equal(t, "USD", got.Currency)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 9.82210284, *got.RemainingUSD, 0.00000001)
	require.Nil(t, got.TotalLimitUSD)
	require.Equal(t, 0, got.ActiveCount)
	require.Empty(t, got.Subscriptions)
}

func TestPixelSubscriptionService_GetStatusReturnsInvalidTokenState(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/auth/me", r.URL.Path)
		require.Equal(t, "Bearer invalid-pixel-token", r.Header.Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"code":"INVALID_TOKEN","message":"Invalid token"}`))
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyPixelSubscriptionEnabled:    "true",
		SettingKeyPixelSubscriptionAPIBaseURL: server.URL,
		SettingKeyPixelSubscriptionAPIToken:   "invalid-pixel-token",
	}}
	svc := NewPixelSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "INVALID_TOKEN", got.ErrorCode)
	require.Equal(t, "Invalid token", got.ErrorMessage)
	require.Equal(t, 0, got.ActiveCount)
	require.Empty(t, got.Subscriptions)
}

func TestPixelSubscriptionService_GetStatusRefreshesExpiredAuthMeToken(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/api/v1/auth/me":
			if len(requestedPaths) == 1 {
				require.Equal(t, "Bearer expired-pixel-token", r.Header.Get("Authorization"))
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(`{"code":"TOKEN_EXPIRED","message":"Token expired"}`))
				return
			}
			require.Equal(t, "Bearer fresh-pixel-token", r.Header.Get("Authorization"))
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": {
					"balance": 12.5,
					"points_balance": 0,
					"total_recharged": 20
				}
			}`))
		case "/api/v1/auth/refresh":
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": {
					"access_token": "fresh-pixel-token",
					"refresh_token": "fresh-pixel-refresh"
				}
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyPixelSubscriptionEnabled:      "true",
		SettingKeyPixelSubscriptionAPIBaseURL:   server.URL,
		SettingKeyPixelSubscriptionAPIToken:     "expired-pixel-token",
		SettingKeyPixelSubscriptionRefreshToken: "old-pixel-refresh",
	}}
	svc := NewPixelSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, []string{"/api/v1/auth/me", "/api/v1/auth/refresh", "/api/v1/auth/me"}, requestedPaths)
	require.Empty(t, got.ErrorCode)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 12.5, *got.RemainingUSD, 0.0001)
	require.Equal(t, "fresh-pixel-token", repo.values[SettingKeyPixelSubscriptionAPIToken])
	require.Equal(t, "fresh-pixel-refresh", repo.values[SettingKeyPixelSubscriptionRefreshToken])
}

func TestPixelSubscriptionService_GetStatusSkipsUpstreamWhenDisabled(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		http.Error(w, "unexpected", http.StatusInternalServerError)
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyPixelSubscriptionEnabled:    "false",
		SettingKeyPixelSubscriptionAPIBaseURL: server.URL,
		SettingKeyPixelSubscriptionAPIToken:   "pixel-secret",
	}}
	svc := NewPixelSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.False(t, got.Enabled)
	require.True(t, got.Configured)
	require.False(t, called)
}
