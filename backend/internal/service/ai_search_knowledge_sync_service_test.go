package service

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/stretchr/testify/require"
)

func TestAISearchKnowledgeSyncService_SyncOnceUploadsFilteredKnowledgeViaCloudflareAPI(t *testing.T) {
	knowledgeFile := writeAISearchKnowledgeFixture(t, "# Creeper & AI 用户知识库\n\nCreepee 可以回答常见问题。\n")

	var requestedPaths []string
	var sawDeleteExisting bool
	var sawDeleteLegacy bool
	var uploadedFilename string
	var uploadedContent string
	var uploadedMetadata string
	var uploadedWait string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPaths = append(requestedPaths, r.Method+" "+r.URL.RequestURI())
		require.Equal(t, "Bearer cf-secret", r.Header.Get("Authorization"))

		switch {
		case r.Method == http.MethodGet && strings.Contains(r.URL.Path, "/items"):
			_, _ = w.Write([]byte(`{
				"success": true,
				"result": [
					{"id":"old-item","key":"sub2api-user-knowledge.md"},
					{"id":"legacy-item","key":"sub2api-ai-search.md"}
				]
			}`))
		case r.Method == http.MethodDelete && strings.HasSuffix(r.URL.Path, "/items/old-item"):
			sawDeleteExisting = true
			_, _ = w.Write([]byte(`{"success":true,"result":{}}`))
		case r.Method == http.MethodDelete && strings.HasSuffix(r.URL.Path, "/items/legacy-item"):
			sawDeleteLegacy = true
			_, _ = w.Write([]byte(`{"success":true,"result":{}}`))
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/items"):
			reader, err := r.MultipartReader()
			require.NoError(t, err)
			for {
				part, err := reader.NextPart()
				if err == io.EOF {
					break
				}
				require.NoError(t, err)
				data, err := io.ReadAll(part)
				require.NoError(t, err)
				switch part.FormName() {
				case "file":
					uploadedFilename = part.FileName()
					uploadedContent = string(data)
				case "metadata":
					uploadedMetadata = string(data)
				case "wait_for_completion":
					uploadedWait = string(data)
				default:
					t.Fatalf("unexpected multipart field %q", part.FormName())
				}
			}
			_, _ = w.Write([]byte(`{
				"success": true,
				"result": {"id":"new-item","key":"sub2api-user-knowledge.md","status":"completed"}
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	svc := NewAISearchKnowledgeSyncService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:                         testAISearchAccountID,
			AISearchInstanceID:                "ai-search",
			AISearchAPIToken:                  "cf-secret",
			AISearchAPIBaseURL:                server.URL,
			AISearchNamespace:                 "default",
			AISearchItemKey:                   "sub2api-user-knowledge.md",
			AISearchSyncKnowledgePath:         knowledgeFile,
			AISearchSyncWaitForCompletion:     true,
			AISearchSyncDeleteLegacySeedItems: true,
		},
	})

	require.NoError(t, svc.SyncOnce(context.Background()))

	require.True(t, sawDeleteExisting)
	require.True(t, sawDeleteLegacy)
	require.Equal(t, "sub2api-user-knowledge.md", uploadedFilename)
	require.Contains(t, uploadedContent, "Creepee 可以回答常见问题")
	require.Contains(t, uploadedMetadata, `"title"`)
	require.Equal(t, "true", uploadedWait)
	require.Equal(t, []string{
		"GET /accounts/" + testAISearchAccountID + "/ai-search/namespaces/default/instances/ai-search/items?per_page=50&search=sub2api-user-knowledge.md&source=builtin",
		"DELETE /accounts/" + testAISearchAccountID + "/ai-search/namespaces/default/instances/ai-search/items/old-item",
		"DELETE /accounts/" + testAISearchAccountID + "/ai-search/namespaces/default/instances/ai-search/items/legacy-item",
		"POST /accounts/" + testAISearchAccountID + "/ai-search/namespaces/default/instances/ai-search/items",
	}, requestedPaths)
}

func TestAISearchKnowledgeSyncService_SyncOnceGeneratesKnowledgeFromCanonicalSource(t *testing.T) {
	sourceFile := writeAISearchKnowledgeFixture(t, `
## R2 灾备状态
每天 `+"`"+`03:00`+"`"+` 自动备份，保留策略为 30 天。
/Users/hinaw/sub2api-src sha256:abc1234567890abcdef

## Cloudflare AI Search 状态
AI Search 搜索框放在公告铃左边。
CPA Codex Buzz TCDMX
QLHazyCoder Mimo replace challenge mismatch
自定义菜单 iframe 跳转 菜单顺序 SVG 图床链接
`)

	var uploadedContent string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && strings.Contains(r.URL.Path, "/items"):
			_, _ = w.Write([]byte(`{"success":true,"result":[]}`))
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/items"):
			reader, err := r.MultipartReader()
			require.NoError(t, err)
			for {
				part, err := reader.NextPart()
				if err == io.EOF {
					break
				}
				require.NoError(t, err)
				if part.FormName() == "file" {
					data, err := io.ReadAll(part)
					require.NoError(t, err)
					uploadedContent = string(data)
				}
			}
			_, _ = w.Write([]byte(`{"success":true,"result":{"id":"new-item"}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	svc := NewAISearchKnowledgeSyncService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:                 testAISearchAccountID,
			AISearchInstanceID:        "ai-search",
			AISearchAPIToken:          "cf-secret",
			AISearchAPIBaseURL:        server.URL,
			AISearchNamespace:         "default",
			AISearchItemKey:           "sub2api-user-knowledge.md",
			AISearchSyncSourcePath:    sourceFile,
			AISearchSyncKnowledgePath: "/missing/fallback.md",
		},
	})

	require.NoError(t, svc.SyncOnce(context.Background()))
	require.Contains(t, uploadedContent, "右上角有常驻的 `Creepee` 入口")
	require.Contains(t, uploadedContent, "右侧侧边栏")
	require.Contains(t, uploadedContent, "助手名称是 `Creepee`")
	require.Contains(t, uploadedContent, "后台已有 Cloudflare AI Search 连接")
	require.Contains(t, uploadedContent, "管理端的“立即同步知识库”")
	require.Contains(t, uploadedContent, "Cloudflare 官方聊天组件承载，基于知识库给出自然语言回答并附带来源")
	require.Contains(t, uploadedContent, "渠道监控建议优先使用低输出的 `replace` 探针")
	require.Contains(t, uploadedContent, "challenge mismatch")
	require.Contains(t, uploadedContent, "QLHazyCoder")
	require.Contains(t, uploadedContent, "Mimo")
	require.Contains(t, uploadedContent, "自定义菜单")
	require.Contains(t, uploadedContent, "SVG 图床链接")
	require.NotContains(t, uploadedContent, "/Users/hinaw")
	require.NotContains(t, uploadedContent, "sha256:")
	require.NotContains(t, uploadedContent, "本机路径")
	require.NotContains(t, uploadedContent, "提交记录")
	require.NotContains(t, uploadedContent, "镜像信息")
	require.NotContains(t, uploadedContent, "部署命令")
	require.NotContains(t, uploadedContent, "密钥")
	require.NotContains(t, uploadedContent, "凭据")
	require.NotContains(t, uploadedContent, "敏感值")
	require.NotContains(t, uploadedContent, "API key")
	require.NotContains(t, uploadedContent, "API Key")
}

func TestAISearchKnowledgeSyncService_SyncOnceFallsBackWhenSourcePathIsDirectory(t *testing.T) {
	sourceDir := t.TempDir()
	knowledgeFile := writeAISearchKnowledgeFixture(t, "# Sub2API 用户知识库\n\nfallback knowledge content\n")

	var uploadedContent string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && strings.Contains(r.URL.Path, "/items"):
			_, _ = w.Write([]byte(`{"success":true,"result":[]}`))
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/items"):
			reader, err := r.MultipartReader()
			require.NoError(t, err)
			for {
				part, err := reader.NextPart()
				if err == io.EOF {
					break
				}
				require.NoError(t, err)
				if part.FormName() == "file" {
					data, err := io.ReadAll(part)
					require.NoError(t, err)
					uploadedContent = string(data)
				}
			}
			_, _ = w.Write([]byte(`{"success":true,"result":{"id":"new-item"}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	svc := NewAISearchKnowledgeSyncService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:                 testAISearchAccountID,
			AISearchInstanceID:        "ai-search",
			AISearchAPIToken:          "cf-secret",
			AISearchAPIBaseURL:        server.URL,
			AISearchNamespace:         "default",
			AISearchItemKey:           "sub2api-user-knowledge.md",
			AISearchSyncSourcePath:    sourceDir,
			AISearchSyncKnowledgePath: knowledgeFile,
		},
	})

	require.NoError(t, svc.SyncOnce(context.Background()))
	require.Contains(t, uploadedContent, "fallback knowledge content")
}

func TestAISearchKnowledgeSyncService_SyncOnceSkipsWhenConfigurationOrFileIsMissing(t *testing.T) {
	svc := NewAISearchKnowledgeSyncService(&config.Config{})
	require.NoError(t, svc.SyncOnce(context.Background()))

	svc = NewAISearchKnowledgeSyncService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:                 testAISearchAccountID,
			AISearchAPIToken:          "cf-secret",
			AISearchSyncKnowledgePath: "/path/that/does/not/exist.md",
		},
	})
	require.NoError(t, svc.SyncOnce(context.Background()))
}

func TestAISearchKnowledgeSyncService_SyncOnceRejectsEmailAccountIDBeforeCallingCloudflare(t *testing.T) {
	knowledgeFile := writeAISearchKnowledgeFixture(t, "# Creeper & AI 用户知识库\n\nCreepee 可以回答常见问题。\n")
	var called bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	svc := NewAISearchKnowledgeSyncService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:                 "admin@example.com",
			AISearchInstanceID:        "ai-search",
			AISearchAPIToken:          "cf-secret",
			AISearchAPIBaseURL:        server.URL,
			AISearchNamespace:         "default",
			AISearchItemKey:           "sub2api-user-knowledge.md",
			AISearchSyncKnowledgePath: knowledgeFile,
		},
	})

	err := svc.SyncOnce(context.Background())

	require.Error(t, err)
	require.True(t, infraerrors.IsBadRequest(err))
	require.Equal(t, "AI_SEARCH_ACCOUNT_ID_INVALID", infraerrors.Reason(err))
	require.False(t, called)
}

func writeAISearchKnowledgeFixture(t *testing.T, content string) string {
	t.Helper()
	file, err := os.CreateTemp(t.TempDir(), "knowledge-*.md")
	require.NoError(t, err)
	_, err = io.Copy(file, strings.NewReader(content))
	require.NoError(t, err)
	require.NoError(t, file.Close())
	return file.Name()
}
