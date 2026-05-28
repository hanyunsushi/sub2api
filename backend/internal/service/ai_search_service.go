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
	cfg    *config.Config
	client *req.Client
}

func NewAISearchService(cfg *config.Config) *AISearchService {
	return &AISearchService{
		cfg: cfg,
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

	settings := s.settings()
	if !settings.configured() {
		return nil, infraerrors.ServiceUnavailable("AI_SEARCH_NOT_CONFIGURED", "AI Search is not configured")
	}

	var upstream aiSearchUpstreamResponse
	request := s.client.R().
		SetContext(ctx).
		SetBody(aiSearchRequestBody(query)).
		SetSuccessResult(&upstream)
	if settings.token != "" {
		request.SetBearerAuthToken(settings.token)
	} else if settings.origin != "" {
		request.SetHeader("Origin", settings.origin)
		request.SetHeader("Referer", settings.origin+"/")
	}
	resp, err := request.Post(settings.endpoint)
	if err != nil {
		return nil, infraerrors.ServiceUnavailable("AI_SEARCH_UPSTREAM_ERROR", "failed to query AI Search")
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, infraerrors.ServiceUnavailable("AI_SEARCH_UPSTREAM_ERROR", "AI Search returned an error")
	}
	if !upstream.Success {
		return nil, infraerrors.ServiceUnavailable("AI_SEARCH_UPSTREAM_ERROR", "AI Search returned an error")
	}

	return &AISearchResponse{
		Query:      firstNonBlank(upstream.Result.SearchQuery, query),
		Configured: true,
		Results:    normalizeAISearchChunks(upstream.Result.Chunks),
	}, nil
}

type aiSearchSettings struct {
	endpoint string
	token    string
	origin   string
}

func (s *AISearchService) settings() aiSearchSettings {
	if s == nil || s.cfg == nil {
		return aiSearchSettings{}
	}

	cf := s.cfg.CloudflareAI
	token := strings.TrimSpace(cf.AISearchAPIToken)
	accountID := strings.TrimSpace(cf.AccountID)
	instanceID := strings.TrimSpace(cf.AISearchInstanceID)
	if instanceID == "" {
		instanceID = defaultAISearchInstanceID
	}
	baseURL := strings.TrimRight(strings.TrimSpace(cf.AISearchAPIBaseURL), "/")
	if baseURL == "" {
		baseURL = defaultAISearchAPIBaseURL
	}
	if token != "" && accountID != "" {
		return aiSearchSettings{
			endpoint: fmt.Sprintf("%s/accounts/%s/ai-search/instances/%s/search", baseURL, url.PathEscape(accountID), url.PathEscape(instanceID)),
			token:    token,
		}
	}

	publicEndpoint := strings.TrimSpace(cf.AISearchPublicEndpointURL)
	if publicEndpoint != "" {
		return aiSearchSettings{
			endpoint: publicEndpoint,
			origin:   strings.TrimRight(strings.TrimSpace(cf.AISearchPublicOrigin), "/"),
		}
	}
	return aiSearchSettings{}
}

func (s aiSearchSettings) configured() bool {
	return strings.TrimSpace(s.endpoint) != ""
}

func aiSearchRequestBody(query string) map[string]any {
	return map[string]any{
		"query": query,
		"ai_search_options": map[string]any{
			"retrieval": map[string]any{
				"retrieval_type":     "hybrid",
				"max_num_results":    defaultAISearchMaxResults,
				"match_threshold":    defaultAISearchMatchThreshold,
				"keyword_match_mode": "or",
			},
		},
	}
}

type aiSearchUpstreamResponse struct {
	Success bool `json:"success"`
	Result  struct {
		SearchQuery string          `json:"search_query"`
		Chunks      []aiSearchChunk `json:"chunks"`
	} `json:"result"`
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
