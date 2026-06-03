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

func TestQLHazyCoderSubscriptionService_GetStatusReadsNewAPISubscriptionQuota(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		if r.URL.Path != "/api/status" {
			require.Equal(t, "Bearer qlhazycoder-secret", r.Header.Get("Authorization"))
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
					"id": 707,
					"username": "hanyunsushi",
					"quota": 0,
					"used_quota": 1030000,
					"request_count": 245
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
								"id": 229,
								"plan_id": 30,
								"status": "active",
								"start_time": 1780171016,
								"end_time": 1811707016,
								"amount_total": 15000000,
								"amount_used": 1030000
							},
							"plan": {
								"id": 30,
								"title": "项目支持 30 元计划"
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
		SettingKeyQLHazyCoderSubscriptionEnabled:    "true",
		SettingKeyQLHazyCoderSubscriptionAPIBaseURL: server.URL,
		SettingKeyQLHazyCoderSubscriptionAPIToken:   "qlhazycoder-secret",
	}}
	svc := NewQLHazyCoderSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, []string{"/api/status", "/api/user/self", "/api/subscription/self"}, requestedPaths)
	require.Equal(t, "qlhazycoder", got.Provider)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, server.URL, got.SiteURL)
	require.Equal(t, "CNY", got.Currency)
	require.Equal(t, 1, got.ActiveCount)
	require.InDelta(t, 30, *got.TotalLimitUSD, 0.0001)
	require.InDelta(t, 2.06, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 27.94, *got.RemainingUSD, 0.0001)
	require.NotNil(t, got.ExpiresAt)
	require.Equal(t, time.Unix(1811707016, 0).UTC(), got.ExpiresAt.UTC())
	require.Len(t, got.Subscriptions, 1)
	require.Equal(t, int64(229), got.Subscriptions[0].ID)
	require.Equal(t, int64(30), got.Subscriptions[0].GroupID)
	require.Equal(t, "项目支持 30 元计划", got.Subscriptions[0].GroupName)
	require.Equal(t, "active", got.Subscriptions[0].Status)
	require.Equal(t, "subscription", got.Subscriptions[0].Window)
	require.InDelta(t, 30, *got.Subscriptions[0].LimitUSD, 0.0001)
	require.InDelta(t, 2.06, got.Subscriptions[0].UsedUSD, 0.0001)
	require.InDelta(t, 27.94, *got.Subscriptions[0].RemainingUSD, 0.0001)
}

func TestQLHazyCoderSubscriptionService_GetStatusNormalizesCopiedUserToken(t *testing.T) {
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
		SettingKeyQLHazyCoderSubscriptionEnabled:    "true",
		SettingKeyQLHazyCoderSubscriptionAPIBaseURL: server.URL,
		SettingKeyQLHazyCoderSubscriptionAPIToken:   `{"success":true,"data":{"token":"Bearer qlhazycoder-secret","id":707}}`,
	}}
	svc := NewQLHazyCoderSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.True(t, got.Configured)
	require.Equal(t, []string{"Bearer qlhazycoder-secret", "Bearer qlhazycoder-secret"}, authHeaders)
	require.Equal(t, []string{"707", "707"}, userHeaders)
}

func TestQLHazyCoderSubscriptionService_GetStatusFallsBackToUserQuotaWhenNoActiveSubscription(t *testing.T) {
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
					"quota": 2500000,
					"used_quota": 750000
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
		SettingKeyQLHazyCoderSubscriptionEnabled:    "true",
		SettingKeyQLHazyCoderSubscriptionAPIBaseURL: server.URL,
		SettingKeyQLHazyCoderSubscriptionAPIToken:   "qlhazycoder-secret",
	}}
	svc := NewQLHazyCoderSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, 0, got.ActiveCount)
	require.InDelta(t, 1.5, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 5, *got.RemainingUSD, 0.0001)
	require.Nil(t, got.TotalLimitUSD)
	require.Nil(t, got.ExpiresAt)
	require.Equal(t, "CNY", got.Currency)
	require.Empty(t, got.ErrorCode)
}

func TestQLHazyCoderSubscriptionService_GetStatusUsesNewAPIUnauthorizedEnvelope(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path != "/api/status" && r.URL.Path != "/api/user/self" {
			http.NotFound(w, r)
			return
		}
		if r.URL.Path == "/api/status" {
			_, _ = w.Write([]byte(`{"success": true, "message": "", "data": {"quota_display_type": "CNY", "quota_per_unit": 500000}}`))
			return
		}
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"success": false, "message": "Unauthorized, not logged in and no access token provided"}`))
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

	require.Equal(t, "401", got.ErrorCode)
	require.Equal(t, "Unauthorized, not logged in and no access token provided", got.ErrorMessage)
	require.Equal(t, 0, got.ActiveCount)
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
