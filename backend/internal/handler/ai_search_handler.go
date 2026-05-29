package handler

import (
	"context"
	"strings"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
)

type aiSearchService interface {
	Search(ctx context.Context, query string) (*service.AISearchResponse, error)
}

type aiSearchConfigService interface {
	GetPublicSnippetConfig(ctx context.Context) (*service.AISearchSnippetConfig, error)
}

type AISearchHandler struct {
	service   aiSearchService
	configSvc aiSearchConfigService
}

func NewAISearchHandler(service aiSearchService, configSvc ...aiSearchConfigService) *AISearchHandler {
	h := &AISearchHandler{service: service}
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
	response.Success(c, cfg)
}
