package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type aiSearchHandlerServiceStub struct {
	query string
}

type aiSearchConfigServiceStub struct {
	config *service.AISearchSnippetConfig
	proxy  *service.AISearchPublicProxyConfig
}

func (s *aiSearchHandlerServiceStub) Search(_ context.Context, query string) (*service.AISearchResponse, error) {
	s.query = query
	return &service.AISearchResponse{
		Query:      query,
		Configured: true,
		Answer:     "AI Search 会先生成回答，再附带来源。",
		Results: []service.AISearchResult{{
			ID:      "chunk-1",
			Title:   "AI Search",
			Snippet: "搜索结果",
			Source:  "docs/ai-search.md",
			Score:   0.8,
		}},
	}, nil
}

func (s *aiSearchConfigServiceStub) GetPublicSnippetConfig(_ context.Context) (*service.AISearchSnippetConfig, error) {
	return s.config, nil
}

func (s *aiSearchConfigServiceStub) GetPublicProxyConfig(_ context.Context) (*service.AISearchPublicProxyConfig, error) {
	return s.proxy, nil
}

func TestAISearchHandler_SearchTrimsAndReturnsResults(t *testing.T) {
	gin.SetMode(gin.TestMode)
	stub := &aiSearchHandlerServiceStub{}
	h := NewAISearchHandler(stub)

	body := bytes.NewBufferString(`{"query":"  AI Search  "}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ai-search/search", body)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req

	h.Search(c)

	require.Equal(t, http.StatusOK, rec.Code)
	require.Equal(t, "AI Search", stub.query)

	var envelope struct {
		Code int                      `json:"code"`
		Data service.AISearchResponse `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &envelope))
	require.Equal(t, 0, envelope.Code)
	require.Equal(t, "AI Search", envelope.Data.Query)
	require.Equal(t, "AI Search 会先生成回答，再附带来源。", envelope.Data.Answer)
	require.Len(t, envelope.Data.Results, 1)
	require.Equal(t, "AI Search", envelope.Data.Results[0].Title)
}

func TestAISearchHandler_SearchRejectsBlankQuery(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAISearchHandler(&aiSearchHandlerServiceStub{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/ai-search/search", bytes.NewBufferString(`{"query":"   "}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req

	h.Search(c)

	require.Equal(t, http.StatusBadRequest, rec.Code)
	require.Contains(t, rec.Body.String(), "AI_SEARCH_QUERY_REQUIRED")
}

func TestAISearchHandler_SnippetConfigReturnsPublicEndpointWithoutSecret(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAISearchHandler(&aiSearchHandlerServiceStub{}, &aiSearchConfigServiceStub{
		config: &service.AISearchSnippetConfig{
			Configured: true,
			APIURL:     "/api/v1/ai-search/public",
			InstanceID: "ai-search",
			Namespace:  "default",
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ai-search/snippet-config", nil)
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req

	h.SnippetConfig(c)

	require.Equal(t, http.StatusOK, rec.Code)
	require.Contains(t, rec.Body.String(), `"api_url":"/api/v1/ai-search/public"`)
	require.NotContains(t, rec.Body.String(), "api_token")
	require.NotContains(t, rec.Body.String(), "account_id")
}

func TestAISearchHandler_SnippetConfigSetsScopedAuthCookieFromBearerToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAISearchHandler(&aiSearchHandlerServiceStub{}, &aiSearchConfigServiceStub{
		config: &service.AISearchSnippetConfig{
			Configured: true,
			APIURL:     "/api/v1/ai-search/public",
			InstanceID: "ai-search",
			Namespace:  "default",
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ai-search/snippet-config", nil)
	req.Header.Set("Authorization", "Bearer access-token-value")
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req

	h.SnippetConfig(c)

	require.Equal(t, http.StatusOK, rec.Code)
	cookie := findAISearchCookie(rec.Result().Cookies(), "ai_search_access_token")
	require.NotNil(t, cookie)
	require.Equal(t, "/api/v1/ai-search/public", cookie.Path)
	require.Equal(t, 600, cookie.MaxAge)
	require.True(t, cookie.HttpOnly)
	require.Equal(t, "access-token-value", cookie.Value)
}

func TestAISearchHandler_PublicProxyForwardsWithConfiguredOrigin(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var gotPath string
	var gotOrigin string
	var gotReferer string
	var gotSource string
	var gotBody string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotOrigin = r.Header.Get("Origin")
		gotReferer = r.Header.Get("Referer")
		gotSource = r.Header.Get("cf-ai-search-source")
		body, err := io.ReadAll(r.Body)
		require.NoError(t, err)
		gotBody = string(body)

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("X-Should-Not-Leak", "secret")
		w.WriteHeader(http.StatusAccepted)
		_, _ = w.Write([]byte("data: ok\n\n"))
	}))
	defer upstream.Close()

	h := NewAISearchHandler(&aiSearchHandlerServiceStub{}, &aiSearchConfigServiceStub{
		proxy: &service.AISearchPublicProxyConfig{
			Configured: true,
			BaseURL:    upstream.URL,
			Origin:     "https://sub2api.example.com",
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/ai-search/public/chat/completions", bytes.NewBufferString(`{"stream":true}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")
	req.Header.Set("cf-ai-search-source", "snippet-chat-completions")
	req.Header.Set("Origin", "http://127.0.0.1:8080")
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req
	c.Params = gin.Params{{Key: "path", Value: "/chat/completions"}}

	h.PublicProxy(c)

	require.Equal(t, http.StatusAccepted, rec.Code)
	require.Equal(t, "/chat/completions", gotPath)
	require.Equal(t, "https://sub2api.example.com", gotOrigin)
	require.Equal(t, "https://sub2api.example.com/", gotReferer)
	require.Equal(t, "snippet-chat-completions", gotSource)
	require.Equal(t, `{"stream":true}`, gotBody)
	require.Equal(t, "text/event-stream", rec.Header().Get("Content-Type"))
	require.Empty(t, rec.Header().Get("X-Should-Not-Leak"))
	require.Equal(t, "data: ok\n\n", rec.Body.String())
}

func TestAISearchHandler_PublicProxyRejectsUnsupportedPath(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAISearchHandler(&aiSearchHandlerServiceStub{}, &aiSearchConfigServiceStub{
		proxy: &service.AISearchPublicProxyConfig{
			Configured: true,
			BaseURL:    "https://public.example.com",
			Origin:     "https://sub2api.example.com",
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/ai-search/public/admin", bytes.NewBufferString(`{}`))
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req
	c.Params = gin.Params{{Key: "path", Value: "/admin"}}

	h.PublicProxy(c)

	require.Equal(t, http.StatusNotFound, rec.Code)
	require.Contains(t, rec.Body.String(), "AI_SEARCH_PUBLIC_PROXY_PATH_NOT_FOUND")
}

func findAISearchCookie(cookies []*http.Cookie, name string) *http.Cookie {
	for _, cookie := range cookies {
		if cookie.Name == name {
			return cookie
		}
	}
	return nil
}
