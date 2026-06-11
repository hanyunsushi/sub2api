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

type mimoTokenPlanEnvelope struct {
	Code    json.RawMessage `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
	Result  json.RawMessage `json:"result"`
}

func (s *ExternalSubscriptionService) getMimoTokenPlanStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, cfg)
	if err != nil {
		return nil, err
	}
	result := &ExternalSubscriptionStatus{
		Provider:      cfg.Provider,
		Enabled:       settings.Enabled,
		Configured:    strings.TrimSpace(settings.APIToken) != "" || strings.TrimSpace(settings.RefreshToken) != "",
		Currency:      "USD",
		SiteURL:       settings.APIBaseURL,
		Subscriptions: []ExternalSubscriptionItem{},
	}
	if !settings.Enabled || !result.Configured {
		return result, nil
	}

	paths := []string{
		"/api/v1/tokenPlan/usage",
		"/api/v1/tokenPlan/quota",
		"/api/v1/token-plan/quota",
		"/api/v1/token-plan/usage",
		"/api/tokenPlan/usage",
		"/api/tokenPlan/quota",
		"/api/token-plan/quota",
		"/api/token-plan/usage",
		"/console/api/tokenPlan/usage",
		"/console/api/tokenPlan/quota",
		"/console/api/token-plan/quota",
		"/console/api/token-plan/usage",
	}
	for _, path := range paths {
		var envelope mimoTokenPlanEnvelope
		if err := s.getMimoTokenPlanJSON(ctx, settings, cfg, path, &envelope); err != nil {
			continue
		}
		if status, ok := mimoTokenPlanStatusFromEnvelope(result, envelope); ok {
			status.RefreshedAt = time.Now().UTC()
			return status, nil
		}
	}
	result.ErrorCode = fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(cfg.Provider))
	result.ErrorMessage = fmt.Sprintf("%s token plan API did not return recognizable quota fields", cfg.DisplayName)
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func (s *ExternalSubscriptionService) getMimoTokenPlanJSON(ctx context.Context, settings ExternalSubscriptionSettings, cfg externalSubscriptionProviderConfig, path string, out any) error {
	req := s.client.R().
		SetContext(ctx).
		SetHeader("Accept", "application/json, text/plain, */*").
		SetHeader("Origin", settings.APIBaseURL).
		SetHeader("Referer", strings.TrimRight(settings.APIBaseURL, "/")+"/").
		SetHeader("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36").
		SetSuccessResult(out)
	if cookie := mimoTokenPlanCookieHeader(settings.APIToken); cookie != "" {
		req.SetHeader("Cookie", cookie)
	} else {
		req.SetBearerAuthToken(strings.TrimSpace(settings.APIToken))
	}
	if strings.TrimSpace(settings.RefreshToken) != "" {
		req.SetHeader("X-Refresh-Token", strings.TrimSpace(settings.RefreshToken))
	}
	resp, err := req.Get(settings.APIBaseURL + path)
	if err != nil {
		return infraerrors.ServiceUnavailable(fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(cfg.Provider)), fmt.Sprintf("failed to query %s token plan", cfg.DisplayName))
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return externalCreditErrorFromResponse(cfg, resp.StatusCode, resp.Bytes())
	}
	return nil
}

func mimoTokenPlanStatusFromEnvelope(result *ExternalSubscriptionStatus, envelope mimoTokenPlanEnvelope) (*ExternalSubscriptionStatus, bool) {
	payloads := make([]json.RawMessage, 0, 3)
	if len(envelope.Data) > 0 && string(envelope.Data) != "null" {
		payloads = append(payloads, envelope.Data)
	}
	if len(envelope.Result) > 0 && string(envelope.Result) != "null" {
		payloads = append(payloads, envelope.Result)
	}
	if len(payloads) == 0 {
		raw, _ := json.Marshal(envelope)
		payloads = append(payloads, raw)
	}
	for _, payload := range payloads {
		if status, ok := mimoTokenPlanStatusFromRaw(result, payload); ok {
			return status, true
		}
	}
	return result, false
}

func mimoTokenPlanStatusFromRaw(result *ExternalSubscriptionStatus, raw json.RawMessage) (*ExternalSubscriptionStatus, bool) {
	if len(raw) == 0 || string(raw) == "null" {
		return result, false
	}
	var object map[string]json.RawMessage
	if err := json.Unmarshal(raw, &object); err == nil {
		if status, ok := mimoTokenPlanStatusFromObject(result, object); ok {
			return status, true
		}
		for _, key := range []string{"quota", "usage", "plan", "subscription", "tokenPlan", "token_plan"} {
			if nested, ok := object[key]; ok {
				if status, nestedOK := mimoTokenPlanStatusFromRaw(result, nested); nestedOK {
					return status, true
				}
			}
		}
	}
	var array []json.RawMessage
	if err := json.Unmarshal(raw, &array); err == nil {
		for _, item := range array {
			if status, ok := mimoTokenPlanStatusFromRaw(result, item); ok {
				return status, true
			}
		}
	}
	return result, false
}

func mimoTokenPlanStatusFromObject(result *ExternalSubscriptionStatus, object map[string]json.RawMessage) (*ExternalSubscriptionStatus, bool) {
	total, hasTotal := firstRawChatNumber(
		object["total"],
		object["totalAmount"],
		object["total_amount"],
		object["totalQuota"],
		object["total_quota"],
		object["amountLimit"],
		object["amount_limit"],
		object["limit"],
		object["quota"],
	)
	used, hasUsed := firstRawChatNumber(
		object["used"],
		object["usedAmount"],
		object["used_amount"],
		object["usedQuota"],
		object["used_quota"],
		object["usage"],
		object["usageAmount"],
		object["usage_amount"],
		object["consumed"],
	)
	remaining, hasRemaining := firstRawChatNumber(
		object["remaining"],
		object["remainingAmount"],
		object["remaining_amount"],
		object["remainingQuota"],
		object["remaining_quota"],
		object["balance"],
		object["credit"],
		object["credits"],
	)
	if !hasUsed {
		if usage, ok := firstMimoTokenPlanUsagePercent(object["usage"]); ok && hasTotal {
			used = total * usage / 100
			hasUsed = true
		}
	}
	if !hasRemaining && hasTotal && hasUsed {
		remaining = total - used
		hasRemaining = true
	}
	if !hasUsed && hasTotal && hasRemaining {
		used = total - remaining
		hasUsed = true
	}
	if !hasRemaining && !hasUsed {
		return result, false
	}
	if hasTotal {
		totalCopy := total
		result.TotalLimitUSD = &totalCopy
	}
	if hasRemaining {
		remainingCopy := remaining
		result.RemainingUSD = &remainingCopy
	}
	if hasUsed {
		result.UsedUSD = used
	}
	if expiresAt := firstMimoTokenPlanTime(object["expireTime"], object["expire_time"], object["expiresAt"], object["expires_at"], object["endTime"], object["end_time"]); expiresAt != nil {
		result.ExpiresAt = expiresAt
		result.DaysRemaining = daysRemainingFromNow(expiresAt)
	}
	item := ExternalSubscriptionItem{
		ID:            1,
		GroupID:       0,
		GroupName:     "Xiaomi MiMo",
		Status:        "active",
		Window:        "subscription",
		UsedUSD:       result.UsedUSD,
		LimitUSD:      cloneFloat64Pointer(result.TotalLimitUSD),
		RemainingUSD:  cloneFloat64Pointer(result.RemainingUSD),
		ExpiresAt:     cloneTimePointer(result.ExpiresAt),
		DaysRemaining: cloneIntPointer(result.DaysRemaining),
	}
	result.ActiveCount = 1
	result.Subscriptions = []ExternalSubscriptionItem{item}
	return result, true
}

func firstMimoTokenPlanUsagePercent(raw json.RawMessage) (float64, bool) {
	if len(raw) == 0 || string(raw) == "null" {
		return 0, false
	}
	if value, ok := firstRawChatNumber(raw); ok {
		return value, true
	}
	var object map[string]json.RawMessage
	if err := json.Unmarshal(raw, &object); err != nil {
		return 0, false
	}
	return firstRawChatNumber(object["percent"], object["percentage"], object["usagePercent"], object["usage_percent"])
}

func firstMimoTokenPlanTime(values ...json.RawMessage) *time.Time {
	for _, raw := range values {
		parsed := parseMimoTokenPlanTime(raw)
		if parsed != nil {
			return parsed
		}
	}
	return nil
}

func mimoTokenPlanCookieHeader(token string) string {
	trimmed := strings.TrimSpace(token)
	if trimmed == "" {
		return ""
	}
	if strings.HasPrefix(strings.ToLower(trimmed), "cookie:") {
		return strings.TrimSpace(trimmed[len("cookie:"):])
	}
	if strings.Contains(trimmed, "=") {
		return trimmed
	}
	return ""
}

func parseMimoTokenPlanTime(raw json.RawMessage) *time.Time {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return nil
	}
	var rawString string
	if err := json.Unmarshal(raw, &rawString); err == nil {
		text = strings.TrimSpace(rawString)
	}
	text = strings.Trim(text, `"`)
	if text == "" {
		return nil
	}
	if numeric, ok := firstRawChatNumber(raw); ok && numeric > 0 {
		if numeric > 1_000_000_000_000 {
			parsed := time.UnixMilli(int64(numeric)).UTC()
			return &parsed
		}
		if numeric > 1_000_000_000 {
			parsed := time.Unix(int64(numeric), 0).UTC()
			return &parsed
		}
	}
	for _, layout := range []string{
		time.RFC3339,
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006/01/02 15:04:05",
		"2006/01/02 15:04",
		"2006-01-02",
		"2006/01/02",
	} {
		if parsed, err := time.Parse(layout, text); err == nil {
			parsed = parsed.UTC()
			return &parsed
		}
	}
	return nil
}
