package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/Wei-Shaw/sub2api/internal/config"
	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/imroc/req/v3"
)

const (
	defaultAISearchMaxResults     = 8
	defaultAISearchMatchThreshold = 0.2
	defaultAISearchInstanceID     = "ai-search"
	defaultAISearchAPIBaseURL     = "https://api.cloudflare.com/client/v4"
)

type AISearchResponse struct {
	Query      string           `json:"query"`
	Configured bool             `json:"configured"`
	Answer     string           `json:"answer,omitempty"`
	Results    []AISearchResult `json:"results"`
}

type AISearchResult struct {
	ID      string  `json:"id"`
	Title   string  `json:"title"`
	Snippet string  `json:"snippet"`
	URL     string  `json:"url,omitempty"`
	Source  string  `json:"source"`
	Score   float64 `json:"score"`
}

type AISearchService struct {
	cfg       *config.Config
	configSvc *AISearchConfigService
	client    *req.Client
}

func NewAISearchService(cfg *config.Config, configSvc ...*AISearchConfigService) *AISearchService {
	var aiSearchConfigSvc *AISearchConfigService
	if len(configSvc) > 0 {
		aiSearchConfigSvc = configSvc[0]
	}
	return &AISearchService{
		cfg:       cfg,
		configSvc: aiSearchConfigSvc,
		client: req.C().
			SetTimeout(12*time.Second).
			SetCommonHeader("Accept", "application/json").
			SetCommonHeader("Content-Type", "application/json"),
	}
}

func (s *AISearchService) Search(ctx context.Context, query string) (*AISearchResponse, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, infraerrors.BadRequest("AI_SEARCH_QUERY_REQUIRED", "AI Search query is required")
	}

	cf := aiSearchConfigForService(s.cfg, s.configSvc)
	if err := validateAISearchAccountID(cf.AccountID); err != nil {
		return nil, err
	}
	return s.searchWithSettings(ctx, aiSearchSettingsFromConfig(&cf), query)
}

func (s *AISearchService) SearchWithConfig(ctx context.Context, query string, cfg AISearchBackendConfig) (*AISearchResponse, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, infraerrors.BadRequest("AI_SEARCH_QUERY_REQUIRED", "AI Search query is required")
	}
	normalized := normalizeAISearchBackendConfig(&cfg)
	if err := validateAISearchAccountID(normalized.AccountID); err != nil {
		return nil, err
	}
	return s.searchWithSettings(ctx, aiSearchSettingsFromConfig(normalized), query)
}

func (s *AISearchService) searchWithSettings(ctx context.Context, settings aiSearchSettings, query string) (*AISearchResponse, error) {
	if !settings.configured() {
		return nil, infraerrors.ServiceUnavailable("AI_SEARCH_NOT_CONFIGURED", "AI Search is not configured")
	}

	if settings.privateConfigured() {
		if response, err := s.searchWithChatCompletion(ctx, settings, query); err == nil {
			return response, nil
		}
		if response, err := s.searchChunks(ctx, settings.searchEndpoint, settings.token, "", query); err == nil {
			return response, nil
		}
	}

	if settings.publicChatEndpoint != "" {
		if response, err := s.searchPublicChatCompletion(ctx, settings, query); err == nil {
			return response, nil
		}
	}

	return s.searchChunks(ctx, settings.publicEndpoint, "", settings.origin, query)
}

func (s *AISearchService) searchWithChatCompletion(ctx context.Context, settings aiSearchSettings, query string) (*AISearchResponse, error) {
	var upstream aiSearchChatUpstreamResponse
	if err := s.postAISearch(ctx, settings.chatEndpoint, settings.token, "", aiSearchChatRequestBody(query), &upstream); err != nil {
		return nil, err
	}
	chunks := upstream.chunks()
	answer := compactAISearchSnippet(upstream.answer(), 1200)
	if shouldUseAISearchEvidenceAnswer(answer, chunks) {
		answer = answerFromAISearchEvidence(chunks)
	}

	return &AISearchResponse{
		Query:      firstNonBlank(upstream.searchQuery(), query),
		Configured: true,
		Answer:     answer,
		Results:    normalizeAISearchChunks(chunks),
	}, nil
}

