package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestPixelAccessTokenQuota(t *testing.T) {
	for _, tc := range []struct {
		name, body      string
		remaining, used float64
		invalid         bool
	}{
		{"current", `{"success":true,"data":{"quota":9864546,"used_quota":5135454}}`, 19.729092, 10.270908, false},
		{"nested strings", `{"success":true,"data":{"user":{"quota":"500000","used_quota":"250000"}}}`, 1, .5, false},
		{"zero", `{"success":true,"data":{"quota":0,"used_quota":0}}`, 0, 0, false},
		{"missing quota", `{"success":true,"data":{"balance":100}}`, 0, 0, true},
		{"failure", `{"success":false,"message":"permission denied"}`, 0, 0, true},
		{"expired", `{"success":false,"code":"AUTH_UNAUTHORIZED","message":"invalid access token"}`, 0, 0, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var paths []string
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				paths = append(paths, r.URL.Path)
				require.Equal(t, "Bearer pat-test", r.Header.Get("Authorization"))
				require.Empty(t, r.Header.Get("Cookie"))
				w.Header().Set("Content-Type", "application/json")
				switch r.URL.Path {
				case "/api/status":
					_, _ = w.Write([]byte(`{"success":true,"data":{"quota_display_type":"CNY","quota_per_unit":500000,"usd_exchange_rate":1}}`))
				case "/api/user/self":
					if tc.name == "expired" {
						w.WriteHeader(http.StatusUnauthorized)
					}
					_, _ = w.Write([]byte(tc.body))
				default:
					t.Errorf("unexpected path: %s", r.URL.Path)
					http.NotFound(w, r)
				}
			}))
			defer server.Close()
			repo := newExternalSubscriptionConfigRepoWithProvidersAndValues([]externalSubscriptionStoredProvider{{
				ID: "pixel-custom", Name: "Pixel", Enabled: true, Template: ExternalSubscriptionTemplatePixelAccessToken,
				APIBaseURL: server.URL + "/v1", APIToken: "Bearer pat-test", RefreshToken: "must-not-refresh",
			}}, nil)
			svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))
			statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
			require.NoError(t, err)
			status := requireExternalSubscriptionStatus(t, statuses, "pixel-custom")
			require.Equal(t, []string{"/api/status", "/api/user/self"}, paths)
			if tc.invalid {
				require.NotEmpty(t, status.ErrorCode)
				require.Nil(t, status.RemainingUSD)
				if tc.name == "expired" {
					require.Equal(t, "401", status.ErrorCode)
				}
				return
			}
			require.Empty(t, status.ErrorCode)
			require.Equal(t, "CNY", status.Currency)
			require.NotNil(t, status.RemainingUSD)
			require.InDelta(t, tc.remaining, *status.RemainingUSD, .00000001)
			require.InDelta(t, tc.used, status.UsedUSD, .00000001)
			require.Empty(t, status.Subscriptions)
		})
	}
}

func TestPixelLegacyConfigurationMigration(t *testing.T) {
	for _, baseURL := range []string{"https://pixelapi.cc", "https://ai-pixel.online", "https://api.ai-pixel.online/v1"} {
		provider, err := normalizeExternalSubscriptionStoredProvider(externalSubscriptionStoredProvider{
			ID: "pixel", Name: "PixelAPI", Enabled: true, Template: ExternalSubscriptionTemplateActiveSubscriptions,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyAuto, APIBaseURL: baseURL, APIToken: "pat-existing", MatchKeywords: []string{"pixel"},
		})
		require.NoError(t, err)
		require.Equal(t, ExternalSubscriptionTemplatePixelAccessToken, provider.Template)
		require.Equal(t, ExternalSubscriptionBalanceStrategyPixelUserQuota, provider.BalanceStrategy)
		require.Equal(t, DefaultPixelSubscriptionAPIBaseURL, provider.APIBaseURL)
		require.Equal(t, "pat-existing", provider.APIToken)
		require.True(t, provider.Enabled)
	}
}
