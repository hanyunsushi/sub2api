package service

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"strings"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/imroc/req/v3"
)

type ExternalSubscriptionSettings struct {
	Enabled      bool
	APIBaseURL   string
	APIToken     string
	RefreshToken string
}

type ExternalSubscriptionStatus struct {
	Provider      string                     `json:"provider"`
	Enabled       bool                       `json:"enabled"`
	Configured    bool                       `json:"configured"`
	Currency      string                     `json:"currency"`
	SiteURL       string                     `json:"site_url"`
	ErrorCode     string                     `json:"error_code,omitempty"`
	ErrorMessage  string                     `json:"error_message,omitempty"`
	TotalLimitUSD *float64                   `json:"total_limit_usd,omitempty"`
	UsedUSD       float64                    `json:"used_usd"`
	RemainingUSD  *float64                   `json:"remaining_usd,omitempty"`
	ExpiresAt     *time.Time                 `json:"expires_at,omitempty"`
	DaysRemaining *int                       `json:"days_remaining,omitempty"`
	ActiveCount   int                        `json:"active_count"`
	Subscriptions []ExternalSubscriptionItem `json:"subscriptions"`
	RefreshedAt   time.Time                  `json:"refreshed_at,omitempty"`
}

type ExternalSubscriptionItem struct {
	ID            int64      `json:"id"`
	GroupID       int64      `json:"group_id"`
	GroupName     string     `json:"group_name"`
	Status        string     `json:"status"`
	Window        string     `json:"window"`
	LimitUSD      *float64   `json:"limit_usd,omitempty"`
	UsedUSD       float64    `json:"used_usd"`
	RemainingUSD  *float64   `json:"remaining_usd,omitempty"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
	DaysRemaining *int       `json:"days_remaining,omitempty"`
}

type externalSubscriptionProviderConfig struct {
	Provider          string
	DisplayName       string
	DefaultAPIBaseURL string
	EnabledKey        string
	APIBaseURLKey     string
	APITokenKey       string
	RefreshTokenKey   string
}

type ExternalSubscriptionService struct {
	settingService *SettingService
	client         *req.Client
	config         externalSubscriptionProviderConfig
}

type externalSubscriptionUpstreamError struct {
	StatusCode int
	Code       string
	Message    string
	Provider   string
	Display    string
}

func (e *externalSubscriptionUpstreamError) Error() string {
	if e == nil {
		return "external subscription upstream error"
	}
	display := strings.TrimSpace(e.Display)
	if display == "" {
		display = "external subscription"
	}
	if e.Code != "" && e.Message != "" {
		return fmt.Sprintf("%s upstream error: status=%d code=%s message=%s", display, e.StatusCode, e.Code, e.Message)
	}
	if e.Code != "" {
		return fmt.Sprintf("%s upstream error: status=%d code=%s", display, e.StatusCode, e.Code)
	}
	return fmt.Sprintf("%s upstream error: status=%d", display, e.StatusCode)
}

func newExternalSubscriptionService(settingService *SettingService, config externalSubscriptionProviderConfig) *ExternalSubscriptionService {
	return &ExternalSubscriptionService{
		settingService: settingService,
		config:         config,
		client: req.C().
			SetTimeout(10*time.Second).
			SetCommonHeader("Accept", "application/json"),
	}
}

func normalizeExternalSubscriptionAPIBaseURL(raw string, fallback string) string {
	base := strings.TrimSpace(raw)
	if base == "" {
		return fallback
	}
	base = strings.TrimRight(base, "/")
	base = strings.TrimSuffix(base, "/api/v1")
	base = strings.TrimSuffix(base, "/api")
	parsed, err := url.Parse(base)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return fallback
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return fallback
	}
	return base
}

func (s *SettingService) getExternalSubscriptionSettings(ctx context.Context, cfg externalSubscriptionProviderConfig) (ExternalSubscriptionSettings, error) {
	values, err := s.settingRepo.GetMultiple(ctx, []string{
		cfg.EnabledKey,
		cfg.APIBaseURLKey,
		cfg.APITokenKey,
		cfg.RefreshTokenKey,
	})
	if err != nil {
		return ExternalSubscriptionSettings{}, fmt.Errorf("get %s subscription settings: %w", cfg.Provider, err)
	}
	return ExternalSubscriptionSettings{
		Enabled:      values[cfg.EnabledKey] == "true",
		APIBaseURL:   normalizeExternalSubscriptionAPIBaseURL(values[cfg.APIBaseURLKey], cfg.DefaultAPIBaseURL),
		APIToken:     strings.TrimSpace(values[cfg.APITokenKey]),
		RefreshToken: strings.TrimSpace(values[cfg.RefreshTokenKey]),
	}, nil
}

func (s *ExternalSubscriptionService) GetStatus(ctx context.Context) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, s.config)
	if err != nil {
		return nil, err
	}

	result := &ExternalSubscriptionStatus{
		Provider:   s.config.Provider,
		Enabled:    settings.Enabled,
		Configured: settings.APIToken != "",
		Currency:   "USD",
		SiteURL:    settings.APIBaseURL,
	}
	if !settings.Enabled || settings.APIToken == "" {
		return result, nil
	}

	var subscriptions []externalUserSubscription
	if err := s.getJSON(ctx, settings, "/api/v1/subscriptions/active", &subscriptions); err != nil {
		if upstreamErr, ok := err.(*externalSubscriptionUpstreamError); ok {
			if strings.TrimSpace(settings.RefreshToken) != "" && isExternalSubscriptionInvalidTokenError(upstreamErr) {
				refreshedSettings, refreshErr := s.refreshAuthToken(ctx, settings)
				if refreshErr == nil {
					settings = refreshedSettings
					upstreamErr = nil
					err = s.getJSON(ctx, settings, "/api/v1/subscriptions/active", &subscriptions)
					if err == nil {
						goto aggregateSubscriptions
					}
					if nextUpstreamErr, ok := err.(*externalSubscriptionUpstreamError); ok {
						upstreamErr = nextUpstreamErr
					} else {
						return nil, err
					}
				} else if refreshUpstreamErr, ok := refreshErr.(*externalSubscriptionUpstreamError); ok {
					upstreamErr = refreshUpstreamErr
				} else {
					return nil, refreshErr
				}
			}
			result.ErrorCode = upstreamErr.Code
			if result.ErrorCode == "" {
				result.ErrorCode = fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(s.config.Provider))
			}
			result.ErrorMessage = upstreamErr.Message
			if strings.TrimSpace(result.ErrorMessage) == "" {
				result.ErrorMessage = fmt.Sprintf("%s subscription API returned an error", s.config.DisplayName)
			}
			result.Subscriptions = []ExternalSubscriptionItem{}
			result.RefreshedAt = time.Now().UTC()
			return result, nil
		}
		return nil, err
	}

aggregateSubscriptions:
	result.ActiveCount = len(subscriptions)
	result.Subscriptions = make([]ExternalSubscriptionItem, 0, len(subscriptions))
	var totalLimit float64
	var hasLimit bool
	var earliestExpiry *time.Time

	for _, sub := range subscriptions {
		item := externalSubscriptionItemFromAPI(sub)
		result.Subscriptions = append(result.Subscriptions, item)
		result.UsedUSD += item.UsedUSD
		if item.LimitUSD != nil {
			totalLimit += *item.LimitUSD
			hasLimit = true
		}
		if item.ExpiresAt != nil && (earliestExpiry == nil || item.ExpiresAt.Before(*earliestExpiry)) {
			expiry := *item.ExpiresAt
			earliestExpiry = &expiry
		}
	}

	if hasLimit {
		result.TotalLimitUSD = &totalLimit
		remaining := totalLimit - result.UsedUSD
		result.RemainingUSD = &remaining
	}
	if earliestExpiry != nil {
		result.ExpiresAt = earliestExpiry
		result.DaysRemaining = daysRemainingFromNow(earliestExpiry)
	}
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

type externalRefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

func (s *ExternalSubscriptionService) refreshAuthToken(ctx context.Context, settings ExternalSubscriptionSettings) (ExternalSubscriptionSettings, error) {
	var refreshed externalRefreshTokenResponse
	if err := s.postJSON(ctx, settings, "/api/v1/auth/refresh", map[string]string{
		"refresh_token": settings.RefreshToken,
	}, &refreshed); err != nil {
		return settings, err
	}
	refreshed.AccessToken = strings.TrimSpace(refreshed.AccessToken)
	refreshed.RefreshToken = strings.TrimSpace(refreshed.RefreshToken)
	if refreshed.AccessToken == "" {
		return settings, &externalSubscriptionUpstreamError{
			StatusCode: http.StatusOK,
			Code:       fmt.Sprintf("%s_SUBSCRIPTION_REFRESH_FAILED", strings.ToUpper(s.config.Provider)),
			Message:    fmt.Sprintf("%s refresh response did not include an access token", s.config.DisplayName),
			Provider:   s.config.Provider,
			Display:    s.config.DisplayName,
		}
	}

	nextSettings := settings
	nextSettings.APIToken = refreshed.AccessToken
	if refreshed.RefreshToken != "" {
		nextSettings.RefreshToken = refreshed.RefreshToken
	}

	updates := map[string]string{
		s.config.APITokenKey: nextSettings.APIToken,
	}
	if nextSettings.RefreshToken != settings.RefreshToken {
		updates[s.config.RefreshTokenKey] = nextSettings.RefreshToken
	}
	if err := s.settingService.settingRepo.SetMultiple(ctx, updates); err != nil {
		return settings, fmt.Errorf("save refreshed %s subscription token: %w", s.config.Provider, err)
	}
	return nextSettings, nil
}

func (s *ExternalSubscriptionService) getJSON(ctx context.Context, settings ExternalSubscriptionSettings, path string, out any) error {
	var envelope struct {
		Code    json.RawMessage `json:"code"`
		Message string          `json:"message"`
		Data    json.RawMessage `json:"data"`
	}
	resp, err := s.client.R().
		SetContext(ctx).
		SetBearerAuthToken(settings.APIToken).
		SetSuccessResult(&envelope).
		Get(settings.APIBaseURL + path)
	if err != nil {
		return infraerrors.ServiceUnavailable(fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(s.config.Provider)), fmt.Sprintf("failed to query %s subscription", s.config.DisplayName))
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return s.errorFromResponse(resp, envelope)
	}
	if !isExternalSubscriptionSuccessCode(envelope.Code) {
		return s.errorFromResponse(resp, envelope)
	}
	if err := json.Unmarshal(envelope.Data, out); err != nil {
		return infraerrors.ServiceUnavailable(fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(s.config.Provider)), fmt.Sprintf("failed to parse %s subscription response", s.config.DisplayName))
	}
	return nil
}

func (s *ExternalSubscriptionService) postJSON(ctx context.Context, settings ExternalSubscriptionSettings, path string, body any, out any) error {
	var envelope struct {
		Code    json.RawMessage `json:"code"`
		Message string          `json:"message"`
		Data    json.RawMessage `json:"data"`
	}
	resp, err := s.client.R().
		SetContext(ctx).
		SetBody(body).
		SetSuccessResult(&envelope).
		Post(settings.APIBaseURL + path)
	if err != nil {
		return infraerrors.ServiceUnavailable(fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(s.config.Provider)), fmt.Sprintf("failed to refresh %s subscription token", s.config.DisplayName))
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return s.errorFromResponse(resp, envelope)
	}
	if !isExternalSubscriptionSuccessCode(envelope.Code) {
		return s.errorFromResponse(resp, envelope)
	}
	if err := json.Unmarshal(envelope.Data, out); err != nil {
		return infraerrors.ServiceUnavailable(fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(s.config.Provider)), fmt.Sprintf("failed to parse %s refresh response", s.config.DisplayName))
	}
	return nil
}

func isExternalSubscriptionInvalidTokenError(err *externalSubscriptionUpstreamError) bool {
	if err == nil {
		return false
	}
	code := strings.ToUpper(strings.TrimSpace(err.Code))
	message := strings.ToLower(strings.TrimSpace(err.Message))
	return err.StatusCode == http.StatusUnauthorized ||
		code == "INVALID_TOKEN" ||
		code == "TOKEN_EXPIRED" ||
		strings.Contains(message, "invalid token") ||
		strings.Contains(message, "token expired")
}

func (s *ExternalSubscriptionService) errorFromResponse(resp *req.Response, envelope struct {
	Code    json.RawMessage `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}) error {
	code := externalSubscriptionErrorCode(envelope.Code)
	message := strings.TrimSpace(envelope.Message)
	if code == "" || message == "" {
		var raw struct {
			Code    json.RawMessage `json:"code"`
			Message string          `json:"message"`
		}
		if err := json.Unmarshal(resp.Bytes(), &raw); err == nil {
			if code == "" {
				code = externalSubscriptionErrorCode(raw.Code)
			}
			if message == "" {
				message = strings.TrimSpace(raw.Message)
			}
		}
	}
	if code == "" {
		code = fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(s.config.Provider))
	}
	if message == "" {
		message = fmt.Sprintf("%s subscription API returned an error", s.config.DisplayName)
	}
	return &externalSubscriptionUpstreamError{
		StatusCode: resp.StatusCode,
		Code:       code,
		Message:    message,
		Provider:   s.config.Provider,
		Display:    s.config.DisplayName,
	}
}

