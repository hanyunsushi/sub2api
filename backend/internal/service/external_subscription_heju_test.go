package service

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestHejuAPIKeyScopesAndFailures(t *testing.T) {
	for _, tc := range []struct {
		name, account, token string
		status               int
		unlimited, failure   bool
	}{
		{"limited", `{"success":true,"data":{"remaining":120.5,"unit":"USD"}}`, `{"code":true,"data":{"total_granted":5000000,"total_used":1250000,"total_available":3750000,"unlimited_quota":false,"expires_at":1900000000}}`, 200, false, false},
		{"unlimited_negative_quota", `{"success":true,"data":{"remaining":29.032322,"unit":"USD"}}`, `{"code":true,"data":{"total_granted":-3831,"total_used":15480008,"total_available":-15483839,"unlimited_quota":true,"expires_at":0}}`, 200, true, false},
		{"wrong_account_success_field", `{"code":true,"data":{"remaining":10,"unit":"USD"}}`, `{}`, 200, false, true},
		{"wrong_token_success_field", `{"success":true,"data":{"remaining":10,"unit":"USD"}}`, `{"success":true,"data":{}}`, 200, false, true},
		{"missing_wallet", `{"success":true,"data":{"unit":"USD"}}`, `{}`, 200, false, true},
		{"invalid_wallet_number", `{"success":true,"data":{"remaining":"NaN","unit":"USD"}}`, `{}`, 200, false, true},
		{"missing_token_fields", `{"success":true,"data":{"remaining":10,"unit":"USD"}}`, `{"code":true,"data":{"total_used":0,"unlimited_quota":false}}`, 200, false, true},
		{"unauthorized", `{}`, `{}`, 401, false, true},
		{"rate_limited", `{}`, `{}`, 429, false, true},
		{"service_unavailable", `{}`, `{}`, 503, false, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				require.Equal(t, "GET", r.Method)
				require.Equal(t, "Bearer sk-heju-test", r.Header.Get("Authorization"))
				require.Empty(t, r.Header.Get("Cookie"))
				require.Empty(t, r.Header.Get("New-Api-User"))
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tc.status)
				switch r.URL.Path {
				case "/api/usage/account":
					_, _ = fmt.Fprint(w, tc.account)
				case "/api/usage/token/":
					_, _ = fmt.Fprint(w, tc.token)
				default:
					t.Errorf("unexpected endpoint %s", r.URL.Path)
				}
			}))
			defer server.Close()
			repo := newExternalSubscriptionConfigRepoWithProviders([]externalSubscriptionStoredProvider{{
				ID: "heju", Name: "合聚 API", Enabled: true, Scheme: ExternalSubscriptionSchemeHejuAPIKey,
				Template: ExternalSubscriptionTemplateHejuAPIKey, BalanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
				APIBaseURL: server.URL + "/v1", APIToken: "sk-heju-test",
			}})
			svc := NewExternalSubscriptionConfigService(NewSettingService(repo, &config.Config{}))
			statuses, err := svc.GetStatuses(context.Background(), ExternalSubscriptionStatusOptions{ForceRefresh: true})
			require.NoError(t, err)
			got := requireExternalSubscriptionStatus(t, statuses, "heju")
			if tc.failure {
				require.NotEmpty(t, got.ErrorCode)
				require.Nil(t, got.RemainingUSD, "failure must not become wallet zero")
				require.Nil(t, got.TokenQuota)
				return
			}
			require.Empty(t, got.ErrorCode)
			require.Equal(t, "USD", got.Currency)
			require.Nil(t, got.TotalLimitUSD, "wallet has no inferred total")
			require.Zero(t, got.UsedUSD, "key usage must not enter account usage")
			require.Empty(t, got.Subscriptions)
			require.Zero(t, got.ActiveCount)
			require.NotNil(t, got.TokenQuota)
			require.Equal(t, tc.unlimited, got.TokenQuota.Unlimited)
			if tc.unlimited {
				require.InDelta(t, 29.032322, *got.RemainingUSD, 0.000001)
				require.InDelta(t, 30.960016, got.TokenQuota.UsedUSD, 0.000001)
				require.Nil(t, got.TokenQuota.RemainingUSD)
				require.Nil(t, got.TokenQuota.TotalLimitUSD)
				require.Nil(t, got.TokenQuota.ExpiresAt)
			} else {
				require.Equal(t, 120.5, *got.RemainingUSD)
				require.Equal(t, 2.5, got.TokenQuota.UsedUSD)
				require.Equal(t, 10.0, *got.TokenQuota.TotalLimitUSD)
				require.Equal(t, 7.5, *got.TokenQuota.RemainingUSD)
				require.Equal(t, int64(1900000000), got.TokenQuota.ExpiresAt.Unix())
			}
			// Cached snapshots must not share mutable key-quota pointers.
			copy := cloneExternalSubscriptionProviderStatuses(statuses)
			for i := range copy {
				if copy[i].Provider == "heju" {
					copy[i].TokenQuota.UsedUSD = 999
				}
			}
			require.NotEqual(t, 999.0, got.TokenQuota.UsedUSD)
		})
	}
}
