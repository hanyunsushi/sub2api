package service

import (
	"context"
	"strings"
	"time"
)

func (s *ExternalSubscriptionService) getMimoTokenPlanStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, cfg)
	if err != nil {
		return nil, err
	}
	result := &ExternalSubscriptionStatus{
		Provider:      cfg.Provider,
		Enabled:       settings.Enabled,
		Configured:    strings.TrimSpace(settings.APIToken) != "" || strings.TrimSpace(settings.RefreshToken) != "",
		Currency:      "USD",
		SiteURL:       settings.APIBaseURL,
		Subscriptions: []ExternalSubscriptionItem{},
	}
	if !settings.Enabled || !result.Configured {
		return result, nil
	}
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}
