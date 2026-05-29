package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/pkg/logger"
	"github.com/robfig/cron/v3"
)

const (
	defaultAISearchNamespace             = "default"
	defaultAISearchItemKey               = "sub2api-user-knowledge.md"
	defaultAISearchSyncCron              = "20 3 */3 * *"
	defaultAISearchSyncSourcePath        = "/app/resources/ai-search/sub2api-codex-custom-plan.md"
	defaultAISearchSyncKnowledgePath     = "/app/resources/ai-search/sub2api-user-knowledge.md"
	legacyAISearchKnowledgeSeedItemKey   = "sub2api-ai-search.md"
	aiSearchKnowledgeSyncRequestTimeout  = 90 * time.Second
	aiSearchKnowledgeSyncShutdownTimeout = 5 * time.Second
)

var aiSearchKnowledgeCronParser = cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)

type AISearchKnowledgeSyncService struct {
	cfg        *config.Config
	configSvc  *AISearchConfigService
	httpClient *http.Client

	mu     sync.Mutex
	cancel context.CancelFunc
	done   chan struct{}
}

func NewAISearchKnowledgeSyncService(cfg *config.Config, configSvc ...*AISearchConfigService) *AISearchKnowledgeSyncService {
	var aiSearchConfigSvc *AISearchConfigService
	if len(configSvc) > 0 {
		aiSearchConfigSvc = configSvc[0]
	}
	return &AISearchKnowledgeSyncService{
		cfg:       cfg,
		configSvc: aiSearchConfigSvc,
		httpClient: &http.Client{
			Timeout: aiSearchKnowledgeSyncRequestTimeout,
		},
	}
}

func ProvideAISearchKnowledgeSyncService(cfg *config.Config, configSvc *AISearchConfigService) *AISearchKnowledgeSyncService {
	svc := NewAISearchKnowledgeSyncService(cfg, configSvc)
	svc.Start()
	return svc
}

