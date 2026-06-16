package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync/atomic"
	"testing"
	"time"

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
		SettingKeyBuzzBalanceEnabled:                "true",
		SettingKeyBuzzBalanceAPIBaseURL:             "https://buzzai.cc",
		SettingKeyBuzzBalanceAPIToken:               "buzz-token",
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
	require.Equal(t, ExternalSubscriptionBalanceStrategyNewAPIUserQuota, packy.BalanceStrategy)
	require.True(t, packy.APITokenConfigured)
	require.Equal(t, "996", packy.UserID)
	require.Empty(t, packy.APIToken)

	pixel := requireExternalSubscriptionProvider(t, providers, "pixel")
	require.Equal(t, ExternalSubscriptionTemplateActiveSubscriptions, pixel.Template)
	require.Equal(t, ExternalSubscriptionBalanceStrategyAuthMeBalance, pixel.BalanceStrategy)

	buzz := requireExternalSubscriptionProvider(t, providers, "buzz")
	require.Equal(t, "Buzz", buzz.Name)
	require.Equal(t, ExternalSubscriptionTemplateBuzzBalance, buzz.Template)
	require.Equal(t, ExternalSubscriptionBalanceStrategyAuto, buzz.BalanceStrategy)
	require.Equal(t, "https://buzzai.cc", buzz.APIBaseURL)
	require.True(t, buzz.Enabled)
	require.True(t, buzz.APITokenConfigured)
	require.Empty(t, buzz.APIToken)
	require.Contains(t, buzz.MatchKeywords, "buzzai.cc")
	require.Contains(t, buzz.MatchKeywords, "claude")

	rawchat := requireExternalSubscriptionProvider(t, providers, "rawchat")
	require.Equal(t, "RawChat", rawchat.Name)
	require.Equal(t, ExternalSubscriptionTemplateRawChatSubscriptions, rawchat.Template)
	require.Equal(t, ExternalSubscriptionBalanceStrategyAuto, rawchat.BalanceStrategy)
	require.Equal(t, DefaultRawChatSubscriptionAPIBaseURL, rawchat.APIBaseURL)
	require.False(t, rawchat.Enabled)
	require.False(t, rawchat.APITokenConfigured)
	require.Contains(t, rawchat.MatchKeywords, "rawchat")

	mimo := requireExternalSubscriptionProvider(t, providers, "mimo")
	require.Equal(t, "Xiaomi MiMo", mimo.Name)
	require.Equal(t, ExternalSubscriptionTemplateMimoTokenPlan, mimo.Template)
	require.Equal(t, ExternalSubscriptionBalanceStrategyAuto, mimo.BalanceStrategy)
	require.Equal(t, DefaultMimoTokenPlanAPIBaseURL, mimo.APIBaseURL)
	require.False(t, mimo.Enabled)
	require.False(t, mimo.APITokenConfigured)
	require.Contains(t, mimo.MatchKeywords, "xiaomimimo")
}

func TestExternalSubscriptionConfigServicePersistsAccountQuotaProgressSettings(t *testing.T) {
	repo := newExternalSubscriptionConfigRepo(nil)
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))
	ctx := context.Background()
	settings := map[string]ExternalSubscriptionAccountQuotaProgressPreference{
		"101:rawchat:rawchat_subscriptions:rawchat": {
			Enabled:     true,
			Mode:        ExternalSubscriptionAccountQuotaProgressModeCustomTotal,
			CustomTotal: testFloat64Ptr(120),
		},
		"102:mimo:mimo_token_plan:xiaomi mimo": {
			Enabled: false,
			Mode:    ExternalSubscriptionAccountQuotaProgressModeStatusTotal,
		},
		"103:mimo:mimo_token_plan:xiaomi mimo": {
			Enabled:      true,
			Mode:         ExternalSubscriptionAccountQuotaProgressModeTokenTotal,
			TokenTotal:   testFloat64Ptr(1000000),
			TokenResetAt: "2026-06-11T00:00:00Z",
		},
	}

	saved, err := svc.UpdateAccountQuotaProgressSettings(ctx, settings)
	require.NoError(t, err)
	require.Equal(t, settings["101:rawchat:rawchat_subscriptions:rawchat"].Mode, saved["101:rawchat:rawchat_subscriptions:rawchat"].Mode)
	require.Equal(t, ExternalSubscriptionAccountQuotaProgressModeTokenTotal, saved["103:mimo:mimo_token_plan:xiaomi mimo"].Mode)
	require.NotNil(t, saved["103:mimo:mimo_token_plan:xiaomi mimo"].TokenTotal)
	require.InDelta(t, 1000000, *saved["103:mimo:mimo_token_plan:xiaomi mimo"].TokenTotal, 0.0001)
	require.Equal(t, "2026-06-11T00:00:00Z", saved["103:mimo:mimo_token_plan:xiaomi mimo"].TokenResetAt)
	require.NotContains(t, repo.values[SettingKeyExternalSubscriptionAccountQuotaProgress], "api_token")

	reloadedService := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))
	reloaded, err := reloadedService.GetAccountQuotaProgressSettings(ctx)
	require.NoError(t, err)
	require.Equal(t, saved, reloaded)
}

func TestExternalSubscriptionConfigServicePersistsDisplayStatusSnapshot(t *testing.T) {
	total := 60.0
	remaining := 37.5
	repo := newExternalSubscriptionConfigRepo(nil)
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))
	ctx := context.Background()
	statuses := []ExternalSubscriptionProviderStatus{
		{
			Name:                   "RawChat",
			Template:               ExternalSubscriptionTemplateRawChatSubscriptions,
			BalanceStrategy:        ExternalSubscriptionBalanceStrategyAuto,
			APITokenConfigured:     true,
			RefreshTokenConfigured: false,
			MatchKeywords:          []string{"rawchat"},
			SortOrder:              90,
			ExternalSubscriptionStatus: ExternalSubscriptionStatus{
				Provider:      "rawchat",
				Enabled:       true,
				Configured:    true,
				Currency:      "USD",
				SiteURL:       DefaultRawChatSubscriptionAPIBaseURL,
				TotalLimitUSD: &total,
				UsedUSD:       22.5,
				RemainingUSD:  &remaining,
				Subscriptions: []ExternalSubscriptionItem{},
				RefreshedAt:   time.Date(2026, 6, 11, 1, 2, 3, 0, time.UTC),
			},
		},
	}

	require.NoError(t, svc.SaveDisplayStatusesSnapshot(ctx, statuses))
	require.NotContains(t, repo.values[SettingKeyExternalSubscriptionDisplayStatuses], "rawchat-secret")

	reloadedService := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))
	reloaded, err := reloadedService.GetDisplayStatusesSnapshot(ctx)
	require.NoError(t, err)
	require.Len(t, reloaded, 1)
	require.Equal(t, "rawchat", reloaded[0].Provider)
	require.NotNil(t, reloaded[0].RemainingUSD)
	require.InDelta(t, remaining, *reloaded[0].RemainingUSD, 0.0001)
}

