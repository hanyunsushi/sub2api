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

func TestExternalSubscriptionConfigServiceListProvidersBuildsLegacyDefaultsAndHidesSecrets(t *testing.T) {
	repo := newExternalSubscriptionConfigRepo(map[string]string{
		SettingKeyTCDMXSubscriptionEnabled:          "true",
		SettingKeyTCDMXSubscriptionAPIBaseURL:       "https://tcdmx.example/api/v1",
		SettingKeyTCDMXSubscriptionAPIToken:         "tcdmx-access-token",
		SettingKeyTCDMXSubscriptionRefreshToken:     "tcdmx-refresh-token",
		SettingKeyQLHazyCoderSubscriptionEnabled:    "true",
		SettingKeyQLHazyCoderSubscriptionAPIBaseURL: "https://api.qlhazycoder.top",
		SettingKeyQLHazyCoderSubscriptionAPIToken:   "qlhazy-token",
		SettingKeyQLHazyCoderSubscriptionUserID:     "707",
		SettingKeyPackyCodeSubscriptionEnabled:      "true",
		SettingKeyPackyCodeSubscriptionAPIToken:     "packy-token",
		SettingKeyPackyCodeSubscriptionUserID:       "996",
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	providers, err := svc.ListProviders(context.Background())
	require.NoError(t, err)

	tcdmx := requireExternalSubscriptionProvider(t, providers, "tcdmx")
	require.Equal(t, "TCDMX", tcdmx.Name)
	require.Equal(t, ExternalSubscriptionTemplateActiveSubscriptions, tcdmx.Template)
	require.Equal(t, "https://tcdmx.example", tcdmx.APIBaseURL)
	require.True(t, tcdmx.Enabled)
	require.True(t, tcdmx.APITokenConfigured)
	require.True(t, tcdmx.RefreshTokenConfigured)
	require.Empty(t, tcdmx.APIToken)
	require.Empty(t, tcdmx.RefreshToken)
	require.Contains(t, tcdmx.MatchKeywords, "tcdmx")

	qlhazy := requireExternalSubscriptionProvider(t, providers, "qlhazycoder")
	require.Equal(t, ExternalSubscriptionTemplateNewAPIConsole, qlhazy.Template)
	require.True(t, qlhazy.APITokenConfigured)
	require.Equal(t, "707", qlhazy.UserID)
	require.Empty(t, qlhazy.APIToken)
	require.Contains(t, qlhazy.MatchKeywords, "qlhazycoder")

	packy := requireExternalSubscriptionProvider(t, providers, "packycode")
	require.Equal(t, ExternalSubscriptionTemplateNewAPIConsole, packy.Template)
	require.True(t, packy.APITokenConfigured)
	require.Equal(t, "996", packy.UserID)
	require.Empty(t, packy.APIToken)
}

func TestExternalSubscriptionConfigServiceUpdateProviderPreservesExistingSecrets(t *testing.T) {
	repo := newExternalSubscriptionConfigRepo(nil)
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	created, err := svc.CreateProvider(context.Background(), ExternalSubscriptionProviderInput{
		ID:            "custom-newapi",
		Name:          "Custom NewAPI",
		Enabled:       true,
		Template:      ExternalSubscriptionTemplateNewAPIConsole,
		APIBaseURL:    "https://newapi.example/api",
		APIToken:      "newapi-token",
		UserID:        "1001",
		MatchKeywords: []string{"newapi.example", "custom-newapi"},
	})
	require.NoError(t, err)
	require.Equal(t, "custom-newapi", created.ID)
	require.True(t, created.APITokenConfigured)
	require.Empty(t, created.APIToken)

	updated, err := svc.UpdateProvider(context.Background(), "custom-newapi", ExternalSubscriptionProviderInput{
		Name:          "Renamed NewAPI",
		Enabled:       true,
		Template:      ExternalSubscriptionTemplateNewAPIConsole,
		APIBaseURL:    "https://renamed.example",
		UserID:        "1002",
		MatchKeywords: []string{"renamed.example"},
	})
	require.NoError(t, err)
	require.Equal(t, "Renamed NewAPI", updated.Name)
	require.True(t, updated.APITokenConfigured)
	require.Empty(t, updated.APIToken)

	var stored []externalSubscriptionStoredProvider
	require.NoError(t, json.Unmarshal([]byte(repo.values[SettingKeyExternalSubscriptionProviders]), &stored))
	raw := requireStoredExternalSubscriptionProvider(t, stored, "custom-newapi")
	require.Equal(t, "newapi-token", raw.APIToken)
	require.Equal(t, "1002", raw.UserID)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsBothTemplates(t *testing.T) {
	activeServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/subscriptions/active", r.URL.Path)
		require.Equal(t, "Bearer active-token", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(`{
			"code": 0,
			"message": "success",
			"data": [
				{
					"id": 7,
					"group_id": 3,
					"status": "active",
					"monthly_usage_usd": 6.5,
					"group": {"name": "Active Pro", "monthly_limit_usd": 20}
				}
			]
		}`))
	}))
	defer activeServer.Close()

	var newAPIUserHeaders []string
	newAPIServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/status" {
			newAPIUserHeaders = append(newAPIUserHeaders, r.Header.Get("New-API-User"))
			require.Equal(t, "Bearer newapi-token", r.Header.Get("Authorization"))
		}
		switch r.URL.Path {
		case "/api/status":
			_, _ = w.Write([]byte(`{"success":true,"message":"","data":{"quota_display_type":"CNY","quota_per_unit":500000}}`))
		case "/api/user/self":
			_, _ = w.Write([]byte(`{"success":true,"message":"","data":{"quota":500000,"used_quota":0}}`))
		case "/api/subscription/self":
			_, _ = w.Write([]byte(`{
				"success": true,
				"message": "",
				"data": {
					"subscriptions": [
						{
							"subscription": {
								"id": 9,
								"plan_id": 2,
								"status": "active",
								"start_time": 1780171016,
								"end_time": 1811707016,
								"amount_total": 15000000,
								"amount_used": 500000
							},
							"plan": {"id": 2, "title": "NewAPI Pro"}
						}
					],
					"all_subscriptions": []
				}
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer newAPIServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "active-provider",
			Name:          "Active Provider",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateActiveSubscriptions,
			APIBaseURL:    activeServer.URL,
			APIToken:      "active-token",
			MatchKeywords: []string{"active.example"},
			SortOrder:     20,
		},
		{
			ID:            "newapi-provider",
			Name:          "NewAPI Provider",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateNewAPIConsole,
			APIBaseURL:    newAPIServer.URL,
			APIToken:      "newapi-token",
			UserID:        "10086",
			MatchKeywords: []string{"newapi.example"},
			SortOrder:     10,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)

	require.Len(t, statuses, 2)
	newAPI := requireExternalSubscriptionStatus(t, statuses, "newapi-provider")
	require.Equal(t, "NewAPI Provider", newAPI.Name)
	require.Equal(t, ExternalSubscriptionTemplateNewAPIConsole, newAPI.Template)
	require.Equal(t, []string{"newapi.example"}, newAPI.MatchKeywords)
	require.InDelta(t, 30, *newAPI.TotalLimitUSD, 0.0001)
	require.InDelta(t, 29, *newAPI.RemainingUSD, 0.0001)
	require.Equal(t, []string{"10086", "10086"}, newAPIUserHeaders)

	active := requireExternalSubscriptionStatus(t, statuses, "active-provider")
	require.Equal(t, "Active Provider", active.Name)
	require.Equal(t, ExternalSubscriptionTemplateActiveSubscriptions, active.Template)
	require.InDelta(t, 13.5, *active.RemainingUSD, 0.0001)
}

func TestExternalSubscriptionConfigServiceGetStatusesPersistsRefreshedActiveTemplateToken(t *testing.T) {
	activeCalls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/subscriptions/active":
			activeCalls++
			if activeCalls == 1 {
				require.Equal(t, "Bearer expired-token", r.Header.Get("Authorization"))
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(`{"code":"INVALID_TOKEN","message":"Invalid token"}`))
				return
			}
			require.Equal(t, "Bearer fresh-token", r.Header.Get("Authorization"))
			_, _ = w.Write([]byte(`{"code":0,"message":"success","data":[]}`))
		case "/api/v1/auth/refresh":
			var payload map[string]string
			require.NoError(t, json.NewDecoder(r.Body).Decode(&payload))
			require.Equal(t, "old-refresh", payload["refresh_token"])
			_, _ = w.Write([]byte(`{
				"code": 0,
				"message": "success",
				"data": {"access_token":"fresh-token","refresh_token":"fresh-refresh"}
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:           "refreshable",
			Name:         "Refreshable",
			Enabled:      true,
			Template:     ExternalSubscriptionTemplateActiveSubscriptions,
			APIBaseURL:   server.URL,
			APIToken:     "expired-token",
			RefreshToken: "old-refresh",
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)
	require.Len(t, statuses, 1)
	require.Equal(t, 0, statuses[0].ActiveCount)

	var stored []externalSubscriptionStoredProvider
	require.NoError(t, json.Unmarshal([]byte(repo.values[SettingKeyExternalSubscriptionProviders]), &stored))
	raw := requireStoredExternalSubscriptionProvider(t, stored, "refreshable")
	require.Equal(t, "fresh-token", raw.APIToken)
	require.Equal(t, "fresh-refresh", raw.RefreshToken)
}

func requireExternalSubscriptionProvider(t *testing.T, providers []ExternalSubscriptionProvider, id string) ExternalSubscriptionProvider {
	t.Helper()
	for _, provider := range providers {
		if provider.ID == id {
			return provider
		}
	}
	require.Failf(t, "provider not found", "id=%s providers=%v", id, providers)
	return ExternalSubscriptionProvider{}
}

func requireExternalSubscriptionStatus(t *testing.T, statuses []ExternalSubscriptionProviderStatus, id string) ExternalSubscriptionProviderStatus {
	t.Helper()
	for _, status := range statuses {
		if status.Provider == id {
			return status
		}
	}
	require.Failf(t, "status not found", "id=%s statuses=%v", id, statuses)
	return ExternalSubscriptionProviderStatus{}
}

func requireStoredExternalSubscriptionProvider(t *testing.T, providers []externalSubscriptionStoredProvider, id string) externalSubscriptionStoredProvider {
	t.Helper()
	for _, provider := range providers {
		if provider.ID == id {
			return provider
		}
	}
	require.Failf(t, "stored provider not found", "id=%s providers=%v", id, providers)
	return externalSubscriptionStoredProvider{}
}

func newExternalSubscriptionConfigRepo(values map[string]string) *externalSubscriptionConfigRepoStub {
	if values == nil {
		values = map[string]string{}
	}
	return &externalSubscriptionConfigRepoStub{values: values}
}

func newExternalSubscriptionConfigRepoWithProviders(providers []externalSubscriptionStoredProvider) *externalSubscriptionConfigRepoStub {
	raw, err := json.Marshal(providers)
	if err != nil {
		panic(err)
	}
	return newExternalSubscriptionConfigRepo(map[string]string{
		SettingKeyExternalSubscriptionProviders: string(raw),
	})
}

type externalSubscriptionConfigRepoStub struct {
	values map[string]string
}

func (s *externalSubscriptionConfigRepoStub) Get(context.Context, string) (*Setting, error) {
	panic("unexpected Get call")
}

func (s *externalSubscriptionConfigRepoStub) GetValue(_ context.Context, key string) (string, error) {
	return s.values[key], nil
}

func (s *externalSubscriptionConfigRepoStub) Set(_ context.Context, key, value string) error {
	if s.values == nil {
		s.values = map[string]string{}
	}
	s.values[key] = value
	return nil
}

func (s *externalSubscriptionConfigRepoStub) GetMultiple(_ context.Context, keys []string) (map[string]string, error) {
	out := make(map[string]string, len(keys))
	for _, key := range keys {
		out[key] = s.values[key]
	}
	return out, nil
}

func (s *externalSubscriptionConfigRepoStub) SetMultiple(_ context.Context, settings map[string]string) error {
	if s.values == nil {
		s.values = map[string]string{}
	}
	for key, value := range settings {
		s.values[key] = value
	}
	return nil
}

func (s *externalSubscriptionConfigRepoStub) GetAll(context.Context) (map[string]string, error) {
	out := make(map[string]string, len(s.values))
	for key, value := range s.values {
		out[key] = value
	}
	return out, nil
}

func (s *externalSubscriptionConfigRepoStub) Delete(_ context.Context, key string) error {
	delete(s.values, key)
	return nil
}
