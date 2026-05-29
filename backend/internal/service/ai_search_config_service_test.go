package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestAISearchConfigService_UpdateEncryptsTokenAndHidesItOnRead(t *testing.T) {
	repo := newAISearchConfigTestSettingRepo()
	svc := NewAISearchConfigService(repo, &config.Config{}, &aiSearchConfigTestEncryptor{})

	got, err := svc.UpdateConfig(context.Background(), AISearchBackendConfig{
		AccountID:                 "account-from-ui",
		APIToken:                  "cf-secret",
		APIBaseURL:                "https://api.example.com/",
		PublicEndpointURL:         "https://public.example.com/search",
		PublicChatEndpointURL:     "https://public.example.com/chat/completions",
		PublicOrigin:              "https://sub2api.example.com/",
		InstanceID:                "ai-search",
		Namespace:                 "default",
		ItemKey:                   "sub2api-user-knowledge.md",
		SyncEnabled:               true,
		SyncCron:                  "20 3 */3 * *",
		SyncSourcePath:            "/app/resources/ai-search/sub2api-codex-custom-plan.md",
		SyncKnowledgePath:         "/app/resources/ai-search/sub2api-user-knowledge.md",
		SyncWaitForCompletion:     true,
		SyncDeleteLegacySeedItems: true,
	})
	require.NoError(t, err)
	require.Empty(t, got.APIToken)
	require.True(t, got.APITokenConfigured)
	require.Equal(t, "https://api.example.com", got.APIBaseURL)
	require.Equal(t, "https://sub2api.example.com", got.PublicOrigin)

	raw, err := repo.GetValue(context.Background(), settingKeyCloudflareAISearchConfig)
	require.NoError(t, err)
	require.NotEmpty(t, raw)
	require.Contains(t, raw, "ENC:cf-secret")
	require.NotContains(t, raw, `"api_token":"cf-secret"`)

	read, err := svc.GetConfig(context.Background())
	require.NoError(t, err)
	require.Empty(t, read.APIToken)
	require.True(t, read.APITokenConfigured)
	require.Equal(t, "account-from-ui", read.AccountID)
	require.Equal(t, "ai-search", read.InstanceID)
	require.Equal(t, "sub2api-user-knowledge.md", read.ItemKey)
}

func TestAISearchConfigService_UpdatePreservesExistingTokenWhenBlank(t *testing.T) {
	repo := newAISearchConfigTestSettingRepo()
	svc := NewAISearchConfigService(repo, &config.Config{}, &aiSearchConfigTestEncryptor{})

	_, err := svc.UpdateConfig(context.Background(), AISearchBackendConfig{
		AccountID:         "account-a",
		APIToken:          "old-token",
		InstanceID:        "ai-search",
		Namespace:         "default",
		ItemKey:           "sub2api-user-knowledge.md",
		SyncKnowledgePath: "/app/resources/ai-search/sub2api-user-knowledge.md",
	})
	require.NoError(t, err)

	_, err = svc.UpdateConfig(context.Background(), AISearchBackendConfig{
		AccountID:         "account-b",
		APIToken:          "",
		InstanceID:        "ai-search",
		Namespace:         "default",
		ItemKey:           "sub2api-user-knowledge.md",
		SyncKnowledgePath: "/app/resources/ai-search/sub2api-user-knowledge.md",
	})
	require.NoError(t, err)

	raw, err := repo.GetValue(context.Background(), settingKeyCloudflareAISearchConfig)
	require.NoError(t, err)
	var stored aiSearchBackendConfigRecord
	require.NoError(t, json.Unmarshal([]byte(raw), &stored))
	require.Equal(t, "account-b", stored.AccountID)
	require.Equal(t, "ENC:old-token", stored.APIToken)
}

func TestAISearchConfigService_MergeWithStoredSecretUsesStoredTokenWhenBlank(t *testing.T) {
	repo := newAISearchConfigTestSettingRepo()
	svc := NewAISearchConfigService(repo, &config.Config{}, &aiSearchConfigTestEncryptor{})

	_, err := svc.UpdateConfig(context.Background(), AISearchBackendConfig{
		AccountID:  "stored-account",
		APIToken:   "stored-token",
		InstanceID: "ai-search",
		Namespace:  "default",
		ItemKey:    "sub2api-user-knowledge.md",
	})
	require.NoError(t, err)

	merged := svc.MergeWithStoredSecret(context.Background(), AISearchBackendConfig{
		AccountID:  "draft-account",
		APIToken:   "",
		InstanceID: "ai-search",
		Namespace:  "default",
		ItemKey:    "sub2api-user-knowledge.md",
	})

	require.Equal(t, "draft-account", merged.AccountID)
	require.Equal(t, "stored-token", merged.APIToken)
}

