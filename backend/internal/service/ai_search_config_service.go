package service

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/Wei-Shaw/sub2api/internal/config"
	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/Wei-Shaw/sub2api/internal/pkg/logger"
)

const (
	settingKeyCloudflareAISearchConfig = "cloudflare_ai_search_config"
	aiSearchPublicProxyAPIURL          = "/api/v1/ai-search/public"
)

var cloudflareAccountIDPattern = regexp.MustCompile(`^[0-9a-fA-F]{32}$`)

type AISearchBackendConfig struct {
	AccountID                 string `json:"account_id"`
	APIToken                  string `json:"api_token,omitempty"`
	APITokenConfigured        bool   `json:"api_token_configured"`
	APIBaseURL                string `json:"api_base_url"`
	PublicEndpointURL         string `json:"public_endpoint_url"`
	PublicChatEndpointURL     string `json:"public_chat_endpoint_url"`
	PublicOrigin              string `json:"public_origin"`
	InstanceID                string `json:"instance_id"`
	Namespace                 string `json:"namespace"`
	ItemKey                   string `json:"item_key"`
	SyncEnabled               bool   `json:"sync_enabled"`
	SyncCron                  string `json:"sync_cron"`
	SyncSourcePath            string `json:"sync_source_path"`
	SyncKnowledgePath         string `json:"sync_knowledge_path"`
	SyncWaitForCompletion     bool   `json:"sync_wait_for_completion"`
	SyncDeleteLegacySeedItems bool   `json:"sync_delete_legacy_seed_items"`
}

type AISearchSnippetConfig struct {
	Configured bool   `json:"configured"`
	APIURL     string `json:"api_url"`
	InstanceID string `json:"instance_id"`
	Namespace  string `json:"namespace"`
}

type AISearchPublicProxyConfig struct {
	Configured bool
	BaseURL    string
	Origin     string
}

type aiSearchBackendConfigRecord struct {
	AccountID                 string `json:"account_id"`
	APIToken                  string `json:"api_token,omitempty"`
	APIBaseURL                string `json:"api_base_url"`
	PublicEndpointURL         string `json:"public_endpoint_url"`
	PublicChatEndpointURL     string `json:"public_chat_endpoint_url"`
	PublicOrigin              string `json:"public_origin"`
	InstanceID                string `json:"instance_id"`
	Namespace                 string `json:"namespace"`
	ItemKey                   string `json:"item_key"`
	SyncEnabled               bool   `json:"sync_enabled"`
	SyncCron                  string `json:"sync_cron"`
	SyncSourcePath            string `json:"sync_source_path"`
	SyncKnowledgePath         string `json:"sync_knowledge_path"`
	SyncWaitForCompletion     bool   `json:"sync_wait_for_completion"`
	SyncDeleteLegacySeedItems bool   `json:"sync_delete_legacy_seed_items"`
}

type AISearchConfigService struct {
	settingRepo SettingRepository
	cfg         *config.Config
	encryptor   SecretEncryptor
}

func NewAISearchConfigService(settingRepo SettingRepository, cfg *config.Config, encryptor SecretEncryptor) *AISearchConfigService {
	return &AISearchConfigService{
		settingRepo: settingRepo,
		cfg:         cfg,
		encryptor:   encryptor,
	}
}

func (s *AISearchConfigService) GetConfig(ctx context.Context) (*AISearchBackendConfig, error) {
	record, err := s.loadRecord(ctx)
	if err != nil {
		return nil, err
	}
	cfg := s.defaults()
	if record != nil {
		recordCfg := aiSearchConfigFromRecord(*record)
		cfg = &recordCfg
	}
	return sanitizeAISearchBackendConfig(cfg), nil
}

