//go:build unit

package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type fakeGlobalPricingService struct {
	items  []service.GlobalModelPricing
	status map[string]any
}

func (f *fakeGlobalPricingService) ListGlobalModelPricing() []service.GlobalModelPricing {
	return f.items
}

func (f *fakeGlobalPricingService) GetStatus() map[string]any {
	return f.status
}

func TestGlobalPricingHandlerUnauthenticated401(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &GlobalPricingHandler{}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/pricing/global", nil)

	h.List(c)

	require.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGlobalPricingHandlerList(t *testing.T) {
	gin.SetMode(gin.TestMode)
	lastUpdated := time.Unix(1700000000, 0).UTC()
	pricingService := &fakeGlobalPricingService{
		items: []service.GlobalModelPricing{
			{
				Model: "gpt-test",
				LiteLLMModelPricing: service.LiteLLMModelPricing{
					InputCostPerToken:              1e-6,
					OutputCostPerToken:             4e-6,
					CacheReadInputTokenCost:        1e-7,
					LiteLLMProvider:                "openai",
					Mode:                           "chat",
					SupportsPromptCaching:          true,
					SupportsServiceTier:            true,
					OutputCostPerImage:             0.04,
					LongContextInputTokenThreshold: 200000,
				},
			},
		},
		status: map[string]any{
			"model_count":  1,
			"last_updated": lastUpdated,
			"local_hash":   "abcdef12",
		},
	}
	h := NewGlobalPricingHandler(pricingService)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/pricing/global", nil)
	c.Set(string(middleware.ContextKeyUser), middleware.AuthSubject{UserID: 42})

	h.List(c)

	require.Equal(t, http.StatusOK, w.Code)

	var envelope struct {
		Code int `json:"code"`
		Data struct {
			Items       []globalPricingItem `json:"items"`
			ModelCount  int                 `json:"model_count"`
			LastUpdated time.Time           `json:"last_updated"`
			LocalHash   string              `json:"local_hash"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &envelope))
	require.Equal(t, 0, envelope.Code)
	require.Equal(t, 1, envelope.Data.ModelCount)
	require.Equal(t, "abcdef12", envelope.Data.LocalHash)
	require.Equal(t, lastUpdated, envelope.Data.LastUpdated)
	require.Len(t, envelope.Data.Items, 1)
	require.Equal(t, "gpt-test", envelope.Data.Items[0].Model)
	require.Equal(t, "openai", envelope.Data.Items[0].Provider)
	require.InDelta(t, 1e-6, envelope.Data.Items[0].InputPrice, 1e-12)
	require.InDelta(t, 4e-6, envelope.Data.Items[0].OutputPrice, 1e-12)
	require.InDelta(t, 1e-7, envelope.Data.Items[0].CacheReadPrice, 1e-12)
	require.True(t, envelope.Data.Items[0].SupportsPromptCaching)
	require.True(t, envelope.Data.Items[0].SupportsServiceTier)
	require.InDelta(t, 0.04, envelope.Data.Items[0].ImageOutputPrice, 1e-12)
	require.Equal(t, 200000, envelope.Data.Items[0].LongContextInputTokenThreshold)
}