func TestAISearchConfigService_GetPublicSnippetConfigReturnsSameOriginProxy(t *testing.T) {
	repo := newAISearchConfigTestSettingRepo()
	svc := NewAISearchConfigService(repo, &config.Config{}, &aiSearchConfigTestEncryptor{})
	_, err := svc.UpdateConfig(context.Background(), AISearchBackendConfig{
		AccountID:             "stored-account",
		APIToken:              "stored-token",
		PublicEndpointURL:     "https://public.example.com/search",
		PublicChatEndpointURL: "https://public.example.com/chat/completions",
		PublicOrigin:          "https://sub2api.example.com",
		InstanceID:            "ai-search",
		Namespace:             "default",
		ItemKey:               "sub2api-user-knowledge.md",
	})
	require.NoError(t, err)

	snippet, err := svc.GetPublicSnippetConfig(context.Background())
	require.NoError(t, err)
	require.True(t, snippet.Configured)
	require.Equal(t, "/api/v1/ai-search/public", snippet.APIURL)
	require.Equal(t, "ai-search", snippet.InstanceID)
	require.Equal(t, "default", snippet.Namespace)

	encoded, err := json.Marshal(snippet)
	require.NoError(t, err)
	require.NotContains(t, string(encoded), "stored-token")
	require.NotContains(t, string(encoded), "account_id")
	require.NotContains(t, string(encoded), "api_token")
}

func TestAISearchConfigService_GetPublicProxyConfigReturnsCloudflareBase(t *testing.T) {
	repo := newAISearchConfigTestSettingRepo()
	svc := NewAISearchConfigService(repo, &config.Config{}, &aiSearchConfigTestEncryptor{})
	_, err := svc.UpdateConfig(context.Background(), AISearchBackendConfig{
		PublicEndpointURL:     "https://public.example.com/search",
		PublicChatEndpointURL: "https://public.example.com/chat/completions",
		PublicOrigin:          "https://sub2api.example.com/",
		InstanceID:            "ai-search",
		Namespace:             "default",
		ItemKey:               "sub2api-user-knowledge.md",
	})
	require.NoError(t, err)

	proxy, err := svc.GetPublicProxyConfig(context.Background())
	require.NoError(t, err)
	require.True(t, proxy.Configured)
	require.Equal(t, "https://public.example.com", proxy.BaseURL)
	require.Equal(t, "https://sub2api.example.com", proxy.Origin)
}

