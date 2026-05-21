package service

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
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
	Enabled     bool      `json:"enabled"`
	Configured  bool      `json:"configured"`
	Currency    string    `json:"currency"`
	Total       float64   `json:"total"`
	Used        float64   `json:"used"`
	Remaining   float64   `json:"remaining"`
	RefreshedAt time.Time `json:"refreshed_at,omitempty"`
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
		Currency:   "CNY",
	}
	if !settings.Enabled || settings.APIToken == "" {
		return result, nil
	}

	var subscription struct {
		SoftLimitUSD float64 `json:"soft_limit_usd"`
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
