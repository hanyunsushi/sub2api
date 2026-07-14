//go:build unit

package service

import (
	"context"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

type settingPublicRepoStub struct {
	values map[string]string
}

func (s *settingPublicRepoStub) Get(ctx context.Context, key string) (*Setting, error) {
	panic("unexpected Get call")
}

func (s *settingPublicRepoStub) GetValue(ctx context.Context, key string) (string, error) {
	if value, ok := s.values[key]; ok {
		return value, nil
	}
	return "", ErrSettingNotFound
}

func (s *settingPublicRepoStub) Set(ctx context.Context, key, value string) error {
	panic("unexpected Set call")
}

func (s *settingPublicRepoStub) GetMultiple(ctx context.Context, keys []string) (map[string]string, error) {
	out := make(map[string]string, len(keys))
	for _, key := range keys {
		if value, ok := s.values[key]; ok {
			out[key] = value
		}
	}
	return out, nil
}

func (s *settingPublicRepoStub) SetMultiple(ctx context.Context, settings map[string]string) error {
	if s.values == nil {
		s.values = map[string]string{}
	}
	for key, value := range settings {
		s.values[key] = value
	}
	return nil
}

func (s *settingPublicRepoStub) GetAll(ctx context.Context) (map[string]string, error) {
	panic("unexpected GetAll call")
}

func (s *settingPublicRepoStub) Delete(ctx context.Context, key string) error {
	panic("unexpected Delete call")
}

func TestSettingService_InitializeDefaultSettings_UsesAnthropicTheme(t *testing.T) {
	repo := &settingPublicRepoStub{values: map[string]string{}}
	svc := NewSettingService(repo, &config.Config{})

	require.NoError(t, svc.InitializeDefaultSettings(context.Background()))
	require.Equal(t, "anthropic", repo.values[SettingKeyAppearanceThemeDefault])
}

func TestSettingService_GetPublicSettings_ExposesRegistrationEmailSuffixWhitelist(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyRegistrationEnabled:              "true",
			SettingKeyEmailVerifyEnabled:               "true",
			SettingKeyRegistrationEmailSuffixWhitelist: `["@EXAMPLE.com"," @foo.bar ","*.EDU.CN","@invalid_domain",""]`,
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.Equal(t, []string{"@example.com", "@foo.bar", "*.edu.cn"}, settings.RegistrationEmailSuffixWhitelist)
}

func TestSettingService_GetPublicSettings_ExposesTablePreferences(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyTableDefaultPageSize: "50",
			SettingKeyTablePageSizeOptions: "[20,50,100]",
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.Equal(t, 50, settings.TableDefaultPageSize)
	require.Equal(t, []int{20, 50, 100}, settings.TablePageSizeOptions)
}

func TestSettingService_GetPublicSettings_ExposesForceEmailOnThirdPartySignup(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyForceEmailOnThirdPartySignup: "true",
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.True(t, settings.ForceEmailOnThirdPartySignup)
}

func TestSettingService_GetPublicSettings_NormalizesRemovedCloudflareTheme(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyAppearanceThemeDefault: "cloudflare",
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.Equal(t, "anthropic", settings.AppearanceThemeDefault)
}

func TestSettingService_GetPublicSettings_ExposesAllowUserViewErrorRequests(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyAllowUserViewErrorRequests: "true",
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.True(t, settings.AllowUserViewErrorRequests)
}

func TestSettingService_GetPublicSettings_ExposesAILogoSettings(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyAILogoCDNBaseURL:         "https://img.example.com/lobe/light/",
			SettingKeyCustomAILogoPresets:      `["https://img.example.com/custom/a.png","javascript:alert(1)","https://img.example.com/custom/a.png","https://img.example.com/custom/b.svg"]`,
			SettingKeyCustomMenuSVGIconPresets: `["https://img.example.com/menu/a.svg","javascript:alert(1)","https://img.example.com/menu/a.svg","https://img.example.com/menu/b.svg"]`,
			SettingKeyAppearanceThemeDefault:   "cloudflare",
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.Equal(t, "https://img.example.com/lobe/light", settings.AILogoCDNBaseURL)
	require.Equal(t, []string{
		"https://img.example.com/custom/a.png",
		"https://img.example.com/custom/b.svg",
	}, settings.CustomAILogoPresets)
	require.Equal(t, []string{
		"https://img.example.com/menu/a.svg",
		"https://img.example.com/menu/b.svg",
	}, settings.CustomMenuSVGIconPresets)
}

func TestSettingService_AppendCustomAILogoPreset_NormalizesDedupesAndPersists(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyCustomAILogoPresets: `["https://img.example.com/custom/a.png"]`,
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	presets, err := svc.AppendCustomAILogoPreset(context.Background(), " https://img.example.com/custom/b.png ")
	require.NoError(t, err)
	require.Equal(t, []string{
		"https://img.example.com/custom/b.png",
		"https://img.example.com/custom/a.png",
	}, presets)
	require.JSONEq(t, `["https://img.example.com/custom/b.png","https://img.example.com/custom/a.png"]`, repo.values[SettingKeyCustomAILogoPresets])

	_, err = svc.AppendCustomAILogoPreset(context.Background(), "javascript:alert(1)")
	require.Error(t, err)
}

func TestSettingService_DeleteCustomAILogoPreset_NormalizesRemovesAndPersists(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyCustomAILogoPresets: `["https://img.example.com/custom/a.png","https://img.example.com/custom/b.png"]`,
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	presets, err := svc.DeleteCustomAILogoPreset(context.Background(), " https://img.example.com/custom/a.png ")
	require.NoError(t, err)
	require.Equal(t, []string{
		"https://img.example.com/custom/b.png",
	}, presets)
	require.JSONEq(t, `["https://img.example.com/custom/b.png"]`, repo.values[SettingKeyCustomAILogoPresets])

	presets, err = svc.DeleteCustomAILogoPreset(context.Background(), "https://img.example.com/custom/missing.png")
	require.NoError(t, err)
	require.Equal(t, []string{
		"https://img.example.com/custom/b.png",
	}, presets)

	_, err = svc.DeleteCustomAILogoPreset(context.Background(), "javascript:alert(1)")
	require.Error(t, err)
}

func TestSettingService_AppendCustomMenuSVGIconPreset_NormalizesDedupesAndPersists(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyCustomMenuSVGIconPresets: `["https://img.example.com/menu/a.svg"]`,
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	presets, err := svc.AppendCustomMenuSVGIconPreset(context.Background(), " https://img.example.com/menu/b.svg ")
	require.NoError(t, err)
	require.Equal(t, []string{
		"https://img.example.com/menu/b.svg",
		"https://img.example.com/menu/a.svg",
	}, presets)
	require.JSONEq(t, `["https://img.example.com/menu/b.svg","https://img.example.com/menu/a.svg"]`, repo.values[SettingKeyCustomMenuSVGIconPresets])

	_, err = svc.AppendCustomMenuSVGIconPreset(context.Background(), "javascript:alert(1)")
	require.Error(t, err)
}

func TestSettingService_DeleteCustomMenuSVGIconPreset_RemovesServerSideLibraryItem(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyCustomMenuSVGIconPresets: `["https://img.example.com/menu/a.svg","https://img.example.com/menu/b.svg"]`,
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	presets, err := svc.DeleteCustomMenuSVGIconPreset(context.Background(), " https://img.example.com/menu/a.svg ")
	require.NoError(t, err)
	require.Equal(t, []string{
		"https://img.example.com/menu/b.svg",
	}, presets)
	require.JSONEq(t, `["https://img.example.com/menu/b.svg"]`, repo.values[SettingKeyCustomMenuSVGIconPresets])

	presets, err = svc.DeleteCustomMenuSVGIconPreset(context.Background(), "https://img.example.com/menu/missing.svg")
	require.NoError(t, err)
	require.Equal(t, []string{
		"https://img.example.com/menu/b.svg",
	}, presets)

	_, err = svc.DeleteCustomMenuSVGIconPreset(context.Background(), "javascript:alert(1)")
	require.Error(t, err)
}

func TestSettingService_GetPublicSettings_NormalizesInvalidAppearanceThemeDefault(t *testing.T) {
	repo := &settingPublicRepoStub{
		values: map[string]string{
			SettingKeyAppearanceThemeDefault: "unknown",
		},
	}
	svc := NewSettingService(repo, &config.Config{})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.Equal(t, "anthropic", settings.AppearanceThemeDefault)
}

func TestSettingService_GetPublicSettings_ExposesWeChatOAuthModeCapabilities(t *testing.T) {
	svc := NewSettingService(&settingPublicRepoStub{
		values: map[string]string{
			SettingKeyWeChatConnectEnabled:             "true",
			SettingKeyWeChatConnectAppID:               "wx-mp-app",
			SettingKeyWeChatConnectAppSecret:           "wx-mp-secret",
			SettingKeyWeChatConnectMode:                "mp",
			SettingKeyWeChatConnectScopes:              "snsapi_base",
			SettingKeyWeChatConnectOpenEnabled:         "true",
			SettingKeyWeChatConnectMPEnabled:           "true",
			SettingKeyWeChatConnectRedirectURL:         "https://api.example.com/api/v1/auth/oauth/wechat/callback",
			SettingKeyWeChatConnectFrontendRedirectURL: "/auth/wechat/callback",
		},
	}, &config.Config{})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.True(t, settings.WeChatOAuthEnabled)
	require.True(t, settings.WeChatOAuthOpenEnabled)
	require.True(t, settings.WeChatOAuthMPEnabled)
}

func TestSettingService_GetPublicSettings_DoesNotExposeMobileOnlyWeChatAsWebOAuthAvailable(t *testing.T) {
	svc := NewSettingService(&settingPublicRepoStub{
		values: map[string]string{
			SettingKeyWeChatConnectEnabled:             "true",
			SettingKeyWeChatConnectMobileEnabled:       "true",
			SettingKeyWeChatConnectMode:                "mobile",
			SettingKeyWeChatConnectMobileAppID:         "wx-mobile-app",
			SettingKeyWeChatConnectMobileAppSecret:     "wx-mobile-secret",
			SettingKeyWeChatConnectFrontendRedirectURL: "/auth/wechat/callback",
		},
	}, &config.Config{})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.False(t, settings.WeChatOAuthEnabled)
	require.False(t, settings.WeChatOAuthOpenEnabled)
	require.False(t, settings.WeChatOAuthMPEnabled)
	require.True(t, settings.WeChatOAuthMobileEnabled)
}

func TestSettingService_GetWebAppIconSettings_ReturnsBrandingFields(t *testing.T) {
	svc := NewSettingService(&settingPublicRepoStub{
		values: map[string]string{
			SettingKeySiteName: "Example Gateway",
			SettingKeySiteLogo: "https://img.example.com/logo.png",
		},
	}, &config.Config{})

	siteName, siteLogo, err := svc.GetWebAppIconSettings(context.Background())
	require.NoError(t, err)
	require.Equal(t, "Example Gateway", siteName)
	require.Equal(t, "https://img.example.com/logo.png", siteLogo)
}

func TestSettingService_GetWebAppIconSettings_FallsBackToDefaultName(t *testing.T) {
	svc := NewSettingService(&settingPublicRepoStub{values: map[string]string{}}, &config.Config{})

	siteName, siteLogo, err := svc.GetWebAppIconSettings(context.Background())
	require.NoError(t, err)
	require.Equal(t, "Sub2API", siteName)
	require.Empty(t, siteLogo)
}

func TestSettingService_GetPublicSettings_FallsBackToConfigForWeChatOAuthCapabilities(t *testing.T) {
	svc := NewSettingService(&settingPublicRepoStub{values: map[string]string{}}, &config.Config{
		WeChat: config.WeChatConnectConfig{
			Enabled:             true,
			OpenEnabled:         true,
			OpenAppID:           "wx-open-config",
			OpenAppSecret:       "wx-open-secret",
			FrontendRedirectURL: "/auth/wechat/config-callback",
		},
	})

	settings, err := svc.GetPublicSettings(context.Background())
	require.NoError(t, err)
	require.True(t, settings.WeChatOAuthEnabled)
	require.True(t, settings.WeChatOAuthOpenEnabled)
	require.False(t, settings.WeChatOAuthMPEnabled)
	require.False(t, settings.WeChatOAuthMobileEnabled)
}
