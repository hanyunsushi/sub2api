package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestLiustSubscriptionService_GetStatusReadsNewAPIConsoleSubscriptionQuota(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		if r.URL.Path != "/api/status" {
			require.Equal(t, "Bearer liust-secret", r.Header.Get("Authorization"))
		}
		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/api/status":
			_, _ = w.Write([]byte(`{
				"success": true,
				"message": "",
				"data": {
					"quota_display_type": "CNY",
					"quota_per_unit": 500000,
					"usd_exchange_rate": 1
				}
			}`))
		case "/api/user/self":
			_, _ = w.Write([]byte(`{
				"success": true,
				"message": "",
				"data": {
					"id": 808,
					"quota": 0,
					"used_quota": 1500000,
					"request_count": 23
				}
			}`))
		case "/api/subscription/self":
			_, _ = w.Write([]byte(`{
				"success": true,
				"message": "",
				"data": {
					"billing_preference": "subscription_first",
					"subscriptions": [
						{
							"subscription": {
								"id": 25,
								"plan_id": 18,
								"status": "active",
								"start_time": 1780171016,
								"end_time": 1811707016,
								"amount_total": 35000000,
								"amount_used": 1500000
							},
							"plan": {
								"id": 18,
								"title": "liust Pro"
							}
						}
					],
					"all_subscriptions": []
				}
			}`))
		default:
			http.NotFound(w, r)
		}
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

	require.Equal(t, []string{"/api/status", "/api/user/self", "/api/subscription/self"}, requestedPaths)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "liust", got.Provider)
	require.Equal(t, server.URL, got.SiteURL)
	require.Equal(t, "CNY", got.Currency)
	require.Equal(t, 1, got.ActiveCount)
	require.NotNil(t, got.TotalLimitUSD)
	require.InDelta(t, 70, *got.TotalLimitUSD, 0.0001)
	require.InDelta(t, 3, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 67, *got.RemainingUSD, 0.0001)
	require.NotNil(t, got.ExpiresAt)
	require.Equal(t, time.Unix(1811707016, 0).UTC(), got.ExpiresAt.UTC())
	require.Len(t, got.Subscriptions, 1)
	require.Equal(t, "liust Pro", got.Subscriptions[0].GroupName)
	require.Equal(t, "subscription", got.Subscriptions[0].Window)
}

func TestLiustSubscriptionService_GetStatusNormalizesCopiedUserToken(t *testing.T) {
	var authHeaders []string
	var userHeaders []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/status" {
			authHeaders = append(authHeaders, r.Header.Get("Authorization"))
			userHeaders = append(userHeaders, r.Header.Get("New-API-User"))
		}
		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/api/status":
			_, _ = w.Write([]byte(`{"success": true, "message": "", "data": {"quota_display_type": "CNY", "quota_per_unit": 500000}}`))
		case "/api/user/self":
			_, _ = w.Write([]byte(`{"success": true, "message": "", "data": {"quota": 500000, "used_quota": 0}}`))
		case "/api/subscription/self":
			_, _ = w.Write([]byte(`{"success": true, "message": "", "data": {"subscriptions": [], "all_subscriptions": []}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyLiustSubscriptionEnabled:    "true",
		SettingKeyLiustSubscriptionAPIBaseURL: server.URL,
		SettingKeyLiustSubscriptionAPIToken:   `{"success":true,"data":{"token":"Bearer liust-secret","id":808}}`,
	}}
	svc := NewLiustSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.True(t, got.Configured)
	require.Equal(t, []string{"Bearer liust-secret", "Bearer liust-secret"}, authHeaders)
	require.Equal(t, []string{"808", "808"}, userHeaders)
}

func TestLiustSubscriptionService_GetStatusUsesConfiguredUserIDWithBareToken(t *testing.T) {
	var authHeaders []string
	var userHeaders []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/status" {
			authHeaders = append(authHeaders, r.Header.Get("Authorization"))
			userHeaders = append(userHeaders, r.Header.Get("New-API-User"))
		}
		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/api/status":
			_, _ = w.Write([]byte(`{"success": true, "message": "", "data": {"quota_display_type": "CNY", "quota_per_unit": 500000}}`))
		case "/api/user/self":
			_, _ = w.Write([]byte(`{"success": true, "message": "", "data": {"quota": 500000, "used_quota": 0}}`))
		case "/api/subscription/self":
			_, _ = w.Write([]byte(`{"success": true, "message": "", "data": {"subscriptions": [], "all_subscriptions": []}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyLiustSubscriptionEnabled:    "true",
		SettingKeyLiustSubscriptionAPIBaseURL: server.URL,
		SettingKeyLiustSubscriptionAPIToken:   "fedcba9876543210fedcba9876543210",
		SettingKeyLiustSubscriptionUserID:     "808",
	}}
	svc := NewLiustSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.True(t, got.Configured)
	require.Equal(t, []string{
		"Bearer fedcba9876543210fedcba9876543210",
		"Bearer fedcba9876543210fedcba9876543210",
	}, authHeaders)
	require.Equal(t, []string{"808", "808"}, userHeaders)
}

func TestLiustSubscriptionService_GetStatusUsesNewAPIUnauthorizedEnvelope(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/api/status":
			_, _ = w.Write([]byte(`{"success": true, "message": "", "data": {"quota_display_type": "CNY", "quota_per_unit": 500000}}`))
		case "/api/user/self":
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"success": false, "message": "Unauthorized, not logged in and no access token provided"}`))
		default:
			http.NotFound(w, r)
		}
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

	require.Equal(t, "401", got.ErrorCode)
	require.Equal(t, "Unauthorized, not logged in and no access token provided", got.ErrorMessage)
	require.Equal(t, 0, got.ActiveCount)
}

func TestLiustSubscriptionService_GetStatusFallsBackToUserQuotaWhenNoActiveSubscription(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/api/status":
			_, _ = w.Write([]byte(`{
				"success": true,
				"message": "",
				"data": {
					"quota_display_type": "CNY",
					"quota_per_unit": 500000,
					"usd_exchange_rate": 1
				}
			}`))
		case "/api/user/self":
			_, _ = w.Write([]byte(`{
				"success": true,
				"message": "",
				"data": {
					"quota": 4000000,
					"used_quota": 500000
				}
			}`))
		case "/api/subscription/self":
			_, _ = w.Write([]byte(`{
				"success": true,
				"message": "",
				"data": {
					"subscriptions": [],
					"all_subscriptions": []
				}
			}`))
		default:
			http.NotFound(w, r)
		}
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

	require.Equal(t, 0, got.ActiveCount)
	require.InDelta(t, 1, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 8, *got.RemainingUSD, 0.0001)
	require.Nil(t, got.TotalLimitUSD)
	require.Nil(t, got.ExpiresAt)
	require.Equal(t, "CNY", got.Currency)
	require.Empty(t, got.ErrorCode)
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