func (s *AISearchService) searchPublicChatCompletion(ctx context.Context, settings aiSearchSettings, query string) (*AISearchResponse, error) {
	var upstream aiSearchChatUpstreamResponse
	if err := s.postAISearch(ctx, settings.publicChatEndpoint, "", settings.origin, aiSearchChatRequestBody(query), &upstream); err != nil {
		return nil, err
	}
	chunks := upstream.chunks()
	answer := compactAISearchSnippet(upstream.answer(), 1200)
	if shouldUseAISearchEvidenceAnswer(answer, chunks) {
		answer = answerFromAISearchEvidence(chunks)
	}

	return &AISearchResponse{
		Query:      firstNonBlank(upstream.searchQuery(), query),
		Configured: true,
		Answer:     answer,
		Results:    normalizeAISearchChunks(chunks),
	}, nil
}

func (s *AISearchService) searchChunks(ctx context.Context, endpoint, token, origin, query string) (*AISearchResponse, error) {
	var upstream aiSearchUpstreamResponse
	if err := s.postAISearch(ctx, endpoint, token, origin, aiSearchRequestBody(query), &upstream); err != nil {
		return nil, err
	}

	return &AISearchResponse{
		Query:      firstNonBlank(upstream.searchQuery(), query),
		Configured: true,
		Answer:     answerFromAISearchEvidence(upstream.chunks()),
		Results:    normalizeAISearchChunks(upstream.chunks()),
	}, nil
}

func (s *AISearchService) postAISearch(ctx context.Context, endpoint, token, origin string, body map[string]any, result any) error {
	request := s.client.R().
		SetContext(ctx).
		SetBody(body).
		SetSuccessResult(result)
	if token != "" {
		request.SetBearerAuthToken(token)
	} else if origin != "" {
		request.SetHeader("Origin", origin)
		request.SetHeader("Referer", origin+"/")
	}
	resp, err := request.Post(endpoint)
	if err != nil {
		return infraerrors.ServiceUnavailable("AI_SEARCH_UPSTREAM_ERROR", "failed to query AI Search")
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return infraerrors.ServiceUnavailable("AI_SEARCH_UPSTREAM_ERROR", "AI Search returned an error")
	}
	if success, ok := aiSearchSuccess(result); ok && !success {
		return infraerrors.ServiceUnavailable("AI_SEARCH_UPSTREAM_ERROR", "AI Search returned an error")
	}
	return nil
}

func aiSearchSuccess(result any) (bool, bool) {
	switch typed := result.(type) {
	case *aiSearchUpstreamResponse:
		if typed.Success == nil {
			return true, false
		}
		return *typed.Success, true
	case *aiSearchChatUpstreamResponse:
		if typed.Success == nil {
			return true, false
		}
		return *typed.Success, true
	default:
		return false, false
	}
}

type aiSearchSettings struct {
	chatEndpoint       string
	searchEndpoint     string
	publicEndpoint     string
	publicChatEndpoint string
	token              string
	origin             string
}

func (s *AISearchService) settings() aiSearchSettings {
	if s == nil || s.cfg == nil {
		return aiSearchSettings{}
	}

	cf := aiSearchConfigForService(s.cfg, s.configSvc)
	return aiSearchSettingsFromConfig(&cf)
}

func aiSearchSettingsFromConfig(cf *AISearchBackendConfig) aiSearchSettings {
	if cf == nil {
		return aiSearchSettings{}
	}
	token := strings.TrimSpace(cf.APIToken)
	accountID := strings.TrimSpace(cf.AccountID)
	publicEndpoint := strings.TrimSpace(cf.PublicEndpointURL)
	publicChatEndpoint := strings.TrimSpace(cf.PublicChatEndpointURL)
	origin := strings.TrimRight(strings.TrimSpace(cf.PublicOrigin), "/")
	instanceID := firstNonBlank(cf.InstanceID, defaultAISearchInstanceID)
	baseURL := firstNonBlank(strings.TrimRight(strings.TrimSpace(cf.APIBaseURL), "/"), defaultAISearchAPIBaseURL)
	if token != "" && accountID != "" {
		basePath := fmt.Sprintf("%s/accounts/%s/ai-search/instances/%s", baseURL, url.PathEscape(accountID), url.PathEscape(instanceID))
		return aiSearchSettings{
			chatEndpoint:       basePath + "/chat/completions",
			searchEndpoint:     basePath + "/search",
			publicEndpoint:     publicEndpoint,
			publicChatEndpoint: publicChatEndpoint,
			token:              token,
			origin:             origin,
		}
	}

	if publicEndpoint != "" {
		return aiSearchSettings{
			publicEndpoint:     publicEndpoint,
			publicChatEndpoint: publicChatEndpoint,
			origin:             origin,
		}
	}
	return aiSearchSettings{}
}

