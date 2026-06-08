package service

import (
	"context"
)

type PixelSubscriptionSettings = ExternalSubscriptionSettings
type PixelSubscriptionStatus = ExternalSubscriptionStatus
type PixelSubscriptionItem = ExternalSubscriptionItem

type PixelSubscriptionService struct {
	*ExternalSubscriptionService
}

func pixelSubscriptionProviderConfig() externalSubscriptionProviderConfig {
	return externalSubscriptionProviderConfig{
		Provider:          "pixel",
		DisplayName:       "Pixel",
		DefaultAPIBaseURL: DefaultPixelSubscriptionAPIBaseURL,
		EnabledKey:        SettingKeyPixelSubscriptionEnabled,
		APIBaseURLKey:     SettingKeyPixelSubscriptionAPIBaseURL,
		APITokenKey:       SettingKeyPixelSubscriptionAPIToken,
		RefreshTokenKey:   SettingKeyPixelSubscriptionRefreshToken,
	}
}

func NewPixelSubscriptionService(settingService *SettingService) *PixelSubscriptionService {
	return &PixelSubscriptionService{
		ExternalSubscriptionService: newExternalSubscriptionService(settingService, pixelSubscriptionProviderConfig()),
	}
}

func normalizePixelSubscriptionAPIBaseURL(raw string) string {
	return normalizeExternalSubscriptionAPIBaseURL(raw, DefaultPixelSubscriptionAPIBaseURL)
}

func (s *SettingService) GetPixelSubscriptionSettings(ctx context.Context) (PixelSubscriptionSettings, error) {
	return s.getExternalSubscriptionSettings(ctx, pixelSubscriptionProviderConfig())
}

func (s *PixelSubscriptionService) GetStatus(ctx context.Context) (*PixelSubscriptionStatus, error) {
	return s.getAuthMeBalanceStatus(ctx, pixelSubscriptionProviderConfig())
}
