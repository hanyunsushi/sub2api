package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

func (s *ExternalSubscriptionService) getBuzzBalanceSubscriptionStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, cfg)
	if err != nil {
		return nil, err
	}
	result := externalCreditStatusBase(settings, cfg, settings.APIToken != "")
	if !settings.Enabled || settings.APIToken == "" {
		return result, nil
	}

	var subscription struct {
		SoftLimitUSD     float64         `json:"soft_limit_usd"`
		ExpiresAt        json.RawMessage `json:"expires_at"`
		CurrentPeriodEnd json.RawMessage `json:"current_period_end"`
		RenewsAt         json.RawMessage `json:"renews_at"`
	}
	if err := s.getBuzzBalanceJSON(ctx, settings, cfg, "/v1/dashboard/billing/subscription", &subscription); err != nil {
		return statusWithExternalCreditError(result, err, cfg)
	}

	var usage struct {
		TotalUsage float64 `json:"total_usage"`
	}
	if err := s.getBuzzBalanceJSON(ctx, settings, cfg, "/v1/dashboard/billing/usage", &usage); err != nil {
		return statusWithExternalCreditError(result, err, cfg)
	}

	total := subscription.SoftLimitUSD
	used := usage.TotalUsage / 100
	remaining := total - used
	expiry := firstExternalTime(subscription.ExpiresAt, subscription.CurrentPeriodEnd, subscription.RenewsAt)

	result.TotalLimitUSD = &total
	result.UsedUSD = used
	result.RemainingUSD = &remaining
	result.ExpiresAt = expiry
	result.DaysRemaining = daysRemainingFromNow(expiry)
	result.ActiveCount = 1
	result.Subscriptions = []ExternalSubscriptionItem{{
		ID:            1,
		GroupID:       0,
		GroupName:     cfg.DisplayName,
		Status:        "active",
		Window:        "subscription",
		LimitUSD:      &total,
		UsedUSD:       used,
		RemainingUSD:  &remaining,
		ExpiresAt:     expiry,
		DaysRemaining: daysRemainingFromNow(expiry),
	}}
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func (s *ExternalSubscriptionService) getBuzzBalanceJSON(ctx context.Context, settings ExternalSubscriptionSettings, cfg externalSubscriptionProviderConfig, path string, out any) error {
	resp, err := s.client.R().
		SetContext(ctx).
		SetBearerAuthToken(settings.APIToken).
		SetSuccessResult(out).
		Get(settings.APIBaseURL + path)
	if err != nil {
		return infraerrors.ServiceUnavailable(externalCreditErrorCode(cfg), fmt.Sprintf("failed to query %s balance", cfg.DisplayName))
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return externalCreditErrorFromResponse(cfg, resp.StatusCode, resp.Bytes())
	}
	return nil
}

func buzzBalanceProviderConfig() externalSubscriptionProviderConfig {
	return externalSubscriptionProviderConfig{
		Provider:          "buzz",
		DisplayName:       "Buzz",
		DefaultAPIBaseURL: DefaultBuzzBalanceAPIBaseURL,
		EnabledKey:        SettingKeyBuzzBalanceEnabled,
		APIBaseURLKey:     SettingKeyBuzzBalanceAPIBaseURL,
		APITokenKey:       SettingKeyBuzzBalanceAPIToken,
		UserIDKey:         "",
		RefreshTokenKey:   "",
	}
}

func isBuzzBalanceProviderID(id string) bool {
	return strings.TrimSpace(strings.ToLower(id)) == "buzz"
}
