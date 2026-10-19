package handler

import (
	"net/http"
	"strings"

	"github.com/Wei-Shaw/sub2api/internal/config"
)

const oidcConsoleOrigin = "https://console.kreeper.cc"

// Only the fixed Console Host selects these callbacks. The gateway preserves
// Host; arbitrary forwarded hosts and return URLs cannot select an origin.
// Return a copy so the original site's issuer, client and stored settings stay
// identical and both legs of the Console code exchange use the same redirect.
func oidcConfigForRequest(cfg config.OIDCConnectConfig, r *http.Request) config.OIDCConnectConfig {
	if strings.EqualFold(r.Host, "console.kreeper.cc") || strings.EqualFold(r.Host, "console.kreeper.cc:443") {
		cfg.RedirectURL = oidcConsoleOrigin + "/api/kreepai/api/v1/auth/oauth/oidc/callback"
		cfg.FrontendRedirectURL = oidcConsoleOrigin + "/kreepai/auth/oidc/callback"
	}
	return cfg
}
