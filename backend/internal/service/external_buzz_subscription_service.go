package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

const openAIBillingUnlimitedLimitUSD = 100_000_000

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

	result.UsedUSD = used
	result.ExpiresAt = expiry
	result.DaysRemaining = daysRemainingFromNow(expiry)
	result.ActiveCount = 1
	item := ExternalSubscriptionItem{
		ID:            1,
		GroupID:       0,
		GroupName:     cfg.DisplayName,
		Status:        "active",
		Window:        "subscription",
		UsedUSD:       used,
		ExpiresAt:     expiry,
		DaysRemaining: daysRemainingFromNow(expiry),
	}
	if total >= openAIBillingUnlimitedLimitUSD {
		// This is an OpenAI-compatible billing sentinel, not the account's
		// actual package quota. Keep usage available without claiming unlimited.
		item.Window = "usage_only"
	} else {
		result.TotalLimitUSD = &total
		result.RemainingUSD = &remaining
		item.LimitUSD = &total
		item.RemainingUSD = &remaining
	}
	result.Subscriptions = []ExternalSubscriptionItem{item}
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