func TestAISearchServicesUseDBConfigOverEnvironmentDefaults(t *testing.T) {
	repo := newAISearchConfigTestSettingRepo()
	configSvc := NewAISearchConfigService(repo, &config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:                 "env-account",
			AISearchAPIToken:          "env-token",
			AISearchAPIBaseURL:        "https://api.env.example.com",
			AISearchInstanceID:        "env-search",
			AISearchNamespace:         "envns",
			AISearchItemKey:           "env.md",
			AISearchSyncCron:          "0 4 */3 * *",
			AISearchSyncKnowledgePath: "/env/knowledge.md",
		},
	}, &aiSearchConfigTestEncryptor{})
	_, err := configSvc.UpdateConfig(context.Background(), AISearchBackendConfig{
		AccountID:                 "db-account",
		APIToken:                  "db-token",
		APIBaseURL:                "https://api.db.example.com/",
		PublicEndpointURL:         "https://public.db.example.com/search",
		PublicChatEndpointURL:     "https://public.db.example.com/chat/completions",
		PublicOrigin:              "https://sub2api.db.example.com/",
		InstanceID:                "ai-search",
		Namespace:                 "default",
		ItemKey:                   "sub2api-user-knowledge.md",
		SyncEnabled:               true,
		SyncCron:                  "20 3 */3 * *",
		SyncSourcePath:            "/db/source.md",
		SyncKnowledgePath:         "/db/knowledge.md",
		SyncWaitForCompletion:     true,
		SyncDeleteLegacySeedItems: true,
	})
	require.NoError(t, err)

	searchSvc := NewAISearchService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:          "env-account",
			AISearchAPIToken:   "env-token",
			AISearchAPIBaseURL: "https://api.env.example.com",
			AISearchInstanceID: "env-search",
		},
	}, configSvc)
	searchSettings := searchSvc.settings()
	require.Equal(t, "db-token", searchSettings.token)
	require.Equal(t, "https://api.db.example.com/accounts/db-account/ai-search/instances/ai-search/chat/completions", searchSettings.chatEndpoint)
	require.Equal(t, "https://public.db.example.com/search", searchSettings.publicEndpoint)
	require.Equal(t, "https://sub2api.db.example.com", searchSettings.origin)

	syncSvc := NewAISearchKnowledgeSyncService(&config.Config{
		CloudflareAI: config.CloudflareAIConfig{
			AccountID:                 "env-account",
			AISearchAPIToken:          "env-token",
			AISearchAPIBaseURL:        "https://api.env.example.com",
			AISearchInstanceID:        "env-search",
			AISearchNamespace:         "envns",
			AISearchItemKey:           "env.md",
			AISearchSyncCron:          "0 4 */3 * *",
			AISearchSyncKnowledgePath: "/env/knowledge.md",
		},
	}, configSvc)
	syncSettings := syncSvc.settings()
	require.True(t, syncSettings.enabled)
	require.Equal(t, "db-account", syncSettings.accountID)
	require.Equal(t, "db-token", syncSettings.token)
	require.Equal(t, "ai-search", syncSettings.instanceID)
	require.Equal(t, "default", syncSettings.namespace)
	require.Equal(t, "sub2api-user-knowledge.md", syncSettings.itemKey)
	require.Equal(t, "20 3 */3 * *", syncSettings.cronSpec)
	require.Equal(t, "/db/source.md", syncSettings.sourcePath)
	require.Equal(t, "/db/knowledge.md", syncSettings.knowledgePath)
	require.True(t, syncSettings.waitForCompletion)
	require.True(t, syncSettings.deleteLegacySeedItems)
}

type aiSearchConfigTestSettingRepo struct {
	mu   sync.Mutex
	data map[string]string
}

func newAISearchConfigTestSettingRepo() *aiSearchConfigTestSettingRepo {
	return &aiSearchConfigTestSettingRepo{data: make(map[string]string)}
}

func (m *aiSearchConfigTestSettingRepo) Get(_ context.Context, key string) (*Setting, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	value, ok := m.data[key]
	if !ok {
		return nil, ErrSettingNotFound
	}
	return &Setting{Key: key, Value: value}, nil
}

func (m *aiSearchConfigTestSettingRepo) GetValue(_ context.Context, key string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.data[key], nil
}

func (m *aiSearchConfigTestSettingRepo) Set(_ context.Context, key, value string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[key] = value
	return nil
}

func (m *aiSearchConfigTestSettingRepo) GetMultiple(_ context.Context, keys []string) (map[string]string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make(map[string]string)
	for _, key := range keys {
		if value, ok := m.data[key]; ok {
			out[key] = value
		}
	}
	return out, nil
}

func (m *aiSearchConfigTestSettingRepo) SetMultiple(_ context.Context, settings map[string]string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for key, value := range settings {
		m.data[key] = value
	}
	return nil
}

func (m *aiSearchConfigTestSettingRepo) GetAll(_ context.Context) (map[string]string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make(map[string]string, len(m.data))
	for key, value := range m.data {
		out[key] = value
	}
	return out, nil
}

func (m *aiSearchConfigTestSettingRepo) Delete(_ context.Context, key string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.data, key)
	return nil
}

type aiSearchConfigTestEncryptor struct{}

func (e *aiSearchConfigTestEncryptor) Encrypt(plaintext string) (string, error) {
	return "ENC:" + plaintext, nil
}

func (e *aiSearchConfigTestEncryptor) Decrypt(ciphertext string) (string, error) {
	if strings.HasPrefix(ciphertext, "ENC:") {
		return strings.TrimPrefix(ciphertext, "ENC:"), nil
	}
	return ciphertext, fmt.Errorf("not encrypted")
}
