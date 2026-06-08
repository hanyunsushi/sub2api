package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestPackyCodeSubscriptionService_GetStatusReadsNewAPIConsoleUserQuota(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		if r.URL.Path != "/api/status" {
			require.Equal(t, "Bearer packy-secret", r.Header.Get("Authorization"))
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
					"id": 996,
					"quota": 0,
					"used_quota": 2000000,
					"request_count": 9
				}
			}`))
		case "/api/subscription/self":
			require.Fail(t, "PackyCode default status should use user quota instead of subscription quota")
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyPackyCodeSubscriptionEnabled:    "true",
		SettingKeyPackyCodeSubscriptionAPIBaseURL: server.URL,
		SettingKeyPackyCodeSubscriptionAPIToken:   "packy-secret",
	}}
	svc := NewPackyCodeSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, []string{"/api/status", "/api/user/self"}, requestedPaths)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Equal(t, "packycode", got.Provider)
	require.Equal(t, server.URL, got.SiteURL)
	require.Equal(t, "CNY", got.Currency)
	require.Equal(t, 0, got.ActiveCount)
	require.Nil(t, got.TotalLimitUSD)
	require.InDelta(t, 4, got.UsedUSD, 0.0001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 0, *got.RemainingUSD, 0.0001)
	require.Nil(t, got.ExpiresAt)
	require.Empty(t, got.Subscriptions)
}

func TestPackyCodeSubscriptionService_GetStatusUsesUserQuotaWhenSubscriptionEndpointMissing(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		if r.URL.Path != "/api/status" {
			require.Equal(t, "Bearer packy-secret", r.Header.Get("Authorization"))
			require.Equal(t, "138044", r.Header.Get("New-API-User"))
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
					"id": 138044,
					"quota": 413219,
					"used_quota": 86781,
					"request_count": 12
				}
			}`))
		case "/api/subscription/self":
			require.Fail(t, "PackyCode should use user quota by default instead of querying the missing subscription endpoint")
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyPackyCodeSubscriptionEnabled:    "true",
		SettingKeyPackyCodeSubscriptionAPIBaseURL: server.URL,
		SettingKeyPackyCodeSubscriptionAPIToken:   "packy-secret",
		SettingKeyPackyCodeSubscriptionUserID:     "138044",
	}}
	svc := NewPackyCodeSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, []string{"/api/status", "/api/user/self"}, requestedPaths)
	require.True(t, got.Enabled)
	require.True(t, got.Configured)
	require.Empty(t, got.ErrorCode)
	require.Equal(t, "packycode", got.Provider)
	require.Equal(t, "CNY", got.Currency)
	require.Equal(t, 0, got.ActiveCount)
	require.Nil(t, got.TotalLimitUSD)
	require.InDelta(t, 0.173562, got.UsedUSD, 0.000001)
	require.NotNil(t, got.RemainingUSD)
	require.InDelta(t, 0.826438, *got.RemainingUSD, 0.000001)
	require.Empty(t, got.Subscriptions)
}

func TestPackyCodeSubscriptionService_GetStatusNormalizesCopiedUserToken(t *testing.T) {
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
		SettingKeyPackyCodeSubscriptionEnabled:    "true",
		SettingKeyPackyCodeSubscriptionAPIBaseURL: server.URL,
		SettingKeyPackyCodeSubscriptionAPIToken:   `{"success":true,"data":{"token":"Bearer packy-secret","id":996}}`,
	}}
	svc := NewPackyCodeSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.True(t, got.Configured)
	require.Equal(t, []string{"Bearer packy-secret"}, authHeaders)
	require.Equal(t, []string{"996"}, userHeaders)
}

func TestPackyCodeSubscriptionService_GetStatusUsesConfiguredUserIDWithBareToken(t *testing.T) {
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
		SettingKeyPackyCodeSubscriptionEnabled:    "true",
		SettingKeyPackyCodeSubscriptionAPIBaseURL: server.URL,
		SettingKeyPackyCodeSubscriptionAPIToken:   "0123456789abcdef0123456789abcdef",
		SettingKeyPackyCodeSubscriptionUserID:     "996",
	}}
	svc := NewPackyCodeSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.True(t, got.Configured)
	require.Equal(t, []string{"Bearer 0123456789abcdef0123456789abcdef"}, authHeaders)
	require.Equal(t, []string{"996"}, userHeaders)
}

func TestPackyCodeSubscriptionService_GetStatusUsesNewAPIUnauthorizedEnvelope(t *testing.T) {
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
		SettingKeyPackyCodeSubscriptionEnabled:    "true",
		SettingKeyPackyCodeSubscriptionAPIBaseURL: server.URL,
		SettingKeyPackyCodeSubscriptionAPIToken:   "packy-secret",
	}}
	svc := NewPackyCodeSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.Equal(t, "401", got.ErrorCode)
	require.Equal(t, "Unauthorized, not logged in and no access token provided", got.ErrorMessage)
	require.Equal(t, 0, got.ActiveCount)
}

func TestPackyCodeSubscriptionService_GetStatusSkipsUpstreamWhenDisabled(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		http.Error(w, "unexpected", http.StatusInternalServerError)
	}))
	defer server.Close()

	repo := &buzzBalanceSettingsRepoStub{values: map[string]string{
		SettingKeyPackyCodeSubscriptionEnabled:    "false",
		SettingKeyPackyCodeSubscriptionAPIBaseURL: server.URL,
		SettingKeyPackyCodeSubscriptionAPIToken:   "packy-secret",
	}}
	svc := NewPackyCodeSubscriptionService(NewSettingService(repo, &config.Config{}))

	got, err := svc.GetStatus(context.Background())
	require.NoError(t, err)

	require.False(t, got.Enabled)
	require.True(t, got.Configured)
	require.False(t, called)
	require.Equal(t, "https://www.packyapi.com", normalizePackyCodeSubscriptionAPIBaseURL(""))
}
