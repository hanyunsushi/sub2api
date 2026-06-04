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
	defaultAISearchSyncSourcePath        = ""
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
	if err := validateAISearchAccountID(settings.accountID); err != nil {
		return err
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
	if sourcePath := strings.TrimSpace(settings.sourcePath); sourcePath != "" {
		info, err := os.Stat(sourcePath)
		if err == nil && !info.IsDir() {
			source, err := os.ReadFile(sourcePath)
			if err != nil {
				return nil, fmt.Errorf("read AI Search source document: %w", err)
			}
			markdown, err := buildAISearchPublicKnowledge(string(source))
			if err != nil {
				return nil, err
			}
			return []byte(markdown), nil
		}
		if err != nil && !errors.Is(err, os.ErrNotExist) {
			return nil, fmt.Errorf("stat AI Search source document: %w", err)
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
	{regexp.MustCompile(`(?i)\b(api token|api key|secret access key|authorization:\s*bearer|jwt\.secret)\b`), "secret term"},
	{regexp.MustCompile(`(密钥|凭据|敏感值)`), "secret term"},
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
		"# Creeper & AI 用户知识库",
		"",
		"本文件面向网页 Creepee 问答，只保留适合用户和管理员搜索的产品知识、功能解释、FAQ 和操作说明。",
		"内容参考 Sub2API 官方网关概念，但以本站实际启用的菜单、渠道、模型、外部订阅、备份和管理后台能力为准。",
		"",
		"## 网站概览",
		"",
		"本站是基于 Sub2API 定制的 AI API 网关和控制台。用户通过平台生成的调用令牌访问上游模型，平台负责鉴权、分组、计费、用量统计、账号调度、渠道监控和请求转发。",
		"普通用户主要使用仪表盘、调用令牌、用量统计、订阅、兑换码、全局价格、余额展示和自定义菜单页面。",
		"管理员主要使用用户管理、分组管理、账号管理、渠道管理、价格管理、渠道监控、系统设置、支付配置、返佣、Codex/CPA 管理、R2 灾备和 Cloudflare AI Search 设置。",
		"本站包含多项定制能力：Cloudflare 主题、Creepee、外部订阅余额展示、QLHazyCoder/TCDMX/Buzz 订阅摘要、Codex/CPA 账号管理、自定义菜单 iframe 或新标签页打开、菜单排序、SVG 图床链接和图标预设保存。",
		"",
		"## Creepee",
		"",
		"登录后的网页控制台右上角有常驻的 `Creepee` 入口，位置在公告铃左侧。点击后会打开右侧侧边栏，用户可以直接提问网站功能、模型、渠道、用量、菜单、备份和管理后台相关问题。",
		"助手名称是 `Creepee`，界面使用 Claude Code 螃蟹图标作为助手头像。回答由 Cloudflare 官方聊天组件承载，基于知识库给出自然语言回答并附带来源。",
		"浏览器只请求 Sub2API 后端同源接口，AI Search 访问由后端统一代理完成，前端不直接暴露 Cloudflare 连接参数。",
		"后台已有 Cloudflare AI Search 连接。知识库由 Sub2API 后端每 3 天按用户版知识文档重新上传一次，管理员也可以在系统设置里使用管理端的“立即同步知识库”触发同步。",
		"同步会替换同名知识项并清理旧种子项，避免过期内容混入搜索。外部脚本只用于本地生成和测试，不是本站正常同步主路径。",
		"输入中文或其他输入法时，Creepee 会保护输入法回车，避免候选词确认时误提交半截内容。",
		"",
		"## 用户功能",
		"",
		"仪表盘展示账户状态、余额、可用分组、近期用量和常用入口。余额区域可能同时展示系统余额以及 Buzz、TCDMX、QLHazyCoder 等外部订阅摘要。",
		"调用令牌页面用于创建、查看、复制、禁用或删除用户自己的调用令牌。调用令牌用于客户端访问模型接口，具体可用模型和倍率由分组、渠道、价格和管理员配置决定。",
		"用量统计页面用于查看请求量、Token 消耗、模型分布、扣费和时间趋势。遇到余额或扣费疑问时，优先查看用量明细和分组倍率。",
		"订阅、充值、兑换码和返佣功能是否可见取决于站点当前配置。若管理员启用支付，用户可以通过站内支付入口充值；若启用兑换码，用户可以使用有效兑换码增加余额或权益。",
		"全局价格页面用于查看不同模型或分组的价格信息，实际扣费还会受到用户分组、倍率、套餐和管理员策略影响。",
		"",
		"## 管理后台",
		"",
		"用户管理用于查看用户、调整余额、角色、状态、分组、属性、邀请关系和风险控制信息。",
		"分组管理用于定义服务套餐。分组可以绑定不同账号池、倍率、并发、速率限制、可见范围和 Claude Code 相关限制。",
		"账号管理用于接入上游账号。账号可以来自 OAuth、会话类授权、上游控制台令牌或其他平台支持的接入方式，并可配置模型映射、代理、并发、调度权重和健康状态。",
		"渠道管理和价格管理用于维护平台、模型白名单、倍率、别名、上游模型同步和对外展示价格。",
		"系统设置覆盖站点名称、主题、登录方式、支付、邮箱、第三方登录、网关策略、外部订阅、AI logo、Cloudflare AI Search、自定义菜单、R2 灾备等站点级配置。",
		"",
		"## 渠道监控",
		"",
		"渠道监控用于定时或手动探测渠道是否可用。它不等同于用户真实长对话，只是用最小请求形态检查路由、鉴权、账号池和上游返回是否正常。",
		"为了节省 token，渠道监控建议优先使用低输出的 `replace` 探针；只有需要覆盖特定能力时，再使用更复杂的模型或请求形态。",
		"如果连接测试通过但渠道监控失败，常见原因是测试接口和监控接口走的请求形态不同、监控模型名没有经过本站映射、账号池没有可用账号、上游挑战校验失败、或监控 endpoint 与真实站点入口不一致。",
		"`challenge mismatch (expected 58, got \"\")` 通常表示上游挑战流程没有返回期望答案。处理时先确认监控模型、endpoint、请求形态、账号状态和上游是否需要浏览器挑战，而不是直接判定调用令牌错误。",
		"Mimo 账号卡片可能显示 Mimo 模型，但站内真实调用应以本站入口模型映射为准。例如上游模型和网关入口模型可能不是同一个名字；渠道监控应使用 Sub2API 面向用户暴露的入口模型，而不是只看上游原始模型名。",
		"",
		"## 模型与外部订阅",
		"",
		"本站模型可来自 OpenAI、Anthropic、Gemini、Antigravity、Codex、Claude Code 兼容链路以及其他管理员接入的上游。用户能否调用某个模型，取决于分组、账号池、渠道、模型映射和价格配置。",
		"QLHazyCoder 订阅展示读取 qlhazycoder New API 控制台的余额、订阅额度和到期时间。它使用控制台个人设置里的用户令牌，不使用普通模型调用令牌读取订阅。",
		"TCDMX 订阅展示需要可访问 TCDMX 订阅接口的访问令牌或登录续期信息。普通模型调用令牌通常只能调用模型接口，不能读取订阅额度。",
		"BuzzAI 展示用于读取 Buzz 余额或订阅摘要，连接信息由后端保存，前端只显示配置状态、余额和到期摘要。",
		"Mimo 当前主要作为模型调用和账号展示来源；如果没有稳定公开的余额或订阅期限查询接口，就不会作为自动余额来源。",
		"",
		"## 自定义菜单",
		"",
		"管理员可以在系统设置中增加自定义菜单。每个菜单可以选择 `iframe` 或 `redirect` 打开方式。",
		"`iframe` 会在站内 `/custom/<id>` 页面打开目标地址，适合允许被嵌入的网站。如果目标站点禁止 iframe，页面可能打不开或显示空白。",
		"`redirect` 会从侧边栏在新标签页打开目标链接，不会把当前 Sub2API 控制台页直接跳走。",
		"自定义菜单支持调整顺序，保存后侧边栏按新的顺序展示。",
		"自定义菜单图标支持内联 SVG 和 SVG 图床链接。使用 SVG 图床链接后，已登录用户可以把该链接保存到服务端可选图标库，后续新增菜单时可继续选择。",
		"",
	}

	if strings.Contains(source, "R2 灾备状态") {
		lines = append(lines,
			"## R2 灾备",
			"",
			fmt.Sprintf("生产数据库已启用 Cloudflare R2 灾备，计划在每天 %s 自动生成 PostgreSQL 备份。", backupTime),
			fmt.Sprintf("备份保留策略为 %s 天，旧备份会按生命周期规则自动清理。", retentionDays),
			"灾备主要覆盖 Sub2API 的 PostgreSQL 业务数据，包括用户、账号、分组、设置、用量、计费、Codex 元数据和运维相关表。",
			"灾备不等于整台机器快照；运行环境配置、缓存、日志、本机认证文件和第三方本机服务配置需要单独管理。",
			"如果 R2 访问方式不可用，可以在 Cloudflare 重新开通有权限的访问方式。已有 R2 对象不会因此被删除。",
			"",
		)
	}

	lines = append(lines,
		"## Codex / CPA 管理",
		"",
		"管理员后台提供 Codex/CPA 账号管理能力，可查看认证账户、上传认证文件、删除文件账号、启停账号、打开 OAuth 授权、维护分组、备注、标签、显示名称和排序。",
		"分组、备注、显示名称、标签、排序等管理元数据保存在 Sub2API 数据库中，因此同一管理员在不同浏览器登录后能看到一致配置。",
		"真实认证文件、OAuth、刷新状态和部分运行状态由 CPA/CLIProxyAPI 负责。失败账号卡片会显示 CPA 返回的错误码和错误文字，方便定位授权或上游问题。",
		"",
		"## 数据保存在哪里",
		"",
		"GitHub 保存源代码和随代码维护的文档。",
		"Sub2API 的用户、账号、分组、设置、用量、计费和 Codex 元数据等业务状态保存在 PostgreSQL。",
		"Redis 主要用于缓存、队列、限流或临时状态，不作为主要长期数据源。",
		"Cloudflare R2 适合保存数据库备份和对象文件，不适合直接替代 PostgreSQL 的实时关系型读写。",
		"Cloudflare AI Search 保存可检索的知识索引；它用于搜索和问答，不是业务数据库。",
		"",
		"## FAQ 如何累积",
		"",
		"适合公开给用户搜索的 FAQ、功能说明和操作说明应先写入受控文档，再由后端定时同步到 Cloudflare AI Search，或由管理员在系统设置中立即同步。",
		"用户在搜索框里输入的问题默认不会自动保存成 FAQ；如果以后需要沉淀用户问题，应单独增加反馈、日志或审核流程。",
		"更新知识库时应删除或替换旧索引，避免搜索结果混入过期说明。",
		"",
		"## 常见问题",
		"",
		"### Creepee 可以帮助用户使用网站吗？",
		"",
		"可以。用户登录后可以点击右上角 `Creepee` 打开右侧侧边栏，用自然语言提问网站功能、账号管理、渠道监控、模型映射、备份范围和常见问题，并得到带来源的回答。",
		"",
		"### 整份运维文档能直接作为知识库吗？",
		"",
		"不建议。运维文档包含开发路径、发布记录、部署状态和内部操作细节。知识库应使用过滤后的用户版文档，只保留可搜索的产品和操作说明。",
		"",
		"### 为什么 iframe 自定义菜单打不开？",
		"",
		"通常是目标网站禁止被 iframe 嵌入，或它要求特殊登录态、跨站 cookie、内容安全策略。遇到这种情况，把菜单打开方式改为 `redirect`，从侧边栏在新标签页打开。",
		"",
		"### 渠道监控为什么要用 replace？",
		"",
		"`replace` 探针输出短、成本低，适合做可用性检查。监控的目标是判断链路和账号池是否可用，不是生成长文本。",
		"",
		"### Mimo 为什么看起来不是 mimo-v2.5？",
		"",
		"账号卡片可以显示 Mimo 来源或上游模型，但实际调用时可能通过本站入口模型映射到上游模型。监控和用户调用应以站内暴露的入口模型为准。",
		"",
		"### R2 能接管全部数据吗？",
		"",
		"不能。R2 是对象存储，适合备份和文件，不适合作为 Sub2API 主业务数据库。结构化业务数据仍应由 PostgreSQL 承担。",
		"",
		"### R2 访问方式不可用后数据还在吗？",
		"",
		"还在。访问方式不可用通常只影响当前访问能力，可以重新开通有权限的访问方式来访问已有对象。",
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
