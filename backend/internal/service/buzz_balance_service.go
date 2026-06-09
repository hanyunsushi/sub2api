package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/imroc/req/v3"
)

type BuzzBalanceSettings struct {
	Enabled    bool
	APIBaseURL string
	APIToken   string
}

type BuzzBalance struct {
	Enabled       bool       `json:"enabled"`
	Configured    bool       `json:"configured"`
	Currency      string     `json:"currency"`
	SiteURL       string     `json:"site_url"`
	Total         float64    `json:"total"`
	Used          float64    `json:"used"`
	Remaining     float64    `json:"remaining"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
	DaysRemaining *int       `json:"days_remaining,omitempty"`
	RefreshedAt   time.Time  `json:"refreshed_at,omitempty"`
}

type BuzzBalanceService struct {
	settingService *SettingService
	client         *req.Client
}

func NewBuzzBalanceService(settingService *SettingService) *BuzzBalanceService {
	return &BuzzBalanceService{
		settingService: settingService,
		client: req.C().
			SetTimeout(10*time.Second).
			SetCommonHeader("Accept", "application/json"),
	}
}

func normalizeBuzzBalanceAPIBaseURL(raw string) string {
	base := strings.TrimSpace(raw)
	if base == "" {
		return DefaultBuzzBalanceAPIBaseURL
	}
	base = strings.TrimRight(base, "/")
	parsed, err := url.Parse(base)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return DefaultBuzzBalanceAPIBaseURL
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return DefaultBuzzBalanceAPIBaseURL
	}
	return base
}

func (s *SettingService) GetBuzzBalanceSettings(ctx context.Context) (BuzzBalanceSettings, error) {
	values, err := s.settingRepo.GetMultiple(ctx, []string{
		SettingKeyBuzzBalanceEnabled,
		SettingKeyBuzzBalanceAPIBaseURL,
		SettingKeyBuzzBalanceAPIToken,
	})
	if err != nil {
		return BuzzBalanceSettings{}, fmt.Errorf("get buzz balance settings: %w", err)
	}
	return BuzzBalanceSettings{
		Enabled:    values[SettingKeyBuzzBalanceEnabled] == "true",
		APIBaseURL: normalizeBuzzBalanceAPIBaseURL(values[SettingKeyBuzzBalanceAPIBaseURL]),
		APIToken:   strings.TrimSpace(values[SettingKeyBuzzBalanceAPIToken]),
	}, nil
}

func (s *BuzzBalanceService) GetBalance(ctx context.Context) (*BuzzBalance, error) {
	settings, err := s.settingService.GetBuzzBalanceSettings(ctx)
	if err != nil {
		return nil, err
	}
	result := &BuzzBalance{
		Enabled:    settings.Enabled,
		Configured: settings.APIToken != "",
		Currency:   "USD",
		SiteURL:    settings.APIBaseURL,
	}
	if !settings.Enabled || settings.APIToken == "" {
		return result, nil
	}

	var subscription struct {
		SoftLimitUSD     float64         `json:"soft_limit_usd"`
		ExpiresAt        json.RawMessage `json:"expires_at"`
		CurrentPeriodEnd json.RawMessage `json:"current_period_end"`
		RenewsAt         json.RawMessage `json:"renews_at"`
	}
	if err := s.getJSON(ctx, settings, "/v1/dashboard/billing/subscription", &subscription); err != nil {
		return nil, err
	}

	var usage struct {
		TotalUsage float64 `json:"total_usage"`
	}
	if err := s.getJSON(ctx, settings, "/v1/dashboard/billing/usage", &usage); err != nil {
		return nil, err
	}

	result.Total = subscription.SoftLimitUSD
	result.Used = usage.TotalUsage / 100
	result.Remaining = result.Total - result.Used
	result.ExpiresAt = firstExternalTime(subscription.ExpiresAt, subscription.CurrentPeriodEnd, subscription.RenewsAt)
	result.DaysRemaining = daysRemainingFromNow(result.ExpiresAt)
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func (s *BuzzBalanceService) getJSON(ctx context.Context, settings BuzzBalanceSettings, path string, out any) error {
	resp, err := s.client.R().
		SetContext(ctx).
		SetBearerAuthToken(settings.APIToken).
		SetSuccessResult(out).
		Get(settings.APIBaseURL + path)
	if err != nil {
		return infraerrors.ServiceUnavailable("BUZZ_BALANCE_UPSTREAM_ERROR", "failed to query BuzzAI balance")
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return infraerrors.ServiceUnavailable("BUZZ_BALANCE_UPSTREAM_ERROR", "BuzzAI balance API returned an error")
	}
	return nil
}

func firstExternalTime(values ...json.RawMessage) *time.Time {
	for _, raw := range values {
		if parsed := parseExternalTimeRaw(raw); parsed != nil {
			return parsed
		}
	}
	return nil
}

func parseExternalTimeRaw(raw json.RawMessage) *time.Time {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return nil
	}
	var str string
	if err := json.Unmarshal(raw, &str); err == nil {
		return parseExternalTimeString(str)
	}
	var number json.Number
	if err := json.Unmarshal(raw, &number); err == nil {
		value, err := strconv.ParseFloat(number.String(), 64)
		if err != nil {
			return nil
		}
		if value > 1e12 {
			value = value / 1000
		}
		seconds := int64(value)
		if seconds <= 0 {
			return nil
		}
		parsed := time.Unix(seconds, 0).UTC()
		return &parsed
	}
	return nil
}

func parseExternalTimeString(value string) *time.Time {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	if parsed, err := time.Parse(time.RFC3339, trimmed); err == nil {
		return &parsed
	}
	for _, layout := range []string{
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006/01/02 15:04:05",
		"2006/01/02 15:04",
	} {
		if parsed, err := time.ParseInLocation(layout, trimmed, time.UTC); err == nil {
			return &parsed
		}
	}
	if parsed, err := time.Parse("2006-01-02", trimmed); err == nil {
		return &parsed
	}
	if number, err := strconv.ParseFloat(trimmed, 64); err == nil {
		if number > 1e12 {
			number = number / 1000
		}
		seconds := int64(number)
		if seconds > 0 {
			parsed := time.Unix(seconds, 0).UTC()
			return &parsed
		}
	}
	return nil
}
