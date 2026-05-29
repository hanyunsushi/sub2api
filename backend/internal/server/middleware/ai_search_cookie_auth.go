package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	AISearchPublicProxyAccessTokenCookieName      = "ai_search_access_token"
	AISearchPublicProxyAccessTokenCookiePath      = "/api/v1/ai-search/public"
	AISearchPublicProxyAccessTokenCookieMaxAgeSec = 10 * 60
)

// AISearchPublicProxyCookieAuth bridges the official Cloudflare snippet's
// internal fetch calls into the existing JWT middleware without making the
// proxy endpoint public.
func AISearchPublicProxyCookieAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetHeader("Authorization") == "" && strings.HasPrefix(c.Request.URL.Path, AISearchPublicProxyAccessTokenCookiePath) {
			if ck, err := c.Request.Cookie(AISearchPublicProxyAccessTokenCookieName); err == nil {
				if token := strings.TrimSpace(ck.Value); token != "" && !strings.ContainsAny(token, " \t\r\n") {
					c.Request.Header.Set("Authorization", "Bearer "+token)
				}
			}
		}
		c.Next()
	}
}

func ClearAISearchPublicProxyAccessTokenCookie(w http.ResponseWriter, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     AISearchPublicProxyAccessTokenCookieName,
		Value:    "",
		Path:     AISearchPublicProxyAccessTokenCookiePath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}
