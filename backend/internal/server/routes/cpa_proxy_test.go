package routes

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestCPAManagementProxyRewritesPathAndPreservesAuthorization(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var gotPath string
	var gotQuery string
	var gotAuth string
	var gotCookie string
	var gotSub2APIAuth string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotQuery = r.URL.RawQuery
		gotAuth = r.Header.Get("Authorization")
		gotCookie = r.Header.Get("Cookie")
		gotSub2APIAuth = r.Header.Get("X-Sub2API-Authorization")
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Set-Cookie", "cpa=session; Path=/")
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer upstream.Close()

	t.Setenv("CPA_MANAGEMENT_PROXY_TARGET", upstream.URL+"/v0/management")

	router := gin.New()
	RegisterCPAManagementProxyRoutes(router, requireSub2APIAuthorization())
	proxyServer := httptest.NewServer(router)
	defer proxyServer.Close()

	req, err := http.NewRequest(http.MethodGet, proxyServer.URL+"/cpa-management/auth-files?limit=10", nil)
	require.NoError(t, err)
	req.Header.Set("Authorization", "Bearer cpa-management-key")
	req.Header.Set("X-Sub2API-Authorization", "Bearer sub2api-admin-token")
	req.Header.Set("Cookie", "sub2api=session")
	resp, err := proxyServer.Client().Do(req)
	require.NoError(t, err)
	defer func() { _ = resp.Body.Close() }()

	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, "/v0/management/auth-files", gotPath)
	require.Equal(t, "limit=10", gotQuery)
	require.Equal(t, "Bearer cpa-management-key", gotAuth)
	require.Empty(t, gotCookie)
	require.Empty(t, gotSub2APIAuth)
	require.Empty(t, resp.Header.Values("Set-Cookie"))
}

func TestCPAManagementProxyRequiresSub2APIAdminAuthorization(t *testing.T) {
	gin.SetMode(gin.TestMode)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("upstream should not be called without Sub2API admin authorization")
	}))
	defer upstream.Close()
	t.Setenv("CPA_MANAGEMENT_PROXY_TARGET", upstream.URL+"/v0/management")

	router := gin.New()
	RegisterCPAManagementProxyRoutes(router, requireSub2APIAuthorization())

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/cpa-management/auth-files", nil)
	req.Header.Set("Authorization", "Bearer cpa-management-key")
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestCPAManagementProxyRejectsInvalidTarget(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("CPA_MANAGEMENT_PROXY_TARGET", "://bad")

	router := gin.New()
	RegisterCPAManagementProxyRoutes(router, requireSub2APIAuthorization())

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/cpa-management/auth-files", nil)
	req.Header.Set("X-Sub2API-Authorization", "Bearer sub2api-admin-token")
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusBadGateway, rec.Code)

	var body map[string]string
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	require.Equal(t, "CPA_MANAGEMENT_PROXY_TARGET_INVALID", body["error"])
}

func TestIsCPAManagementProxyPath(t *testing.T) {
	require.True(t, IsCPAManagementProxyPath("/cpa-management"))
	require.True(t, IsCPAManagementProxyPath("/cpa-management/auth-files"))
	require.False(t, IsCPAManagementProxyPath("/cpa-management-settings"))
}

func requireSub2APIAuthorization() middleware.AdminAuthMiddleware {
	return middleware.AdminAuthMiddleware(func(c *gin.Context) {
		if c.GetHeader("X-Sub2API-Authorization") == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Sub2API admin authorization"})
			return
		}
		c.Next()
	})
}
