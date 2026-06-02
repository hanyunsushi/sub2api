package service

import (
	"context"
)

type TCDMXSubscriptionSettings = ExternalSubscriptionSettings
type TCDMXSubscriptionStatus = ExternalSubscriptionStatus
type TCDMXSubscriptionItem = ExternalSubscriptionItem

type TCDMXSubscriptionService struct {
	*ExternalSubscriptionService
}

func tcdmxSubscriptionProviderConfig() externalSubscriptionProviderConfig {
	return externalSubscriptionProviderConfig{
		Provider:          "tcdmx",
		DisplayName:       "TCDMX",
		DefaultAPIBaseURL: DefaultTCDMXSubscriptionAPIBaseURL,
		EnabledKey:        SettingKeyTCDMXSubscriptionEnabled,
		APIBaseURLKey:     SettingKeyTCDMXSubscriptionAPIBaseURL,
		APITokenKey:       SettingKeyTCDMXSubscriptionAPIToken,
		RefreshTokenKey:   SettingKeyTCDMXSubscriptionRefreshToken,
	}
}

func NewTCDMXSubscriptionService(settingService *SettingService) *TCDMXSubscriptionService {
	return &TCDMXSubscriptionService{
		ExternalSubscriptionService: newExternalSubscriptionService(settingService, tcdmxSubscriptionProviderConfig()),
	}
}

func normalizeTCDMXSubscriptionAPIBaseURL(raw string) string {
	return normalizeExternalSubscriptionAPIBaseURL(raw, DefaultTCDMXSubscriptionAPIBaseURL)
}

func (s *SettingService) GetTCDMXSubscriptionSettings(ctx context.Context) (TCDMXSubscriptionSettings, error) {
	return s.getExternalSubscriptionSettings(ctx, tcdmxSubscriptionProviderConfig())
}
