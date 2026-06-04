package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
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
			"id": "chatcmpl-1",
			"object": "chat.completion",
			"model": "@cf/meta/llama-3.1-8b-instruct-fast",
			"choices": [
				{
					"index": 0,
					"message": {
						"role": "assistant",
						"content": "Cloudflare AI Search 密钥保存在后端配置中，前端不会拿到。"
					}
				}
			],
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
		}`))
	}))
	defer server.Close()

	svc := NewAISearchService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:          testAISearchAccountID,
			AISearchInstanceID: "ai-search",
			AISearchAPIToken:   "cf-secret",
			AISearchAPIBaseURL: server.URL,
		},
	})

	got, err := svc.Search(context.Background(), "  如何配置密钥  ")
	require.NoError(t, err)

	require.Equal(t, "/accounts/"+testAISearchAccountID+"/ai-search/instances/ai-search/chat/completions", requestedPath)
	require.Equal(t, "Bearer cf-secret", authHeader)
	require.Empty(t, originHeader)
	messages := body["messages"].([]any)
	require.Len(t, messages, 2)
	systemPrompt := messages[0].(map[string]any)["content"].(string)
	require.Contains(t, systemPrompt, "Ask Creepee.ai")
	require.Contains(t, systemPrompt, "creepee")
	require.Contains(t, systemPrompt, "优先依据检索到的知识块回答")
	require.NotContains(t, systemPrompt, "ask ai")
	require.Equal(t, "user", messages[1].(map[string]any)["role"])
	options := body["ai_search_options"].(map[string]any)
	retrieval := options["retrieval"].(map[string]any)
	require.Equal(t, "hybrid", retrieval["retrieval_type"])
	require.Equal(t, float64(8), retrieval["max_num_results"])
	require.Equal(t, float64(0.2), retrieval["match_threshold"])
	require.Equal(t, "or", retrieval["keyword_match_mode"])

	require.Equal(t, "如何配置密钥", got.Query)
	require.Equal(t, "Cloudflare AI Search 密钥保存在后端配置中，前端不会拿到。", got.Answer)
	require.Len(t, got.Results, 1)
	require.Equal(t, "chunk-1", got.Results[0].ID)
	require.Equal(t, "Sub2API AI Search", got.Results[0].Title)
	require.Equal(t, "/admin/settings", got.Results[0].URL)
	require.Equal(t, "docs/ai-search/sub2api-ai-search.md", got.Results[0].Source)
	require.Equal(t, "Sub2API 的 Cloudflare AI Search 密钥只保存在后端环境变量中，前端不会拿到。", got.Results[0].Snippet)
	require.InDelta(t, 0.89, got.Results[0].Score, 0.0001)
	require.True(t, got.Configured)
}

func TestAISearchService_SearchFallsBackToChunksWhenChatCompletionFails(t *testing.T) {
	var requestedPaths []string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		switch r.URL.Path {
		case "/accounts/" + testAISearchAccountID + "/ai-search/instances/ai-search/chat/completions":
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"success":false,"errors":[{"message":"not found"}]}`))
		case "/accounts/" + testAISearchAccountID + "/ai-search/instances/ai-search/search":
			_, _ = w.Write([]byte(`{
				"success": true,
				"result": {
					"search_query": "R2",
					"chunks": [
						{
							"id": "chunk-2",
							"type": "text",
							"score": 0.77,
							"text": "R2 灾备保留 30 天。",
							"item": {"key": "sub2api-user-knowledge.md", "metadata": {"title": "R2 灾备"}}
						}
					]
				}
			}`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	svc := NewAISearchService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:          testAISearchAccountID,
			AISearchInstanceID: "ai-search",
			AISearchAPIToken:   "cf-secret",
			AISearchAPIBaseURL: server.URL,
		},
	})

	got, err := svc.Search(context.Background(), "R2")
	require.NoError(t, err)

	require.Equal(t, []string{
		"/accounts/" + testAISearchAccountID + "/ai-search/instances/ai-search/chat/completions",
		"/accounts/" + testAISearchAccountID + "/ai-search/instances/ai-search/search",
	}, requestedPaths)
	require.Equal(t, "根据知识库，R2 灾备保留 30 天。", got.Answer)
	require.Len(t, got.Results, 1)
	require.Equal(t, "R2 灾备", got.Results[0].Title)
}

func TestAISearchService_SearchFallsBackToPublicChatWhenPrivateAPIIsUnavailable(t *testing.T) {
	var requestedPaths []string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.URL.Path)
		switch r.URL.Path {
		case "/accounts/" + testAISearchAccountID + "/ai-search/instances/ai-search/chat/completions":
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"success":false}`))
		case "/accounts/" + testAISearchAccountID + "/ai-search/instances/ai-search/search":
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"success":false}`))
		case "/public-chat":
			require.Equal(t, "https://sub2api.creeperxco.cn", r.Header.Get("Origin"))
			_, _ = w.Write([]byte(`{
				"choices": [
					{"message": {"role": "assistant", "content": "公开 chat endpoint 已接管回答。"}}
				],
				"chunks": []
			}`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	svc := NewAISearchService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:                     testAISearchAccountID,
			AISearchInstanceID:            "ai-search",
			AISearchAPIToken:              "cf-secret",
			AISearchAPIBaseURL:            server.URL,
			AISearchPublicEndpointURL:     server.URL + "/public-search",
			AISearchPublicChatEndpointURL: server.URL + "/public-chat",
			AISearchPublicOrigin:          "https://sub2api.creeperxco.cn",
		},
	})

	got, err := svc.Search(context.Background(), "FAQ")
	require.NoError(t, err)

	require.Equal(t, []string{
		"/accounts/" + testAISearchAccountID + "/ai-search/instances/ai-search/chat/completions",
		"/accounts/" + testAISearchAccountID + "/ai-search/instances/ai-search/search",
		"/public-chat",
	}, requestedPaths)
	require.Equal(t, "公开 chat endpoint 已接管回答。", got.Answer)
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
	require.Empty(t, got.Answer)
	require.Empty(t, got.Results)
	require.True(t, got.Configured)
}

