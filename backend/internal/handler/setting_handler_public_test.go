//go:build unit

package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type settingHandlerPublicRepoStub struct {
	values map[string]string
}

func (s *settingHandlerPublicRepoStub) Get(ctx context.Context, key string) (*service.Setting, error) {
	panic("unexpected Get call")
}

func (s *settingHandlerPublicRepoStub) GetValue(ctx context.Context, key string) (string, error) {
	if value, ok := s.values[key]; ok {
		return value, nil
	}
	return "", service.ErrSettingNotFound
}

func (s *settingHandlerPublicRepoStub) Set(ctx context.Context, key, value string) error {
	panic("unexpected Set call")
}

func (s *settingHandlerPublicRepoStub) GetMultiple(ctx context.Context, keys []string) (map[string]string, error) {
	out := make(map[string]string, len(keys))
	for _, key := range keys {
		if value, ok := s.values[key]; ok {
			out[key] = value
		}
	}
	return out, nil
}

func (s *settingHandlerPublicRepoStub) SetMultiple(ctx context.Context, settings map[string]string) error {
	if s.values == nil {
		s.values = map[string]string{}
	}
	for key, value := range settings {
		s.values[key] = value
	}
	return nil
}

func (s *settingHandlerPublicRepoStub) GetAll(ctx context.Context) (map[string]string, error) {
	panic("unexpected GetAll call")
}

func (s *settingHandlerPublicRepoStub) Delete(ctx context.Context, key string) error {
	panic("unexpected Delete call")
}

