package routes

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestCPAManagementProxyRewritesPathAndPreservesAuthorization(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var gotPath string
	var gotQuery string
	var gotAuth string
	var gotCookie string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotQuery = r.URL.RawQuery
		gotAuth = r.Header.Get("Authorization")
		gotCookie = r.Header.Get("Cookie")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer upstream.Close()

	t.Setenv("CPA_MANAGEMENT_PROXY_TARGET", upstream.URL+"/v0/management")

	router := gin.New()
	RegisterCPAManagementProxyRoutes(router)
	proxyServer := httptest.NewServer(router)
	defer proxyServer.Close()

	req, err := http.NewRequest(http.MethodGet, proxyServer.URL+"/cpa-management/auth-files?limit=10", nil)
	require.NoError(t, err)
	req.Header.Set("Authorization", "Bearer cpa-management-key")
	req.Header.Set("Cookie", "sub2api=session")
	resp, err := proxyServer.Client().Do(req)
	require.NoError(t, err)
	defer func() { _ = resp.Body.Close() }()

	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, "/v0/management/auth-files", gotPath)
	require.Equal(t, "limit=10", gotQuery)
	require.Equal(t, "Bearer cpa-management-key", gotAuth)
	require.Empty(t, gotCookie)
}

func TestCPAManagementProxyRejectsInvalidTarget(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("CPA_MANAGEMENT_PROXY_TARGET", "://bad")

	router := gin.New()
	RegisterCPAManagementProxyRoutes(router)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/cpa-management/auth-files", nil)
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusBadGateway, rec.Code)

	var body map[string]string
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	require.Equal(t, "CPA_MANAGEMENT_PROXY_TARGET_INVALID", body["error"])
}
