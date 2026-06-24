package admin

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/pkg/usagestats"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func setupAccountListRouter() (*gin.Engine, *stubAdminService) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	adminSvc := newStubAdminService()
	handler := NewAccountHandler(adminSvc, nil, nil, nil, nil, nil, nil, nil, nil, nil, nil, nil, nil, nil)
	router.GET("/api/v1/admin/accounts", handler.List)
	return router, adminSvc
}

type accountListUsageLogRepoStub struct {
	service.UsageLogRepository

	batchStart time.Time
	batchIDs   []int64
	batchStats map[int64]*usagestats.AccountStats
}

func (s *accountListUsageLogRepoStub) GetAccountWindowStatsBatch(ctx context.Context, accountIDs []int64, startTime time.Time) (map[int64]*usagestats.AccountStats, error) {
	s.batchStart = startTime
	s.batchIDs = append([]int64(nil), accountIDs...)
	result := make(map[int64]*usagestats.AccountStats, len(accountIDs))
	for _, accountID := range accountIDs {
		if stats, ok := s.batchStats[accountID]; ok {
			result[accountID] = stats
		}
	}
	return result, nil
}

func (s *accountListUsageLogRepoStub) GetAccountWindowStats(ctx context.Context, accountID int64, startTime time.Time) (*usagestats.AccountStats, error) {
	if stats, ok := s.batchStats[accountID]; ok {
		return stats, nil
	}
	return &usagestats.AccountStats{}, nil
}

type accountListSettingRepoStub struct {
	service.SettingRepository
	values map[string]string
}

func (s *accountListSettingRepoStub) GetValue(_ context.Context, key string) (string, error) {
	value, ok := s.values[key]
	if !ok {
		return "", service.ErrSettingNotFound
	}
	return value, nil
}

func setupAccountListRouterWithTokenQuotaResetAt(tokenResetAt string) (*gin.Engine, *stubAdminService, *accountListUsageLogRepoStub) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	adminSvc := newStubAdminService()
	adminSvc.accounts = []service.Account{
		{
			ID:        303,
			Name:      "mimo-account",
			Platform:  service.PlatformAnthropic,
			Type:      service.AccountTypeAPIKey,
			Status:    service.StatusActive,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
	}
	usageRepo := &accountListUsageLogRepoStub{
		batchStats: map[int64]*usagestats.AccountStats{
			303: {Requests: 12, Tokens: 250000, Cost: 0, StandardCost: 0, UserCost: 0},
		},
	}
	settingRepo := &accountListSettingRepoStub{
		values: map[string]string{
			service.SettingKeyExternalSubscriptionAccountQuotaProgress: `{"303:mimo:mimo_token_plan:xiaomi mimo":{"enabled":true,"mode":"token_total","tokenTotal":1000000,"tokenResetAt":"` + tokenResetAt + `"}}`,
		},
	}
	accountUsageService := service.NewAccountUsageService(nil, usageRepo, nil, nil, nil, service.NewUsageCache(), nil, nil)
	externalConfigService := service.NewExternalSubscriptionConfigService(service.NewSettingService(settingRepo, &config.Config{}))
	handler := NewAccountHandler(adminSvc, nil, nil, nil, nil, nil, accountUsageService, nil, nil, nil, nil, nil, nil, externalConfigService)
	router.GET("/api/v1/admin/accounts", handler.List)
	return router, adminSvc, usageRepo
}

func setupAccountListRouterWithTokenQuota() (*gin.Engine, *stubAdminService, *accountListUsageLogRepoStub) {
	return setupAccountListRouterWithTokenQuotaResetAt("2026-06-11T00:00:00Z")
}

func setupAccountListRouterWithTokenQuotaSettings(settings string) (*gin.Engine, *accountListUsageLogRepoStub) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	adminSvc := newStubAdminService()
	adminSvc.accounts = []service.Account{
		{
			ID:        303,
			Name:      "mimo-account",
			Platform:  service.PlatformAnthropic,
			Type:      service.AccountTypeAPIKey,
			Status:    service.StatusActive,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
	}
	usageRepo := &accountListUsageLogRepoStub{
		batchStats: map[int64]*usagestats.AccountStats{
			303: {Requests: 12, Tokens: 250000, Cost: 0, StandardCost: 0, UserCost: 0},
		},
	}
	settingRepo := &accountListSettingRepoStub{
		values: map[string]string{
			service.SettingKeyExternalSubscriptionAccountQuotaProgress: settings,
		},
	}
	accountUsageService := service.NewAccountUsageService(nil, usageRepo, nil, nil, nil, service.NewUsageCache(), nil, nil)
	externalConfigService := service.NewExternalSubscriptionConfigService(service.NewSettingService(settingRepo, &config.Config{}))
	handler := NewAccountHandler(adminSvc, nil, nil, nil, nil, nil, accountUsageService, nil, nil, nil, nil, nil, nil, externalConfigService)
	router.GET("/api/v1/admin/accounts", handler.List)
	return router, usageRepo
}

