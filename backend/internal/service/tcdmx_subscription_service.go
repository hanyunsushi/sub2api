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

type TCDMXSubscriptionSettings struct {
	Enabled      bool
	APIBaseURL   string
	APIToken     string
	RefreshToken string
}

type TCDMXSubscriptionStatus struct {
	Provider      string                  `json:"provider"`
	Enabled       bool                    `json:"enabled"`
	Configured    bool                    `json:"configured"`
	Currency      string                  `json:"currency"`
	SiteURL       string                  `json:"site_url"`
	ErrorCode     string                  `json:"error_code,omitempty"`
	ErrorMessage  string                  `json:"error_message,omitempty"`
	TotalLimitUSD *float64                `json:"total_limit_usd,omitempty"`
	UsedUSD       float64                 `json:"used_usd"`
	RemainingUSD  *float64                `json:"remaining_usd,omitempty"`
	ExpiresAt     *time.Time              `json:"expires_at,omitempty"`
	DaysRemaining *int                    `json:"days_remaining,omitempty"`
	ActiveCount   int                     `json:"active_count"`
	Subscriptions []TCDMXSubscriptionItem `json:"subscriptions"`
	RefreshedAt   time.Time               `json:"refreshed_at,omitempty"`
}

type TCDMXSubscriptionItem struct {
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

type TCDMXSubscriptionService struct {
	settingService *SettingService
	client         *req.Client
}

type tcdmxSubscriptionUpstreamError struct {
	StatusCode int
	Code       string
	Message    string
}

func (e *tcdmxSubscriptionUpstreamError) Error() string {
	if e == nil {
		return "TCDMX subscription upstream error"
	}
	if e.Code != "" && e.Message != "" {
		return fmt.Sprintf("TCDMX subscription upstream error: status=%d code=%s message=%s", e.StatusCode, e.Code, e.Message)
	}
	if e.Code != "" {
		return fmt.Sprintf("TCDMX subscription upstream error: status=%d code=%s", e.StatusCode, e.Code)
	}
	return fmt.Sprintf("TCDMX subscription upstream error: status=%d", e.StatusCode)
}

func NewTCDMXSubscriptionService(settingService *SettingService) *TCDMXSubscriptionService {
	return &TCDMXSubscriptionService{
		settingService: settingService,
		client: req.C().
			SetTimeout(10*time.Second).
			SetCommonHeader("Accept", "application/json"),
	}
}

func normalizeTCDMXSubscriptionAPIBaseURL(raw string) string {
	base := strings.TrimSpace(raw)
	if base == "" {
		return DefaultTCDMXSubscriptionAPIBaseURL
	}
	base = strings.TrimRight(base, "/")
	base = strings.TrimSuffix(base, "/api/v1")
	base = strings.TrimSuffix(base, "/api")
	parsed, err := url.Parse(base)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return DefaultTCDMXSubscriptionAPIBaseURL
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return DefaultTCDMXSubscriptionAPIBaseURL
	}
	return base
}

func (s *SettingService) GetTCDMXSubscriptionSettings(ctx context.Context) (TCDMXSubscriptionSettings, error) {
	values, err := s.settingRepo.GetMultiple(ctx, []string{
		SettingKeyTCDMXSubscriptionEnabled,
		SettingKeyTCDMXSubscriptionAPIBaseURL,
		SettingKeyTCDMXSubscriptionAPIToken,
		SettingKeyTCDMXSubscriptionRefreshToken,
	})
	if err != nil {
		return TCDMXSubscriptionSettings{}, fmt.Errorf("get tcdmx subscription settings: %w", err)
	}
	return TCDMXSubscriptionSettings{
		Enabled:      values[SettingKeyTCDMXSubscriptionEnabled] == "true",
		APIBaseURL:   normalizeTCDMXSubscriptionAPIBaseURL(values[SettingKeyTCDMXSubscriptionAPIBaseURL]),
		APIToken:     strings.TrimSpace(values[SettingKeyTCDMXSubscriptionAPIToken]),
		RefreshToken: strings.TrimSpace(values[SettingKeyTCDMXSubscriptionRefreshToken]),
	}, nil
}