func (s *AISearchConfigService) UpdateConfig(ctx context.Context, cfg AISearchBackendConfig) (*AISearchBackendConfig, error) {
	if s == nil || s.settingRepo == nil {
		return nil, infraerrors.InternalServer("AI_SEARCH_CONFIG_UNAVAILABLE", "AI Search config storage is unavailable")
	}
	old, err := s.loadStoredRecord(ctx)
	if err != nil {
		return nil, err
	}

	normalized := normalizeAISearchBackendConfig(&cfg)
	if err := validateAISearchAccountID(normalized.AccountID); err != nil {
		return nil, err
	}
	record := aiSearchRecordFromConfig(normalized)
	if record.APIToken == "" && old != nil {
		record.APIToken = old.APIToken
	}
	if record.APIToken != "" && (old == nil || record.APIToken != old.APIToken) {
		encrypted, err := s.encryptToken(record.APIToken)
		if err != nil {
			return nil, fmt.Errorf("encrypt AI Search token: %w", err)
		}
		record.APIToken = encrypted
	}

	data, err := json.Marshal(record)
	if err != nil {
		return nil, fmt.Errorf("marshal AI Search config: %w", err)
	}
	if err := s.settingRepo.Set(ctx, settingKeyCloudflareAISearchConfig, string(data)); err != nil {
		return nil, fmt.Errorf("save AI Search config: %w", err)
	}

	out := aiSearchConfigFromRecord(record)
	return sanitizeAISearchBackendConfig(&out), nil
}

func (s *AISearchConfigService) ResolveConfig(ctx context.Context) AISearchBackendConfig {
	cfg := s.defaults()
	if s == nil || s.settingRepo == nil {
		return *cfg
	}
	record, err := s.loadRecord(ctx)
	if err != nil {
		logger.LegacyPrintf("service.ai_search_config", "[AISearchConfig] load DB config failed: %v", err)
		return *cfg
	}
	if record == nil {
		return *cfg
	}
	resolved := aiSearchConfigFromRecord(*record)
	return *normalizeAISearchBackendConfig(&resolved)
}

func (s *AISearchConfigService) MergeWithStoredSecret(ctx context.Context, cfg AISearchBackendConfig) AISearchBackendConfig {
	normalized := normalizeAISearchBackendConfig(&cfg)
	if strings.TrimSpace(normalized.APIToken) != "" {
		return *normalized
	}
	resolved := s.ResolveConfig(ctx)
	normalized.APIToken = resolved.APIToken
	return *normalized
}

func (s *AISearchConfigService) GetPublicSnippetConfig(ctx context.Context) (*AISearchSnippetConfig, error) {
	resolvedConfig := s.ResolveConfig(ctx)
	resolved := normalizeAISearchBackendConfig(&resolvedConfig)
	apiURL := publicAISearchBaseURL(resolved.PublicEndpointURL, resolved.PublicChatEndpointURL)
	return &AISearchSnippetConfig{
		Configured: apiURL != "",
		APIURL: func() string {
			if apiURL == "" {
				return ""
			}
			return aiSearchPublicProxyAPIURL
		}(),
		InstanceID: resolved.InstanceID,
		Namespace:  resolved.Namespace,
	}, nil
}

func (s *AISearchConfigService) GetPublicProxyConfig(ctx context.Context) (*AISearchPublicProxyConfig, error) {
	resolvedConfig := s.ResolveConfig(ctx)
	resolved := normalizeAISearchBackendConfig(&resolvedConfig)
	baseURL := publicAISearchBaseURL(resolved.PublicEndpointURL, resolved.PublicChatEndpointURL)
	return &AISearchPublicProxyConfig{
		Configured: baseURL != "",
		BaseURL:    baseURL,
		Origin:     resolved.PublicOrigin,
	}, nil
}

func (s *AISearchConfigService) ApplyRuntimeConfig(cfg AISearchBackendConfig) {
	if s == nil || s.cfg == nil {
		return
	}
	normalized := normalizeAISearchBackendConfig(&cfg)
	s.cfg.CloudflareAI.AccountID = normalized.AccountID
	s.cfg.CloudflareAI.AISearchAPIToken = normalized.APIToken
	s.cfg.CloudflareAI.AISearchAPIBaseURL = normalized.APIBaseURL
	s.cfg.CloudflareAI.AISearchPublicEndpointURL = normalized.PublicEndpointURL
	s.cfg.CloudflareAI.AISearchPublicChatEndpointURL = normalized.PublicChatEndpointURL
	s.cfg.CloudflareAI.AISearchPublicOrigin = normalized.PublicOrigin
	s.cfg.CloudflareAI.AISearchInstanceID = normalized.InstanceID
	s.cfg.CloudflareAI.AISearchNamespace = normalized.Namespace
	s.cfg.CloudflareAI.AISearchItemKey = normalized.ItemKey
	s.cfg.CloudflareAI.AISearchSyncEnabled = normalized.SyncEnabled
	s.cfg.CloudflareAI.AISearchSyncCron = normalized.SyncCron
	s.cfg.CloudflareAI.AISearchSyncSourcePath = normalized.SyncSourcePath
	s.cfg.CloudflareAI.AISearchSyncKnowledgePath = normalized.SyncKnowledgePath
	s.cfg.CloudflareAI.AISearchSyncWaitForCompletion = normalized.SyncWaitForCompletion
	s.cfg.CloudflareAI.AISearchSyncDeleteLegacySeedItems = normalized.SyncDeleteLegacySeedItems
}

