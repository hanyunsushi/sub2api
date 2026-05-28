package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestAISearchService_SearchUsesCloudflareInstanceAPI(t *testing.T) {
	var requestedPath string
	var authHeader string
	var originHeader string
	var body map[string]any

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath = r.URL.Path
		authHeader = r.Header.Get("Authorization")
		originHeader = r.Header.Get("Origin")
		require.Equal(t, http.MethodPost, r.Method)
		require.Equal(t, "application/json", r.Header.Get("Content-Type"))
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))

		_, _ = w.Write([]byte(`{
			"success": true,
			"result": {
				"search_query": "如何配置密钥",
				"chunks": [
					{
						"id": "chunk-1",
						"type": "text",
						"score": 0.89,
						"text": "  Sub2API 的 Cloudflare AI Search 密钥只保存在后端环境变量中，前端不会拿到。  ",
						"item": {
							"key": "docs/ai-search/sub2api-ai-search.md",
							"metadata": {
								"title": "Sub2API AI Search",
								"url": "/admin/settings"
							}
						}
					}
				]
			}
		}`))
	}))
	defer server.Close()

	svc := NewAISearchService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:          "test-account",
			AISearchInstanceID: "ai-search",
			AISearchAPIToken:   "cf-secret",
			AISearchAPIBaseURL: server.URL,
		},
	})

	got, err := svc.Search(context.Background(), "  如何配置密钥  ")
	require.NoError(t, err)

	require.Equal(t, "/accounts/test-account/ai-search/instances/ai-search/search", requestedPath)
	require.Equal(t, "Bearer cf-secret", authHeader)
	require.Empty(t, originHeader)
	require.Equal(t, "如何配置密钥", body["query"])
	options := body["ai_search_options"].(map[string]any)
	retrieval := options["retrieval"].(map[string]any)
	require.Equal(t, "hybrid", retrieval["retrieval_type"])
	require.Equal(t, float64(8), retrieval["max_num_results"])
	require.Equal(t, float64(0.2), retrieval["match_threshold"])
	require.Equal(t, "or", retrieval["keyword_match_mode"])

	require.Equal(t, "如何配置密钥", got.Query)
	require.Len(t, got.Results, 1)
	require.Equal(t, "chunk-1", got.Results[0].ID)
	require.Equal(t, "Sub2API AI Search", got.Results[0].Title)
	require.Equal(t, "/admin/settings", got.Results[0].URL)
	require.Equal(t, "docs/ai-search/sub2api-ai-search.md", got.Results[0].Source)
	require.Equal(t, "Sub2API 的 Cloudflare AI Search 密钥只保存在后端环境变量中，前端不会拿到。", got.Results[0].Snippet)
	require.InDelta(t, 0.89, got.Results[0].Score, 0.0001)
	require.True(t, got.Configured)
}

func TestAISearchService_SearchFallsBackToPublicEndpoint(t *testing.T) {
	var requestedPath string
	var authHeader string
	var originHeader string
	var refererHeader string
	var body map[string]any

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath = r.URL.Path
		authHeader = r.Header.Get("Authorization")
		originHeader = r.Header.Get("Origin")
		refererHeader = r.Header.Get("Referer")
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		_, _ = w.Write([]byte(`{
			"success": true,
			"result": {
				"search_query": "FAQ",
				"chunks": []
			}
		}`))
	}))
	defer server.Close()

	svc := NewAISearchService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AISearchInstanceID:        "ai-search",
			AISearchPublicEndpointURL: server.URL + "/search",
			AISearchPublicOrigin:      "https://sub2api.creeperxco.cn/",
		},
	})

	got, err := svc.Search(context.Background(), "FAQ")
	require.NoError(t, err)

	require.Equal(t, "/search", requestedPath)
	require.Empty(t, authHeader)
	require.Equal(t, "https://sub2api.creeperxco.cn", originHeader)
	require.Equal(t, "https://sub2api.creeperxco.cn/", refererHeader)
	require.Equal(t, "FAQ", body["query"])
	require.Equal(t, "FAQ", got.Query)
	require.Empty(t, got.Results)
	require.True(t, got.Configured)
}

func TestAISearchService_SearchRequiresBackendConfiguration(t *testing.T) {
	svc := NewAISearchService(&config.Config{})

	got, err := svc.Search(context.Background(), "FAQ")

	require.Nil(t, got)
	require.Error(t, err)
	require.Contains(t, err.Error(), "AI_SEARCH_NOT_CONFIGURED")
}