func (s *TCDMXSubscriptionService) GetStatus(ctx context.Context) (*TCDMXSubscriptionStatus, error) {
	settings, err := s.settingService.GetTCDMXSubscriptionSettings(ctx)
	if err != nil {
		return nil, err
	}

	result := &TCDMXSubscriptionStatus{
		Provider:   "tcdmx",
		Enabled:    settings.Enabled,
		Configured: settings.APIToken != "",
		Currency:   "USD",
		SiteURL:    settings.APIBaseURL,
	}
	if !settings.Enabled || settings.APIToken == "" {
		return result, nil
	}

	var subscriptions []tcdmxUserSubscription
	if err := s.getJSON(ctx, settings, "/api/v1/subscriptions/active", &subscriptions); err != nil {
		if upstreamErr, ok := err.(*tcdmxSubscriptionUpstreamError); ok {
			if strings.TrimSpace(settings.RefreshToken) != "" && isTCDMXSubscriptionInvalidTokenError(upstreamErr) {
				refreshedSettings, refreshErr := s.refreshAuthToken(ctx, settings)
				if refreshErr == nil {
					settings = refreshedSettings
					upstreamErr = nil
					err = s.getJSON(ctx, settings, "/api/v1/subscriptions/active", &subscriptions)
					if err == nil {
						goto aggregateSubscriptions
					}
					if nextUpstreamErr, ok := err.(*tcdmxSubscriptionUpstreamError); ok {
						upstreamErr = nextUpstreamErr
					} else {
						return nil, err
					}
				} else if refreshUpstreamErr, ok := refreshErr.(*tcdmxSubscriptionUpstreamError); ok {
					upstreamErr = refreshUpstreamErr
				} else {
					return nil, refreshErr
				}
			}
			result.ErrorCode = upstreamErr.Code
			if result.ErrorCode == "" {
				result.ErrorCode = "TCDMX_SUBSCRIPTION_UPSTREAM_ERROR"
			}
			result.ErrorMessage = upstreamErr.Message
			if strings.TrimSpace(result.ErrorMessage) == "" {
				result.ErrorMessage = "TCDMX subscription API returned an error"
			}
			result.Subscriptions = []TCDMXSubscriptionItem{}
			result.RefreshedAt = time.Now().UTC()
			return result, nil
		}
		return nil, err
	}

aggregateSubscriptions:
	result.ActiveCount = len(subscriptions)
	result.Subscriptions = make([]TCDMXSubscriptionItem, 0, len(subscriptions))
	var totalLimit float64
	var hasLimit bool
	var earliestExpiry *time.Time

	for _, sub := range subscriptions {
		item := tcdmxSubscriptionItemFromAPI(sub)
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

type tcdmxRefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

func (s *TCDMXSubscriptionService) refreshAuthToken(ctx context.Context, settings TCDMXSubscriptionSettings) (TCDMXSubscriptionSettings, error) {
	var refreshed tcdmxRefreshTokenResponse
	if err := s.postJSON(ctx, settings, "/api/v1/auth/refresh", map[string]string{
		"refresh_token": settings.RefreshToken,
	}, &refreshed); err != nil {
		return settings, err
	}
	refreshed.AccessToken = strings.TrimSpace(refreshed.AccessToken)
	refreshed.RefreshToken = strings.TrimSpace(refreshed.RefreshToken)
	if refreshed.AccessToken == "" {
		return settings, &tcdmxSubscriptionUpstreamError{
			StatusCode: http.StatusOK,
			Code:       "TCDMX_SUBSCRIPTION_REFRESH_FAILED",
			Message:    "TCDMX refresh response did not include an access token",
		}
	}

	nextSettings := settings
	nextSettings.APIToken = refreshed.AccessToken
	if refreshed.RefreshToken != "" {
		nextSettings.RefreshToken = refreshed.RefreshToken
	}

	updates := map[string]string{
		SettingKeyTCDMXSubscriptionAPIToken: nextSettings.APIToken,
	}
	if nextSettings.RefreshToken != settings.RefreshToken {
		updates[SettingKeyTCDMXSubscriptionRefreshToken] = nextSettings.RefreshToken
	}
	if err := s.settingService.settingRepo.SetMultiple(ctx, updates); err != nil {
		return settings, fmt.Errorf("save refreshed tcdmx subscription token: %w", err)
	}
	return nextSettings, nil
}

func (s *TCDMXSubscriptionService) getJSON(ctx context.Context, settings TCDMXSubscriptionSettings, path string, out any) error {
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
		return infraerrors.ServiceUnavailable("TCDMX_SUBSCRIPTION_UPSTREAM_ERROR", "failed to query TCDMX subscription")
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return tcdmxSubscriptionErrorFromResponse(resp, envelope)
	}
	if !isTCDMXSubscriptionSuccessCode(envelope.Code) {
		return tcdmxSubscriptionErrorFromResponse(resp, envelope)
	}
	if err := json.Unmarshal(envelope.Data, out); err != nil {
		return infraerrors.ServiceUnavailable("TCDMX_SUBSCRIPTION_UPSTREAM_ERROR", "failed to parse TCDMX subscription response")
	}
	return nil
}

func (s *TCDMXSubscriptionService) postJSON(ctx context.Context, settings TCDMXSubscriptionSettings, path string, body any, out any) error {
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
		return infraerrors.ServiceUnavailable("TCDMX_SUBSCRIPTION_UPSTREAM_ERROR", "failed to refresh TCDMX subscription token")
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return tcdmxSubscriptionErrorFromResponse(resp, envelope)
	}
	if !isTCDMXSubscriptionSuccessCode(envelope.Code) {
		return tcdmxSubscriptionErrorFromResponse(resp, envelope)
	}
	if err := json.Unmarshal(envelope.Data, out); err != nil {
		return infraerrors.ServiceUnavailable("TCDMX_SUBSCRIPTION_UPSTREAM_ERROR", "failed to parse TCDMX refresh response")
	}
	return nil
}