func (s *AISearchKnowledgeSyncService) Start() {
	settings := s.settings()
	if !settings.enabled || !settings.configured() {
		return
	}
	schedule, err := aiSearchKnowledgeCronParser.Parse(settings.cronSpec)
	if err != nil {
		logger.LegacyPrintf("service.ai_search_sync", "[AISearchSync] invalid cron spec=%q: %v", settings.cronSpec, err)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if s.cancel != nil {
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel
	s.done = make(chan struct{})
	go s.loop(ctx, schedule)
}

func (s *AISearchKnowledgeSyncService) Stop() {
	s.mu.Lock()
	cancel := s.cancel
	done := s.done
	s.cancel = nil
	s.done = nil
	s.mu.Unlock()

	if cancel == nil {
		return
	}
	cancel()
	select {
	case <-done:
	case <-time.After(aiSearchKnowledgeSyncShutdownTimeout):
		logger.LegacyPrintf("service.ai_search_sync", "[AISearchSync] stop timed out")
	}
}

func (s *AISearchKnowledgeSyncService) Restart() {
	if s == nil {
		return
	}
	s.Stop()
	s.Start()
}

func (s *AISearchKnowledgeSyncService) loop(ctx context.Context, schedule cron.Schedule) {
	defer close(s.done)
	for {
		next := schedule.Next(time.Now())
		timer := time.NewTimer(time.Until(next))
		select {
		case <-timer.C:
			if err := s.SyncOnce(ctx); err != nil {
				logger.LegacyPrintf("service.ai_search_sync", "[AISearchSync] sync failed: %v", err)
			}
		case <-ctx.Done():
			if !timer.Stop() {
				select {
				case <-timer.C:
				default:
				}
			}
			return
		}
	}
}

func (s *AISearchKnowledgeSyncService) SyncOnce(ctx context.Context) error {
	settings := s.settings()
	if !settings.configured() {
		return nil
	}

	content, err := s.knowledgeContent(settings)
	if err != nil {
		return err
	}
	if len(bytes.TrimSpace(content)) == 0 {
		return nil
	}

	items, err := s.findItems(ctx, settings, settings.itemKey)
	if err != nil {
		return err
	}
	deletedIDs := make(map[string]struct{}, len(items))
	legacyDeleted := false
	for _, item := range items {
		if item.Key == settings.itemKey || (settings.deleteLegacySeedItems && item.Key == legacyAISearchKnowledgeSeedItemKey) {
			if err := s.deleteItem(ctx, settings, item.ID); err != nil {
				return err
			}
			deletedIDs[item.ID] = struct{}{}
			legacyDeleted = legacyDeleted || item.Key == legacyAISearchKnowledgeSeedItemKey
		}
	}

	if settings.deleteLegacySeedItems && settings.itemKey != legacyAISearchKnowledgeSeedItemKey && !legacyDeleted {
		legacyItems, err := s.findItems(ctx, settings, legacyAISearchKnowledgeSeedItemKey)
		if err != nil {
			return err
		}
		for _, item := range legacyItems {
			if item.Key == legacyAISearchKnowledgeSeedItemKey {
				if _, ok := deletedIDs[item.ID]; ok {
					continue
				}
				if err := s.deleteItem(ctx, settings, item.ID); err != nil {
					return err
				}
			}
		}
	}

	return s.uploadItem(ctx, settings, content)
}

type aiSearchKnowledgeSyncSettings struct {
	enabled               bool
	accountID             string
	token                 string
	instanceID            string
	namespace             string
	itemKey               string
	baseURL               string
	cronSpec              string
	sourcePath            string
	knowledgePath         string
	waitForCompletion     bool
	deleteLegacySeedItems bool
}

func (s *AISearchKnowledgeSyncService) settings() aiSearchKnowledgeSyncSettings {
	if s == nil || s.cfg == nil {
		return aiSearchKnowledgeSyncSettings{}
	}
	cf := aiSearchConfigForService(s.cfg, s.configSvc)
	settings := aiSearchKnowledgeSyncSettings{
		enabled:               cf.SyncEnabled,
		accountID:             strings.TrimSpace(cf.AccountID),
		token:                 strings.TrimSpace(cf.APIToken),
		instanceID:            firstNonBlank(cf.InstanceID, defaultAISearchInstanceID),
		namespace:             firstNonBlank(cf.Namespace, defaultAISearchNamespace),
		itemKey:               firstNonBlank(cf.ItemKey, defaultAISearchItemKey),
		baseURL:               firstNonBlank(strings.TrimRight(cf.APIBaseURL, "/"), defaultAISearchAPIBaseURL),
		cronSpec:              firstNonBlank(cf.SyncCron, defaultAISearchSyncCron),
		sourcePath:            firstNonBlank(cf.SyncSourcePath, defaultAISearchSyncSourcePath),
		knowledgePath:         firstNonBlank(cf.SyncKnowledgePath, defaultAISearchSyncKnowledgePath),
		waitForCompletion:     cf.SyncWaitForCompletion,
		deleteLegacySeedItems: cf.SyncDeleteLegacySeedItems,
	}
	return settings
}

func (s aiSearchKnowledgeSyncSettings) configured() bool {
	return strings.TrimSpace(s.accountID) != "" &&
		strings.TrimSpace(s.token) != "" &&
		strings.TrimSpace(s.instanceID) != "" &&
		strings.TrimSpace(s.namespace) != "" &&
		strings.TrimSpace(s.itemKey) != "" &&
		strings.TrimSpace(s.baseURL) != "" &&
		strings.TrimSpace(s.knowledgePath) != ""
}

func (s *AISearchKnowledgeSyncService) knowledgeContent(settings aiSearchKnowledgeSyncSettings) ([]byte, error) {
	if strings.TrimSpace(settings.sourcePath) != "" {
		source, err := os.ReadFile(settings.sourcePath)
		if err == nil {
			markdown, err := buildAISearchPublicKnowledge(string(source))
			if err != nil {
				return nil, err
			}
			return []byte(markdown), nil
		}
		if err != nil && !errors.Is(err, os.ErrNotExist) {
			return nil, fmt.Errorf("read AI Search source document: %w", err)
		}
	}

	content, err := os.ReadFile(settings.knowledgePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		return nil, fmt.Errorf("read AI Search knowledge file: %w", err)
	}
	return content, nil
}

type aiSearchForbiddenPattern struct {
	re    *regexp.Regexp
	label string
}

var aiSearchForbiddenKnowledgePatterns = []aiSearchForbiddenPattern{
	{regexp.MustCompile(`/Users/[^\s` + "`" + `，。；、)）]+`), "local filesystem path"},
	{regexp.MustCompile(`sha256:[0-9a-f]{12,}`), "container image digest"},
	{regexp.MustCompile(`\b[0-9a-f]{40}\b`), "git commit hash or secret-like token"},
	{regexp.MustCompile(`\bd1cf0f9a11253d72f2dde108713d5e76\b`), "Cloudflare account id"},
	{regexp.MustCompile(`(?i)\b(api token|secret access key|authorization:\s*bearer|jwt\.secret)\b`), "secret term"},
	{regexp.MustCompile(`(?i)\b(docker compose|cherry-pick|worktree|image digest)\b`), "deployment implementation term"},
	{regexp.MustCompile(`(开发仓|正式运行源码|运行镜像|备份镜像|容器镜像|提交并推送)`), "deployment implementation term"},
}

func buildAISearchPublicKnowledge(source string) (string, error) {
	r2Source := markdownSection(source, "## R2 灾备状态")
	if r2Source == "" {
		r2Source = source
	}
	backupTime := firstRegexpMatch(r2Source, `每天\s+`+"`?"+`([0-9]{1,2}:[0-9]{2})`+"`?", "03:00")
	retentionDays := firstRegexpMatch(r2Source, `(?:保留策略为|下对象)\s*([0-9]+)\s*天`, "30")

	lines := []string{
		"# Sub2API 用户知识库",
		"",
		"本文件由 Sub2API canonical 运维文档生成，只保留适合用户和管理员搜索的产品知识、FAQ 和操作说明。",
		"本文件面向网页搜索和问答场景，只描述用户可见功能、数据范围和常见问题。",
		"",
	}

	if sourceHas(source, "Cloudflare AI Search", "AI Search") {
		lines = append(lines,
			"## AI Search",
			"",
			"登录后的网页控制台右上角有常驻的 `ask ai` 搜索框，位置在公告铃左侧。用户可以直接搜索常见问题、功能说明、备份说明和账号管理说明。",
			"浏览器只请求 Sub2API 后端接口，后端再查询 Cloudflare AI Search；Cloudflare 凭据不会暴露给前端。",
			"实例名称使用 `ai-search`，界面文案使用 `ask ai`，不使用 Help 作为名称。",
			"知识库由 Sub2API 后端通过 Cloudflare API 每 3 天按用户版知识文档重新上传一次；同步前会删除同名旧索引和遗留临时索引，避免过期内容混入搜索。",
			"登录用户的搜索使用 Cloudflare 官方 search bar 组件展示相关结果和来源片段；它不是聊天弹窗，不会把结果包装成多轮自然语言回答。",
			"",
		)
	}

	if strings.Contains(source, "R2 灾备状态") {
		lines = append(lines,
			"## R2 灾备",
			"",
			fmt.Sprintf("生产数据库已启用 Cloudflare R2 灾备，计划在每天 %s 自动生成 PostgreSQL 备份。", backupTime),
			fmt.Sprintf("备份保留策略为 %s 天，旧备份会按生命周期规则自动清理。", retentionDays),
			"灾备主要覆盖 Sub2API 的 PostgreSQL 业务数据，包括用户、账号、API key、分组、设置、用量、计费、Codex 元数据和运维相关表。",
			"灾备不等于整台机器快照；运行环境配置、缓存、日志、本机认证文件和第三方本机服务配置需要单独管理。",
			"如果 R2 访问密钥丢失，可以在 Cloudflare 重新创建有权限的凭据。已有 R2 对象不会因为旧密钥失效而被删除。",
			"",
		)
	}

	if sourceHas(source, "CPA", "Codex") {
		lines = append(lines,
			"## Codex 账号管理",
			"",
			"管理员后台提供 Codex/CPA 账号管理能力，可查看认证账户、上传认证文件、删除文件账号、启停账号、打开 OAuth 授权、维护分组、备注、标签和显示名称。",
			"分组、备注、显示名称、标签、排序等管理元数据保存在 Sub2API 数据库中，因此同一账号在不同浏览器登录后能看到一致配置。",
			"真实认证文件、OAuth、刷新状态和部分运行状态仍由 CPA/CLIProxyAPI 负责。",
			"失败账号卡片会显示 CPA 返回的错误码和错误文字，方便定位授权或上游问题。",
			"",
		)
	}

	if sourceHas(source, "Buzz", "TCDMX") {
		lines = append(lines,
			"## 余额和外部订阅",
			"",
			"右上角余额区域会展示系统余额，并可展示 BuzzAI、TCDMX 等外部订阅摘要。",
			"账号管理页会按账号来源展示外部订阅余额、期限和官网入口；期限缺失时显示为长期。",
			"BuzzAI 和 TCDMX 的密钥只保存在后端设置中，前端只显示配置状态和订阅摘要，不回显敏感值。",
			"Mimo 当前公开文档能确认兼容 OpenAI/Anthropic 推理接口，但没有稳定公开的余额或订阅期限查询接口，因此暂不作为自动余额来源。",
			"",
		)
	}

	lines = append(lines,
		"## 数据保存在哪里",
		"",
		"GitHub 保存源代码和随代码维护的文档。",
		"Sub2API 的用户、账号、API Key、分组、设置、用量、计费和 Codex 元数据等业务状态保存在 PostgreSQL。",
		"Redis 主要用于缓存、队列、限流或临时状态，不作为主要长期数据源。",
		"Cloudflare R2 适合保存数据库备份和对象文件，不适合直接替代 PostgreSQL 的实时关系型读写。",
		"Cloudflare AI Search 保存可检索的知识索引；它用于搜索和问答，不是业务数据库。",
		"",
		"## FAQ 如何累积",
		"",
		"适合公开给用户搜索的 FAQ、功能说明和操作说明应先写入受控文档，再由后端定时同步到 Cloudflare AI Search。",
		"用户在搜索框里输入的问题默认不会自动保存成 FAQ；如果以后需要沉淀用户问题，应单独增加反馈、日志或审核流程。",
		"更新知识库时应删除或替换旧索引，避免搜索结果混入过期说明。",
		"",
		"## 常见问题",
		"",
		"### AI Search 可以帮助用户使用网站吗？",
		"",
		"可以。用户登录后可以在右上角 `ask ai` 搜索框中查询网站功能、账号管理、备份范围和常见问题。",
		"",
		"### 整份运维文档能直接作为知识库吗？",
		"",
		"不建议。运维文档包含开发路径、发布记录、部署状态和内部操作细节。知识库应使用过滤后的用户版文档，只保留可搜索的产品和操作说明。",
		"",
		"### R2 能接管全部数据吗？",
		"",
		"不能。R2 是对象存储，适合备份和文件，不适合作为 Sub2API 主业务数据库。结构化业务数据仍应由 PostgreSQL 承担。",
		"",
		"### R2 密钥丢失后数据还在吗？",
		"",
		"还在。丢失访问密钥通常只影响当前凭据访问能力，可以重新创建有权限的凭据来访问已有对象。",
	)

	markdown := strings.TrimSpace(strings.Join(lines, "\n")) + "\n"
	if err := validateAISearchPublicKnowledge(markdown); err != nil {
		return "", err
	}
	return markdown, nil
}

func sourceHas(source string, needles ...string) bool {
	for _, needle := range needles {
		if !strings.Contains(source, needle) {
			return false
		}
	}
	return true
}

func markdownSection(source, heading string) string {
	start := strings.Index(source, heading)
	if start < 0 {
		return ""
	}
	next := strings.Index(source[start+len(heading):], "\n## ")
	if next < 0 {
		return source[start:]
	}
	return source[start : start+len(heading)+next]
}

func firstRegexpMatch(source, pattern, fallback string) string {
	matches := regexp.MustCompile(pattern).FindStringSubmatch(source)
	if len(matches) == 0 {
		return fallback
	}
	for _, match := range matches[1:] {
		if strings.TrimSpace(match) != "" {
			return match
		}
	}
	return matches[0]
}

func validateAISearchPublicKnowledge(markdown string) error {
	for _, pattern := range aiSearchForbiddenKnowledgePatterns {
		if pattern.re.MatchString(markdown) {
			return fmt.Errorf("generated AI Search knowledge contains forbidden content: %s", pattern.label)
		}
	}
	return nil
}

type aiSearchKnowledgeItem struct {
	ID  string `json:"id"`
	Key string `json:"key"`
}

type aiSearchKnowledgeItemsResponse struct {
	Success bool                    `json:"success"`
	Result  []aiSearchKnowledgeItem `json:"result"`
}

func (s *AISearchKnowledgeSyncService) findItems(ctx context.Context, settings aiSearchKnowledgeSyncSettings, search string) ([]aiSearchKnowledgeItem, error) {
	endpoint := fmt.Sprintf(
		"%s/accounts/%s/ai-search/namespaces/%s/instances/%s/items?%s",
		settings.baseURL,
		url.PathEscape(settings.accountID),
		url.PathEscape(settings.namespace),
		url.PathEscape(settings.instanceID),
		url.Values{"search": {search}, "source": {"builtin"}, "per_page": {"50"}}.Encode(),
	)
	var out aiSearchKnowledgeItemsResponse
	if err := s.doJSON(ctx, http.MethodGet, endpoint, settings.token, "", nil, &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("AI Search items list returned an error")
	}
	return out.Result, nil
}

func (s *AISearchKnowledgeSyncService) deleteItem(ctx context.Context, settings aiSearchKnowledgeSyncSettings, itemID string) error {
	if itemID == "" {
		return nil
	}
	endpoint := fmt.Sprintf(
		"%s/accounts/%s/ai-search/namespaces/%s/instances/%s/items/%s",
		settings.baseURL,
		url.PathEscape(settings.accountID),
		url.PathEscape(settings.namespace),
		url.PathEscape(settings.instanceID),
		url.PathEscape(itemID),
	)
	return s.doJSON(ctx, http.MethodDelete, endpoint, settings.token, "", nil, nil)
}

func (s *AISearchKnowledgeSyncService) uploadItem(ctx context.Context, settings aiSearchKnowledgeSyncSettings, content []byte) error {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	fileHeader := make(textproto.MIMEHeader)
	fileHeader.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, escapeMultipartFilename(settings.itemKey)))
	fileHeader.Set("Content-Type", "text/markdown; charset=utf-8")
	filePart, err := writer.CreatePart(fileHeader)
	if err != nil {
		return fmt.Errorf("create multipart file part: %w", err)
	}
	if _, err := filePart.Write(content); err != nil {
		return fmt.Errorf("write multipart file part: %w", err)
	}

	metadata := map[string]any{
		"title":          "Sub2API 用户知识库",
		"url":            "/",
		"route":          "/",
		"generated_from": "sub2api-codex-custom-plan",
	}
	metadataBytes, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("marshal AI Search metadata: %w", err)
	}
	if err := writer.WriteField("metadata", string(metadataBytes)); err != nil {
		return fmt.Errorf("write metadata field: %w", err)
	}
	if err := writer.WriteField("wait_for_completion", fmt.Sprintf("%t", settings.waitForCompletion)); err != nil {
		return fmt.Errorf("write wait field: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("close multipart writer: %w", err)
	}

	endpoint := fmt.Sprintf(
		"%s/accounts/%s/ai-search/namespaces/%s/instances/%s/items",
		settings.baseURL,
		url.PathEscape(settings.accountID),
		url.PathEscape(settings.namespace),
		url.PathEscape(settings.instanceID),
	)
	return s.doJSON(ctx, http.MethodPost, endpoint, settings.token, writer.FormDataContentType(), body.Bytes(), nil)
}

func (s *AISearchKnowledgeSyncService) doJSON(ctx context.Context, method, endpoint, token, contentType string, body []byte, out any) error {
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, reader)
	if err != nil {
		return fmt.Errorf("build AI Search request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("call AI Search API: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read AI Search response: %w", err)
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("AI Search API returned HTTP %d", resp.StatusCode)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(raw, out); err != nil {
		return fmt.Errorf("decode AI Search response: %w", err)
	}
	return nil
}

func escapeMultipartFilename(filename string) string {
	filename = filepath.Base(filename)
	filename = strings.ReplaceAll(filename, `\`, "")
	filename = strings.ReplaceAll(filename, `"`, "")
	if filename == "." || filename == string(filepath.Separator) || filename == "" {
		return defaultAISearchItemKey
	}
	return filename
}