func externalSubscriptionErrorCode(raw json.RawMessage) string {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return ""
	}
	var numeric int
	if err := json.Unmarshal(raw, &numeric); err == nil {
		return fmt.Sprintf("%d", numeric)
	}
	var value string
	if err := json.Unmarshal(raw, &value); err == nil {
		return strings.TrimSpace(value)
	}
	return ""
}

func isExternalSubscriptionSuccessCode(raw json.RawMessage) bool {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return false
	}
	var numeric int
	if err := json.Unmarshal(raw, &numeric); err == nil {
		return numeric == 0
	}
	var value string
	if err := json.Unmarshal(raw, &value); err == nil {
		return strings.TrimSpace(value) == "0"
	}
	return false
}

type externalUserSubscription struct {
	ID              int64      `json:"id"`
	GroupID         int64      `json:"group_id"`
	Status          string     `json:"status"`
	DailyUsageUSD   float64    `json:"daily_usage_usd"`
	WeeklyUsageUSD  float64    `json:"weekly_usage_usd"`
	MonthlyUsageUSD float64    `json:"monthly_usage_usd"`
	ExpiresAt       *time.Time `json:"expires_at"`
	Group           *struct {
		Name            string   `json:"name"`
		DailyLimitUSD   *float64 `json:"daily_limit_usd"`
		WeeklyLimitUSD  *float64 `json:"weekly_limit_usd"`
		MonthlyLimitUSD *float64 `json:"monthly_limit_usd"`
	} `json:"group"`
}

