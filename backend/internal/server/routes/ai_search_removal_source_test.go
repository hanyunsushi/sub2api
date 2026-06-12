package routes

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func repoRootForAISearchRemovalTest(t *testing.T) string {
	t.Helper()
	_, filename, _, ok := runtime.Caller(0)
	require.True(t, ok)
	return filepath.Clean(filepath.Join(filepath.Dir(filename), "..", "..", "..", ".."))
}

func readRepoFileForAISearchRemovalTest(t *testing.T, rel string) string {
	t.Helper()
	content, err := os.ReadFile(filepath.Join(repoRootForAISearchRemovalTest(t), rel))
	require.NoError(t, err)
	return string(content)
}

func TestCloudflareAISearchRoutesAndRuntimeWiringAreRemoved(t *testing.T) {
	files := map[string]string{
		"backend/internal/server/routes/user.go":           readRepoFileForAISearchRemovalTest(t, "backend/internal/server/routes/user.go"),
		"backend/internal/server/routes/admin.go":          readRepoFileForAISearchRemovalTest(t, "backend/internal/server/routes/admin.go"),
		"backend/internal/handler/handler.go":              readRepoFileForAISearchRemovalTest(t, "backend/internal/handler/handler.go"),
		"backend/internal/handler/wire.go":                 readRepoFileForAISearchRemovalTest(t, "backend/internal/handler/wire.go"),
		"backend/internal/handler/admin/backup_handler.go": readRepoFileForAISearchRemovalTest(t, "backend/internal/handler/admin/backup_handler.go"),
		"backend/cmd/server/wire.go":                       readRepoFileForAISearchRemovalTest(t, "backend/cmd/server/wire.go"),
		"backend/cmd/server/wire_gen.go":                   readRepoFileForAISearchRemovalTest(t, "backend/cmd/server/wire_gen.go"),
		"backend/internal/config/config.go":                readRepoFileForAISearchRemovalTest(t, "backend/internal/config/config.go"),
	}

	for name, source := range files {
		t.Run(name, func(t *testing.T) {
			require.NotContains(t, source, "AISearch")
			require.NotContains(t, source, "ai-search")
			require.NotContains(t, source, "cloudflare_ai")
			require.NotContains(t, source, "CloudflareAI")
		})
	}
}

func TestCloudflareAISearchSourceFilesAndKnowledgeToolsAreRemoved(t *testing.T) {
	for _, rel := range []string{
		"backend/internal/handler/ai_search_handler.go",
		"backend/internal/server/middleware/ai_search_cookie_auth.go",
		"backend/internal/service/ai_search_config_service.go",
		"backend/internal/service/ai_search_service.go",
		"backend/internal/service/ai_search_knowledge_sync_service.go",
		"frontend/src/api/aiSearch.ts",
		"tools/generate_ai_search_knowledge.py",
		"tools/sync_ai_search_knowledge.py",
		"tools/test_generate_ai_search_knowledge.py",
		"docs/ai-search/sub2api-user-knowledge.md",
	} {
		_, err := os.Stat(filepath.Join(repoRootForAISearchRemovalTest(t), rel))
		require.Truef(t, os.IsNotExist(err), "%s should be removed", rel)
	}
}

func TestDockerAndDeployExamplesDoNotBundleCloudflareAISearchKnowledge(t *testing.T) {
	for _, rel := range []string{
		"Dockerfile",
		".dockerignore",
		"deploy/.env.example",
		"deploy/docker-compose.yml",
		"deploy/docker-compose.local.yml",
		"deploy/docker-compose.standalone.yml",
	} {
		source := readRepoFileForAISearchRemovalTest(t, rel)
		t.Run(strings.ReplaceAll(rel, "/", "_"), func(t *testing.T) {
			require.NotContains(t, source, "docs/ai-search")
			require.NotContains(t, source, "CLOUDFLARE_AI")
			require.NotContains(t, source, "Cloudflare AI Search")
			require.NotContains(t, source, "sub2api-user-knowledge.md")
		})
	}
}