func TestExternalSubscriptionConfigServiceUsesPersistedDisplaySnapshotForTransientStatusErrors(t *testing.T) {
	total := 60.0
	remaining := 37.5
	snapshot := []ExternalSubscriptionProviderStatus{
		{
			Name:                   "OpenRouter",
			Template:               ExternalSubscriptionTemplateOpenRouterCredits,
			BalanceStrategy:        ExternalSubscriptionBalanceStrategyAuto,
			APITokenConfigured:     true,
			RefreshTokenConfigured: false,
			MatchKeywords:          []string{"openrouter"},
			SortOrder:              70,
			ExternalSubscriptionStatus: ExternalSubscriptionStatus{
				Provider:      "openrouter",
				Enabled:       true,
				Configured:    true,
				Currency:      "USD",
				SiteURL:       DefaultOpenRouterCreditsAPIBaseURL,
				TotalLimitUSD: &total,
				UsedUSD:       22.5,
				RemainingUSD:  &remaining,
				Subscriptions: []ExternalSubscriptionItem{},
				RefreshedAt:   time.Date(2026, 6, 11, 1, 2, 3, 0, time.UTC),
			},
		},
	}
	snapshotRaw, err := json.Marshal(snapshot)
	require.NoError(t, err)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/credits", r.URL.Path)
		http.Error(w, `{"error":{"message":"temporary outage"}}`, http.StatusBadGateway)
	}))
	defer server.Close()

	repo := newExternalSubscriptionConfigRepoWithProvidersAndValues([]externalSubscriptionStoredProvider{
		{
			ID:            "openrouter",
			Name:          "OpenRouter",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    server.URL,
			APIToken:      "openrouter-token",
			MatchKeywords: []string{"openrouter"},
			SortOrder:     70,
		},
	}, map[string]string{
		SettingKeyExternalSubscriptionDisplayStatuses: string(snapshotRaw),
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)

	openrouter := requireExternalSubscriptionStatus(t, statuses, "openrouter")
	require.Empty(t, openrouter.ErrorCode)
	require.NotNil(t, openrouter.TotalLimitUSD)
	require.InDelta(t, total, *openrouter.TotalLimitUSD, 0.0001)
	require.NotNil(t, openrouter.RemainingUSD)
	require.InDelta(t, remaining, *openrouter.RemainingUSD, 0.0001)
	require.Equal(t, "OpenRouter", openrouter.Name)
	require.Equal(t, server.URL, openrouter.SiteURL)
}

func TestExternalSubscriptionConfigServiceKeepsRawChatSnapshotWhenQuotaAndSubscriptionsAreTransient(t *testing.T) {
	total := 60.0
	remaining := 37.5
	snapshot := []ExternalSubscriptionProviderStatus{
		{
			Name:                   "RawChat",
			Template:               ExternalSubscriptionTemplateRawChatSubscriptions,
			BalanceStrategy:        ExternalSubscriptionBalanceStrategyAuto,
			APITokenConfigured:     true,
			RefreshTokenConfigured: false,
			MatchKeywords:          []string{"rawchat"},
			SortOrder:              65,
			ExternalSubscriptionStatus: ExternalSubscriptionStatus{
				Provider:      "rawchat",
				Enabled:       true,
				Configured:    true,
				Currency:      "USD",
				SiteURL:       DefaultRawChatSubscriptionAPIBaseURL,
				TotalLimitUSD: &total,
				UsedUSD:       22.5,
				RemainingUSD:  &remaining,
				ActiveCount:   1,
				Subscriptions: []ExternalSubscriptionItem{
					{ID: 701, GroupName: "codex 每日60刀月卡", Status: "active", Window: "24h", LimitUSD: &total, UsedUSD: 22.5, RemainingUSD: &remaining},
				},
				RefreshedAt: time.Date(2026, 6, 11, 1, 2, 3, 0, time.UTC),
			},
		},
	}
	snapshotRaw, err := json.Marshal(snapshot)
	require.NoError(t, err)

	rawChatServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/frontend-api/vibe-code/quota":
			http.Error(w, `{"code":502,"message":"quota temporary unavailable"}`, http.StatusBadGateway)
		case "/frontend-api/getUserSubscriptions":
			http.Error(w, `{"code":502,"message":"subscription temporary unavailable"}`, http.StatusBadGateway)
		default:
			http.NotFound(w, r)
		}
	}))
	defer rawChatServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProvidersAndValues([]externalSubscriptionStoredProvider{
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    rawChatServer.URL,
			APIToken:      "__user_token__=rawchat-session",
			MatchKeywords: []string{"rawchat"},
			SortOrder:     65,
		},
	}, map[string]string{
		SettingKeyExternalSubscriptionDisplayStatuses: string(snapshotRaw),
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)

	rawchat := requireExternalSubscriptionStatus(t, statuses, "rawchat")
	require.Empty(t, rawchat.ErrorCode)
	require.NotNil(t, rawchat.TotalLimitUSD)
	require.InDelta(t, total, *rawchat.TotalLimitUSD, 0.0001)
	require.NotNil(t, rawchat.RemainingUSD)
	require.InDelta(t, remaining, *rawchat.RemainingUSD, 0.0001)
	require.Equal(t, 1, rawchat.ActiveCount)
	require.Len(t, rawchat.Subscriptions, 1)
	require.Equal(t, "RawChat", rawchat.Name)
	require.Equal(t, rawChatServer.URL, rawchat.SiteURL)
}

func TestExternalSubscriptionConfigServiceConfigurationChangesInvalidateDisplayStatusSnapshot(t *testing.T) {
	repo := newExternalSubscriptionConfigRepo(map[string]string{
		SettingKeyExternalSubscriptionDisplayStatuses: `[{"provider":"rawchat"}]`,
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	_, err := svc.CreateProvider(context.Background(), ExternalSubscriptionProviderInput{
		ID:              "custom-newapi",
		Name:            "Custom NewAPI",
		Enabled:         true,
		Template:        ExternalSubscriptionTemplateNewAPIConsole,
		BalanceStrategy: ExternalSubscriptionBalanceStrategyNewAPISubscription,
		APIBaseURL:      "https://newapi.example",
		APIToken:        "newapi-token",
		MatchKeywords:   []string{"custom-newapi"},
	})
	require.NoError(t, err)
	require.NotContains(t, repo.values, SettingKeyExternalSubscriptionDisplayStatuses)
}

func TestExternalSubscriptionConfigServiceMergesDefaultProvidersIntoExistingStoredConfig(t *testing.T) {
	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    DefaultRawChatSubscriptionAPIBaseURL,
			APIToken:      "rawchat-token",
			MatchKeywords: []string{"rawchat"},
			SortOrder:     90,
		},
		{
			ID:            "openrouter",
			Name:          "OpenRouter",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    DefaultOpenRouterCreditsAPIBaseURL,
			APIToken:      "openrouter-key",
			MatchKeywords: []string{"openrouter"},
			SortOrder:     70,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	providers, err := svc.ListProviders(context.Background())
	require.NoError(t, err)

	mimo := requireExternalSubscriptionProvider(t, providers, "mimo")
	require.Equal(t, "Xiaomi MiMo", mimo.Name)
	require.Equal(t, ExternalSubscriptionTemplateMimoTokenPlan, mimo.Template)
	require.False(t, mimo.Enabled)
	require.False(t, mimo.APITokenConfigured)
	require.Contains(t, mimo.MatchKeywords, "xiaomimimo")
}

func TestExternalSubscriptionConfigServiceDeleteDefaultProviderDoesNotRecreateMimo(t *testing.T) {
	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "openrouter",
			Name:          "OpenRouter",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    DefaultOpenRouterCreditsAPIBaseURL,
			MatchKeywords: []string{"openrouter"},
			SortOrder:     70,
		},
		{
			ID:            "cloudflare",
			Name:          "Cloudflare AI Gateway",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateCloudflareAIGatewayCredits,
			APIBaseURL:    DefaultCloudflareAIGatewayCreditsAPIBaseURL,
			MatchKeywords: []string{"cloudflare"},
			SortOrder:     80,
		},
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    DefaultRawChatSubscriptionAPIBaseURL,
			MatchKeywords: []string{"rawchat"},
			SortOrder:     90,
		},
		{
			ID:            "mimo",
			Name:          "Xiaomi MiMo",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateMimoTokenPlan,
			APIBaseURL:    DefaultMimoTokenPlanAPIBaseURL,
			MatchKeywords: []string{"mimo", "xiaomimimo"},
			SortOrder:     95,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))
	ctx := context.Background()

	require.NoError(t, svc.DeleteProvider(ctx, "mimo"))

	providers, err := svc.ListProviders(ctx)
	require.NoError(t, err)
	requireNoExternalSubscriptionProvider(t, providers, "mimo")
	require.Contains(t, repo.values[SettingKeyExternalSubscriptionDeletedDefaultProviders], "mimo")
}