func aiSearchConfigForService(cfg *config.Config, configSvc *AISearchConfigService) AISearchBackendConfig {
	if configSvc != nil {
		return configSvc.ResolveConfig(context.Background())
	}
	return *NewAISearchConfigService(nil, cfg, nil).defaults()
}

func (s aiSearchSettings) configured() bool {
	return s.privateConfigured() || strings.TrimSpace(s.publicEndpoint) != ""
}

func (s aiSearchSettings) privateConfigured() bool {
	return strings.TrimSpace(s.token) != "" &&
		strings.TrimSpace(s.chatEndpoint) != "" &&
		strings.TrimSpace(s.searchEndpoint) != ""
}

func aiSearchRequestBody(query string) map[string]any {
	return map[string]any{
		"query":             query,
		"ai_search_options": aiSearchOptions(),
	}
}

func aiSearchChatRequestBody(query string) map[string]any {
	return map[string]any{
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "你是 Sub2API 网站内的 ask ai 助手。请优先依据检索到的知识块回答，直接给出结论；如果知识块里有明确时间、数字、范围或步骤，必须使用这些具体信息。不要编造知识块之外的事实；如果确实没有相关知识，再说明当前知识库没有收录。",
			},
			{
				"role":    "user",
				"content": query,
			},
		},
		"stream":            false,
		"ai_search_options": aiSearchOptions(),
	}
}

func aiSearchOptions() map[string]any {
	return map[string]any{
		"retrieval": map[string]any{
			"retrieval_type":     "hybrid",
			"max_num_results":    defaultAISearchMaxResults,
			"match_threshold":    defaultAISearchMatchThreshold,
			"keyword_match_mode": "or",
		},
	}
}

type aiSearchUpstreamResponse struct {
	Success     *bool                `json:"success"`
	SearchQuery string               `json:"search_query"`
	Chunks      []aiSearchChunk      `json:"chunks"`
	Result      aiSearchSearchResult `json:"result"`
}

type aiSearchChatUpstreamResponse struct {
	Success     *bool                `json:"success"`
	SearchQuery string               `json:"search_query"`
	Chunks      []aiSearchChunk      `json:"chunks"`
	Choices     []aiSearchChatChoice `json:"choices"`
	Result      aiSearchChatResult   `json:"result"`
}

type aiSearchSearchResult struct {
	SearchQuery string          `json:"search_query"`
	Chunks      []aiSearchChunk `json:"chunks"`
}

type aiSearchChatResult struct {
	SearchQuery string               `json:"search_query"`
	Chunks      []aiSearchChunk      `json:"chunks"`
	Choices     []aiSearchChatChoice `json:"choices"`
}

type aiSearchChatChoice struct {
	Message struct {
		Content string `json:"content"`
	} `json:"message"`
}

func (r aiSearchUpstreamResponse) searchQuery() string {
	return firstNonBlank(r.SearchQuery, r.Result.SearchQuery)
}

func (r aiSearchUpstreamResponse) chunks() []aiSearchChunk {
	if len(r.Chunks) > 0 {
		return r.Chunks
	}
	return r.Result.Chunks
}

func (r aiSearchChatUpstreamResponse) searchQuery() string {
	return firstNonBlank(r.SearchQuery, r.Result.SearchQuery)
}

func (r aiSearchChatUpstreamResponse) answer() string {
	choices := r.choices()
	if len(choices) == 0 {
		return ""
	}
	return strings.TrimSpace(choices[0].Message.Content)
}

func (r aiSearchChatUpstreamResponse) chunks() []aiSearchChunk {
	if len(r.Chunks) > 0 {
		return r.Chunks
	}
	return r.Result.Chunks
}

func (r aiSearchChatUpstreamResponse) choices() []aiSearchChatChoice {
	if len(r.Choices) > 0 {
		return r.Choices
	}
	return r.Result.Choices
}

