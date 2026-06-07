package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

const (
	ExternalSubscriptionTemplateNewAPIConsole       = "newapi_console"
	ExternalSubscriptionTemplateActiveSubscriptions = "active_subscriptions"
)

var externalSubscriptionIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]{1,63}$`)

type ExternalSubscriptionProvider struct {
	ID                     string   `json:"id"`
	Name                   string   `json:"name"`
	Enabled                bool     `json:"enabled"`
	Template               string   `json:"template"`
	APIBaseURL             string   `json:"api_base_url"`
	APIToken               string   `json:"api_token,omitempty"`
	APITokenConfigured     bool     `json:"api_token_configured"`
	UserID                 string   `json:"user_id,omitempty"`
	RefreshToken           string   `json:"refresh_token,omitempty"`
	RefreshTokenConfigured bool     `json:"refresh_token_configured"`
	MatchKeywords          []string `json:"match_keywords"`
	SortOrder              int      `json:"sort_order"`
}

type ExternalSubscriptionProviderInput struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Enabled       bool     `json:"enabled"`
	Template      string   `json:"template"`
	APIBaseURL    string   `json:"api_base_url"`
	APIToken      string   `json:"api_token"`
	UserID        string   `json:"user_id"`
	RefreshToken  string   `json:"refresh_token"`
	MatchKeywords []string `json:"match_keywords"`
	SortOrder     int      `json:"sort_order"`
}

type ExternalSubscriptionProviderStatus struct {
	Name                   string   `json:"name"`
	Template               string   `json:"template"`
	APITokenConfigured     bool     `json:"api_token_configured"`
	RefreshTokenConfigured bool     `json:"refresh_token_configured"`
	MatchKeywords          []string `json:"match_keywords"`
	SortOrder              int      `json:"sort_order"`
	ExternalSubscriptionStatus
}

type externalSubscriptionStoredProvider struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Enabled       bool     `json:"enabled"`
	Template      string   `json:"template"`
	APIBaseURL    string   `json:"api_base_url"`
	APIToken      string   `json:"api_token"`
	UserID        string   `json:"user_id,omitempty"`
	RefreshToken  string   `json:"refresh_token,omitempty"`
	MatchKeywords []string `json:"match_keywords"`
	SortOrder     int      `json:"sort_order"`
}

type ExternalSubscriptionConfigService struct {
	settingService *SettingService
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
	return s.saveStoredProviders(ctx, next)
}

func (s *ExternalSubscriptionConfigService) GetStatuses(ctx context.Context) ([]ExternalSubscriptionProviderStatus, error) {
	stored, err := s.loadStoredProviders(ctx)
	if err != nil {
		return nil, err
	}
	statuses := make([]ExternalSubscriptionProviderStatus, 0, len(stored))
	updated := false
	for index := range stored {
		provider := stored[index]
		status, nextProvider, err := s.getStatusForStoredProvider(ctx, provider)
		if err != nil {
			return nil, err
		}
		if nextProvider != nil {
			stored[index] = *nextProvider
			updated = true
		}
		publicProvider := publicExternalSubscriptionProvider(stored[index])
		statuses = append(statuses, ExternalSubscriptionProviderStatus{
			Name:                       publicProvider.Name,
			Template:                   publicProvider.Template,
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
	return statuses, nil
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
	switch provider.Template {
	case ExternalSubscriptionTemplateNewAPIConsole:
		status, err = runner.getNewAPIConsoleSubscriptionStatus(ctx, cfg)
	case ExternalSubscriptionTemplateActiveSubscriptions:
		status, err = runner.GetStatus(ctx)
	default:
		return nil, nil, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_TEMPLATE_INVALID", "external subscription provider template is invalid")
	}
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
			return s.buildLegacyProviders(ctx)
		}
		return nil, fmt.Errorf("get external subscription providers: %w", err)
	}
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return s.buildLegacyProviders(ctx)
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
	return normalized, nil
}

func (s *ExternalSubscriptionConfigService) buildLegacyProviders(ctx context.Context) ([]externalSubscriptionStoredProvider, error) {
	configs := []struct {
		cfg      externalSubscriptionProviderConfig
		template string
		keywords []string
		order    int
	}{
		{tcdmxSubscriptionProviderConfig(), ExternalSubscriptionTemplateActiveSubscriptions, []string{"tcdmx.com", "tcdmx"}, 10},
		{qlhazycoderSubscriptionProviderConfig(), ExternalSubscriptionTemplateNewAPIConsole, []string{"api.qlhazycoder.top", "qlhazycoder", "qlhazy"}, 20},
		{xhyapiSubscriptionProviderConfig(), ExternalSubscriptionTemplateActiveSubscriptions, []string{"xhyapi.com", "xhyapi", "xhy"}, 30},
		{pixelSubscriptionProviderConfig(), ExternalSubscriptionTemplateActiveSubscriptions, []string{"ai-pixel.online", "pixel"}, 40},
		{liustSubscriptionProviderConfig(), ExternalSubscriptionTemplateNewAPIConsole, []string{"liust.xyz", "liust"}, 50},
		{packycodeSubscriptionProviderConfig(), ExternalSubscriptionTemplateNewAPIConsole, []string{"packyapi.com", "packycode", "packy"}, 60},
	}
	providers := make([]externalSubscriptionStoredProvider, 0, len(configs))
	for _, item := range configs {
		settings, err := s.settingService.getExternalSubscriptionSettings(ctx, item.cfg)
		if err != nil {
			return nil, err
		}
		providers = append(providers, externalSubscriptionStoredProvider{
			ID:            item.cfg.Provider,
			Name:          item.cfg.DisplayName,
			Enabled:       settings.Enabled,
			Template:      item.template,
			APIBaseURL:    settings.APIBaseURL,
			APIToken:      settings.APIToken,
			UserID:        settings.UserID,
			RefreshToken:  settings.RefreshToken,
			MatchKeywords: item.keywords,
			SortOrder:     item.order,
		})
	}
	return providers, nil
}

func (s *ExternalSubscriptionConfigService) saveStoredProviders(ctx context.Context, providers []externalSubscriptionStoredProvider) error {
	sortExternalSubscriptionStoredProviders(providers)
	raw, err := json.Marshal(providers)
	if err != nil {
		return fmt.Errorf("marshal external subscription providers: %w", err)
	}
	if err := s.settingService.settingRepo.Set(ctx, SettingKeyExternalSubscriptionProviders, string(raw)); err != nil {
		return fmt.Errorf("save external subscription providers: %w", err)
	}
	return nil
}

func normalizeExternalSubscriptionInput(input ExternalSubscriptionProviderInput, existing *externalSubscriptionStoredProvider) (externalSubscriptionStoredProvider, error) {
	provider := externalSubscriptionStoredProvider{
		ID:            strings.TrimSpace(strings.ToLower(input.ID)),
		Name:          strings.TrimSpace(input.Name),
		Enabled:       input.Enabled,
		Template:      strings.TrimSpace(input.Template),
		APIBaseURL:    normalizeExternalSubscriptionAPIBaseURL(input.APIBaseURL, strings.TrimSpace(input.APIBaseURL)),
		APIToken:      strings.TrimSpace(input.APIToken),
		UserID:        strings.TrimSpace(input.UserID),
		RefreshToken:  strings.TrimSpace(input.RefreshToken),
		MatchKeywords: normalizeExternalSubscriptionKeywords(input.MatchKeywords),
		SortOrder:     input.SortOrder,
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
	if provider.Template != ExternalSubscriptionTemplateNewAPIConsole && provider.Template != ExternalSubscriptionTemplateActiveSubscriptions {
		return externalSubscriptionStoredProvider{}, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_TEMPLATE_INVALID", "external subscription provider template is invalid")
	}
	provider.APIBaseURL = normalizeExternalSubscriptionAPIBaseURL(provider.APIBaseURL, strings.TrimSpace(provider.APIBaseURL))
	if provider.APIBaseURL == "" {
		return externalSubscriptionStoredProvider{}, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_API_BASE_URL_REQUIRED", "external subscription provider API base URL is required")
	}
	provider.APIToken = strings.TrimSpace(provider.APIToken)
	provider.UserID = strings.TrimSpace(provider.UserID)
	provider.RefreshToken = strings.TrimSpace(provider.RefreshToken)
	provider.MatchKeywords = normalizeExternalSubscriptionKeywords(provider.MatchKeywords)
	if len(provider.MatchKeywords) == 0 {
		provider.MatchKeywords = []string{provider.ID, strings.ToLower(provider.Name)}
	}
	return provider, nil
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
		APIBaseURL:             provider.APIBaseURL,
		APITokenConfigured:     strings.TrimSpace(provider.APIToken) != "",
		UserID:                 provider.UserID,
		RefreshTokenConfigured: strings.TrimSpace(provider.RefreshToken) != "",
		MatchKeywords:          append([]string(nil), provider.MatchKeywords...),
		SortOrder:              provider.SortOrder,
	}
}

func externalSubscriptionRuntimeConfig(provider externalSubscriptionStoredProvider) externalSubscriptionProviderConfig {
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