func TestExternalSubscriptionConfigServiceDeleteLegacyLiustProviderDoesNotRecreateFromCredentials(t *testing.T) {
	repo := newExternalSubscriptionConfigRepoWithProvidersAndValues([]externalSubscriptionStoredProvider{
		{
			ID:            "liust",
			Name:          "liust",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateNewAPIConsole,
			APIBaseURL:    DefaultLiustSubscriptionAPIBaseURL,
			APIToken:      "liust-token",
			UserID:        "808",
			MatchKeywords: []string{"liust.xyz", "liust"},
			SortOrder:     50,
		},
	}, map[string]string{
		SettingKeyLiustSubscriptionEnabled:    "true",
		SettingKeyLiustSubscriptionAPIBaseURL: DefaultLiustSubscriptionAPIBaseURL,
		SettingKeyLiustSubscriptionAPIToken:   "liust-token",
		SettingKeyLiustSubscriptionUserID:     "808",
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))
	ctx := context.Background()

	require.NoError(t, svc.DeleteProvider(ctx, "liust"))

	providers, err := svc.ListProviders(ctx)
	require.NoError(t, err)
	requireNoExternalSubscriptionProvider(t, providers, "liust")
	require.Contains(t, repo.values[SettingKeyExternalSubscriptionDeletedDefaultProviders], "liust")
}

func TestExternalSubscriptionConfigServiceCreateProviderClearsDeletedDefaultMarker(t *testing.T) {
	repo := newExternalSubscriptionConfigRepoWithProvidersAndValues([]externalSubscriptionStoredProvider{
		{
			ID:            "openrouter",
			Name:          "OpenRouter",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    DefaultOpenRouterCreditsAPIBaseURL,
			MatchKeywords: []string{"openrouter"},
			SortOrder:     70,
		},
		{
			ID:            "cloudflare",
			Name:          "Cloudflare AI Gateway",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateCloudflareAIGatewayCredits,
			APIBaseURL:    DefaultCloudflareAIGatewayCreditsAPIBaseURL,
			MatchKeywords: []string{"cloudflare"},
			SortOrder:     80,
		},
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    DefaultRawChatSubscriptionAPIBaseURL,
			MatchKeywords: []string{"rawchat"},
			SortOrder:     90,
		},
	}, map[string]string{
		SettingKeyExternalSubscriptionDeletedDefaultProviders: `["mimo"]`,
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))
	ctx := context.Background()

	created, err := svc.CreateProvider(ctx, ExternalSubscriptionProviderInput{
		ID:              "mimo",
		Name:            "Xiaomi MiMo",
		Enabled:         true,
		Template:        ExternalSubscriptionTemplateMimoTokenPlan,
		BalanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
		APIBaseURL:      DefaultMimoTokenPlanAPIBaseURL,
		APIToken:        "mimo-token",
		MatchKeywords:   []string{"mimo", "xiaomimimo"},
		SortOrder:       95,
	})
	require.NoError(t, err)
	require.Equal(t, "mimo", created.ID)
	require.True(t, created.APITokenConfigured)

	var deleted []string
	require.NoError(t, json.Unmarshal([]byte(repo.values[SettingKeyExternalSubscriptionDeletedDefaultProviders]), &deleted))
	require.NotContains(t, deleted, "mimo")
}

func TestExternalSubscriptionConfigServiceUpdateProviderPreservesExistingSecrets(t *testing.T) {
	repo := newExternalSubscriptionConfigRepo(nil)
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	created, err := svc.CreateProvider(context.Background(), ExternalSubscriptionProviderInput{
		ID:              "custom-newapi",
		Name:            "Custom NewAPI",
		Enabled:         true,
		Template:        ExternalSubscriptionTemplateNewAPIConsole,
		BalanceStrategy: ExternalSubscriptionBalanceStrategyNewAPISubscription,
		APIBaseURL:      "https://newapi.example/api",
		APIToken:        "newapi-token",
		UserID:          "1001",
		MatchKeywords:   []string{"newapi.example", "custom-newapi"},
	})
	require.NoError(t, err)
	require.Equal(t, "custom-newapi", created.ID)
	require.Equal(t, ExternalSubscriptionBalanceStrategyNewAPISubscription, created.BalanceStrategy)
	require.True(t, created.APITokenConfigured)
	require.Empty(t, created.APIToken)

	updated, err := svc.UpdateProvider(context.Background(), "custom-newapi", ExternalSubscriptionProviderInput{
		Name:            "Renamed NewAPI",
		Enabled:         true,
		Template:        ExternalSubscriptionTemplateNewAPIConsole,
		BalanceStrategy: ExternalSubscriptionBalanceStrategyNewAPIUserQuota,
		APIBaseURL:      "https://renamed.example",
		UserID:          "1002",
		MatchKeywords:   []string{"renamed.example"},
	})
	require.NoError(t, err)
	require.Equal(t, "Renamed NewAPI", updated.Name)
	require.Equal(t, ExternalSubscriptionBalanceStrategyNewAPIUserQuota, updated.BalanceStrategy)
	require.True(t, updated.APITokenConfigured)
	require.Empty(t, updated.APIToken)

	var stored []externalSubscriptionStoredProvider
	require.NoError(t, json.Unmarshal([]byte(repo.values[SettingKeyExternalSubscriptionProviders]), &stored))
	raw := requireStoredExternalSubscriptionProvider(t, stored, "custom-newapi")
	require.Equal(t, "newapi-token", raw.APIToken)
	require.Equal(t, ExternalSubscriptionBalanceStrategyNewAPIUserQuota, raw.BalanceStrategy)
	require.Equal(t, "1002", raw.UserID)
}

