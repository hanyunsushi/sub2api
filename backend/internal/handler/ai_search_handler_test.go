package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type aiSearchHandlerServiceStub struct {
	query string
}

func (s *aiSearchHandlerServiceStub) Search(_ context.Context, query string) (*service.AISearchResponse, error) {
	s.query = query
	return &service.AISearchResponse{
		Query:      query,
		Configured: true,
		Answer:     "AI Search 会先生成回答，再附带来源。",
		Results: []service.AISearchResult{{
			ID:      "chunk-1",
			Title:   "AI Search",
			Snippet: "搜索结果",
			Source:  "docs/ai-search.md",
			Score:   0.8,
		}},
	}, nil
}

func TestAISearchHandler_SearchTrimsAndReturnsResults(t *testing.T) {
	gin.SetMode(gin.TestMode)
	stub := &aiSearchHandlerServiceStub{}
	h := NewAISearchHandler(stub)

	body := bytes.NewBufferString(`{"query":"  AI Search  "}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ai-search/search", body)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req

	h.Search(c)

	require.Equal(t, http.StatusOK, rec.Code)
	require.Equal(t, "AI Search", stub.query)

	var envelope struct {
		Code int                      `json:"code"`
		Data service.AISearchResponse `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &envelope))
	require.Equal(t, 0, envelope.Code)
	require.Equal(t, "AI Search", envelope.Data.Query)
	require.Equal(t, "AI Search 会先生成回答，再附带来源。", envelope.Data.Answer)
	require.Len(t, envelope.Data.Results, 1)
	require.Equal(t, "AI Search", envelope.Data.Results[0].Title)
}

func TestAISearchHandler_SearchRejectsBlankQuery(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewAISearchHandler(&aiSearchHandlerServiceStub{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/ai-search/search", bytes.NewBufferString(`{"query":"   "}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req

	h.Search(c)

	require.Equal(t, http.StatusBadRequest, rec.Code)
	require.Contains(t, rec.Body.String(), "AI_SEARCH_QUERY_REQUIRED")
}
