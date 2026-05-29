package handler

import (
	"bufio"
	"context"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	servermiddleware "github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type aiSearchService interface {
	Search(ctx context.Context, query string) (*service.AISearchResponse, error)
}

type aiSearchConfigService interface {
	GetPublicSnippetConfig(ctx context.Context) (*service.AISearchSnippetConfig, error)
	GetPublicProxyConfig(ctx context.Context) (*service.AISearchPublicProxyConfig, error)
}

type AISearchHandler struct {
	service   aiSearchService
	configSvc aiSearchConfigService
	client    *http.Client
}

func NewAISearchHandler(service aiSearchService, configSvc ...aiSearchConfigService) *AISearchHandler {
	h := &AISearchHandler{
		service: service,
		client:  &http.Client{Timeout: 2 * time.Minute},
	}
	if len(configSvc) > 0 {
		h.configSvc = configSvc[0]
	}
	return h
}

type aiSearchRequest struct {
	Query string `json:"query"`
}

func (h *AISearchHandler) Search(c *gin.Context) {
	var req aiSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ErrorFrom(c, infraerrors.BadRequest("AI_SEARCH_INVALID_REQUEST", "invalid AI Search request"))
		return
	}
	query := strings.TrimSpace(req.Query)
	switch {
	case query == "":
		response.ErrorFrom(c, infraerrors.BadRequest("AI_SEARCH_QUERY_REQUIRED", "AI Search query is required"))
		return
	case len([]rune(query)) > 300:
		response.ErrorFrom(c, infraerrors.BadRequest("AI_SEARCH_QUERY_TOO_LONG", "AI Search query is too long"))
		return
	}

	result, err := h.service.Search(c.Request.Context(), query)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	response.Success(c, result)
}

func (h *AISearchHandler) SnippetConfig(c *gin.Context) {
	if h.configSvc == nil {
		response.Success(c, &service.AISearchSnippetConfig{Configured: false})
		return
	}
	cfg, err := h.configSvc.GetPublicSnippetConfig(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	setAISearchPublicProxyAccessTokenCookie(c)
	response.Success(c, cfg)
}

func (h *AISearchHandler) PublicProxy(c *gin.Context) {
	if h.configSvc == nil {
		response.ErrorFrom(c, infraerrors.ServiceUnavailable("AI_SEARCH_NOT_CONFIGURED", "AI Search is not configured"))
		return
	}
	cfg, err := h.configSvc.GetPublicProxyConfig(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}
	if cfg == nil || !cfg.Configured || strings.TrimSpace(cfg.BaseURL) == "" {
		response.ErrorFrom(c, infraerrors.ServiceUnavailable("AI_SEARCH_NOT_CONFIGURED", "AI Search is not configured"))
		return
	}

	upstreamURL, err := aiSearchPublicProxyURL(cfg.BaseURL, c.Param("path"))
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	req, err := http.NewRequestWithContext(c.Request.Context(), c.Request.Method, upstreamURL, c.Request.Body)
	if err != nil {
		response.ErrorFrom(c, infraerrors.ServiceUnavailable("AI_SEARCH_UPSTREAM_ERROR", "failed to query AI Search"))
		return
	}
	copyAISearchPublicProxyHeaders(req.Header, c.Request.Header, strings.TrimRight(strings.TrimSpace(cfg.Origin), "/"))

	client := h.client
	if client == nil {
		client = http.DefaultClient
	}
	resp, err := client.Do(req)
	if err != nil {
		response.ErrorFrom(c, infraerrors.ServiceUnavailable("AI_SEARCH_UPSTREAM_ERROR", "failed to query AI Search"))
		return
	}
	defer func() { _ = resp.Body.Close() }()

	writeAISearchPublicProxyResponse(c, resp)
}

func aiSearchPublicProxyURL(baseURL, suffix string) (string, error) {
	cleanSuffix := strings.Trim(strings.TrimSpace(suffix), "/")
	switch cleanSuffix {
	case "chat/completions", "search", "stats":
	default:
		return "", infraerrors.NotFound("AI_SEARCH_PUBLIC_PROXY_PATH_NOT_FOUND", "AI Search public proxy path not found")
	}

	base, err := url.Parse(strings.TrimRight(strings.TrimSpace(baseURL), "/"))
	if err != nil || base.Scheme == "" || base.Host == "" {
		return "", infraerrors.ServiceUnavailable("AI_SEARCH_PUBLIC_PROXY_INVALID", "AI Search public endpoint is invalid")
	}
	base.Path = strings.TrimRight(base.Path, "/") + "/" + cleanSuffix
	base.RawPath = ""
	base.RawQuery = ""
	base.Fragment = ""
	return base.String(), nil
}

func copyAISearchPublicProxyHeaders(dst, src http.Header, origin string) {
	for _, name := range []string{"Accept", "Content-Type", "cf-ai-search-source"} {
		if value := src.Get(name); value != "" {
			dst.Set(name, value)
		}
	}
	if origin != "" {
		dst.Set("Origin", origin)
		dst.Set("Referer", origin+"/")
	}
}

func writeAISearchPublicProxyResponse(c *gin.Context, resp *http.Response) {
	for _, name := range []string{"Content-Type", "Cache-Control"} {
		if value := resp.Header.Get(name); value != "" {
			c.Writer.Header().Set(name, value)
		}
	}
	c.Status(resp.StatusCode)
	if strings.Contains(resp.Header.Get("Content-Type"), "text/event-stream") {
		copyAndFlushAISearchPublicProxyStream(c.Writer, resp.Body)
		return
	}
	_, _ = io.Copy(c.Writer, resp.Body)
	if flusher, ok := c.Writer.(http.Flusher); ok {
		flusher.Flush()
	}
}

func copyAndFlushAISearchPublicProxyStream(w gin.ResponseWriter, body io.Reader) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		_, _ = io.Copy(w, body)
		return
	}
	reader := bufio.NewReader(body)
	buffer := make([]byte, 16*1024)
	for {
		n, err := reader.Read(buffer)
		if n > 0 {
			if _, writeErr := w.Write(buffer[:n]); writeErr != nil {
				return
			}
			flusher.Flush()
		}
		if err != nil {
			return
		}
	}
}

func setAISearchPublicProxyAccessTokenCookie(c *gin.Context) {
	const bearerPrefix = "Bearer "

	authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
	if !strings.HasPrefix(strings.ToLower(authHeader), strings.ToLower(bearerPrefix)) {
		return
	}
	token := strings.TrimSpace(authHeader[len(bearerPrefix):])
	if token == "" || strings.ContainsAny(token, " \t\r\n") {
		return
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     servermiddleware.AISearchPublicProxyAccessTokenCookieName,
		Value:    token,
		Path:     servermiddleware.AISearchPublicProxyAccessTokenCookiePath,
		MaxAge:   servermiddleware.AISearchPublicProxyAccessTokenCookieMaxAgeSec,
		HttpOnly: true,
		Secure:   isAISearchRequestHTTPS(c),
		SameSite: http.SameSiteLaxMode,
	})
}

func isAISearchRequestHTTPS(c *gin.Context) bool {
	if c.Request.TLS != nil {
		return true
	}
	return strings.EqualFold(strings.TrimSpace(c.GetHeader("X-Forwarded-Proto")), "https")
}