func TestExternalSubscriptionConfigServiceProviderLogoURLPersistsToPublicProviderAndStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/credits", r.URL.Path)
		_, _ = w.Write([]byte(`{"data":{"total_credits":12,"total_usage":2}}`))
	}))
	defer server.Close()

	repo := newExternalSubscriptionConfigRepo(nil)
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	created, err := svc.CreateProvider(context.Background(), ExternalSubscriptionProviderInput{
		ID:            "logo-provider",
		Name:          "Logo Provider",
		Enabled:       true,
		Template:      ExternalSubscriptionTemplateOpenRouterCredits,
		APIBaseURL:    server.URL,
		APIToken:      "logo-token",
		LogoURL:       "  https://cdn.example.com/logo.png  ",
		MatchKeywords: []string{"logo-provider"},
		SortOrder:     11,
	})
	require.NoError(t, err)
	require.Equal(t, "https://cdn.example.com/logo.png", created.LogoURL)

	providers, err := svc.ListProviders(context.Background())
	require.NoError(t, err)
	require.Equal(t, "https://cdn.example.com/logo.png", requireExternalSubscriptionProvider(t, providers, "logo-provider").LogoURL)

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)
	require.Equal(t, "https://cdn.example.com/logo.png", requireExternalSubscriptionStatus(t, statuses, "logo-provider").LogoURL)

	updated, err := svc.UpdateProvider(context.Background(), "logo-provider", ExternalSubscriptionProviderInput{
		Name:          "Logo Provider",
		Enabled:       true,
		Template:      ExternalSubscriptionTemplateOpenRouterCredits,
		APIBaseURL:    server.URL,
		MatchKeywords: []string{"logo-provider"},
		SortOrder:     11,
	})
	require.NoError(t, err)
	require.Empty(t, updated.LogoURL)

	stored := mustStoredExternalSubscriptionProviders(t, repo)
	require.Empty(t, requireStoredExternalSubscriptionProvider(t, stored, "logo-provider").LogoURL)
}

func TestExternalSubscriptionConfigServiceBalanceStrategyPersistsToPublicProviderAndStatus(t *testing.T) {
	var requestedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		require.Equal(t, "Bearer pixel-token", r.Header.Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/api/v1/auth/me":
			_, _ = w.Write([]byte(`{"code":0,"message":"success","data":{"balance":9.82210284,"points_balance":0}}`))
		case "/api/v1/subscriptions/active":
			require.Fail(t, "auth_me_balance strategy should not query active subscriptions")
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	repo := newExternalSubscriptionConfigRepo(nil)
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	created, err := svc.CreateProvider(context.Background(), ExternalSubscriptionProviderInput{
		ID:              "pixel-wallet",
		Name:            "Pixel Wallet",
		Enabled:         true,
		Template:        ExternalSubscriptionTemplateActiveSubscriptions,
		BalanceStrategy: ExternalSubscriptionBalanceStrategyAuthMeBalance,
		APIBaseURL:      server.URL,
		APIToken:        "pixel-token",
		MatchKeywords:   []string{"pixel"},
		SortOrder:       40,
	})
	require.NoError(t, err)
	require.Equal(t, ExternalSubscriptionBalanceStrategyAuthMeBalance, created.BalanceStrategy)

	providers, err := svc.ListProviders(context.Background())
	require.NoError(t, err)
	require.Equal(t, ExternalSubscriptionBalanceStrategyAuthMeBalance, requireExternalSubscriptionProvider(t, providers, "pixel-wallet").BalanceStrategy)

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)
	pixel := requireExternalSubscriptionStatus(t, statuses, "pixel-wallet")
	require.Equal(t, ExternalSubscriptionBalanceStrategyAuthMeBalance, pixel.BalanceStrategy)
	require.InDelta(t, 9.82210284, *pixel.RemainingUSD, 0.00000001)
	require.Equal(t, 0, pixel.ActiveCount)
	require.Empty(t, pixel.Subscriptions)
	require.Equal(t, []string{"/api/v1/auth/me"}, requestedPaths)

	stored := mustStoredExternalSubscriptionProviders(t, repo)
	require.Equal(t, ExternalSubscriptionBalanceStrategyAuthMeBalance, requireStoredExternalSubscriptionProvider(t, stored, "pixel-wallet").BalanceStrategy)
}

