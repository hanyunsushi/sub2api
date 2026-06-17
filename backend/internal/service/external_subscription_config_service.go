package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"golang.org/x/sync/singleflight"
)

const (
	ExternalSubscriptionTemplateNewAPIConsole              = "newapi_console"
	ExternalSubscriptionTemplateActiveSubscriptions        = "active_subscriptions"
	ExternalSubscriptionTemplateBuzzBalance                = "buzz_balance"
	ExternalSubscriptionTemplateOpenRouterCredits          = "openrouter_credits"
	ExternalSubscriptionTemplateCloudflareAIGatewayCredits = "cloudflare_ai_gateway_credits"
	ExternalSubscriptionTemplateRawChatSubscriptions       = "rawchat_subscriptions"
	ExternalSubscriptionTemplateMimoTokenPlan              = "mimo_token_plan"

	ExternalSubscriptionBalanceStrategyAuto                    = "auto"
	ExternalSubscriptionBalanceStrategyNewAPIUserQuota         = "newapi_user_quota"
	ExternalSubscriptionBalanceStrategyNewAPISubscription      = "newapi_subscription"
	ExternalSubscriptionBalanceStrategyActiveSubscriptions     = "active_subscriptions"
	ExternalSubscriptionBalanceStrategyAuthMeBalance           = "auth_me_balance"
	ExternalSubscriptionBalanceStrategyActiveWithAuthMeBalance = "active_with_auth_me_balance"

	externalSubscriptionStatusCacheTTL             = 60 * time.Second
	externalSubscriptionStatusStaleTTL             = 30 * time.Minute
	externalSubscriptionStatusBackgroundRefreshTTL = 30 * time.Second
	externalSubscriptionProviderStatusTimeout      = 6 * time.Second

	ExternalSubscriptionAccountQuotaProgressModeStatusTotal = "status_total"
	ExternalSubscriptionAccountQuotaProgressModeCustomTotal = "custom_total"
	ExternalSubscriptionAccountQuotaProgressModeTokenTotal  = "token_total"
)

var externalSubscriptionIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]{1,63}$`)

type ExternalSubscriptionProvider struct {
	ID                     string   `json:"id"`
	Name                   string   `json:"name"`
	Enabled                bool     `json:"enabled"`
	Template               string   `json:"template"`
	BalanceStrategy        string   `json:"balance_strategy"`
	APIBaseURL             string   `json:"api_base_url"`
	LogoURL                string   `json:"logo_url,omitempty"`
	APIToken               string   `json:"api_token,omitempty"`
	APITokenConfigured     bool     `json:"api_token_configured"`
	UserID                 string   `json:"user_id,omitempty"`
	RefreshToken           string   `json:"refresh_token,omitempty"`
	RefreshTokenConfigured bool     `json:"refresh_token_configured"`
	MatchKeywords          []string `json:"match_keywords"`
	SortOrder              int      `json:"sort_order"`
}

type ExternalSubscriptionProviderInput struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	Enabled         bool     `json:"enabled"`
	Template        string   `json:"template"`
	BalanceStrategy string   `json:"balance_strategy"`
	APIBaseURL      string   `json:"api_base_url"`
	LogoURL         string   `json:"logo_url"`
	APIToken        string   `json:"api_token"`
	UserID          string   `json:"user_id"`
	RefreshToken    string   `json:"refresh_token"`
	MatchKeywords   []string `json:"match_keywords"`
	SortOrder       int      `json:"sort_order"`
}

type ExternalSubscriptionProviderStatus struct {
	Name                   string   `json:"name"`
	Template               string   `json:"template"`
	BalanceStrategy        string   `json:"balance_strategy"`
	LogoURL                string   `json:"logo_url,omitempty"`
	APITokenConfigured     bool     `json:"api_token_configured"`
	RefreshTokenConfigured bool     `json:"refresh_token_configured"`
	MatchKeywords          []string `json:"match_keywords"`
	SortOrder              int      `json:"sort_order"`
	ExternalSubscriptionStatus
}

type externalSubscriptionStoredProvider struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	Enabled         bool     `json:"enabled"`
	Template        string   `json:"template"`
	BalanceStrategy string   `json:"balance_strategy,omitempty"`
	APIBaseURL      string   `json:"api_base_url"`
	LogoURL         string   `json:"logo_url,omitempty"`
	APIToken        string   `json:"api_token"`
	UserID          string   `json:"user_id,omitempty"`
	RefreshToken    string   `json:"refresh_token,omitempty"`
	MatchKeywords   []string `json:"match_keywords"`
	SortOrder       int      `json:"sort_order"`
}

type ExternalSubscriptionConfigService struct {
	settingService *SettingService
	statusCacheMu  sync.Mutex
	statusCache    *externalSubscriptionStatusCache
	statusSF       singleflight.Group
}

type externalSubscriptionStatusCache struct {
	fingerprint string
	expiresAt   time.Time
	staleUntil  time.Time
	statuses    []ExternalSubscriptionProviderStatus
}

type ExternalSubscriptionStatusOptions struct {
	ForceRefresh bool
}

type ExternalSubscriptionAccountQuotaProgressPreference struct {
	Enabled      bool     `json:"enabled"`
	Mode         string   `json:"mode"`
	CustomTotal  *float64 `json:"customTotal,omitempty"`
	TokenTotal   *float64 `json:"tokenTotal,omitempty"`
	TokenResetAt string   `json:"tokenResetAt,omitempty"`
}

func NewExternalSubscriptionConfigService(settingService *SettingService) *ExternalSubscriptionConfigService {
	return &ExternalSubscriptionConfigService{settingService: settingService}
}

func (s *ExternalSubscriptionConfigService) ListProviders(ctx context.Context) ([]ExternalSubscriptionProvider, error) {
	stored, err := s.loadStoredProviders(ctx)
	if err != nil {
		return nil, err
	}
	return publicExternalSubscriptionProviders(stored), nil
}

func (s *ExternalSubscriptionConfigService) CreateProvider(ctx context.Context, input ExternalSubscriptionProviderInput) (ExternalSubscriptionProvider, error) {
	stored, err := s.loadStoredProviders(ctx)
	if err != nil {
		return ExternalSubscriptionProvider{}, err
	}
	next, err := normalizeExternalSubscriptionInput(input, nil)
	if err != nil {
		return ExternalSubscriptionProvider{}, err
	}
	for _, provider := range stored {
		if provider.ID == next.ID {
			return ExternalSubscriptionProvider{}, infraerrors.Conflict("EXTERNAL_SUBSCRIPTION_PROVIDER_EXISTS", "external subscription provider already exists")
		}
	}
	stored = append(stored, next)
	if err := s.saveStoredProviders(ctx, stored); err != nil {
		return ExternalSubscriptionProvider{}, err
	}
	if canMarkDeletedExternalSubscriptionProvider(next.ID) {
		if err := s.removeDeletedDefaultProvider(ctx, next.ID); err != nil {
			return ExternalSubscriptionProvider{}, err
		}
	}
	s.invalidateStatusesCache(ctx)
	return publicExternalSubscriptionProvider(next), nil
}

func (s *ExternalSubscriptionConfigService) UpdateProvider(ctx context.Context, id string, input ExternalSubscriptionProviderInput) (ExternalSubscriptionProvider, error) {
	id = strings.TrimSpace(strings.ToLower(id))
	stored, err := s.loadStoredProviders(ctx)
	if err != nil {
		return ExternalSubscriptionProvider{}, err
	}
	for index := range stored {
		if stored[index].ID != id {
			continue
		}
		next, err := normalizeExternalSubscriptionInput(input, &stored[index])
		if err != nil {
			return ExternalSubscriptionProvider{}, err
		}
		next.ID = id
		stored[index] = next
		if err := s.saveStoredProviders(ctx, stored); err != nil {
			return ExternalSubscriptionProvider{}, err
		}
		if canMarkDeletedExternalSubscriptionProvider(next.ID) {
			if err := s.removeDeletedDefaultProvider(ctx, next.ID); err != nil {
				return ExternalSubscriptionProvider{}, err
			}
		}
		s.invalidateStatusesCache(ctx)
		return publicExternalSubscriptionProvider(next), nil
	}
	return ExternalSubscriptionProvider{}, infraerrors.NotFound("EXTERNAL_SUBSCRIPTION_PROVIDER_NOT_FOUND", "external subscription provider not found")
}

func (s *ExternalSubscriptionConfigService) DeleteProvider(ctx context.Context, id string) error {
	id = strings.TrimSpace(strings.ToLower(id))
	stored, err := s.loadStoredProviders(ctx)
	if err != nil {
		return err
	}
	next := stored[:0]
	deleted := false
	for _, provider := range stored {
		if provider.ID == id {
			deleted = true
			continue
		}
		next = append(next, provider)
	}
	if !deleted {
		return infraerrors.NotFound("EXTERNAL_SUBSCRIPTION_PROVIDER_NOT_FOUND", "external subscription provider not found")
	}
	if err := s.saveStoredProviders(ctx, next); err != nil {
		return err
	}
	if canMarkDeletedExternalSubscriptionProvider(id) {
		if err := s.addDeletedDefaultProvider(ctx, id); err != nil {
			return err
		}
	}
	s.invalidateStatusesCache(ctx)
	return nil
}

func (s *ExternalSubscriptionConfigService) GetStatuses(ctx context.Context, options ...ExternalSubscriptionStatusOptions) ([]ExternalSubscriptionProviderStatus, error) {
	stored, err := s.loadStoredProviders(ctx)
	if err != nil {
		return nil, err
	}
	fingerprint := externalSubscriptionProvidersFingerprint(stored)
	forceRefresh := len(options) > 0 && options[0].ForceRefresh
	if !forceRefresh {
		if cached := s.getFreshCachedStatuses(fingerprint); cached != nil {
			return cached, nil
		}
		if cached := s.getStaleCachedStatuses(fingerprint); cached != nil {
			s.refreshStatusesCacheAsync(fingerprint, stored)
			return cached, nil
		}
	}

	value, err, _ := s.statusSF.Do(fingerprint, func() (any, error) {
		if !forceRefresh {
			if cached := s.getFreshCachedStatuses(fingerprint); cached != nil {
				return cached, nil
			}
		}
		return s.getStatusesUncached(ctx, stored, fingerprint)
	})
	if err != nil {
		return nil, err
	}
	return cloneExternalSubscriptionProviderStatuses(value.([]ExternalSubscriptionProviderStatus)), nil
}

func (s *ExternalSubscriptionConfigService) refreshStatusesCacheAsync(fingerprint string, stored []externalSubscriptionStoredProvider) {
	stored = cloneExternalSubscriptionStoredProviders(stored)
	go func() {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("external_subscription: background status refresh panic", "panic", rec)
			}
		}()
		ctx, cancel := context.WithTimeout(context.Background(), externalSubscriptionStatusBackgroundRefreshTTL)
		defer cancel()
		_, _, _ = s.statusSF.Do(fingerprint, func() (any, error) {
			if cached := s.getFreshCachedStatuses(fingerprint); cached != nil {
				return cached, nil
			}
			return s.getStatusesUncached(ctx, stored, fingerprint)
		})
	}()
}

func (s *ExternalSubscriptionConfigService) getStatusesUncached(ctx context.Context, stored []externalSubscriptionStoredProvider, fingerprint string) ([]ExternalSubscriptionProviderStatus, error) {
	type providerResult struct {
		index        int
		status       *ExternalSubscriptionStatus
		nextProvider *externalSubscriptionStoredProvider
		err          error
	}

	results := make([]providerResult, len(stored))
	var wg sync.WaitGroup
	for index := range stored {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			defer func() {
				if rec := recover(); rec != nil {
					slog.Error("external_subscription: provider status panic",
						"provider", stored[index].Name, "template", stored[index].Template, "panic", rec)
					results[index] = providerResult{
						index: index,
						err:   fmt.Errorf("provider status panic: %v", rec),
					}
				}
			}()
			providerCtx, cancel := context.WithTimeout(ctx, externalSubscriptionProviderStatusTimeout)
			defer cancel()
			provider := stored[index]
			status, nextProvider, err := s.getStatusForStoredProvider(providerCtx, provider)
			results[index] = providerResult{
				index:        index,
				status:       status,
				nextProvider: nextProvider,
				err:          err,
			}
		}(index)
	}
	wg.Wait()

	statuses := make([]ExternalSubscriptionProviderStatus, 0, len(stored))
	updated := false
	for _, result := range results {
		provider := stored[result.index]
		status := result.status
		if result.err != nil {
			status = externalSubscriptionProviderErrorStatus(provider, result.err)
		}
		if result.nextProvider != nil {
			stored[result.index] = *result.nextProvider
			updated = true
		}
		publicProvider := publicExternalSubscriptionProvider(stored[result.index])
		statuses = append(statuses, ExternalSubscriptionProviderStatus{
			Name:                       publicProvider.Name,
			Template:                   publicProvider.Template,
			BalanceStrategy:            publicProvider.BalanceStrategy,
			LogoURL:                    publicProvider.LogoURL,
			APITokenConfigured:         publicProvider.APITokenConfigured,
			RefreshTokenConfigured:     publicProvider.RefreshTokenConfigured,
			MatchKeywords:              publicProvider.MatchKeywords,
			SortOrder:                  publicProvider.SortOrder,
			ExternalSubscriptionStatus: *status,
		})
	}
	if updated {
		if err := s.saveStoredProviders(ctx, stored); err != nil {
			return nil, err
		}
	}
	sortExternalSubscriptionStatuses(statuses)
	statuses = s.mergeCachedStatusesForTransientErrors(ctx, fingerprint, statuses)
	s.setCachedStatuses(fingerprint, statuses)
	_ = s.SaveDisplayStatusesSnapshot(ctx, statuses)
	return cloneExternalSubscriptionProviderStatuses(statuses), nil
}

func (s *ExternalSubscriptionConfigService) GetDisplayStatusesSnapshot(ctx context.Context) ([]ExternalSubscriptionProviderStatus, error) {
	raw, err := s.settingService.settingRepo.GetValue(ctx, SettingKeyExternalSubscriptionDisplayStatuses)
	if err != nil {
		if errors.Is(err, ErrSettingNotFound) {
			return []ExternalSubscriptionProviderStatus{}, nil
		}
		return nil, fmt.Errorf("get external subscription display status snapshot: %w", err)
	}
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return []ExternalSubscriptionProviderStatus{}, nil
	}
	var statuses []ExternalSubscriptionProviderStatus
	if err := json.Unmarshal([]byte(raw), &statuses); err != nil {
		return []ExternalSubscriptionProviderStatus{}, nil
	}
	return cloneExternalSubscriptionProviderStatuses(statuses), nil
}

func (s *ExternalSubscriptionConfigService) SaveDisplayStatusesSnapshot(ctx context.Context, statuses []ExternalSubscriptionProviderStatus) error {
	raw, err := json.Marshal(cloneExternalSubscriptionProviderStatuses(statuses))
	if err != nil {
		return fmt.Errorf("marshal external subscription display status snapshot: %w", err)
	}
	if err := s.settingService.settingRepo.Set(ctx, SettingKeyExternalSubscriptionDisplayStatuses, string(raw)); err != nil {
		return fmt.Errorf("save external subscription display status snapshot: %w", err)
	}
	return nil
}

func (s *ExternalSubscriptionConfigService) GetAccountQuotaProgressSettings(ctx context.Context) (map[string]ExternalSubscriptionAccountQuotaProgressPreference, error) {
	raw, err := s.settingService.settingRepo.GetValue(ctx, SettingKeyExternalSubscriptionAccountQuotaProgress)
	if err != nil {
		if errors.Is(err, ErrSettingNotFound) {
			return map[string]ExternalSubscriptionAccountQuotaProgressPreference{}, nil
		}
		return nil, fmt.Errorf("get external subscription account quota progress settings: %w", err)
	}
	settings, err := decodeExternalSubscriptionAccountQuotaProgressSettings(raw)
	if err != nil {
		return nil, err
	}
	return settings, nil
}

func (s *ExternalSubscriptionConfigService) UpdateAccountQuotaProgressSettings(ctx context.Context, input map[string]ExternalSubscriptionAccountQuotaProgressPreference) (map[string]ExternalSubscriptionAccountQuotaProgressPreference, error) {
	settings := normalizeExternalSubscriptionAccountQuotaProgressSettings(input)
	raw, err := json.Marshal(settings)
	if err != nil {
		return nil, fmt.Errorf("marshal external subscription account quota progress settings: %w", err)
	}
	if err := s.settingService.settingRepo.Set(ctx, SettingKeyExternalSubscriptionAccountQuotaProgress, string(raw)); err != nil {
		return nil, fmt.Errorf("save external subscription account quota progress settings: %w", err)
	}
	return settings, nil
}

func (s *ExternalSubscriptionConfigService) mergeCachedStatusesForTransientErrors(ctx context.Context, fingerprint string, statuses []ExternalSubscriptionProviderStatus) []ExternalSubscriptionProviderStatus {
	cached := s.getAnyCachedStatuses(fingerprint)
	if len(cached) == 0 {
		snapshot, err := s.GetDisplayStatusesSnapshot(ctx)
		if err != nil || len(snapshot) == 0 {
			return statuses
		}
		cached = snapshot
	}
	previousByProvider := make(map[string]ExternalSubscriptionProviderStatus, len(cached))
	for _, status := range cached {
		previousByProvider[status.Provider] = status
	}
	merged := cloneExternalSubscriptionProviderStatuses(statuses)
	for index, status := range merged {
		previous, ok := previousByProvider[status.Provider]
		if !ok || !shouldKeepExternalSubscriptionPreviousStatus(status, previous) {
			continue
		}
		kept := previous
		kept.Name = status.Name
		kept.Template = status.Template
		kept.BalanceStrategy = status.BalanceStrategy
		kept.LogoURL = status.LogoURL
		kept.Enabled = status.Enabled
		kept.Configured = status.Configured
		kept.APITokenConfigured = status.APITokenConfigured
		kept.RefreshTokenConfigured = status.RefreshTokenConfigured
		kept.MatchKeywords = append([]string(nil), status.MatchKeywords...)
		kept.SortOrder = status.SortOrder
		kept.SiteURL = status.SiteURL
		merged[index] = kept
	}
	return merged
}

func shouldKeepExternalSubscriptionPreviousStatus(next, previous ExternalSubscriptionProviderStatus) bool {
	if strings.TrimSpace(next.ErrorCode) == "" || strings.TrimSpace(previous.ErrorCode) != "" {
		return false
	}
	if isExternalSubscriptionInvalidStatusCode(next.ErrorCode) {
		return false
	}
	return previous.RemainingUSD != nil || previous.TotalLimitUSD != nil || previous.ActiveCount > 0
}

func isExternalSubscriptionInvalidStatusCode(code string) bool {
	normalized := strings.ToUpper(strings.TrimSpace(code))
	return normalized == "401" || normalized == "INVALID_TOKEN" || normalized == "TOKEN_EXPIRED"
}

func (s *ExternalSubscriptionConfigService) getStatusForStoredProvider(ctx context.Context, provider externalSubscriptionStoredProvider) (*ExternalSubscriptionStatus, *externalSubscriptionStoredProvider, error) {
	cfg := externalSubscriptionRuntimeConfig(provider)
	directRepo := &externalSubscriptionDirectSettingsRepo{
		settings: ExternalSubscriptionSettings{
			Enabled:      provider.Enabled,
			APIBaseURL:   normalizeExternalSubscriptionAPIBaseURL(provider.APIBaseURL, provider.APIBaseURL),
			APIToken:     strings.TrimSpace(provider.APIToken),
			UserID:       strings.TrimSpace(provider.UserID),
			RefreshToken: strings.TrimSpace(provider.RefreshToken),
		},
		cfg: cfg,
	}
	runner := newExternalSubscriptionService(s.settingService, cfg)
	runner.settingService = &SettingService{
		settingRepo: directRepo,
	}

	var status *ExternalSubscriptionStatus
	var err error
	status, err = runner.getStatusWithBalanceStrategy(ctx, cfg, provider.Template, effectiveExternalSubscriptionBalanceStrategy(provider))
	if err != nil {
		return nil, nil, err
	}
	status.Provider = provider.ID
	next := provider
	if saved, ok := runner.settingService.settingRepo.(*externalSubscriptionDirectSettingsRepo); ok {
		if saved.settings.APIToken != provider.APIToken || saved.settings.RefreshToken != provider.RefreshToken {
			next.APIToken = saved.settings.APIToken
			next.RefreshToken = saved.settings.RefreshToken
			return status, &next, nil
		}
	}
	return status, nil, nil
}

func (s *ExternalSubscriptionConfigService) loadStoredProviders(ctx context.Context) ([]externalSubscriptionStoredProvider, error) {
	raw, err := s.settingService.settingRepo.GetValue(ctx, SettingKeyExternalSubscriptionProviders)
	if err != nil {
		if errors.Is(err, ErrSettingNotFound) {
			return defaultExternalSubscriptionProviders(), nil
		}
		return nil, fmt.Errorf("get external subscription providers: %w", err)
	}
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return defaultExternalSubscriptionProviders(), nil
	}
	var providers []externalSubscriptionStoredProvider
	if err := json.Unmarshal([]byte(raw), &providers); err != nil {
		return nil, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_PROVIDERS_INVALID", "external subscription providers setting is invalid")
	}
	normalized := make([]externalSubscriptionStoredProvider, 0, len(providers))
	for _, provider := range providers {
		next, err := normalizeExternalSubscriptionStoredProvider(provider)
		if err != nil {
			return nil, err
		}
		normalized = append(normalized, next)
	}
	sortExternalSubscriptionStoredProviders(normalized)
	merged, updated, err := s.mergeDefaultProviders(ctx, normalized)
	if err != nil {
		return nil, err
	}
	if updated {
		if err := s.saveStoredProviders(ctx, merged); err != nil {
			return nil, err
		}
		return merged, nil
	}
	return normalized, nil
}

func (s *ExternalSubscriptionConfigService) mergeDefaultProviders(ctx context.Context, stored []externalSubscriptionStoredProvider) ([]externalSubscriptionStoredProvider, bool, error) {
	deletedDefaults, err := s.loadDeletedDefaultProviders(ctx)
	if err != nil {
		return nil, false, err
	}
	byID := make(map[string]int, len(stored))
	for index, provider := range stored {
		byID[provider.ID] = index
	}
	shouldMergeDefaults := shouldMergeDefaultExternalSubscriptionProviders(stored)
	updated := false
	for _, defaultProvider := range defaultExternalSubscriptionProviders() {
		if deletedDefaults[defaultProvider.ID] {
			continue
		}
		if !shouldMergeDefaults {
			continue
		}
		if _, ok := byID[defaultProvider.ID]; ok {
			continue
		}
		stored = append(stored, defaultProvider)
		byID[defaultProvider.ID] = len(stored) - 1
		updated = true
	}
	if updated {
		sortExternalSubscriptionStoredProviders(stored)
	}
	return stored, updated, nil
}

func isDefaultExternalSubscriptionProvider(id string) bool {
	switch strings.TrimSpace(strings.ToLower(id)) {
	case "openrouter", "cloudflare", "rawchat", "mimo":
		return true
	default:
		return false
	}
}

func canMarkDeletedExternalSubscriptionProvider(id string) bool {
	switch strings.TrimSpace(strings.ToLower(id)) {
	case "buzz", "tcdmx", "qlhazycoder", "xhyapi", "pixel", "liust", "packycode", "openrouter", "cloudflare", "rawchat", "mimo":
		return true
	default:
		return false
	}
}

func shouldMergeDefaultExternalSubscriptionProviders(providers []externalSubscriptionStoredProvider) bool {
	count := 0
	for _, provider := range providers {
		if isDefaultExternalSubscriptionProvider(provider.ID) {
			count++
		}
	}
	return count >= 2
}

func (s *ExternalSubscriptionConfigService) loadDeletedDefaultProviders(ctx context.Context) (map[string]bool, error) {
	raw, err := s.settingService.settingRepo.GetValue(ctx, SettingKeyExternalSubscriptionDeletedDefaultProviders)
	if err != nil {
		if errors.Is(err, ErrSettingNotFound) {
			return map[string]bool{}, nil
		}
		return nil, fmt.Errorf("get deleted default external subscription providers: %w", err)
	}
	return decodeExternalSubscriptionDeletedDefaultProviders(raw)
}

func (s *ExternalSubscriptionConfigService) addDeletedDefaultProvider(ctx context.Context, id string) error {
	deleted, err := s.loadDeletedDefaultProviders(ctx)
	if err != nil {
		return err
	}
	id = strings.TrimSpace(strings.ToLower(id))
	if !canMarkDeletedExternalSubscriptionProvider(id) || deleted[id] {
		return nil
	}
	deleted[id] = true
	return s.saveDeletedDefaultProviders(ctx, deleted)
}

func (s *ExternalSubscriptionConfigService) removeDeletedDefaultProvider(ctx context.Context, id string) error {
	deleted, err := s.loadDeletedDefaultProviders(ctx)
	if err != nil {
		return err
	}
	id = strings.TrimSpace(strings.ToLower(id))
	if !deleted[id] {
		return nil
	}
	delete(deleted, id)
	return s.saveDeletedDefaultProviders(ctx, deleted)
}

func (s *ExternalSubscriptionConfigService) saveDeletedDefaultProviders(ctx context.Context, deleted map[string]bool) error {
	ids := make([]string, 0, len(deleted))
	for id := range deleted {
		id = strings.TrimSpace(strings.ToLower(id))
		if canMarkDeletedExternalSubscriptionProvider(id) {
			ids = append(ids, id)
		}
	}
	sort.Strings(ids)
	raw, err := json.Marshal(ids)
	if err != nil {
		return fmt.Errorf("marshal deleted default external subscription providers: %w", err)
	}
	if err := s.settingService.settingRepo.Set(ctx, SettingKeyExternalSubscriptionDeletedDefaultProviders, string(raw)); err != nil {
		return fmt.Errorf("save deleted default external subscription providers: %w", err)
	}
	return nil
}

func mergeExternalSubscriptionKeywords(current []string, defaults []string) []string {
	merged := normalizeExternalSubscriptionKeywords(current)
	seen := make(map[string]struct{}, len(merged))
	for _, keyword := range merged {
		seen[keyword] = struct{}{}
	}
	for _, keyword := range normalizeExternalSubscriptionKeywords(defaults) {
		if _, ok := seen[keyword]; ok {
			continue
		}
		seen[keyword] = struct{}{}
		merged = append(merged, keyword)
	}
	return merged
}

func externalSubscriptionProviderErrorStatus(provider externalSubscriptionStoredProvider, err error) *ExternalSubscriptionStatus {
	code := fmt.Sprintf("%s_SUBSCRIPTION_STATUS_ERROR", strings.ToUpper(provider.ID))
	message := "external subscription status check failed"
	if err != nil {
		message = err.Error()
		if upstreamErr, ok := err.(*externalSubscriptionUpstreamError); ok {
			if strings.TrimSpace(upstreamErr.Code) != "" {
				code = upstreamErr.Code
			}
			if strings.TrimSpace(upstreamErr.Message) != "" {
				message = upstreamErr.Message
			}
		}
	}
	return &ExternalSubscriptionStatus{
		Provider:      provider.ID,
		Enabled:       provider.Enabled,
		Configured:    strings.TrimSpace(provider.APIToken) != "" || strings.TrimSpace(provider.RefreshToken) != "" || strings.TrimSpace(provider.UserID) != "",
		Currency:      "USD",
		SiteURL:       normalizeExternalSubscriptionAPIBaseURL(provider.APIBaseURL, provider.APIBaseURL),
		ErrorCode:     code,
		ErrorMessage:  message,
		Subscriptions: []ExternalSubscriptionItem{},
		RefreshedAt:   time.Now().UTC(),
	}
}

func defaultExternalSubscriptionProviders() []externalSubscriptionStoredProvider {
	return []externalSubscriptionStoredProvider{
		{
			ID:              "buzz",
			Name:            "Buzz",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateBuzzBalance,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
			APIBaseURL:      DefaultBuzzBalanceAPIBaseURL,
			MatchKeywords:   []string{"buzz", "buzzai", "buzzai.cc", "claude"},
			SortOrder:       5,
		},
		{
			ID:              "tcdmx",
			Name:            "TCDMX",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateActiveSubscriptions,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyActiveSubscriptions,
			APIBaseURL:      DefaultTCDMXSubscriptionAPIBaseURL,
			MatchKeywords:   []string{"tcdmx.com", "tcdmx"},
			SortOrder:       10,
		},
		{
			ID:              "qlhazycoder",
			Name:            "qlhazycoder",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateNewAPIConsole,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyNewAPISubscription,
			APIBaseURL:      DefaultQLHazyCoderSubscriptionAPIBaseURL,
			MatchKeywords:   []string{"api.qlhazycoder.top", "qlhazycoder", "qlhazy"},
			SortOrder:       20,
		},
		{
			ID:              "xhyapi",
			Name:            "XHYAPI",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateActiveSubscriptions,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyActiveSubscriptions,
			APIBaseURL:      DefaultXHYAPISubscriptionAPIBaseURL,
			MatchKeywords:   []string{"xhyapi.com", "xhyapi", "xhy"},
			SortOrder:       30,
		},
		{
			ID:              "pixel",
			Name:            "Pixel",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateActiveSubscriptions,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyAuthMeBalance,
			APIBaseURL:      DefaultPixelSubscriptionAPIBaseURL,
			MatchKeywords:   []string{"ai-pixel.online", "pixel"},
			SortOrder:       40,
		},
		{
			ID:              "liust",
			Name:            "liust",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateNewAPIConsole,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyNewAPISubscription,
			APIBaseURL:      DefaultLiustSubscriptionAPIBaseURL,
			MatchKeywords:   []string{"liust.xyz", "liust"},
			SortOrder:       50,
		},
		{
			ID:              "packycode",
			Name:            "PackyCode",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateNewAPIConsole,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyNewAPIUserQuota,
			APIBaseURL:      DefaultPackyCodeSubscriptionAPIBaseURL,
			MatchKeywords:   []string{"packyapi.com", "packycode", "packy"},
			SortOrder:       60,
		},
		externalSubscriptionStoredProvider{
			ID:              "openrouter",
			Name:            "OpenRouter",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateOpenRouterCredits,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
			APIBaseURL:      DefaultOpenRouterCreditsAPIBaseURL,
			MatchKeywords:   []string{"openrouter", "openrouter.ai"},
			SortOrder:       70,
		},
		externalSubscriptionStoredProvider{
			ID:              "cloudflare",
			Name:            "Cloudflare AI Gateway",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateCloudflareAIGatewayCredits,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
			APIBaseURL:      DefaultCloudflareAIGatewayCreditsAPIBaseURL,
			MatchKeywords:   []string{"cloudflare", "ai-gateway", "workers-ai"},
			SortOrder:       80,
		},
		externalSubscriptionStoredProvider{
			ID:              "rawchat",
			Name:            "RawChat",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateRawChatSubscriptions,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
			APIBaseURL:      DefaultRawChatSubscriptionAPIBaseURL,
			MatchKeywords:   []string{"rawchat", "rawchat.cn"},
			SortOrder:       90,
		},
		externalSubscriptionStoredProvider{
			ID:              "mimo",
			Name:            "Xiaomi MiMo",
			Enabled:         false,
			Template:        ExternalSubscriptionTemplateMimoTokenPlan,
			BalanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
			APIBaseURL:      DefaultMimoTokenPlanAPIBaseURL,
			MatchKeywords:   []string{"mimo", "xiaomi", "xiaomimimo"},
			SortOrder:       95,
		},
	}
}

func (s *ExternalSubscriptionConfigService) saveStoredProviders(ctx context.Context, providers []externalSubscriptionStoredProvider) error {
	sortExternalSubscriptionStoredProviders(providers)
	raw, err := json.Marshal(providers)
	if err != nil {
		return fmt.Errorf("marshal external subscription providers: %w", err)
	}
	updates := map[string]string{
		SettingKeyExternalSubscriptionProviders: string(raw),
	}
	if buzz, ok := findBuzzStoredProvider(providers); ok {
		updates[SettingKeyBuzzBalanceEnabled] = fmt.Sprintf("%t", buzz.Enabled)
		updates[SettingKeyBuzzBalanceAPIBaseURL] = normalizeBuzzBalanceAPIBaseURL(buzz.APIBaseURL)
		updates[SettingKeyBuzzBalanceAPIToken] = strings.TrimSpace(buzz.APIToken)
	} else {
		updates[SettingKeyBuzzBalanceEnabled] = "false"
		updates[SettingKeyBuzzBalanceAPIBaseURL] = DefaultBuzzBalanceAPIBaseURL
		updates[SettingKeyBuzzBalanceAPIToken] = ""
	}
	if err := s.settingService.settingRepo.SetMultiple(ctx, updates); err != nil {
		return fmt.Errorf("save external subscription providers: %w", err)
	}
	return nil
}

func normalizeExternalSubscriptionInput(input ExternalSubscriptionProviderInput, existing *externalSubscriptionStoredProvider) (externalSubscriptionStoredProvider, error) {
	provider := externalSubscriptionStoredProvider{
		ID:              strings.TrimSpace(strings.ToLower(input.ID)),
		Name:            strings.TrimSpace(input.Name),
		Enabled:         input.Enabled,
		Template:        strings.TrimSpace(input.Template),
		BalanceStrategy: strings.TrimSpace(input.BalanceStrategy),
		APIBaseURL:      normalizeExternalSubscriptionAPIBaseURL(input.APIBaseURL, strings.TrimSpace(input.APIBaseURL)),
		LogoURL:         strings.TrimSpace(input.LogoURL),
		APIToken:        strings.TrimSpace(input.APIToken),
		UserID:          strings.TrimSpace(input.UserID),
		RefreshToken:    strings.TrimSpace(input.RefreshToken),
		MatchKeywords:   normalizeExternalSubscriptionKeywords(input.MatchKeywords),
		SortOrder:       input.SortOrder,
	}
	if existing != nil {
		provider.ID = existing.ID
		if provider.APIToken == "" {
			provider.APIToken = existing.APIToken
		}
		if provider.RefreshToken == "" {
			provider.RefreshToken = existing.RefreshToken
		}
	}
	return normalizeExternalSubscriptionStoredProvider(provider)
}

func normalizeExternalSubscriptionStoredProvider(provider externalSubscriptionStoredProvider) (externalSubscriptionStoredProvider, error) {
	provider.ID = strings.TrimSpace(strings.ToLower(provider.ID))
	if !externalSubscriptionIDPattern.MatchString(provider.ID) {
		return externalSubscriptionStoredProvider{}, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_PROVIDER_ID_INVALID", "external subscription provider id is invalid")
	}
	provider.Name = strings.TrimSpace(provider.Name)
	if provider.Name == "" {
		return externalSubscriptionStoredProvider{}, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_PROVIDER_NAME_REQUIRED", "external subscription provider name is required")
	}
	provider.Template = strings.TrimSpace(provider.Template)
	if !isExternalSubscriptionTemplate(provider.Template) {
		return externalSubscriptionStoredProvider{}, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_TEMPLATE_INVALID", "external subscription provider template is invalid")
	}
	provider.BalanceStrategy = strings.TrimSpace(provider.BalanceStrategy)
	if provider.BalanceStrategy == "" {
		provider.BalanceStrategy = defaultExternalSubscriptionBalanceStrategy(provider.ID, provider.Template)
	}
	if !isExternalSubscriptionBalanceStrategy(provider.BalanceStrategy) {
		return externalSubscriptionStoredProvider{}, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_BALANCE_STRATEGY_INVALID", "external subscription provider balance strategy is invalid")
	}
	provider.APIBaseURL = normalizeExternalSubscriptionAPIBaseURL(provider.APIBaseURL, strings.TrimSpace(provider.APIBaseURL))
	if provider.APIBaseURL == "" {
		return externalSubscriptionStoredProvider{}, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_API_BASE_URL_REQUIRED", "external subscription provider API base URL is required")
	}
	provider.LogoURL = strings.TrimSpace(provider.LogoURL)
	provider.APIToken = strings.TrimSpace(provider.APIToken)
	provider.UserID = strings.TrimSpace(provider.UserID)
	provider.RefreshToken = strings.TrimSpace(provider.RefreshToken)
	provider.MatchKeywords = normalizeExternalSubscriptionKeywords(provider.MatchKeywords)
	if len(provider.MatchKeywords) == 0 {
		provider.MatchKeywords = []string{provider.ID, strings.ToLower(provider.Name)}
	}
	return provider, nil
}

func defaultExternalSubscriptionBalanceStrategy(providerID, template string) string {
	switch strings.TrimSpace(strings.ToLower(providerID)) {
	case "packycode":
		return ExternalSubscriptionBalanceStrategyNewAPIUserQuota
	case "pixel":
		return ExternalSubscriptionBalanceStrategyAuthMeBalance
	}
	switch strings.TrimSpace(template) {
	case ExternalSubscriptionTemplateNewAPIConsole:
		return ExternalSubscriptionBalanceStrategyNewAPISubscription
	case ExternalSubscriptionTemplateActiveSubscriptions:
		return ExternalSubscriptionBalanceStrategyActiveSubscriptions
	default:
		return ExternalSubscriptionBalanceStrategyAuto
	}
}

func effectiveExternalSubscriptionBalanceStrategy(provider externalSubscriptionStoredProvider) string {
	strategy := strings.TrimSpace(provider.BalanceStrategy)
	if strategy == "" || strategy == ExternalSubscriptionBalanceStrategyAuto {
		return defaultExternalSubscriptionBalanceStrategy(provider.ID, provider.Template)
	}
	return strategy
}

func isExternalSubscriptionBalanceStrategy(strategy string) bool {
	switch strings.TrimSpace(strategy) {
	case ExternalSubscriptionBalanceStrategyAuto,
		ExternalSubscriptionBalanceStrategyNewAPIUserQuota,
		ExternalSubscriptionBalanceStrategyNewAPISubscription,
		ExternalSubscriptionBalanceStrategyActiveSubscriptions,
		ExternalSubscriptionBalanceStrategyAuthMeBalance,
		ExternalSubscriptionBalanceStrategyActiveWithAuthMeBalance:
		return true
	default:
		return false
	}
}

func isExternalSubscriptionTemplate(template string) bool {
	switch template {
	case ExternalSubscriptionTemplateNewAPIConsole,
		ExternalSubscriptionTemplateActiveSubscriptions,
		ExternalSubscriptionTemplateBuzzBalance,
		ExternalSubscriptionTemplateOpenRouterCredits,
		ExternalSubscriptionTemplateCloudflareAIGatewayCredits,
		ExternalSubscriptionTemplateRawChatSubscriptions,
		ExternalSubscriptionTemplateMimoTokenPlan:
		return true
	default:
		return false
	}
}

func decodeExternalSubscriptionAccountQuotaProgressSettings(raw string) (map[string]ExternalSubscriptionAccountQuotaProgressPreference, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return map[string]ExternalSubscriptionAccountQuotaProgressPreference{}, nil
	}
	var settings map[string]ExternalSubscriptionAccountQuotaProgressPreference
	if err := json.Unmarshal([]byte(raw), &settings); err != nil {
		return nil, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_ACCOUNT_QUOTA_PROGRESS_INVALID", "external subscription account quota progress settings are invalid")
	}
	return normalizeExternalSubscriptionAccountQuotaProgressSettings(settings), nil
}

func normalizeExternalSubscriptionAccountQuotaProgressSettings(input map[string]ExternalSubscriptionAccountQuotaProgressPreference) map[string]ExternalSubscriptionAccountQuotaProgressPreference {
	out := make(map[string]ExternalSubscriptionAccountQuotaProgressPreference, len(input))
	for key, preference := range input {
		key = strings.TrimSpace(strings.ToLower(key))
		if key == "" {
			continue
		}
		out[key] = normalizeExternalSubscriptionAccountQuotaProgressPreference(preference)
	}
	return out
}

func normalizeExternalSubscriptionAccountQuotaProgressPreference(preference ExternalSubscriptionAccountQuotaProgressPreference) ExternalSubscriptionAccountQuotaProgressPreference {
	mode := strings.TrimSpace(preference.Mode)
	if mode != ExternalSubscriptionAccountQuotaProgressModeCustomTotal && mode != ExternalSubscriptionAccountQuotaProgressModeTokenTotal {
		mode = ExternalSubscriptionAccountQuotaProgressModeStatusTotal
	}
	var customTotal *float64
	if preference.CustomTotal != nil && *preference.CustomTotal > 0 {
		value := *preference.CustomTotal
		customTotal = &value
	}
	var tokenTotal *float64
	if preference.TokenTotal != nil && *preference.TokenTotal > 0 {
		value := *preference.TokenTotal
		tokenTotal = &value
	}
	tokenResetAt := strings.TrimSpace(preference.TokenResetAt)
	if mode != ExternalSubscriptionAccountQuotaProgressModeTokenTotal {
		tokenTotal = nil
		tokenResetAt = ""
	}
	return ExternalSubscriptionAccountQuotaProgressPreference{
		Enabled:      preference.Enabled,
		Mode:         mode,
		CustomTotal:  customTotal,
		TokenTotal:   tokenTotal,
		TokenResetAt: tokenResetAt,
	}
}

func decodeExternalSubscriptionDeletedDefaultProviders(raw string) (map[string]bool, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return map[string]bool{}, nil
	}
	var ids []string
	if err := json.Unmarshal([]byte(raw), &ids); err != nil {
		return nil, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_DELETED_DEFAULT_PROVIDERS_INVALID", "deleted default external subscription providers setting is invalid")
	}
	deleted := make(map[string]bool, len(ids))
	for _, id := range ids {
		id = strings.TrimSpace(strings.ToLower(id))
		if canMarkDeletedExternalSubscriptionProvider(id) {
			deleted[id] = true
		}
	}
	return deleted, nil
}

func externalSubscriptionProvidersFingerprint(providers []externalSubscriptionStoredProvider) string {
	raw, err := json.Marshal(providers)
	if err != nil {
		return fmt.Sprintf("%p:%d", providers, len(providers))
	}
	return string(raw)
}

func (s *ExternalSubscriptionConfigService) getFreshCachedStatuses(fingerprint string) []ExternalSubscriptionProviderStatus {
	s.statusCacheMu.Lock()
	defer s.statusCacheMu.Unlock()
	if s.statusCache == nil || s.statusCache.fingerprint != fingerprint || time.Now().After(s.statusCache.expiresAt) {
		return nil
	}
	return cloneExternalSubscriptionProviderStatuses(s.statusCache.statuses)
}

func (s *ExternalSubscriptionConfigService) getStaleCachedStatuses(fingerprint string) []ExternalSubscriptionProviderStatus {
	s.statusCacheMu.Lock()
	defer s.statusCacheMu.Unlock()
	if s.statusCache == nil || s.statusCache.fingerprint != fingerprint || time.Now().After(s.statusCache.staleUntil) {
		return nil
	}
	return cloneExternalSubscriptionProviderStatuses(s.statusCache.statuses)
}

func (s *ExternalSubscriptionConfigService) getAnyCachedStatuses(fingerprint string) []ExternalSubscriptionProviderStatus {
	s.statusCacheMu.Lock()
	defer s.statusCacheMu.Unlock()
	if s.statusCache == nil || s.statusCache.fingerprint != fingerprint {
		return nil
	}
	return cloneExternalSubscriptionProviderStatuses(s.statusCache.statuses)
}

func (s *ExternalSubscriptionConfigService) setCachedStatuses(fingerprint string, statuses []ExternalSubscriptionProviderStatus) {
	s.statusCacheMu.Lock()
	defer s.statusCacheMu.Unlock()
	now := time.Now()
	s.statusCache = &externalSubscriptionStatusCache{
		fingerprint: fingerprint,
		expiresAt:   now.Add(externalSubscriptionStatusCacheTTL),
		staleUntil:  now.Add(externalSubscriptionStatusStaleTTL),
		statuses:    cloneExternalSubscriptionProviderStatuses(statuses),
	}
}

func (s *ExternalSubscriptionConfigService) clearStatusesCache() {
	s.statusCacheMu.Lock()
	defer s.statusCacheMu.Unlock()
	s.statusCache = nil
}

func (s *ExternalSubscriptionConfigService) invalidateStatusesCache(ctx context.Context) {
	s.clearStatusesCache()
	_ = s.settingService.settingRepo.Delete(ctx, SettingKeyExternalSubscriptionDisplayStatuses)
}

func cloneExternalSubscriptionProviderStatuses(input []ExternalSubscriptionProviderStatus) []ExternalSubscriptionProviderStatus {
	out := make([]ExternalSubscriptionProviderStatus, len(input))
	for i, item := range input {
		out[i] = item
		out[i].MatchKeywords = append([]string(nil), item.MatchKeywords...)
		out[i].Subscriptions = cloneExternalSubscriptionItems(item.Subscriptions)
		out[i].TotalLimitUSD = cloneFloat64Pointer(item.TotalLimitUSD)
		out[i].RemainingUSD = cloneFloat64Pointer(item.RemainingUSD)
		out[i].ExpiresAt = cloneTimePointer(item.ExpiresAt)
		out[i].DaysRemaining = cloneIntPointer(item.DaysRemaining)
	}
	return out
}

func cloneExternalSubscriptionStoredProviders(input []externalSubscriptionStoredProvider) []externalSubscriptionStoredProvider {
	out := make([]externalSubscriptionStoredProvider, len(input))
	for i, item := range input {
		out[i] = item
		out[i].MatchKeywords = append([]string(nil), item.MatchKeywords...)
	}
	return out
}

func cloneExternalSubscriptionItems(input []ExternalSubscriptionItem) []ExternalSubscriptionItem {
	out := make([]ExternalSubscriptionItem, len(input))
	for i, item := range input {
		out[i] = item
		out[i].LimitUSD = cloneFloat64Pointer(item.LimitUSD)
		out[i].RemainingUSD = cloneFloat64Pointer(item.RemainingUSD)
		out[i].ExpiresAt = cloneTimePointer(item.ExpiresAt)
		out[i].DaysRemaining = cloneIntPointer(item.DaysRemaining)
	}
	return out
}

func cloneFloat64Pointer(value *float64) *float64 {
	if value == nil {
		return nil
	}
	next := *value
	return &next
}

func cloneIntPointer(value *int) *int {
	if value == nil {
		return nil
	}
	next := *value
	return &next
}

func cloneTimePointer(value *time.Time) *time.Time {
	if value == nil {
		return nil
	}
	next := *value
	return &next
}

func normalizeExternalSubscriptionKeywords(input []string) []string {
	seen := map[string]struct{}{}
	keywords := make([]string, 0, len(input))
	for _, value := range input {
		keyword := strings.ToLower(strings.TrimSpace(value))
		if keyword == "" {
			continue
		}
		if _, ok := seen[keyword]; ok {
			continue
		}
		seen[keyword] = struct{}{}
		keywords = append(keywords, keyword)
	}
	return keywords
}

func publicExternalSubscriptionProviders(stored []externalSubscriptionStoredProvider) []ExternalSubscriptionProvider {
	providers := make([]ExternalSubscriptionProvider, 0, len(stored))
	for _, provider := range stored {
		providers = append(providers, publicExternalSubscriptionProvider(provider))
	}
	return providers
}

func publicExternalSubscriptionProvider(provider externalSubscriptionStoredProvider) ExternalSubscriptionProvider {
	return ExternalSubscriptionProvider{
		ID:                     provider.ID,
		Name:                   provider.Name,
		Enabled:                provider.Enabled,
		Template:               provider.Template,
		BalanceStrategy:        provider.BalanceStrategy,
		APIBaseURL:             provider.APIBaseURL,
		LogoURL:                provider.LogoURL,
		APITokenConfigured:     strings.TrimSpace(provider.APIToken) != "",
		UserID:                 provider.UserID,
		RefreshTokenConfigured: strings.TrimSpace(provider.RefreshToken) != "",
		MatchKeywords:          append([]string(nil), provider.MatchKeywords...),
		SortOrder:              provider.SortOrder,
	}
}

func externalSubscriptionRuntimeConfig(provider externalSubscriptionStoredProvider) externalSubscriptionProviderConfig {
	if isBuzzBalanceProviderID(provider.ID) {
		cfg := buzzBalanceProviderConfig()
		cfg.DisplayName = provider.Name
		cfg.DefaultAPIBaseURL = provider.APIBaseURL
		return cfg
	}
	return externalSubscriptionProviderConfig{
		Provider:          provider.ID,
		DisplayName:       provider.Name,
		DefaultAPIBaseURL: provider.APIBaseURL,
		EnabledKey:        provider.ID + "_enabled",
		APIBaseURLKey:     provider.ID + "_api_base_url",
		APITokenKey:       provider.ID + "_api_token",
		UserIDKey:         provider.ID + "_user_id",
		RefreshTokenKey:   provider.ID + "_refresh_token",
	}
}

func findBuzzStoredProvider(providers []externalSubscriptionStoredProvider) (externalSubscriptionStoredProvider, bool) {
	for _, provider := range providers {
		if isBuzzBalanceProviderID(provider.ID) {
			return provider, true
		}
	}
	return externalSubscriptionStoredProvider{}, false
}

func sortExternalSubscriptionStoredProviders(providers []externalSubscriptionStoredProvider) {
	sort.SliceStable(providers, func(i, j int) bool {
		if providers[i].SortOrder == providers[j].SortOrder {
			return providers[i].Name < providers[j].Name
		}
		return providers[i].SortOrder < providers[j].SortOrder
	})
}

func sortExternalSubscriptionStatuses(statuses []ExternalSubscriptionProviderStatus) {
	sort.SliceStable(statuses, func(i, j int) bool {
		if statuses[i].SortOrder == statuses[j].SortOrder {
			return statuses[i].Name < statuses[j].Name
		}
		return statuses[i].SortOrder < statuses[j].SortOrder
	})
}

type externalSubscriptionDirectSettingsRepo struct {
	settings ExternalSubscriptionSettings
	cfg      externalSubscriptionProviderConfig
}

func (r *externalSubscriptionDirectSettingsRepo) Get(context.Context, string) (*Setting, error) {
	panic("unexpected Get call")
}

func (r *externalSubscriptionDirectSettingsRepo) GetValue(context.Context, string) (string, error) {
	panic("unexpected GetValue call")
}

func (r *externalSubscriptionDirectSettingsRepo) Set(context.Context, string, string) error {
	panic("unexpected Set call")
}

func (r *externalSubscriptionDirectSettingsRepo) GetMultiple(context.Context, []string) (map[string]string, error) {
	return map[string]string{
		r.cfg.EnabledKey:      fmt.Sprintf("%t", r.settings.Enabled),
		r.cfg.APIBaseURLKey:   r.settings.APIBaseURL,
		r.cfg.APITokenKey:     r.settings.APIToken,
		r.cfg.UserIDKey:       r.settings.UserID,
		r.cfg.RefreshTokenKey: r.settings.RefreshToken,
	}, nil
}

func (r *externalSubscriptionDirectSettingsRepo) SetMultiple(_ context.Context, settings map[string]string) error {
	if value, ok := settings[r.cfg.APITokenKey]; ok {
		r.settings.APIToken = value
	}
	if value, ok := settings[r.cfg.RefreshTokenKey]; ok {
		r.settings.RefreshToken = value
	}
	return nil
}

func (r *externalSubscriptionDirectSettingsRepo) GetAll(context.Context) (map[string]string, error) {
	panic("unexpected GetAll call")
}

func (r *externalSubscriptionDirectSettingsRepo) Delete(context.Context, string) error {
	panic("unexpected Delete call")
}