func TestSettingHandler_GetPublicSettings_ExposesForceEmailOnThirdPartySignup(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &settingHandlerPublicRepoStub{
		values: map[string]string{
			service.SettingKeyForceEmailOnThirdPartySignup: "true",
		},
	}
	h := NewSettingHandler(service.NewSettingService(repo, &config.Config{}), "test-version")

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/settings/public", nil)

	h.GetPublicSettings(c)

	require.Equal(t, http.StatusOK, recorder.Code)

	var resp struct {
		Code int `json:"code"`
		Data struct {
			ForceEmailOnThirdPartySignup bool `json:"force_email_on_third_party_signup"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
	require.Equal(t, 0, resp.Code)
	require.True(t, resp.Data.ForceEmailOnThirdPartySignup)
}

func TestSettingHandler_GetPublicSettings_ExposesAppearanceThemeDefault(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &settingHandlerPublicRepoStub{
		values: map[string]string{
			service.SettingKeyAppearanceThemeDefault: "cloudflare",
		},
	}
	h := NewSettingHandler(service.NewSettingService(repo, &config.Config{}), "test-version")

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/settings/public", nil)

	h.GetPublicSettings(c)

	require.Equal(t, http.StatusOK, recorder.Code)

	var resp struct {
		Code int `json:"code"`
		Data struct {
			AppearanceThemeDefault string `json:"appearance_theme_default"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
	require.Equal(t, 0, resp.Code)
	require.Equal(t, "cloudflare", resp.Data.AppearanceThemeDefault)
}

func TestSettingHandler_GetPublicSettings_ExposesAILogoSettings(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &settingHandlerPublicRepoStub{
		values: map[string]string{
			service.SettingKeyAILogoCDNBaseURL:         "https://img.example.com/lobe/light",
			service.SettingKeyCustomAILogoPresets:      `["https://img.example.com/custom/a.png"]`,
			service.SettingKeyCustomMenuSVGIconPresets: `["https://img.example.com/menu/a.svg"]`,
		},
	}
	h := NewSettingHandler(service.NewSettingService(repo, &config.Config{}), "test-version")

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/settings/public", nil)

	h.GetPublicSettings(c)

	require.Equal(t, http.StatusOK, recorder.Code)

	var resp struct {
		Code int `json:"code"`
		Data struct {
			AILogoCDNBaseURL         string   `json:"ai_logo_cdn_base_url"`
			CustomAILogoPresets      []string `json:"custom_ai_logo_presets"`
			CustomMenuSVGIconPresets []string `json:"custom_menu_svg_icon_presets"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
	require.Equal(t, 0, resp.Code)
	require.Equal(t, "https://img.example.com/lobe/light", resp.Data.AILogoCDNBaseURL)
	require.Equal(t, []string{"https://img.example.com/custom/a.png"}, resp.Data.CustomAILogoPresets)
	require.Equal(t, []string{"https://img.example.com/menu/a.svg"}, resp.Data.CustomMenuSVGIconPresets)
}

func TestSettingHandler_AppendCustomAILogoPreset_PersistsServerSideLibrary(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &settingHandlerPublicRepoStub{
		values: map[string]string{
			service.SettingKeyCustomAILogoPresets: `["https://img.example.com/custom/a.png"]`,
		},
	}
	h := NewSettingHandler(service.NewSettingService(repo, &config.Config{}), "test-version")

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(
		http.MethodPost,
		"/api/v1/settings/ai-logo-presets",
		strings.NewReader(`{"url":" https://img.example.com/custom/b.png "}`),
	)
	c.Request.Header.Set("Content-Type", "application/json")

	h.AppendCustomAILogoPreset(c)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.JSONEq(t, `["https://img.example.com/custom/b.png","https://img.example.com/custom/a.png"]`, repo.values[service.SettingKeyCustomAILogoPresets])

	var resp struct {
		Code int `json:"code"`
		Data struct {
			CustomAILogoPresets []string `json:"custom_ai_logo_presets"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
	require.Equal(t, []string{
		"https://img.example.com/custom/b.png",
		"https://img.example.com/custom/a.png",
	}, resp.Data.CustomAILogoPresets)
}

func TestSettingHandler_DeleteCustomAILogoPreset_PersistsServerSideLibrary(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &settingHandlerPublicRepoStub{
		values: map[string]string{
			service.SettingKeyCustomAILogoPresets: `["https://img.example.com/custom/a.png","https://img.example.com/custom/b.png"]`,
		},
	}
	h := NewSettingHandler(service.NewSettingService(repo, &config.Config{}), "test-version")

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(
		http.MethodDelete,
		"/api/v1/settings/ai-logo-presets",
		strings.NewReader(`{"url":" https://img.example.com/custom/a.png "}`),
	)
	c.Request.Header.Set("Content-Type", "application/json")

	h.DeleteCustomAILogoPreset(c)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.JSONEq(t, `["https://img.example.com/custom/b.png"]`, repo.values[service.SettingKeyCustomAILogoPresets])

	var resp struct {
		Code int `json:"code"`
		Data struct {
			CustomAILogoPresets []string `json:"custom_ai_logo_presets"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
	require.Equal(t, []string{"https://img.example.com/custom/b.png"}, resp.Data.CustomAILogoPresets)
}

func TestSettingHandler_AppendCustomMenuSVGIconPreset_PersistsServerSideLibrary(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &settingHandlerPublicRepoStub{
		values: map[string]string{
			service.SettingKeyCustomMenuSVGIconPresets: `["https://img.example.com/menu/a.svg"]`,
		},
	}
	h := NewSettingHandler(service.NewSettingService(repo, &config.Config{}), "test-version")

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(
		http.MethodPost,
		"/api/v1/settings/custom-menu-svg-icon-presets",
		strings.NewReader(`{"url":" https://img.example.com/menu/b.svg "}`),
	)
	c.Request.Header.Set("Content-Type", "application/json")

	h.AppendCustomMenuSVGIconPreset(c)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.JSONEq(t, `["https://img.example.com/menu/b.svg","https://img.example.com/menu/a.svg"]`, repo.values[service.SettingKeyCustomMenuSVGIconPresets])

	var resp struct {
		Code int `json:"code"`
		Data struct {
			CustomMenuSVGIconPresets []string `json:"custom_menu_svg_icon_presets"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
	require.Equal(t, []string{
		"https://img.example.com/menu/b.svg",
		"https://img.example.com/menu/a.svg",
	}, resp.Data.CustomMenuSVGIconPresets)
}

func TestSettingHandler_GetPublicSettings_ExposesWeChatOAuthModeCapabilities(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewSettingHandler(service.NewSettingService(&settingHandlerPublicRepoStub{
		values: map[string]string{
			service.SettingKeyWeChatConnectEnabled:             "true",
			service.SettingKeyWeChatConnectAppID:               "wx-mp-app",
			service.SettingKeyWeChatConnectAppSecret:           "wx-mp-secret",
			service.SettingKeyWeChatConnectMode:                "mp",
			service.SettingKeyWeChatConnectScopes:              "snsapi_base",
			service.SettingKeyWeChatConnectOpenEnabled:         "true",
			service.SettingKeyWeChatConnectMPEnabled:           "true",
			service.SettingKeyWeChatConnectRedirectURL:         "https://api.example.com/api/v1/auth/oauth/wechat/callback",
			service.SettingKeyWeChatConnectFrontendRedirectURL: "/auth/wechat/callback",
		},
	}, &config.Config{}), "test-version")

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/settings/public", nil)

	h.GetPublicSettings(c)

	require.Equal(t, http.StatusOK, recorder.Code)

	var resp struct {
		Code int `json:"code"`
		Data struct {
			WeChatOAuthEnabled     bool `json:"wechat_oauth_enabled"`
			WeChatOAuthOpenEnabled bool `json:"wechat_oauth_open_enabled"`
			WeChatOAuthMPEnabled   bool `json:"wechat_oauth_mp_enabled"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
	require.Equal(t, 0, resp.Code)
	require.True(t, resp.Data.WeChatOAuthEnabled)
	require.True(t, resp.Data.WeChatOAuthOpenEnabled)
	require.True(t, resp.Data.WeChatOAuthMPEnabled)
}