func isTCDMXSubscriptionInvalidTokenError(err *tcdmxSubscriptionUpstreamError) bool {
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

func tcdmxSubscriptionErrorFromResponse(resp *req.Response, envelope struct {
	Code    json.RawMessage `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}) error {
	code := tcdmxSubscriptionErrorCode(envelope.Code)
	message := strings.TrimSpace(envelope.Message)
	if code == "" || message == "" {
		var raw struct {
			Code    json.RawMessage `json:"code"`
			Message string          `json:"message"`
		}
		if err := json.Unmarshal(resp.Bytes(), &raw); err == nil {
			if code == "" {
				code = tcdmxSubscriptionErrorCode(raw.Code)
			}
			if message == "" {
				message = strings.TrimSpace(raw.Message)
			}
		}
	}
	if code == "" {
		code = "TCDMX_SUBSCRIPTION_UPSTREAM_ERROR"
	}
	if message == "" {
		message = "TCDMX subscription API returned an error"
	}
	return &tcdmxSubscriptionUpstreamError{
		StatusCode: resp.StatusCode,
		Code:       code,
		Message:    message,
	}
}

func tcdmxSubscriptionErrorCode(raw json.RawMessage) string {
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

func isTCDMXSubscriptionSuccessCode(raw json.RawMessage) bool {
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

type tcdmxUserSubscription struct {
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

func tcdmxSubscriptionItemFromAPI(sub tcdmxUserSubscription) TCDMXSubscriptionItem {
	window, used, limit := chooseTCDMXSubscriptionWindow(sub)
	groupName := fmt.Sprintf("Group %d", sub.GroupID)
	if sub.Group != nil && strings.TrimSpace(sub.Group.Name) != "" {
		groupName = strings.TrimSpace(sub.Group.Name)
	}
	item := TCDMXSubscriptionItem{
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

func chooseTCDMXSubscriptionWindow(sub tcdmxUserSubscription) (string, float64, *float64) {
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