func TestExternalSubscriptionConfigServiceMergesLegacyKeywordsIntoStoredProvider(t *testing.T) {
	repo := newExternalSubscriptionConfigRepoWithProvidersAndValues([]externalSubscriptionStoredProvider{
		{
			ID:            "buzz",
			Name:          "Buzz",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateBuzzBalance,
			APIBaseURL:    "https://buzzai.cc",
			APIToken:      "buzz-token",
			MatchKeywords: []string{"buzz"},
			SortOrder:     5,
		},
	}, map[string]string{
		SettingKeyBuzzBalanceEnabled:    "true",
		SettingKeyBuzzBalanceAPIBaseURL: "https://buzzai.cc",
		SettingKeyBuzzBalanceAPIToken:   "buzz-token",
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	providers, err := svc.ListProviders(context.Background())
	require.NoError(t, err)

	buzz := requireExternalSubscriptionProvider(t, providers, "buzz")
	require.Contains(t, buzz.MatchKeywords, "buzz")
	require.Contains(t, buzz.MatchKeywords, "buzzai")
	require.Contains(t, buzz.MatchKeywords, "buzzai.cc")
	require.Contains(t, buzz.MatchKeywords, "claude")

	stored := mustStoredExternalSubscriptionProviders(t, repo)
	raw := requireStoredExternalSubscriptionProvider(t, stored, "buzz")
	require.Contains(t, raw.MatchKeywords, "claude")
}

func TestExternalSubscriptionConfigServiceMergesConfiguredLegacyProvidersIntoStoredProviders(t *testing.T) {
	repo := newExternalSubscriptionConfigRepoWithProvidersAndValues([]externalSubscriptionStoredProvider{
		{
			ID:            "xhyapi",
			Name:          "XHYAPI",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateActiveSubscriptions,
			APIBaseURL:    "https://xhyapi.com",
			MatchKeywords: []string{"xhyapi"},
			SortOrder:     30,
		},
		{
			ID:            "openrouter",
			Name:          "OpenRouter",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    DefaultOpenRouterCreditsAPIBaseURL,
			MatchKeywords: []string{"openrouter"},
			SortOrder:     70,
		},
	}, map[string]string{
		SettingKeyQLHazyCoderSubscriptionEnabled:    "true",
		SettingKeyQLHazyCoderSubscriptionAPIBaseURL: "https://api.qlhazycoder.top",
		SettingKeyQLHazyCoderSubscriptionAPIToken:   "legacy-ql-token",
		SettingKeyQLHazyCoderSubscriptionUserID:     "707",
		SettingKeyXHYAPISubscriptionEnabled:         "true",
		SettingKeyXHYAPISubscriptionAPIBaseURL:      "https://xhyapi.com",
		SettingKeyXHYAPISubscriptionAPIToken:        "legacy-xhy-token",
		SettingKeyXHYAPISubscriptionRefreshToken:    "legacy-xhy-refresh",
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	providers, err := svc.ListProviders(context.Background())
	require.NoError(t, err)

	qlhazy := requireExternalSubscriptionProvider(t, providers, "qlhazycoder")
	require.True(t, qlhazy.Enabled)
	require.True(t, qlhazy.APITokenConfigured)
	require.Equal(t, "707", qlhazy.UserID)

	xhyapi := requireExternalSubscriptionProvider(t, providers, "xhyapi")
	require.True(t, xhyapi.APITokenConfigured)
	require.True(t, xhyapi.RefreshTokenConfigured)

	stored := mustStoredExternalSubscriptionProviders(t, repo)
	require.Equal(t, "legacy-ql-token", requireStoredExternalSubscriptionProvider(t, stored, "qlhazycoder").APIToken)
	xhyRaw := requireStoredExternalSubscriptionProvider(t, stored, "xhyapi")
	require.Equal(t, "legacy-xhy-token", xhyRaw.APIToken)
	require.Equal(t, "legacy-xhy-refresh", xhyRaw.RefreshToken)
}

func TestExternalSubscriptionConfigServiceMergesLegacyEnabledFlagIntoStoredProvider(t *testing.T) {
	newAPIServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/status":
			_, _ = w.Write([]byte(`{"success":true,"message":"","data":{"quota_display_type":"CNY","quota_per_unit":500000}}`))
		case "/api/user/self":
			_, _ = w.Write([]byte(`{"success":true,"message":"","data":{"quota":2500000,"used_quota":0}}`))
		case "/api/subscription/self":
			_, _ = w.Write([]byte(`{"success":true,"message":"","data":{"subscriptions":[],"all_subscriptions":[]}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer newAPIServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProvidersAndValues([]externalSubscriptionStoredProvider{
		{
			ID:            "qlhazycoder",
			Name:          "qlhazycoder",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateNewAPIConsole,
			APIBaseURL:    newAPIServer.URL,
			MatchKeywords: []string{"qlhazycoder"},
			SortOrder:     20,
		},
	}, map[string]string{
		SettingKeyQLHazyCoderSubscriptionEnabled:    "true",
		SettingKeyQLHazyCoderSubscriptionAPIBaseURL: newAPIServer.URL,
		SettingKeyQLHazyCoderSubscriptionAPIToken:   "legacy-ql-token",
		SettingKeyQLHazyCoderSubscriptionUserID:     "707",
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)

	qlhazy := requireExternalSubscriptionStatus(t, statuses, "qlhazycoder")
	require.True(t, qlhazy.Enabled)
	require.True(t, qlhazy.Configured)
	require.NotNil(t, qlhazy.RemainingUSD)
	require.InDelta(t, 5, *qlhazy.RemainingUSD, 0.0001)

	stored := mustStoredExternalSubscriptionProviders(t, repo)
	qlhazyRaw := requireStoredExternalSubscriptionProvider(t, stored, "qlhazycoder")
	require.True(t, qlhazyRaw.Enabled)
	require.Equal(t, "legacy-ql-token", qlhazyRaw.APIToken)
	require.Equal(t, "707", qlhazyRaw.UserID)
}

func TestExternalSubscriptionConfigServiceMergesLegacyEnabledFlagAfterPreviousSecretMerge(t *testing.T) {
	repo := newExternalSubscriptionConfigRepoWithProvidersAndValues([]externalSubscriptionStoredProvider{
		{
			ID:            "qlhazycoder",
			Name:          "qlhazycoder",
			Enabled:       false,
			Template:      ExternalSubscriptionTemplateNewAPIConsole,
			APIBaseURL:    "https://api.qlhazycoder.top",
			APIToken:      "legacy-ql-token",
			UserID:        "707",
			MatchKeywords: []string{"qlhazycoder"},
			SortOrder:     20,
		},
	}, map[string]string{
		SettingKeyQLHazyCoderSubscriptionEnabled:    "true",
		SettingKeyQLHazyCoderSubscriptionAPIBaseURL: "https://api.qlhazycoder.top",
		SettingKeyQLHazyCoderSubscriptionAPIToken:   "legacy-ql-token",
		SettingKeyQLHazyCoderSubscriptionUserID:     "707",
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	providers, err := svc.ListProviders(context.Background())
	require.NoError(t, err)

	qlhazy := requireExternalSubscriptionProvider(t, providers, "qlhazycoder")
	require.True(t, qlhazy.Enabled)

	stored := mustStoredExternalSubscriptionProviders(t, repo)
	require.True(t, requireStoredExternalSubscriptionProvider(t, stored, "qlhazycoder").Enabled)
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

func TestExternalSubscriptionConfigServiceGetStatusesRunsRawChatTemplate(t *testing.T) {
	rawChatServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if writeRawChatQuotaUnavailable(w, r) {
			return
		}
		require.Equal(t, "/frontend-api/getUserSubscriptions", r.URL.Path)
		require.Equal(t, http.MethodPost, r.Method)
		require.Equal(t, "Bearer rawchat-token", r.Header.Get("Authorization"))
		require.Equal(t, "application/json", r.Header.Get("Content-Type"))

		var body struct {
			Page int `json:"page"`
			Size int `json:"size"`
		}
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		require.Equal(t, 1, body.Page)
		require.Equal(t, 20, body.Size)

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"code": 0,
			"message": "success",
			"data": {
				"list": [
					{
						"id": 101,
						"packageName": "RawChat Pro",
						"status": 1,
						"billingType": "amount",
						"limit": 18.5,
						"used": 3.25,
						"startTime": "2026-06-01T00:00:00Z",
						"expireTime": "2026-07-01T00:00:00Z"
					},
					{
						"id": 102,
						"packageName": "RawChat Expired",
						"status": 2,
						"billingType": "amount",
						"limit": 99,
						"used": 99,
						"expireTime": "2026-05-01T00:00:00Z"
					}
				],
				"total": 2
			}
		}`))
	}))
	defer rawChatServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    rawChatServer.URL,
			APIToken:      "rawchat-token",
			MatchKeywords: []string{"rawchat"},
			SortOrder:     65,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)

	rawchat := requireExternalSubscriptionStatus(t, statuses, "rawchat")
	require.Equal(t, "RawChat", rawchat.Name)
	require.Equal(t, ExternalSubscriptionTemplateRawChatSubscriptions, rawchat.Template)
	require.Equal(t, "USD", rawchat.Currency)
	require.Equal(t, 1, rawchat.ActiveCount)
	require.InDelta(t, 18.5, *rawchat.TotalLimitUSD, 0.0001)
	require.InDelta(t, 15.25, *rawchat.RemainingUSD, 0.0001)
	require.Len(t, rawchat.Subscriptions, 1)
	require.Equal(t, int64(101), rawchat.Subscriptions[0].ID)
	require.Equal(t, "RawChat Pro", rawchat.Subscriptions[0].GroupName)
	require.Equal(t, "active", rawchat.Subscriptions[0].Status)
	require.Equal(t, "subscription", rawchat.Subscriptions[0].Window)
	require.InDelta(t, 18.5, *rawchat.Subscriptions[0].LimitUSD, 0.0001)
	require.InDelta(t, 3.25, rawchat.Subscriptions[0].UsedUSD, 0.0001)
	require.InDelta(t, 15.25, *rawchat.Subscriptions[0].RemainingUSD, 0.0001)
	require.NotNil(t, rawchat.ExpiresAt)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsRawChatTemplateWithCookieToken(t *testing.T) {
	rawChatServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if writeRawChatQuotaUnavailable(w, r) {
			return
		}
		require.Equal(t, "/frontend-api/getUserSubscriptions", r.URL.Path)
		require.Empty(t, r.Header.Get("Authorization"))
		require.Equal(t, "__user_token__=rawchat-session", r.Header.Get("Cookie"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"code": 1,
			"data": {
				"list": [
					{"id": "201", "packageName": "RawChat Cookie", "status": "active", "limit": "8.5", "usedAmount": "1.5"}
				]
			}
		}`))
	}))
	defer rawChatServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    rawChatServer.URL,
			APIToken:      "Cookie: __user_token__=rawchat-session",
			MatchKeywords: []string{"rawchat"},
			SortOrder:     65,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)

	rawchat := requireExternalSubscriptionStatus(t, statuses, "rawchat")
	require.InDelta(t, 7, *rawchat.RemainingUSD, 0.0001)
	require.Equal(t, int64(201), rawchat.Subscriptions[0].ID)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsRawChatTemplateWithExplicitRemainingAndExpiryAliases(t *testing.T) {
	rawChatServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if writeRawChatQuotaUnavailable(w, r) {
			return
		}
		require.Equal(t, "/frontend-api/getUserSubscriptions", r.URL.Path)
		require.Empty(t, r.Header.Get("Authorization"))
		require.Equal(t, "__user_token__=rawchat-session", r.Header.Get("Cookie"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"code": 1,
			"data": {
				"list": [
					{
						"id": "301",
						"packageName": "RawChat Balance",
						"status": 1,
						"limit": 60,
						"remaining": "12.34",
						"expireDate": "2026-08-09"
					}
				]
			}
		}`))
	}))
	defer rawChatServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    rawChatServer.URL,
			APIToken:      "__user_token__=rawchat-session",
			MatchKeywords: []string{"rawchat"},
			SortOrder:     65,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)

	rawchat := requireExternalSubscriptionStatus(t, statuses, "rawchat")
	require.NotNil(t, rawchat.TotalLimitUSD)
	require.InDelta(t, 60, *rawchat.TotalLimitUSD, 0.0001)
	require.NotNil(t, rawchat.RemainingUSD)
	require.InDelta(t, 12.34, *rawchat.RemainingUSD, 0.0001)
	require.NotNil(t, rawchat.ExpiresAt)
	require.Equal(t, "2026-08-09T00:00:00Z", rawchat.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"))
	require.Len(t, rawchat.Subscriptions, 1)
	require.InDelta(t, 12.34, *rawchat.Subscriptions[0].RemainingUSD, 0.0001)
	require.NotNil(t, rawchat.Subscriptions[0].ExpiresAt)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsRawChatTemplateWithLimitOnlyAndBrowserHeaders(t *testing.T) {
	var rawChatServer *httptest.Server
	rawChatServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if writeRawChatQuotaUnavailable(w, r) {
			return
		}
		require.Equal(t, "/frontend-api/getUserSubscriptions", r.URL.Path)
		require.Empty(t, r.Header.Get("Authorization"))
		require.Equal(t, "__user_token__=rawchat-session", r.Header.Get("Cookie"))
		require.Equal(t, "application/json, text/plain, */*", r.Header.Get("Accept"))
		require.Contains(t, r.Header.Get("User-Agent"), "Mozilla/5.0")
		require.Contains(t, r.Header.Get("User-Agent"), "Chrome/")
		require.Equal(t, rawChatServer.URL, r.Header.Get("Origin"))
		require.Equal(t, rawChatServer.URL+"/pastel/", r.Header.Get("Referer"))
		require.Equal(t, "zh-CN,zh;q=0.9,en;q=0.8", r.Header.Get("Accept-Language"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"code": 1,
			"data": {
				"list": [
					{
						"id": "401",
						"packageName": "RawChat Codex",
						"status": 1,
						"billingType": "amount",
						"limit": 60,
						"expireTime": "2026-06-27 17:13:08"
					}
				]
			}
		}`))
	}))
	defer rawChatServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    rawChatServer.URL,
			APIToken:      "__user_token__=rawchat-session",
			MatchKeywords: []string{"rawchat"},
			SortOrder:     65,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)

	rawchat := requireExternalSubscriptionStatus(t, statuses, "rawchat")
	require.Equal(t, 1, rawchat.ActiveCount)
	require.NotNil(t, rawchat.TotalLimitUSD)
	require.InDelta(t, 60, *rawchat.TotalLimitUSD, 0.0001)
	require.Nil(t, rawchat.RemainingUSD)
	require.NotNil(t, rawchat.ExpiresAt)
	require.Equal(t, "2026-06-27T17:13:08Z", rawchat.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"))
	require.Len(t, rawchat.Subscriptions, 1)
	require.Nil(t, rawchat.Subscriptions[0].RemainingUSD)
	require.NotNil(t, rawchat.Subscriptions[0].ExpiresAt)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsRawChatTemplateWithVibeCodeQuota(t *testing.T) {
	var sawQuota bool
	var sawSubscriptions bool
	var rawChatServer *httptest.Server
	rawChatServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Empty(t, r.Header.Get("Authorization"))
		require.Equal(t, "__user_token__=rawchat-session", r.Header.Get("Cookie"))
		require.Equal(t, "application/json, text/plain, */*", r.Header.Get("Accept"))
		require.Contains(t, r.Header.Get("User-Agent"), "Mozilla/5.0")
		require.Equal(t, rawChatServer.URL, r.Header.Get("Origin"))
		require.Equal(t, rawChatServer.URL+"/pastel/", r.Header.Get("Referer"))
		require.Equal(t, "zh-CN,zh;q=0.9,en;q=0.8", r.Header.Get("Accept-Language"))

		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/frontend-api/vibe-code/quota":
			require.Equal(t, http.MethodGet, r.Method)
			sawQuota = true
			_, _ = w.Write([]byte(`{
				"code": 1,
				"data": {
					"codex": {
						"isAuth": true,
						"subscriptions": {
							"id": 501,
							"subTypeName": "codex 特惠 每日60刀月卡",
							"billingType": "amount",
							"amountLimit": 60,
							"usedAmount": 22.785875,
							"remainingAmount": 37.214125,
							"expireTime": "2026-06-27T17:13:08.727+08:00",
							"period": "24h",
							"periodResetTime": "2026-06-10 11:58:09",
							"isActive": true
						},
						"currentUsage": {
							"totalCost": 22.785875,
							"totalRequests": 232,
							"lastRequestTime": "2026-06-09 20:53:03"
						}
					}
				}
			}`))
		case "/frontend-api/getUserSubscriptions":
			require.Equal(t, http.MethodPost, r.Method)
			sawSubscriptions = true
			_, _ = w.Write([]byte(`{
				"code": 1,
				"data": {
					"list": [
						{
							"id": "401",
							"subTypeName": "codex 特惠 每日60刀月卡",
							"status": 1,
							"billingType": "amount",
							"limit": 60,
							"expireTime": "2026-06-27 17:13:08"
						}
					]
				}
			}`))
		default:
			require.Failf(t, "unexpected RawChat path", "path=%s", r.URL.Path)
		}
	}))
	defer rawChatServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    rawChatServer.URL,
			APIToken:      "__user_token__=rawchat-session",
			MatchKeywords: []string{"rawchat"},
			SortOrder:     65,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)
	require.True(t, sawQuota)
	require.True(t, sawSubscriptions)

	rawchat := requireExternalSubscriptionStatus(t, statuses, "rawchat")
	require.Equal(t, 1, rawchat.ActiveCount)
	require.NotNil(t, rawchat.TotalLimitUSD)
	require.InDelta(t, 60, *rawchat.TotalLimitUSD, 0.0001)
	require.InDelta(t, 22.785875, rawchat.UsedUSD, 0.000001)
	require.NotNil(t, rawchat.RemainingUSD)
	require.InDelta(t, 37.214125, *rawchat.RemainingUSD, 0.000001)
	require.NotNil(t, rawchat.ExpiresAt)
	require.Equal(t, "2026-06-27T09:13:08Z", rawchat.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"))
	require.Len(t, rawchat.Subscriptions, 1)
	require.InDelta(t, 60, *rawchat.Subscriptions[0].LimitUSD, 0.0001)
	require.InDelta(t, 22.785875, rawchat.Subscriptions[0].UsedUSD, 0.000001)
	require.NotNil(t, rawchat.Subscriptions[0].RemainingUSD)
	require.InDelta(t, 37.214125, *rawchat.Subscriptions[0].RemainingUSD, 0.000001)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsRawChatTemplateWithLooseCookieAndRootQuota(t *testing.T) {
	var sawQuota bool
	var rawChatServer *httptest.Server
	rawChatServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Empty(t, r.Header.Get("Authorization"))
		require.Equal(t, "theme=light; __user_token__=rawchat-session", r.Header.Get("Cookie"))
		require.Equal(t, "application/json, text/plain, */*", r.Header.Get("Accept"))
		require.Contains(t, r.Header.Get("User-Agent"), "Mozilla/5.0")
		require.Equal(t, rawChatServer.URL, r.Header.Get("Origin"))
		require.Equal(t, rawChatServer.URL+"/pastel/", r.Header.Get("Referer"))

		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/frontend-api/vibe-code/quota":
			sawQuota = true
			_, _ = w.Write([]byte(`{
				"code": 1,
				"data": {
					"subscriptions": {
						"id": "701",
						"subTypeName": "codex 每日60刀月卡",
						"billingType": "amount",
						"amountLimit": "60 USD",
						"usedAmount": "22.5 USD",
						"remainingAmount": "37.5 USD",
						"expireTime": "2026-06-27T17:13:08.727+08:00",
						"period": "24h"
					},
					"currentUsage": {
						"totalCost": "22.5 USD"
					}
				}
			}`))
		case "/frontend-api/getUserSubscriptions":
			w.WriteHeader(http.StatusBadGateway)
			_, _ = w.Write([]byte(`{"code":502,"message":"subscription list temporarily unavailable"}`))
		default:
			require.Failf(t, "unexpected RawChat path", "path=%s", r.URL.Path)
		}
	}))
	defer rawChatServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "rawchat",
			Name:          "RawChat",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateRawChatSubscriptions,
			APIBaseURL:    rawChatServer.URL,
			APIToken:      "theme=light; __user_token__=rawchat-session",
			MatchKeywords: []string{"rawchat"},
			SortOrder:     65,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)
	require.True(t, sawQuota)

	rawchat := requireExternalSubscriptionStatus(t, statuses, "rawchat")
	require.Empty(t, rawchat.ErrorCode)
	require.Equal(t, 1, rawchat.ActiveCount)
	require.NotNil(t, rawchat.TotalLimitUSD)
	require.InDelta(t, 60, *rawchat.TotalLimitUSD, 0.0001)
	require.InDelta(t, 22.5, rawchat.UsedUSD, 0.0001)
	require.NotNil(t, rawchat.RemainingUSD)
	require.InDelta(t, 37.5, *rawchat.RemainingUSD, 0.0001)
	require.NotNil(t, rawchat.ExpiresAt)
	require.Equal(t, "2026-06-27T09:13:08Z", rawchat.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"))
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsMimoTokenPlanTemplate(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Fail(t, "MiMo token plan status must not call guessed quota endpoints")
	}))
	defer server.Close()
	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "mimo",
			Name:          "Xiaomi MiMo",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateMimoTokenPlan,
			APIBaseURL:    server.URL,
			APIToken:      "mimo-session=abc",
			MatchKeywords: []string{"mimo", "xiaomi"},
			SortOrder:     95,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)

	mimo := requireExternalSubscriptionStatus(t, statuses, "mimo")
	require.Empty(t, mimo.ErrorCode)
	require.Equal(t, ExternalSubscriptionTemplateMimoTokenPlan, mimo.Template)
	require.True(t, mimo.Configured)
	require.Nil(t, mimo.TotalLimitUSD)
	require.Nil(t, mimo.RemainingUSD)
	require.Zero(t, mimo.UsedUSD)
	require.Zero(t, mimo.ActiveCount)
	require.Empty(t, mimo.Subscriptions)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsMimoTokenPlanTemplateWithBearerKey(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Fail(t, "MiMo token plan status must not call guessed quota endpoints")
	}))
	defer server.Close()
	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "mimo",
			Name:          "Xiaomi MiMo",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateMimoTokenPlan,
			APIBaseURL:    server.URL,
			APIToken:      "tp-abc",
			MatchKeywords: []string{"mimo", "xiaomi"},
			SortOrder:     95,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
	require.NoError(t, err)

	mimo := requireExternalSubscriptionStatus(t, statuses, "mimo")
	require.Empty(t, mimo.ErrorCode)
	require.True(t, mimo.Configured)
	require.Nil(t, mimo.TotalLimitUSD)
	require.Nil(t, mimo.RemainingUSD)
	require.Zero(t, mimo.UsedUSD)
}

func TestExternalSubscriptionConfigServiceGetStatusesKeepsOtherProvidersWhenOneFails(t *testing.T) {
	goodServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/credits", r.URL.Path)
		_, _ = w.Write([]byte(`{"data":{"total_credits":10,"total_usage":1}}`))
	}))
	defer goodServer.Close()

	badServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error":"upstream offline"}`))
	}))
	defer badServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "bad-provider",
			Name:          "Bad Provider",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    badServer.URL,
			APIToken:      "bad-key",
			MatchKeywords: []string{"bad"},
			SortOrder:     10,
		},
		{
			ID:            "good-provider",
			Name:          "Good Provider",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    goodServer.URL,
			APIToken:      "good-key",
			MatchKeywords: []string{"good"},
			SortOrder:     20,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)
	require.Len(t, statuses, 2)

	bad := requireExternalSubscriptionStatus(t, statuses, "bad-provider")
	require.True(t, bad.Enabled)
	require.True(t, bad.Configured)
	require.NotEmpty(t, bad.ErrorCode)
	require.NotEmpty(t, bad.ErrorMessage)

	good := requireExternalSubscriptionStatus(t, statuses, "good-provider")
	require.Empty(t, good.ErrorCode)
	require.InDelta(t, 9, *good.RemainingUSD, 0.0001)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsCreditTemplates(t *testing.T) {
	openRouterServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/credits", r.URL.Path)
		require.Equal(t, "Bearer openrouter-key", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(`{"data":{"total_credits":25.5,"total_usage":4.25}}`))
	}))
	defer openRouterServer.Close()

	cloudflareServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/accounts/cf-account/ai-gateway/billing/credit-balance", r.URL.Path)
		require.Equal(t, "Bearer cf-token", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(`{"success":true,"result":{"balance":12.75}}`))
	}))
	defer cloudflareServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "openrouter",
			Name:          "OpenRouter",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    openRouterServer.URL,
			APIToken:      "openrouter-key",
			MatchKeywords: []string{"openrouter"},
			SortOrder:     70,
		},
		{
			ID:            "cloudflare",
			Name:          "Cloudflare AI Gateway",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateCloudflareAIGatewayCredits,
			APIBaseURL:    cloudflareServer.URL,
			APIToken:      "cf-token",
			UserID:        "cf-account",
			MatchKeywords: []string{"cloudflare", "ai-gateway"},
			SortOrder:     80,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)

	openRouter := requireExternalSubscriptionStatus(t, statuses, "openrouter")
	require.Equal(t, "OpenRouter", openRouter.Name)
	require.Equal(t, ExternalSubscriptionTemplateOpenRouterCredits, openRouter.Template)
	require.Equal(t, "USD", openRouter.Currency)
	require.InDelta(t, 25.5, *openRouter.TotalLimitUSD, 0.0001)
	require.InDelta(t, 4.25, openRouter.UsedUSD, 0.0001)
	require.InDelta(t, 21.25, *openRouter.RemainingUSD, 0.0001)
	require.Equal(t, 0, openRouter.ActiveCount)

	cloudflare := requireExternalSubscriptionStatus(t, statuses, "cloudflare")
	require.Equal(t, "Cloudflare AI Gateway", cloudflare.Name)
	require.Equal(t, ExternalSubscriptionTemplateCloudflareAIGatewayCredits, cloudflare.Template)
	require.Equal(t, "USD", cloudflare.Currency)
	require.Nil(t, cloudflare.TotalLimitUSD)
	require.InDelta(t, 12.75, *cloudflare.RemainingUSD, 0.0001)
	require.Equal(t, "cf-account", requireStoredExternalSubscriptionProvider(t, mustStoredExternalSubscriptionProviders(t, repo), "cloudflare").UserID)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsBuzzBalanceTemplate(t *testing.T) {
	buzzServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "Bearer buzz-key", r.Header.Get("Authorization"))
		switch r.URL.Path {
		case "/v1/dashboard/billing/subscription":
			_, _ = w.Write([]byte(`{"soft_limit_usd":100,"expires_at":"2026-07-08T00:00:00Z"}`))
		case "/v1/dashboard/billing/usage":
			_, _ = w.Write([]byte(`{"total_usage":1234}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer buzzServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "buzz",
			Name:          "Buzz",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateBuzzBalance,
			APIBaseURL:    buzzServer.URL,
			APIToken:      "buzz-key",
			MatchKeywords: []string{"buzz", "buzzai.cc"},
			SortOrder:     5,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	statuses, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)

	buzz := requireExternalSubscriptionStatus(t, statuses, "buzz")
	require.Equal(t, "Buzz", buzz.Name)
	require.Equal(t, ExternalSubscriptionTemplateBuzzBalance, buzz.Template)
	require.Equal(t, "USD", buzz.Currency)
	require.InDelta(t, 100, *buzz.TotalLimitUSD, 0.0001)
	require.InDelta(t, 12.34, buzz.UsedUSD, 0.0001)
	require.InDelta(t, 87.66, *buzz.RemainingUSD, 0.0001)
	require.Equal(t, 1, buzz.ActiveCount)
	require.Len(t, buzz.Subscriptions, 1)
	require.Equal(t, "Buzz", buzz.Subscriptions[0].GroupName)
}

func TestExternalSubscriptionConfigServiceGetStatusesCachesExternalCallsBriefly(t *testing.T) {
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		_, _ = w.Write([]byte(`{"data":{"total_credits":10,"total_usage":1}}`))
	}))
	defer server.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "openrouter",
			Name:          "OpenRouter",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    server.URL,
			APIToken:      "openrouter-key",
			MatchKeywords: []string{"openrouter"},
			SortOrder:     70,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	first, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)
	second, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)

	require.Equal(t, 1, calls)
	require.Equal(t, first[0].RefreshedAt, second[0].RefreshedAt)
	require.InDelta(t, 9, *second[0].RemainingUSD, 0.0001)
}

func TestExternalSubscriptionConfigServiceGetStatusesReturnsStaleSnapshotWhileRefreshing(t *testing.T) {
	t.Setenv("TZ", "UTC")

	var credits atomic.Int64
	credits.Store(10)
	requests := make(chan struct{}, 8)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests <- struct{}{}
		_, _ = w.Write([]byte(`{"data":{"total_credits":` + jsonNumber(credits.Load()) + `,"total_usage":1}}`))
	}))
	defer server.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "openrouter",
			Name:          "OpenRouter",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    server.URL,
			APIToken:      "openrouter-key",
			MatchKeywords: []string{"openrouter"},
			SortOrder:     70,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	first, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)
	require.InDelta(t, 9, *first[0].RemainingUSD, 0.0001)
	<-requests

	svc.statusCacheMu.Lock()
	svc.statusCache.expiresAt = time.Now().Add(-time.Second)
	svc.statusCache.staleUntil = time.Now().Add(time.Minute)
	svc.statusCacheMu.Unlock()
	credits.Store(25)

	stale, err := svc.GetStatuses(context.Background())
	require.NoError(t, err)
	require.InDelta(t, 9, *stale[0].RemainingUSD, 0.0001)

	require.Eventually(t, func() bool {
		select {
		case <-requests:
			return true
		default:
			return false
		}
	}, time.Second, 10*time.Millisecond)

	require.Eventually(t, func() bool {
		latest, err := svc.GetStatuses(context.Background())
		if err != nil || len(latest) != 1 || latest[0].RemainingUSD == nil {
			return false
		}
		return *latest[0].RemainingUSD > 20
	}, time.Second, 10*time.Millisecond)
}

func TestExternalSubscriptionConfigServiceGetStatusesRunsProvidersConcurrently(t *testing.T) {
	makeServer := func(delay time.Duration, total int64) *httptest.Server {
		return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			time.Sleep(delay)
			_, _ = w.Write([]byte(`{"data":{"total_credits":` + jsonNumber(total) + `,"total_usage":1}}`))
		}))
	}
	firstServer := makeServer(120*time.Millisecond, 10)
	defer firstServer.Close()
	secondServer := makeServer(120*time.Millisecond, 20)
	defer secondServer.Close()

	repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{
		{
			ID:            "first-provider",
			Name:          "First",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    firstServer.URL,
			APIToken:      "first-key",
			MatchKeywords: []string{"first"},
			SortOrder:     10,
		},
		{
			ID:            "second-provider",
			Name:          "Second",
			Enabled:       true,
			Template:      ExternalSubscriptionTemplateOpenRouterCredits,
			APIBaseURL:    secondServer.URL,
			APIToken:      "second-key",
			MatchKeywords: []string{"second"},
			SortOrder:     20,
		},
	})
	svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))

	started := time.Now()
	statuses, err := svc.GetStatuses(context.Background())
	elapsed := time.Since(started)

	require.NoError(t, err)
	require.Len(t, statuses, 2)
	require.Less(t, elapsed, 220*time.Millisecond)
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

func requireNoExternalSubscriptionProvider(t *testing.T, providers []ExternalSubscriptionProvider, id string) {
	t.Helper()
	for _, provider := range providers {
		require.NotEqual(t, id, provider.ID, "provider should not exist")
	}
}

func testFloat64Ptr(value float64) *float64 {
	return &value
}

func jsonNumber(value int64) string {
	return strconv.FormatInt(value, 10)
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

func writeRawChatQuotaUnavailable(w http.ResponseWriter, r *http.Request) bool {
	if r.URL.Path != "/frontend-api/vibe-code/quota" {
		return false
	}
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"code":0,"message":"quota unavailable"}`))
	return true
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

func mustStoredExternalSubscriptionProviders(t *testing.T, repo *externalSubscriptionConfigRepoStub) []externalSubscriptionStoredProvider {
	t.Helper()
	var stored []externalSubscriptionStoredProvider
	require.NoError(t, json.Unmarshal([]byte(repo.values[SettingKeyExternalSubscriptionProviders]), &stored))
	return stored
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

func newExternalSubscriptionConfigRepoWithProvidersAndValues(providers []externalSubscriptionStoredProvider, values map[string]string) *externalSubscriptionConfigRepoStub {
	repo := newExternalSubscriptionConfigRepoWithProviders(providers)
	for key, value := range values {
		repo.values[key] = value
	}
	return repo
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
