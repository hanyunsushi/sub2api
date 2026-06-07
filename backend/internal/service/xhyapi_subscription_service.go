package service

import (
	"context"
)

type XHYAPISubscriptionSettings = ExternalSubscriptionSettings
type XHYAPISubscriptionStatus = ExternalSubscriptionStatus
type XHYAPISubscriptionItem = ExternalSubscriptionItem

type XHYAPISubscriptionService struct {
	*ExternalSubscriptionService
}

func xhyapiSubscriptionProviderConfig() externalSubscriptionProviderConfig {
	return externalSubscriptionProviderConfig{
		Provider:          "xhyapi",
		DisplayName:       "XHYAPI",
		DefaultAPIBaseURL: DefaultXHYAPISubscriptionAPIBaseURL,
		EnabledKey:        SettingKeyXHYAPISubscriptionEnabled,
		APIBaseURLKey:     SettingKeyXHYAPISubscriptionAPIBaseURL,
		APITokenKey:       SettingKeyXHYAPISubscriptionAPIToken,
		UserIDKey:         SettingKeyXHYAPISubscriptionUserID,
		RefreshTokenKey:   SettingKeyXHYAPISubscriptionRefreshToken,
	}
}

func NewXHYAPISubscriptionService(settingService *SettingService) *XHYAPISubscriptionService {
	return &XHYAPISubscriptionService{
		ExternalSubscriptionService: newExternalSubscriptionService(settingService, xhyapiSubscriptionProviderConfig()),
	}
}

func normalizeXHYAPISubscriptionAPIBaseURL(raw string) string {
	return normalizeExternalSubscriptionAPIBaseURL(raw, DefaultXHYAPISubscriptionAPIBaseURL)
}

func (s *SettingService) GetXHYAPISubscriptionSettings(ctx context.Context) (XHYAPISubscriptionSettings, error) {
	return s.getExternalSubscriptionSettings(ctx, xhyapiSubscriptionProviderConfig())
}

func (s *XHYAPISubscriptionService) GetStatus(ctx context.Context) (*XHYAPISubscriptionStatus, error) {
	return s.getNewAPIConsoleSubscriptionStatus(ctx, xhyapiSubscriptionProviderConfig())
}