func publicAISearchBaseURL(endpoints ...string) string {
	for _, endpoint := range endpoints {
		raw := strings.TrimSpace(endpoint)
		if raw == "" {
			continue
		}
		raw = strings.TrimRight(raw, "/")
		switch {
		case strings.HasSuffix(raw, "/chat/completions"):
			return strings.TrimSuffix(raw, "/chat/completions")
		case strings.HasSuffix(raw, "/search"):
			return strings.TrimSuffix(raw, "/search")
		default:
			return raw
		}
	}
	return ""
}

func (s *AISearchConfigService) defaults() *AISearchBackendConfig {
	if s == nil || s.cfg == nil {
		return normalizeAISearchBackendConfig(&AISearchBackendConfig{})
	}
	cf := s.cfg.CloudflareAI
	return normalizeAISearchBackendConfig(&AISearchBackendConfig{
		AccountID:                 cf.AccountID,
		APIToken:                  cf.AISearchAPIToken,
		APIBaseURL:                firstNonBlank(strings.TrimRight(cf.AISearchAPIBaseURL, "/"), defaultAISearchAPIBaseURL),
		PublicEndpointURL:         cf.AISearchPublicEndpointURL,
		PublicChatEndpointURL:     cf.AISearchPublicChatEndpointURL,
		PublicOrigin:              cf.AISearchPublicOrigin,
		InstanceID:                firstNonBlank(cf.AISearchInstanceID, defaultAISearchInstanceID),
		Namespace:                 firstNonBlank(cf.AISearchNamespace, defaultAISearchNamespace),
		ItemKey:                   firstNonBlank(cf.AISearchItemKey, defaultAISearchItemKey),
		SyncEnabled:               cf.AISearchSyncEnabled,
		SyncCron:                  firstNonBlank(cf.AISearchSyncCron, defaultAISearchSyncCron),
		SyncSourcePath:            firstNonBlank(cf.AISearchSyncSourcePath, defaultAISearchSyncSourcePath),
		SyncKnowledgePath:         firstNonBlank(cf.AISearchSyncKnowledgePath, defaultAISearchSyncKnowledgePath),
		SyncWaitForCompletion:     cf.AISearchSyncWaitForCompletion,
		SyncDeleteLegacySeedItems: cf.AISearchSyncDeleteLegacySeedItems,
	})
}

func (s *AISearchConfigService) loadRecord(ctx context.Context) (*aiSearchBackendConfigRecord, error) {
	record, err := s.loadStoredRecord(ctx)
	if err != nil || record == nil {
		return record, err
	}
	if record.APIToken != "" {
		token, err := s.decryptToken(record.APIToken)
		if err == nil {
			record.APIToken = token
		} else {
			logger.LegacyPrintf("service.ai_search_config", "[AISearchConfig] token decrypt failed, keeping stored value: %v", err)
		}
	}
	return record, nil
}

func (s *AISearchConfigService) loadStoredRecord(ctx context.Context) (*aiSearchBackendConfigRecord, error) {
	if s == nil || s.settingRepo == nil {
		return nil, nil //nolint:nilnil // no storage means no DB override
	}
	raw, err := s.settingRepo.GetValue(ctx, settingKeyCloudflareAISearchConfig)
	if err != nil || strings.TrimSpace(raw) == "" {
		return nil, nil //nolint:nilnil // missing config is a valid state
	}
	var record aiSearchBackendConfigRecord
	if err := json.Unmarshal([]byte(raw), &record); err != nil {
		return nil, infraerrors.InternalServer("AI_SEARCH_CONFIG_CORRUPT", "AI Search config data is corrupted")
	}
	return &record, nil
}

func (s *AISearchConfigService) encryptToken(token string) (string, error) {
	if s == nil || s.encryptor == nil {
		return token, nil
	}
	return s.encryptor.Encrypt(token)
}

func (s *AISearchConfigService) decryptToken(token string) (string, error) {
	if s == nil || s.encryptor == nil {
		return token, nil
	}
	return s.encryptor.Decrypt(token)
}

