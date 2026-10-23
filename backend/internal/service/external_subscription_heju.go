package service

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"strings"
	"time"
)

const hejuQuotaPerUnit = 500000.0

func (s *ExternalSubscriptionService) getHejuAPIKeyStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, cfg)
	if err != nil {
		return nil, err
	}
	settings.APIToken = normalizeQLHazyCoderSubscriptionAuth(settings.APIToken).Token
	result := &ExternalSubscriptionStatus{
		Provider: cfg.Provider, Enabled: settings.Enabled, Configured: settings.APIToken != "",
		Currency: "USD", SiteURL: settings.APIBaseURL, Subscriptions: []ExternalSubscriptionItem{},
	}
	if !result.Enabled || !result.Configured {
		return result, nil
	}
	var account struct {
		Remaining *qlhazyCoderFloat `json:"remaining"`
		Unit      string            `json:"unit"`
	}
	if err := s.getHejuJSON(ctx, settings, "/api/usage/account", "success", &account); err != nil {
		return nil, err
	}
	if !validHejuQuota(account.Remaining) || !strings.EqualFold(account.Unit, "USD") {
		return nil, hejuResponseError(http.StatusOK)
	}
	var token struct {
		TotalGranted   *qlhazyCoderFloat `json:"total_granted"`
		TotalUsed      *qlhazyCoderFloat `json:"total_used"`
		TotalAvailable *qlhazyCoderFloat `json:"total_available"`
		Unlimited      *bool             `json:"unlimited_quota"`
		ExpiresAt      *int64            `json:"expires_at"`
	}
	if err := s.getHejuJSON(ctx, settings, "/api/usage/token/", "code", &token); err != nil {
		return nil, err
	}
	if !validHejuQuota(token.TotalUsed) || *token.TotalUsed < 0 || token.Unlimited == nil || token.ExpiresAt == nil ||
		(!*token.Unlimited && (!validHejuQuota(token.TotalGranted) || *token.TotalGranted < 0 || !validHejuQuota(token.TotalAvailable))) {
		return nil, hejuResponseError(http.StatusOK)
	}
	wallet := float64(*account.Remaining)
	result.RemainingUSD = &wallet
	result.TokenQuota = &ExternalSubscriptionTokenQuota{
		Unlimited: *token.Unlimited, UsedUSD: float64(*token.TotalUsed) / hejuQuotaPerUnit,
	}
	if !*token.Unlimited {
		total, remaining := float64(*token.TotalGranted)/hejuQuotaPerUnit, float64(*token.TotalAvailable)/hejuQuotaPerUnit
		result.TokenQuota.TotalLimitUSD = &total
		result.TokenQuota.RemainingUSD = &remaining
	}
	if *token.ExpiresAt > 0 {
		expires := time.Unix(*token.ExpiresAt, 0).UTC()
		result.TokenQuota.ExpiresAt = &expires
	}
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func validHejuQuota(value *qlhazyCoderFloat) bool {
	return value != nil && !math.IsNaN(float64(*value)) && !math.IsInf(float64(*value), 0)
}

// The two documented endpoints intentionally use different boolean success
// fields. Neither a 200 response nor a missing field is treated as success.
func (s *ExternalSubscriptionService) getHejuJSON(ctx context.Context, settings ExternalSubscriptionSettings, path, successField string, out any) error {
	resp, err := s.client.R().SetContext(ctx).SetBearerAuthToken(settings.APIToken).Get(settings.APIBaseURL + path)
	if err != nil {
		return hejuResponseError(0)
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return hejuResponseError(resp.StatusCode)
	}
	var envelope map[string]json.RawMessage
	if json.Unmarshal(resp.Bytes(), &envelope) != nil || string(envelope[successField]) != "true" {
		return hejuResponseError(resp.StatusCode)
	}
	if len(envelope["data"]) == 0 || string(envelope["data"]) == "null" || json.Unmarshal(envelope["data"], out) != nil {
		return hejuResponseError(resp.StatusCode)
	}
	return nil
}

func hejuResponseError(status int) error {
	code, message := "HEJU_SUBSCRIPTION_UPSTREAM_ERROR", "合聚余额查询失败，请稍后重试"
	if status == http.StatusUnauthorized || status == http.StatusForbidden {
		code, message = "INVALID_TOKEN", "合聚 API Key 无效、已过期或访问受限"
	}
	if status == http.StatusTooManyRequests {
		message = "合聚查询过于频繁，请稍后刷新"
	}
	return &externalSubscriptionUpstreamError{StatusCode: status, Code: code, Message: message, Provider: "heju", Display: "合聚 API"}
}