func TestAISearchService_PublicChatBuildsAnswerFromEvidenceWhenModelDenies(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/chat/completions", r.URL.Path)
		_, _ = w.Write([]byte(`{
			"choices": [
				{"message": {"role": "assistant", "content": "当前知识库没有收录这个信息。"}}
			],
			"chunks": [
				{
					"id": "chunk-r2",
					"type": "text",
					"score": 0.93,
					"text": "## R2 灾备\n\nR2 灾备会每天 03:00 自动生成 PostgreSQL 备份，保留 30 天。",
					"item": {"key": "sub2api-user-knowledge.md", "metadata": {"title": "R2 灾备"}}
				}
			]
		}`))
	}))
	defer server.Close()

	svc := NewAISearchService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AISearchInstanceID:            "ai-search",
			AISearchPublicEndpointURL:     server.URL + "/search",
			AISearchPublicChatEndpointURL: server.URL + "/chat/completions",
			AISearchPublicOrigin:          "https://sub2api.creeperxco.cn",
		},
	})

	got, err := svc.Search(context.Background(), "R2 什么时候备份")
	require.NoError(t, err)

	require.Equal(t, "根据知识库，R2 灾备会每天 03:00 自动生成 PostgreSQL 备份，保留 30 天。", got.Answer)
	require.Len(t, got.Results, 1)
	require.Equal(t, "R2 灾备", got.Results[0].Title)
}

func TestAISearchService_SearchUsesPublicChatEndpointBeforePublicSearch(t *testing.T) {
	var requestedPath string
	var originHeader string
	var body map[string]any

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath = r.URL.Path
		originHeader = r.Header.Get("Origin")
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		_, _ = w.Write([]byte(`{
			"choices": [
				{"message": {"role": "assistant", "content": "FAQ 会根据知识库生成回答。"}}
			],
			"chunks": [
				{
					"id": "chunk-public-chat",
					"type": "text",
					"score": 0.81,
					"text": "公开 chat endpoint 也会返回来源知识块。",
					"item": {"key": "sub2api-user-knowledge.md", "metadata": {"title": "AI Search"}}
				}
			]
		}`))
	}))
	defer server.Close()

	svc := NewAISearchService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AISearchInstanceID:            "ai-search",
			AISearchPublicEndpointURL:     server.URL + "/search",
			AISearchPublicChatEndpointURL: server.URL + "/chat/completions",
			AISearchPublicOrigin:          "https://sub2api.creeperxco.cn",
		},
	})

	got, err := svc.Search(context.Background(), "FAQ")
	require.NoError(t, err)

	require.Equal(t, "/chat/completions", requestedPath)
	require.Equal(t, "https://sub2api.creeperxco.cn", originHeader)
	messages := body["messages"].([]any)
	require.Len(t, messages, 2)
	require.Equal(t, "system", messages[0].(map[string]any)["role"])
	systemPrompt := messages[0].(map[string]any)["content"].(string)
	require.Contains(t, systemPrompt, "Ask Creepee.ai")
	require.Contains(t, systemPrompt, "creepee")
	require.NotContains(t, systemPrompt, "ask ai")
	require.Equal(t, "user", messages[1].(map[string]any)["role"])
	require.Equal(t, "FAQ 会根据知识库生成回答。", got.Answer)
	require.Len(t, got.Results, 1)
	require.Equal(t, "AI Search", got.Results[0].Title)
}

func TestAISearchService_SearchRequiresBackendConfiguration(t *testing.T) {
	svc := NewAISearchService(&config.Config{})

	got, err := svc.Search(context.Background(), "FAQ")

	require.Nil(t, got)
	require.Error(t, err)
	require.Contains(t, err.Error(), "AI_SEARCH_NOT_CONFIGURED")
}

func TestAISearchService_SearchWithConfigRejectsEmailAccountIDBeforeCallingUpstream(t *testing.T) {
	var called bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	svc := NewAISearchService(&config.Config{})

	got, err := svc.SearchWithConfig(context.Background(), "FAQ", AISearchBackendConfig{
		AccountID:  "admin@example.com",
		APIToken:   "cf-secret",
		APIBaseURL: server.URL,
		InstanceID: "ai-search",
		Namespace:  "default",
		ItemKey:    "sub2api-user-knowledge.md",
	})

	require.Nil(t, got)
	require.Error(t, err)
	require.True(t, infraerrors.IsBadRequest(err))
	require.Equal(t, "AI_SEARCH_ACCOUNT_ID_INVALID", infraerrors.Reason(err))
	require.False(t, called)
}
