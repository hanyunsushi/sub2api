//go:build unit

package service

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestPricingServiceListGlobalModelPricingSortedSnapshot(t *testing.T) {
	s := &PricingService{
		pricingData: map[string]*LiteLLMModelPricing{
			"z-model": {
				InputCostPerToken:               2e-6,
				OutputCostPerToken:              8e-6,
				CacheReadInputTokenCost:         2e-7,
				LiteLLMProvider:                 "openai",
				Mode:                            "chat",
				SupportsPromptCaching:           true,
				LongContextInputTokenThreshold:  200000,
				LongContextInputCostMultiplier:  2,
				LongContextOutputCostMultiplier: 1.5,
			},
			"a-model": {
				InputCostPerToken:           1e-6,
				OutputCostPerToken:          4e-6,
				CacheCreationInputTokenCost: 1.25e-6,
				LiteLLMProvider:             "anthropic",
				Mode:                        "chat",
			},
		},
		lastUpdated: time.Unix(1700000000, 0).UTC(),
		localHash:   "abcdef1234567890",
	}

	items := s.ListGlobalModelPricing()

	require.Len(t, items, 2)
	require.Equal(t, "a-model", items[0].Model)
	require.Equal(t, "z-model", items[1].Model)
	require.Equal(t, "anthropic", items[0].LiteLLMProvider)
	require.InDelta(t, 1e-6, items[0].InputCostPerToken, 1e-12)
	require.InDelta(t, 1.25e-6, items[0].CacheCreationInputTokenCost, 1e-12)
	require.True(t, items[1].SupportsPromptCaching)
	require.Equal(t, 200000, items[1].LongContextInputTokenThreshold)
}

func TestParsePricingDataPreservesGlobalPricingFields(t *testing.T) {
	body := []byte(`{
		"gpt-test": {
			"input_cost_per_token": 0.000001,
			"input_cost_per_token_priority": 0.0000015,
			"output_cost_per_token": 0.000004,
			"output_cost_per_token_priority": 0.000005,
			"cache_creation_input_token_cost": 0.00000125,
			"cache_creation_input_token_cost_above_1hr": 0.0000015,
			"cache_read_input_token_cost": 0.0000001,
			"cache_read_input_token_cost_priority": 0.0000002,
			"long_context_input_token_threshold": 200000,
			"long_context_input_cost_multiplier": 2,
			"long_context_output_cost_multiplier": 1.5,
			"supports_service_tier": true,
			"supports_prompt_caching": true,
			"litellm_provider": "openai",
			"mode": "chat",
			"output_cost_per_image": 0.04,
			"output_cost_per_image_token": 0.0000003
		}
	}`)
	s := &PricingService{}

	data, err := s.parsePricingData(body)

	require.NoError(t, err)
	pricing := data["gpt-test"]
	require.NotNil(t, pricing)
	require.InDelta(t, 0.0000015, pricing.InputCostPerTokenPriority, 1e-12)
	require.InDelta(t, 0.000005, pricing.OutputCostPerTokenPriority, 1e-12)
	require.InDelta(t, 0.0000015, pricing.CacheCreationInputTokenCostAbove1hr, 1e-12)
	require.InDelta(t, 0.0000002, pricing.CacheReadInputTokenCostPriority, 1e-12)
	require.Equal(t, 200000, pricing.LongContextInputTokenThreshold)
	require.InDelta(t, 2.0, pricing.LongContextInputCostMultiplier, 1e-12)
	require.InDelta(t, 1.5, pricing.LongContextOutputCostMultiplier, 1e-12)
	require.True(t, pricing.SupportsServiceTier)
	require.True(t, pricing.SupportsPromptCaching)
	require.InDelta(t, 0.04, pricing.OutputCostPerImage, 1e-12)
	require.InDelta(t, 0.0000003, pricing.OutputCostPerImageToken, 1e-12)
}

func TestParsePricingDataKeepsImageOnlyPricing(t *testing.T) {
	body := []byte(`{
		"image-only": {
			"output_cost_per_image": 0.02,
			"litellm_provider": "openai",
			"mode": "image_generation"
		}
	}`)
	s := &PricingService{}

	data, err := s.parsePricingData(body)

	require.NoError(t, err)
	pricing := data["image-only"]
	require.NotNil(t, pricing)
	require.InDelta(t, 0.02, pricing.OutputCostPerImage, 1e-12)
	require.Equal(t, "image_generation", pricing.Mode)
}
