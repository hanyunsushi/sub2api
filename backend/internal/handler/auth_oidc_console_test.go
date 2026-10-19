package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/Wei-Shaw/sub2api/ent/authidentity"
	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestOIDCConsoleCallbackSelection(t *testing.T) {
	cfg := config.OIDCConnectConfig{
		IssuerURL: "https://issuer.example/application/o/ai/", ClientID: "existing-client", ClientSecret: "existing-secret",
		RedirectURL: "https://ai.example/api/v1/auth/oauth/oidc/callback", FrontendRedirectURL: "https://ai.example/auth/oidc/callback",
	}
	for _, host := range []string{"console.kreeper.cc", "CONSOLE.KREEPER.CC:443", "ai.example", "console.kreeper.cc.evil.test", "console.kreeper.cc:444"} {
		t.Run(host, func(t *testing.T) {
			r := httptest.NewRequest("GET", "https://"+host+"/", nil)
			r.Header.Set("X-Forwarded-Host", "console.kreeper.cc")
			r.Header.Set("Origin", oidcConsoleOrigin)
			want := cfg
			if host == "console.kreeper.cc" || host == "CONSOLE.KREEPER.CC:443" {
				want.RedirectURL = oidcConsoleOrigin + "/api/kreepai/api/v1/auth/oauth/oidc/callback"
				want.FrontendRedirectURL = oidcConsoleOrigin + "/kreepai/auth/oidc/callback"
			}
			require.Equal(t, want, oidcConfigForRequest(cfg, r))
		})
	}
}

func TestOIDCConsoleStartAndSignedCallback(t *testing.T) {
	redirectURI := oidcConsoleOrigin + "/api/kreepai/api/v1/auth/oauth/oidc/callback"
	cfg, cleanup := newOIDCTestProvider(t, oidcProviderFixture{
		Subject: "console-user", PreferredUsername: "console_user", Email: "console@example.com", EmailVerified: true,
		RedirectURI: redirectURI,
	})
	t.Cleanup(cleanup)
	handler, client := newOIDCOAuthHandlerAndClientWithSettings(t, false, cfg, nil)
	t.Cleanup(func() { _ = client.Close() })
	start := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(start)
	c.Request = httptest.NewRequest("GET", oidcConsoleOrigin+"/api/v1/auth/oauth/oidc/start?redirect=/dashboard", nil)
	handler.OIDCOAuthStart(c)
	require.Equal(t, http.StatusFound, start.Code)
	authorizeURL, err := url.Parse(start.Header().Get("Location"))
	require.NoError(t, err)
	require.Equal(t, redirectURI, authorizeURL.Query().Get("redirect_uri"))
	require.Equal(t, cfg.ClientID, authorizeURL.Query().Get("client_id"))
	require.NotEmpty(t, authorizeURL.Query().Get("nonce"))
	require.Equal(t, "S256", authorizeURL.Query().Get("code_challenge_method"))
	for _, cookie := range start.Result().Cookies() {
		require.True(t, cookie.Secure)
		require.True(t, cookie.HttpOnly)
	}
	// The fixture signs a real ID token with this nonce and verifies the token
	// exchange redirect_uri; the existing account/PKCE/state machinery stays active.
	callback := httptest.NewRecorder()
	c, _ = gin.CreateTestContext(callback)
	req := httptest.NewRequest("GET", oidcConsoleOrigin+"/api/v1/auth/oauth/oidc/callback?code=oidc-code&state=console-state", nil)
	for name, value := range map[string]string{
		oidcOAuthStateCookieName: "console-state", oidcOAuthRedirectCookie: "/dashboard",
		oidcOAuthVerifierCookie: "console-verifier", oidcOAuthNonceCookie: "nonce-console-user",
		oidcOAuthIntentCookieName: oauthIntentLogin, oauthPendingBrowserCookieName: "console-browser",
	} {
		req.AddCookie(encodedCookie(name, value))
	}
	c.Request = req
	handler.OIDCOAuthCallback(c)
	require.Equal(t, http.StatusFound, callback.Code)
	require.Contains(t, callback.Header().Get("Location"), oidcConsoleOrigin+"/kreepai/auth/oidc/callback#")
	fragment := parseOAuthRedirectFragment(t, callback.Header().Get("Location"))
	require.NotEmpty(t, fragment.Get("access_token"))
	require.NotEmpty(t, fragment.Get("refresh_token"))
	require.Equal(t, "/dashboard", fragment.Get("redirect"))
	identity, err := client.AuthIdentity.Query().Where(
		authidentity.ProviderTypeEQ("oidc"), authidentity.ProviderKeyEQ(cfg.IssuerURL), authidentity.ProviderSubjectEQ("console-user"),
	).Only(context.Background())
	require.NoError(t, err)
	require.Positive(t, identity.UserID)
	stored, err := handler.getOIDCOAuthConfig(context.Background())
	require.NoError(t, err)
	require.Equal(t, cfg.RedirectURL, stored.RedirectURL)
	require.Equal(t, cfg.FrontendRedirectURL, stored.FrontendRedirectURL)
}

func TestOIDCConsoleRejectsMissingBrowserProof(t *testing.T) {
	cfg, cleanup := newOIDCTestProvider(t, oidcProviderFixture{Subject: "untrusted-console-user"})
	t.Cleanup(cleanup)
	handler, client := newOIDCOAuthHandlerAndClient(t, false, cfg)
	t.Cleanup(func() { _ = client.Close() })
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest("GET", oidcConsoleOrigin+"/api/v1/auth/oauth/oidc/callback?code=unused&state=wrong", nil)
	handler.OIDCOAuthCallback(c)
	require.Contains(t, recorder.Header().Get("Location"), oidcConsoleOrigin+"/kreepai/auth/oidc/callback")
	require.Contains(t, recorder.Header().Get("Location"), "invalid_state")
	count, err := client.AuthIdentity.Query().Count(context.Background())
	require.NoError(t, err)
	require.Zero(t, count)
}
