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
	require.Equal(t, server.URL, got.SiteURL)
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

func TestTCDMXSubscriptionService_GetStatusReturnsInvalidTokenState(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "Bearer expired-token", r.Header.Get("Authorization"))
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{
			"code": "INVALID_TOKEN",
			"message": "Invalid token"
		}`))
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyTCDMXSubscriptionEnabled:    "true",
		SettingKeyTCDMXSubscriptionAPIBaseURL: server.URL,
		SettingKeyTCDMXSubscriptionAPIToken:   "expired-token",
	}}
	svc := NewTCDMXSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "INVALID_TOKEN", got.ErrorCode)
	require.Equal(t, "Invalid token", got.ErrorMessage)
	require.Equal(t, 0, got.ActiveCount)
	require.Empty(t, got.Subscriptions)
}

func TestTCDMXSubscriptionService_GetStatusRefreshesExpiredAccessToken(t *testing.T) {
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
				_, _ = w.Write([]byte(`{
					"code": "INVALID_TOKEN",
					"message": "Invalid token"
				}`))
				return
			}
			require.Equal(t, "Bearer fresh-access-token", r.Header.Get("Authorization"))
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": [
					{
						"id": 11,
						"group_id": 8,
						"status": "active",
						"daily_usage_usd": 2,
						"weekly_usage_usd": 8,
						"monthly_usage_usd": 18,
						"group": {
							"name": "Refreshed",
							"daily_limit_usd": 30
						}
					}
				]
			}`))
		case "/api/v1/auth/refresh":
			var payload map[string]string
			require.NoError(t, json.NewDecoder(r.Body).Decode(&payload))
			require.Equal(t, "saved-refresh-token", payload["refresh_token"])
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": {
					"access_token": "fresh-access-token",
					"refresh_token": "fresh-refresh-token",
					"expires_in": 3600
				}
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyTCDMXSubscriptionEnabled:      "true",
		SettingKeyTCDMXSubscriptionAPIBaseURL:   server.URL,
		SettingKeyTCDMXSubscriptionAPIToken:     "expired-access-token",
		SettingKeyTCDMXSubscriptionRefreshToken: "saved-refresh-token",
	}}
	svc := NewTCDMXSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, []string{
		"/api/v1/subscriptions/active",
		"/api/v1/auth/refresh",
		"/api/v1/subscriptions/active",
	}, requestedPaths)
	require.Equal(t, []string{
		"Bearer expired-access-token",
		"Bearer fresh-access-token",
	}, activeAuthorization)
	require.Empty(t, got.ErrorCode)
	require.Equal(t, 1, got.ActiveCount)
	require.NotNil(t, got.TotalLimitUSD)
	require.InDelta(t, 30, *got.TotalLimitUSD, 0.0001)
	require.Equal(t, "fresh-access-token", repo.values[SettingKeyTCDMXSubscriptionAPIToken])
	require.Equal(t, "fresh-refresh-token", repo.values[SettingKeyTCDMXSubscriptionRefreshToken])
}

func TestTCDMXSubscriptionService_GetStatusPreservesRefreshTokenWhenRefreshResponseOmitsIt(t *testing.T) {
	var refreshCalled bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/api/v1/subscriptions/active":
			if !refreshCalled {
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(`{"code":"INVALID_TOKEN","message":"Invalid token"}`))
				return
			}
			require.Equal(t, "Bearer replacement-access-token", r.Header.Get("Authorization"))
			_, _ = w.Write([]byte(`{"code":0,"message":"success","data":[]}`))
		case "/api/v1/auth/refresh":
			refreshCalled = true
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": {
					"access_token": "replacement-access-token",
					"expires_in": 3600
				}
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyTCDMXSubscriptionEnabled:      "true",
		SettingKeyTCDMXSubscriptionAPIBaseURL:   server.URL,
		SettingKeyTCDMXSubscriptionAPIToken:     "expired-access-token",
		SettingKeyTCDMXSubscriptionRefreshToken: "keep-this-refresh-token",
	}}
	svc := NewTCDMXSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.True(t, refreshCalled)
	require.Equal(t, 0, got.ActiveCount)
	require.Equal(t, "replacement-access-token", repo.values[SettingKeyTCDMXSubscriptionAPIToken])
	require.Equal(t, "keep-this-refresh-token", repo.values[SettingKeyTCDMXSubscriptionRefreshToken])
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
