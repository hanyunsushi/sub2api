package service

import (
	"context"
)

type LiustSubscriptionSettings = ExternalSubscriptionSettings
type LiustSubscriptionStatus = ExternalSubscriptionStatus
type LiustSubscriptionItem = ExternalSubscriptionItem

type LiustSubscriptionService struct {
	*ExternalSubscriptionService
}

func liustSubscriptionProviderConfig() externalSubscriptionProviderConfig {
	return externalSubscriptionProviderConfig{
		Provider:          "liust",
		DisplayName:       "liust",
		DefaultAPIBaseURL: DefaultLiustSubscriptionAPIBaseURL,
		EnabledKey:        SettingKeyLiustSubscriptionEnabled,
		APIBaseURLKey:     SettingKeyLiustSubscriptionAPIBaseURL,
		APITokenKey:       SettingKeyLiustSubscriptionAPIToken,
		UserIDKey:         SettingKeyLiustSubscriptionUserID,
		RefreshTokenKey:   SettingKeyLiustSubscriptionRefreshToken,
	}
}

func NewLiustSubscriptionService(settingService *SettingService) *LiustSubscriptionService {
	return &LiustSubscriptionService{
		ExternalSubscriptionService: newExternalSubscriptionService(settingService, liustSubscriptionProviderConfig()),
	}
}

func normalizeLiustSubscriptionAPIBaseURL(raw string) string {
	return normalizeExternalSubscriptionAPIBaseURL(raw, DefaultLiustSubscriptionAPIBaseURL)
}

func (s *SettingService) GetLiustSubscriptionSettings(ctx context.Context) (LiustSubscriptionSettings, error) {
	return s.getExternalSubscriptionSettings(ctx, liustSubscriptionProviderConfig())
}

func (s *LiustSubscriptionService) GetStatus(ctx context.Context) (*LiustSubscriptionStatus, error) {
	return s.getNewAPIConsoleSubscriptionStatus(ctx, liustSubscriptionProviderConfig())
}
