package service

import (
	"context"
)

type PackyCodeSubscriptionSettings = ExternalSubscriptionSettings
type PackyCodeSubscriptionStatus = ExternalSubscriptionStatus
type PackyCodeSubscriptionItem = ExternalSubscriptionItem

type PackyCodeSubscriptionService struct {
	*ExternalSubscriptionService
}

func packycodeSubscriptionProviderConfig() externalSubscriptionProviderConfig {
	return externalSubscriptionProviderConfig{
		Provider:          "packycode",
		DisplayName:       "PackyCode",
		DefaultAPIBaseURL: DefaultPackyCodeSubscriptionAPIBaseURL,
		EnabledKey:        SettingKeyPackyCodeSubscriptionEnabled,
		APIBaseURLKey:     SettingKeyPackyCodeSubscriptionAPIBaseURL,
		APITokenKey:       SettingKeyPackyCodeSubscriptionAPIToken,
		UserIDKey:         SettingKeyPackyCodeSubscriptionUserID,
		RefreshTokenKey:   SettingKeyPackyCodeSubscriptionRefreshToken,
	}
}

func NewPackyCodeSubscriptionService(settingService *SettingService) *PackyCodeSubscriptionService {
	return &PackyCodeSubscriptionService{
		ExternalSubscriptionService: newExternalSubscriptionService(settingService, packycodeSubscriptionProviderConfig()),
	}
}

func normalizePackyCodeSubscriptionAPIBaseURL(raw string) string {
	return normalizeExternalSubscriptionAPIBaseURL(raw, DefaultPackyCodeSubscriptionAPIBaseURL)
}

func (s *SettingService) GetPackyCodeSubscriptionSettings(ctx context.Context) (PackyCodeSubscriptionSettings, error) {
	return s.getExternalSubscriptionSettings(ctx, packycodeSubscriptionProviderConfig())
}

func (s *PackyCodeSubscriptionService) GetStatus(ctx context.Context) (*PackyCodeSubscriptionStatus, error) {
	return s.getNewAPIConsoleUserQuotaStatus(ctx, packycodeSubscriptionProviderConfig())
}