func externalSubscriptionItemFromAPI(sub externalUserSubscription) ExternalSubscriptionItem {
	window, used, limit := chooseExternalSubscriptionWindow(sub)
	groupName := fmt.Sprintf("Group %d", sub.GroupID)
	if sub.Group != nil && strings.TrimSpace(sub.Group.Name) != "" {
		groupName = strings.TrimSpace(sub.Group.Name)
	}
	item := ExternalSubscriptionItem{
		ID:            sub.ID,
		GroupID:       sub.GroupID,
		GroupName:     groupName,
		Status:        sub.Status,
		Window:        window,
		LimitUSD:      limit,
		UsedUSD:       used,
		ExpiresAt:     sub.ExpiresAt,
		DaysRemaining: daysRemainingFromNow(sub.ExpiresAt),
	}
	if limit != nil {
		remaining := *limit - used
		item.RemainingUSD = &remaining
	}
	return item
}

func chooseExternalSubscriptionWindow(sub externalUserSubscription) (string, float64, *float64) {
	if sub.Group == nil {
		return "monthly", sub.MonthlyUsageUSD, nil
	}
	if sub.Group.MonthlyLimitUSD != nil && *sub.Group.MonthlyLimitUSD > 0 {
		return "monthly", sub.MonthlyUsageUSD, sub.Group.MonthlyLimitUSD
	}
	if sub.Group.WeeklyLimitUSD != nil && *sub.Group.WeeklyLimitUSD > 0 {
		return "weekly", sub.WeeklyUsageUSD, sub.Group.WeeklyLimitUSD
	}
	if sub.Group.DailyLimitUSD != nil && *sub.Group.DailyLimitUSD > 0 {
		return "daily", sub.DailyUsageUSD, sub.Group.DailyLimitUSD
	}
	return "unlimited", sub.MonthlyUsageUSD, nil
}

func daysRemainingFromNow(expiry *time.Time) *int {
	if expiry == nil {
		return nil
	}
	days := int(math.Ceil(time.Until(*expiry).Hours() / 24))
	if days < 0 {
		days = 0
	}
	return &days
}
