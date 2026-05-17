package handler

import (
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	"github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"

	"github.com/gin-gonic/gin"
)

type globalPricingService interface {
	ListGlobalModelPricing() []service.GlobalModelPricing
	GetStatus() map[string]any
}

// GlobalPricingHandler exposes the runtime global model pricing table to logged-in users.
type GlobalPricingHandler struct {
	pricingService globalPricingService
}

func NewGlobalPricingHandler(pricingService globalPricingService) *GlobalPricingHandler {
	return &GlobalPricingHandler{pricingService: pricingService}
}

type globalPricingResponse struct {
	Items       []globalPricingItem `json:"items"`
	ModelCount  int                 `json:"model_count"`
	LastUpdated time.Time           `json:"last_updated"`
	LocalHash   string              `json:"local_hash"`
}

type globalPricingItem struct {
	Model                           string  `json:"model"`
	Provider                        string  `json:"provider"`
	Mode                            string  `json:"mode"`
	InputPrice                      float64 `json:"input_price"`
	InputPriorityPrice              float64 `json:"input_priority_price"`
	OutputPrice                     float64 `json:"output_price"`
	OutputPriorityPrice             float64 `json:"output_priority_price"`
	CacheWritePrice                 float64 `json:"cache_write_price"`
	CacheWrite1hPrice               float64 `json:"cache_write_1h_price"`
	CacheReadPrice                  float64 `json:"cache_read_price"`
	CacheReadPriorityPrice          float64 `json:"cache_read_priority_price"`
	ImageOutputPrice                float64 `json:"image_output_price"`
	ImageOutputTokenPrice           float64 `json:"image_output_token_price"`
	SupportsPromptCaching           bool    `json:"supports_prompt_caching"`
	SupportsServiceTier             bool    `json:"supports_service_tier"`
	LongContextInputTokenThreshold  int     `json:"long_context_input_token_threshold"`
	LongContextInputCostMultiplier  float64 `json:"long_context_input_cost_multiplier"`
	LongContextOutputCostMultiplier float64 `json:"long_context_output_cost_multiplier"`
}

// List returns all global pricing rows. Authentication is required, admin role is not.
// GET /api/v1/pricing/global
func (h *GlobalPricingHandler) List(c *gin.Context) {
	if _, ok := middleware.GetAuthSubjectFromContext(c); !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	if h == nil || h.pricingService == nil {
		response.Success(c, globalPricingResponse{Items: []globalPricingItem{}})
		return
	}

	models := h.pricingService.ListGlobalModelPricing()
	items := make([]globalPricingItem, 0, len(models))
	for _, model := range models {
		items = append(items, toGlobalPricingItem(model))
	}

	status := h.pricingService.GetStatus()
	modelCount := len(items)
	if value, ok := status["model_count"].(int); ok {
		modelCount = value
	}
	lastUpdated, _ := status["last_updated"].(time.Time)
	localHash, _ := status["local_hash"].(string)

	response.Success(c, globalPricingResponse{
		Items:       items,
		ModelCount:  modelCount,
		LastUpdated: lastUpdated,
		LocalHash:   localHash,
	})
}

func toGlobalPricingItem(row service.GlobalModelPricing) globalPricingItem {
	return globalPricingItem{
		Model:                           row.Model,
		Provider:                        row.LiteLLMProvider,
		Mode:                            row.Mode,
		InputPrice:                      row.InputCostPerToken,
		InputPriorityPrice:              row.InputCostPerTokenPriority,
		OutputPrice:                     row.OutputCostPerToken,
		OutputPriorityPrice:             row.OutputCostPerTokenPriority,
		CacheWritePrice:                 row.CacheCreationInputTokenCost,
		CacheWrite1hPrice:               row.CacheCreationInputTokenCostAbove1hr,
		CacheReadPrice:                  row.CacheReadInputTokenCost,
		CacheReadPriorityPrice:          row.CacheReadInputTokenCostPriority,
		ImageOutputPrice:                row.OutputCostPerImage,
		ImageOutputTokenPrice:           row.OutputCostPerImageToken,
		SupportsPromptCaching:           row.SupportsPromptCaching,
		SupportsServiceTier:             row.SupportsServiceTier,
		LongContextInputTokenThreshold:  row.LongContextInputTokenThreshold,
		LongContextInputCostMultiplier:  row.LongContextInputCostMultiplier,
		LongContextOutputCostMultiplier: row.LongContextOutputCostMultiplier,
	}
}
