package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

func (s *ExternalSubscriptionService) getOpenRouterCreditsStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, cfg)
	if err != nil {
		return nil, err
	}
	result := externalCreditStatusBase(settings, cfg, settings.APIToken != "")
	if !settings.Enabled || settings.APIToken == "" {
		return result, nil
	}

	var response struct {
		Data struct {
			TotalCredits float64 `json:"total_credits"`
			TotalUsage   float64 `json:"total_usage"`
		} `json:"data"`
	}
	if err := s.getOpenRouterCreditsJSON(ctx, settings, cfg, &response); err != nil {
		return statusWithExternalCreditError(result, err, cfg)
	}

	total := response.Data.TotalCredits
	remaining := response.Data.TotalCredits - response.Data.TotalUsage
	result.TotalLimitUSD = &total
	result.UsedUSD = response.Data.TotalUsage
	result.RemainingUSD = &remaining
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func (s *ExternalSubscriptionService) getCloudflareAIGatewayCreditsStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, cfg)
	if err != nil {
		return nil, err
	}
	accountID := strings.TrimSpace(settings.UserID)
	result := externalCreditStatusBase(settings, cfg, settings.APIToken != "" && accountID != "")
	if !settings.Enabled || settings.APIToken == "" || accountID == "" {
		return result, nil
	}

	var response struct {
		Success bool            `json:"success"`
		Result  json.RawMessage `json:"result"`
		Errors  []struct {
			Code    json.RawMessage `json:"code"`
			Message string          `json:"message"`
		} `json:"errors"`
	}
	path := fmt.Sprintf("/accounts/%s/ai-gateway/billing/credit-balance", accountID)
	if err := s.getCloudflareCreditsJSON(ctx, settings, cfg, path, &response); err != nil {
		return statusWithExternalCreditError(result, err, cfg)
	}
	if !response.Success {
		return statusWithExternalCreditError(result, cloudflareCreditResponseError(cfg, http.StatusOK, response.Errors), cfg)
	}
	balance, err := parseCloudflareCreditBalance(response.Result)
	if err != nil {
		return nil, err
	}
	result.RemainingUSD = &balance
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func externalCreditStatusBase(settings ExternalSubscriptionSettings, cfg externalSubscriptionProviderConfig, configured bool) *ExternalSubscriptionStatus {
	return &ExternalSubscriptionStatus{
		Provider:      cfg.Provider,
		Enabled:       settings.Enabled,
		Configured:    configured,
		Currency:      "USD",
		SiteURL:       settings.APIBaseURL,
		Subscriptions: []ExternalSubscriptionItem{},
	}
}

func (s *ExternalSubscriptionService) getOpenRouterCreditsJSON(ctx context.Context, settings ExternalSubscriptionSettings, cfg externalSubscriptionProviderConfig, out any) error {
	resp, err := s.client.R().
		SetContext(ctx).
		SetBearerAuthToken(settings.APIToken).
		SetSuccessResult(out).
		Get(settings.APIBaseURL + "/api/v1/credits")
	if err != nil {
		return infraerrors.ServiceUnavailable(externalCreditErrorCode(cfg), fmt.Sprintf("failed to query %s credits", cfg.DisplayName))
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return externalCreditErrorFromResponse(cfg, resp.StatusCode, resp.Bytes())
	}
	return nil
}

func (s *ExternalSubscriptionService) getCloudflareCreditsJSON(ctx context.Context, settings ExternalSubscriptionSettings, cfg externalSubscriptionProviderConfig, path string, out any) error {
	resp, err := s.client.R().
		SetContext(ctx).
		SetBearerAuthToken(settings.APIToken).
		SetSuccessResult(out).
		Get(settings.APIBaseURL + path)
	if err != nil {
		return infraerrors.ServiceUnavailable(externalCreditErrorCode(cfg), fmt.Sprintf("failed to query %s credits", cfg.DisplayName))
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return externalCreditErrorFromResponse(cfg, resp.StatusCode, resp.Bytes())
	}
	return nil
}

func statusWithExternalCreditError(result *ExternalSubscriptionStatus, err error, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	if upstreamErr, ok := err.(*externalSubscriptionUpstreamError); ok {
		result.ErrorCode = upstreamErr.Code
		if result.ErrorCode == "" {
			result.ErrorCode = externalCreditErrorCode(cfg)
		}
		result.ErrorMessage = upstreamErr.Message
		if strings.TrimSpace(result.ErrorMessage) == "" {
			result.ErrorMessage = fmt.Sprintf("%s credits API returned an error", cfg.DisplayName)
		}
		result.RefreshedAt = time.Now().UTC()
		return result, nil
	}
	return nil, err
}

func externalCreditErrorFromResponse(cfg externalSubscriptionProviderConfig, statusCode int, body []byte) error {
	code := ""
	if statusCode == http.StatusUnauthorized {
		code = "401"
	}
	message := ""
	var raw struct {
		Code    json.RawMessage `json:"code"`
		Message string          `json:"message"`
		Error   string          `json:"error"`
		Errors  []struct {
			Code    json.RawMessage `json:"code"`
			Message string          `json:"message"`
		} `json:"errors"`
	}
	if err := json.Unmarshal(body, &raw); err == nil {
		code = firstNonEmptyCreditText(code, externalSubscriptionErrorCode(raw.Code))
		message = firstNonEmptyCreditText(strings.TrimSpace(raw.Message), strings.TrimSpace(raw.Error))
		if message == "" && len(raw.Errors) > 0 {
			code = firstNonEmptyCreditText(code, externalSubscriptionErrorCode(raw.Errors[0].Code))
			message = strings.TrimSpace(raw.Errors[0].Message)
		}
	}
	if code == "" {
		code = externalCreditErrorCode(cfg)
	}
	if message == "" {
		message = fmt.Sprintf("%s credits API returned an error", cfg.DisplayName)
	}
	return &externalSubscriptionUpstreamError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
		Provider:   cfg.Provider,
		Display:    cfg.DisplayName,
	}
}

func cloudflareCreditResponseError(cfg externalSubscriptionProviderConfig, statusCode int, errors []struct {
	Code    json.RawMessage `json:"code"`
	Message string          `json:"message"`
}) error {
	code := externalCreditErrorCode(cfg)
	message := fmt.Sprintf("%s credits API returned an error", cfg.DisplayName)
	if len(errors) > 0 {
		code = firstNonEmptyCreditText(externalSubscriptionErrorCode(errors[0].Code), code)
		message = firstNonEmptyCreditText(strings.TrimSpace(errors[0].Message), message)
	}
	return &externalSubscriptionUpstreamError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
		Provider:   cfg.Provider,
		Display:    cfg.DisplayName,
	}
}

func parseCloudflareCreditBalance(raw json.RawMessage) (float64, error) {
	var object struct {
		Balance float64 `json:"balance"`
	}
	if err := json.Unmarshal(raw, &object); err == nil {
		return object.Balance, nil
	}
	var number float64
	if err := json.Unmarshal(raw, &number); err == nil {
		return number, nil
	}
	return 0, infraerrors.ServiceUnavailable("CLOUDFLARE_SUBSCRIPTION_UPSTREAM_ERROR", "failed to parse Cloudflare AI Gateway credit balance")
}

func externalCreditErrorCode(cfg externalSubscriptionProviderConfig) string {
	return fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(cfg.Provider))
}

func firstNonEmptyCreditText(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