type aiSearchChunk struct {
	ID    string  `json:"id"`
	Type  string  `json:"type"`
	Score float64 `json:"score"`
	Text  string  `json:"text"`
	Item  struct {
		Key      string         `json:"key"`
		Metadata map[string]any `json:"metadata"`
	} `json:"item"`
}

func normalizeAISearchChunks(chunks []aiSearchChunk) []AISearchResult {
	results := make([]AISearchResult, 0, len(chunks))
	for _, chunk := range chunks {
		source := strings.TrimSpace(chunk.Item.Key)
		results = append(results, AISearchResult{
			ID:      firstNonBlank(chunk.ID, source),
			Title:   aiSearchResultTitle(source, chunk.Item.Metadata),
			Snippet: compactAISearchSnippet(chunk.Text, 240),
			URL:     aiSearchMetadataString(chunk.Item.Metadata, "url", "route", "href", "path"),
			Source:  source,
			Score:   chunk.Score,
		})
	}
	return results
}

func shouldUseAISearchEvidenceAnswer(answer string, chunks []aiSearchChunk) bool {
	if len(chunks) == 0 {
		return false
	}
	answer = strings.TrimSpace(answer)
	if answer == "" {
		return true
	}
	lower := strings.ToLower(answer)
	denialMarkers := []string{
		"没有收录",
		"未收录",
		"没有找到",
		"未找到",
		"没有相关",
		"无法找到",
		"无法回答",
		"不清楚",
		"不知道",
		"not in the knowledge",
		"no relevant",
		"not found",
		"cannot answer",
		"can't answer",
		"do not know",
		"don't know",
	}
	for _, marker := range denialMarkers {
		if strings.Contains(lower, marker) {
			return true
		}
	}
	return false
}

func answerFromAISearchEvidence(chunks []aiSearchChunk) string {
	if len(chunks) == 0 {
		return ""
	}
	best := chunks[0]
	for _, chunk := range chunks[1:] {
		if chunk.Score > best.Score {
			best = chunk
		}
	}
	text := cleanAISearchEvidenceText(best.Text)
	if text == "" {
		return ""
	}
	return compactAISearchSnippet("根据知识库，"+text, 1200)
}

func cleanAISearchEvidenceText(text string) string {
	lines := strings.Split(strings.ReplaceAll(text, "\r\n", "\n"), "\n")
	cleaned := make([]string, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimLeft(line, "-*• ")
		line = strings.ReplaceAll(line, "`", "")
		line = strings.ReplaceAll(line, "**", "")
		line = strings.ReplaceAll(line, "__", "")
		if line != "" {
			cleaned = append(cleaned, line)
		}
	}
	if len(cleaned) == 0 {
		return compactAISearchSnippet(strings.ReplaceAll(strings.TrimSpace(text), "`", ""), 600)
	}
	return compactAISearchSnippet(strings.Join(cleaned, " "), 600)
}

func aiSearchResultTitle(source string, metadata map[string]any) string {
	if title := aiSearchMetadataString(metadata, "title", "name"); title != "" {
		return title
	}
	base := path.Base(strings.TrimSpace(source))
	base = strings.TrimSuffix(base, path.Ext(base))
	base = strings.ReplaceAll(base, "-", " ")
	base = strings.ReplaceAll(base, "_", " ")
	if base == "." || base == "/" || base == "" {
		return "AI Search"
	}
	return strings.TrimSpace(base)
}

func aiSearchMetadataString(metadata map[string]any, keys ...string) string {
	for _, key := range keys {
		value, ok := metadata[key]
		if !ok {
			continue
		}
		switch typed := value.(type) {
		case string:
			if trimmed := strings.TrimSpace(typed); trimmed != "" {
				return trimmed
			}
		case json.Number:
			if text := typed.String(); text != "" {
				return text
			}
		}
	}
	return ""
}

func compactAISearchSnippet(text string, limit int) string {
	fields := strings.Fields(strings.TrimSpace(text))
	compact := strings.Join(fields, " ")
	if limit <= 0 || utf8.RuneCountInString(compact) <= limit {
		return compact
	}
	runes := []rune(compact)
	return strings.TrimSpace(string(runes[:limit-1])) + "..."
}

func firstNonBlank(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}
