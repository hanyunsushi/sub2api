package service

import (
	"context"
	"math"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

// Pixel access tokens authorize console APIs, not model inference APIs.
func (s *ExternalSubscriptionService) getPixelAccessTokenStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, cfg)
	if err != nil {
		return nil, err
	}
	auth := normalizeQLHazyCoderSubscriptionAuth(settings.APIToken)
	settings.APIToken = auth.Token
	result := &ExternalSubscriptionStatus{
		Provider: cfg.Provider, Enabled: settings.Enabled, Configured: settings.APIToken != "",
		Currency: "CNY", SiteURL: settings.APIBaseURL, Subscriptions: []ExternalSubscriptionItem{},
	}
	if !settings.Enabled || settings.APIToken == "" {
		return result, nil
	}
	var metadata qlhazyCoderStatusMetadata
	if err := s.getNewAPIConsoleJSON(ctx, settings, auth, cfg, "/api/status", &metadata); err != nil {
		return statusWithNewAPIConsoleError(result, err, cfg)
	}
	converter := newQLHazyCoderQuotaConverter(metadata)
	result.Currency = converter.currency
	var account struct {
		User *struct {
			Quota     *qlhazyCoderFloat `json:"quota"`
			UsedQuota *qlhazyCoderFloat `json:"used_quota"`
		} `json:"user"`
		Quota     *qlhazyCoderFloat `json:"quota"`
		UsedQuota *qlhazyCoderFloat `json:"used_quota"`
	}
	if err := s.getNewAPIConsoleJSON(ctx, settings, auth, cfg, "/api/user/self", &account); err != nil {
		return statusWithNewAPIConsoleError(result, err, cfg)
	}
	if account.User != nil {
		account.Quota = account.User.Quota
		account.UsedQuota = account.User.UsedQuota
	}
	if account.Quota == nil || math.IsNaN(float64(*account.Quota)) || math.IsInf(float64(*account.Quota), 0) {
		return nil, infraerrors.ServiceUnavailable("PIXEL_SUBSCRIPTION_RESPONSE_INVALID", "Pixel account response did not include a valid quota")
	}
	remaining := converter.amount(*account.Quota)
	result.RemainingUSD = &remaining
	if account.UsedQuota != nil {
		result.UsedUSD = converter.amount(*account.UsedQuota)
		if math.IsNaN(result.UsedUSD) || math.IsInf(result.UsedUSD, 0) {
			return nil, infraerrors.ServiceUnavailable("PIXEL_SUBSCRIPTION_RESPONSE_INVALID", "Pixel account response included an invalid used quota")
		}
	}
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}
