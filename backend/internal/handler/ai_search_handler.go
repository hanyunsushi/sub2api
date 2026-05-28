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

type AISearchHandler struct {
	service aiSearchService
}

func NewAISearchHandler(service aiSearchService) *AISearchHandler {
	return &AISearchHandler{service: service}
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
