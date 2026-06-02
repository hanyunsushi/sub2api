package service

import "context"

type QLHazyCoderSubscriptionSettings = ExternalSubscriptionSettings
type QLHazyCoderSubscriptionStatus = ExternalSubscriptionStatus
type QLHazyCoderSubscriptionItem = ExternalSubscriptionItem

type QLHazyCoderSubscriptionService struct {
	*ExternalSubscriptionService
}

func qlhazycoderSubscriptionProviderConfig() externalSubscriptionProviderConfig {
	return externalSubscriptionProviderConfig{
		Provider:          "qlhazycoder",
		DisplayName:       "qlhazycoder",
		DefaultAPIBaseURL: DefaultQLHazyCoderSubscriptionAPIBaseURL,
		EnabledKey:        SettingKeyQLHazyCoderSubscriptionEnabled,
		APIBaseURLKey:     SettingKeyQLHazyCoderSubscriptionAPIBaseURL,
		APITokenKey:       SettingKeyQLHazyCoderSubscriptionAPIToken,
		RefreshTokenKey:   SettingKeyQLHazyCoderSubscriptionRefreshToken,
	}
}

func NewQLHazyCoderSubscriptionService(settingService *SettingService) *QLHazyCoderSubscriptionService {
	return &QLHazyCoderSubscriptionService{
		ExternalSubscriptionService: newExternalSubscriptionService(settingService, qlhazycoderSubscriptionProviderConfig()),
	}
}

func normalizeQLHazyCoderSubscriptionAPIBaseURL(raw string) string {
	return normalizeExternalSubscriptionAPIBaseURL(raw, DefaultQLHazyCoderSubscriptionAPIBaseURL)
}

func (s *SettingService) GetQLHazyCoderSubscriptionSettings(ctx context.Context) (QLHazyCoderSubscriptionSettings, error) {
	return s.getExternalSubscriptionSettings(ctx, qlhazycoderSubscriptionProviderConfig())
}