func normalizeAISearchBackendConfig(cfg *AISearchBackendConfig) *AISearchBackendConfig {
	if cfg == nil {
		cfg = &AISearchBackendConfig{}
	}
	out := *cfg
	out.AccountID = strings.TrimSpace(out.AccountID)
	out.APIToken = strings.TrimSpace(out.APIToken)
	out.APIBaseURL = firstNonBlank(strings.TrimRight(strings.TrimSpace(out.APIBaseURL), "/"), defaultAISearchAPIBaseURL)
	out.PublicEndpointURL = strings.TrimSpace(out.PublicEndpointURL)
	out.PublicChatEndpointURL = strings.TrimSpace(out.PublicChatEndpointURL)
	out.PublicOrigin = strings.TrimRight(strings.TrimSpace(out.PublicOrigin), "/")
	out.InstanceID = firstNonBlank(out.InstanceID, defaultAISearchInstanceID)
	out.Namespace = firstNonBlank(out.Namespace, defaultAISearchNamespace)
	out.ItemKey = firstNonBlank(out.ItemKey, defaultAISearchItemKey)
	out.SyncCron = firstNonBlank(out.SyncCron, defaultAISearchSyncCron)
	out.SyncSourcePath = firstNonBlank(out.SyncSourcePath, defaultAISearchSyncSourcePath)
	out.SyncKnowledgePath = firstNonBlank(out.SyncKnowledgePath, defaultAISearchSyncKnowledgePath)
	return &out
}

func validateAISearchAccountID(accountID string) error {
	accountID = strings.TrimSpace(accountID)
	if accountID == "" || cloudflareAccountIDPattern.MatchString(accountID) {
		return nil
	}
	return infraerrors.BadRequest(
		"AI_SEARCH_ACCOUNT_ID_INVALID",
		"Cloudflare Account ID must be the 32-character ID from the Cloudflare dashboard, not a login email.",
	)
}

func sanitizeAISearchBackendConfig(cfg *AISearchBackendConfig) *AISearchBackendConfig {
	cfg = normalizeAISearchBackendConfig(cfg)
	cfg.APITokenConfigured = strings.TrimSpace(cfg.APIToken) != ""
	cfg.APIToken = ""
	return cfg
}

func aiSearchRecordFromConfig(cfg *AISearchBackendConfig) aiSearchBackendConfigRecord {
	cfg = normalizeAISearchBackendConfig(cfg)
	return aiSearchBackendConfigRecord{
		AccountID:                 cfg.AccountID,
		APIToken:                  cfg.APIToken,
		APIBaseURL:                cfg.APIBaseURL,
		PublicEndpointURL:         cfg.PublicEndpointURL,
		PublicChatEndpointURL:     cfg.PublicChatEndpointURL,
		PublicOrigin:              cfg.PublicOrigin,
		InstanceID:                cfg.InstanceID,
		Namespace:                 cfg.Namespace,
		ItemKey:                   cfg.ItemKey,
		SyncEnabled:               cfg.SyncEnabled,
		SyncCron:                  cfg.SyncCron,
		SyncSourcePath:            cfg.SyncSourcePath,
		SyncKnowledgePath:         cfg.SyncKnowledgePath,
		SyncWaitForCompletion:     cfg.SyncWaitForCompletion,
		SyncDeleteLegacySeedItems: cfg.SyncDeleteLegacySeedItems,
	}
}

func aiSearchConfigFromRecord(record aiSearchBackendConfigRecord) AISearchBackendConfig {
	return *normalizeAISearchBackendConfig(&AISearchBackendConfig{
		AccountID:                 record.AccountID,
		APIToken:                  record.APIToken,
		APIBaseURL:                record.APIBaseURL,
		PublicEndpointURL:         record.PublicEndpointURL,
		PublicChatEndpointURL:     record.PublicChatEndpointURL,
		PublicOrigin:              record.PublicOrigin,
		InstanceID:                record.InstanceID,
		Namespace:                 record.Namespace,
		ItemKey:                   record.ItemKey,
		SyncEnabled:               record.SyncEnabled,
		SyncCron:                  record.SyncCron,
		SyncSourcePath:            record.SyncSourcePath,
		SyncKnowledgePath:         record.SyncKnowledgePath,
		SyncWaitForCompletion:     record.SyncWaitForCompletion,
		SyncDeleteLegacySeedItems: record.SyncDeleteLegacySeedItems,
	})
}