func TestAccountHandlerListIncludesCreatedAt(t *testing.T) {
	router, adminSvc := setupAccountListRouter()

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/accounts?page=1&page_size=20&sort_by=created_at&sort_order=desc", nil)
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
	require.Equal(t, "created_at", adminSvc.lastListAccounts.sortBy)

	var payload struct {
		Data struct {
			Items []struct {
				ID        int64  `json:"id"`
				CreatedAt string `json:"created_at"`
			} `json:"items"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &payload))
	require.Len(t, payload.Data.Items, 1)

	createdAt := payload.Data.Items[0].CreatedAt
	require.NotEmpty(t, createdAt)
	require.True(t, strings.HasSuffix(createdAt, "Z"), "created_at should be serialized as UTC")
	parsed, err := time.Parse(time.RFC3339Nano, createdAt)
	require.NoError(t, err)
	_, offset := parsed.Zone()
	require.Equal(t, 0, offset)
}

func TestAccountHandlerListIncludesExternalQuotaTokenStats(t *testing.T) {
	router, _, usageRepo := setupAccountListRouterWithTokenQuota()

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/accounts?page=1&page_size=20", nil)
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)

	var payload struct {
		Data struct {
			Items []struct {
				ID                      int64 `json:"id"`
				ExternalQuotaTokenStats map[string]struct {
					Requests int64 `json:"requests"`
					Tokens   int64 `json:"tokens"`
				} `json:"external_quota_token_stats"`
			} `json:"items"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &payload))
	require.Len(t, payload.Data.Items, 1)
	require.Equal(t, int64(303), payload.Data.Items[0].ID)
	stats := payload.Data.Items[0].ExternalQuotaTokenStats["303:mimo:mimo_token_plan:xiaomi mimo"]
	require.Equal(t, int64(12), stats.Requests)
	require.Equal(t, int64(250000), stats.Tokens)
	require.Equal(t, []int64{303}, usageRepo.batchIDs)
	require.Equal(t, "2026-06-11T00:00:00Z", usageRepo.batchStart.UTC().Format(time.RFC3339))
}

func TestAccountHandlerListIgnoresFutureExternalQuotaTokenWindow(t *testing.T) {
	router, _, usageRepo := setupAccountListRouterWithTokenQuotaResetAt("2999-06-11T00:00:00Z")

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/accounts?page=1&page_size=20", nil)
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
	require.Empty(t, usageRepo.batchIDs)

	var payload struct {
		Data struct {
			Items []struct {
				ExternalQuotaTokenStats map[string]struct {
					Tokens int64 `json:"tokens"`
				} `json:"external_quota_token_stats"`
			} `json:"items"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &payload))
	require.Len(t, payload.Data.Items, 1)
	require.Nil(t, payload.Data.Items[0].ExternalQuotaTokenStats)
}

func TestAccountHandlerListFallsBackToAccountTokenWindow(t *testing.T) {
	router, usageRepo := setupAccountListRouterWithTokenQuotaSettings(`{"303:account":{"enabled":true,"mode":"token_total","tokenTotal":1000000,"tokenResetAt":"2026-06-11T00:00:00Z"},"303:mimo:mimo_token_plan:xiaomi mimo":{"enabled":true,"mode":"token_total","tokenTotal":1000000,"tokenResetAt":"2999-06-11T00:00:00Z"}}`)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/accounts?page=1&page_size=20", nil)
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)

	var payload struct {
		Data struct {
			Items []struct {
				ExternalQuotaTokenStats map[string]struct {
					Tokens int64 `json:"tokens"`
				} `json:"external_quota_token_stats"`
			} `json:"items"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &payload))
	require.Len(t, payload.Data.Items, 1)
	stats := payload.Data.Items[0].ExternalQuotaTokenStats["303:mimo:mimo_token_plan:xiaomi mimo"]
	require.Equal(t, int64(250000), stats.Tokens)
	require.Equal(t, []int64{303}, usageRepo.batchIDs)
	require.Equal(t, "2026-06-11T00:00:00Z", usageRepo.batchStart.UTC().Format(time.RFC3339))
}
