package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

type rawChatSubscriptionsResponse struct {
	Code    json.RawMessage `json:"code"`
	Message string          `json:"message"`
	Data    struct {
		List []rawChatSubscription `json:"list"`
	} `json:"data"`
	List []rawChatSubscription `json:"list"`
}

type rawChatSubscription struct {
	ID          json.RawMessage `json:"id"`
	PackageID   json.RawMessage `json:"packageId"`
	PackageName string          `json:"packageName"`
	Name        string          `json:"name"`
	Status      json.RawMessage `json:"status"`
	BillingType string          `json:"billingType"`
	Limit       json.RawMessage `json:"limit"`
	Used        json.RawMessage `json:"used"`
	UsedAmount  json.RawMessage `json:"usedAmount"`
	ExpireTime  json.RawMessage `json:"expireTime"`
	ExpiresAt   json.RawMessage `json:"expiresAt"`
}

func (s *ExternalSubscriptionService) getRawChatSubscriptionStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, cfg)
	if err != nil {
		return nil, err
	}
	result := &ExternalSubscriptionStatus{
		Provider:      cfg.Provider,
		Enabled:       settings.Enabled,
		Configured:    settings.APIToken != "",
		Currency:      "USD",
		SiteURL:       settings.APIBaseURL,
		Subscriptions: []ExternalSubscriptionItem{},
	}
	if !settings.Enabled || settings.APIToken == "" {
		return result, nil
	}

	var response rawChatSubscriptionsResponse
	if err := s.getRawChatSubscriptionsJSON(ctx, settings, cfg, &response); err != nil {
		return statusWithRawChatSubscriptionError(result, err, cfg)
	}
	if !isRawChatSubscriptionSuccessCode(response.Code) {
		return statusWithRawChatSubscriptionError(result, rawChatSubscriptionResponseError(cfg, http.StatusOK, response.Code, response.Message), cfg)
	}

	subscriptions := response.Data.List
	if len(subscriptions) == 0 {
		subscriptions = response.List
	}

	var totalLimit float64
	var hasLimit bool
	var earliestExpiry *time.Time
	for _, subscription := range subscriptions {
		if !isRawChatSubscriptionActive(subscription.Status) {
			continue
		}
		item := rawChatSubscriptionItemFromAPI(subscription)
		result.Subscriptions = append(result.Subscriptions, item)
		result.ActiveCount++
		result.UsedUSD += item.UsedUSD
		if item.LimitUSD != nil {
			totalLimit += *item.LimitUSD
			hasLimit = true
		}
		if item.ExpiresAt != nil && (earliestExpiry == nil || item.ExpiresAt.Before(*earliestExpiry)) {
			expiry := *item.ExpiresAt
			earliestExpiry = &expiry
		}
	}
	if hasLimit {
		result.TotalLimitUSD = &totalLimit
		remaining := totalLimit - result.UsedUSD
		result.RemainingUSD = &remaining
	}
	if earliestExpiry != nil {
		result.ExpiresAt = earliestExpiry
		result.DaysRemaining = daysRemainingFromNow(earliestExpiry)
	}
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func (s *ExternalSubscriptionService) getRawChatSubscriptionsJSON(ctx context.Context, settings ExternalSubscriptionSettings, cfg externalSubscriptionProviderConfig, out any) error {
	request := s.client.R().
		SetContext(ctx).
		SetHeader("Content-Type", "application/json").
		SetHeader("ThemeId", "pastel").
		SetHeader("Accept-Language", "zh-CN").
		SetBody(map[string]int{
			"page": 1,
			"size": 20,
		}).
		SetSuccessResult(out)
	if cookie := rawChatCookieHeader(settings.APIToken); cookie != "" {
		request.SetHeader("Cookie", cookie)
	} else {
		request.SetBearerAuthToken(settings.APIToken)
	}
	resp, err := request.Post(settings.APIBaseURL + "/frontend-api/getUserSubscriptions")
	if err != nil {
		return infraerrors.ServiceUnavailable(rawChatSubscriptionErrorCode(cfg), fmt.Sprintf("failed to query %s subscriptions", cfg.DisplayName))
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return rawChatSubscriptionErrorFromResponse(cfg, resp.StatusCode, resp.Bytes())
	}
	return nil
}

func rawChatCookieHeader(token string) string {
	trimmed := strings.TrimSpace(token)
	if trimmed == "" {
		return ""
	}
	if strings.HasPrefix(strings.ToLower(trimmed), "cookie:") {
		return strings.TrimSpace(trimmed[len("cookie:"):])
	}
	if strings.Contains(trimmed, "=") && !strings.Contains(trimmed, " ") {
		return trimmed
	}
	return ""
}

func isRawChatSubscriptionSuccessCode(raw json.RawMessage) bool {
	if isExternalSubscriptionSuccessCode(raw) {
		return true
	}
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return false
	}
	var numeric int
	if err := json.Unmarshal(raw, &numeric); err == nil {
		return numeric == 1
	}
	var value string
	if err := json.Unmarshal(raw, &value); err == nil {
		return strings.TrimSpace(value) == "1"
	}
	return false
}

func rawChatSubscriptionItemFromAPI(subscription rawChatSubscription) ExternalSubscriptionItem {
	limit, hasLimit := rawChatNumber(subscription.Limit)
	used, hasUsed := rawChatNumber(subscription.Used)
	if !hasUsed {
		used, hasUsed = rawChatNumber(subscription.UsedAmount)
	}
	if !hasUsed {
		used = 0
	}

	groupName := strings.TrimSpace(subscription.PackageName)
	if groupName == "" {
		groupName = strings.TrimSpace(subscription.Name)
	}
	if groupName == "" {
		groupName = "RawChat"
	}

	item := ExternalSubscriptionItem{
		ID:        rawChatInt64(subscription.ID),
		GroupID:   rawChatInt64(subscription.PackageID),
		GroupName: groupName,
		Status:    "active",
		Window:    "subscription",
		UsedUSD:   used,
		ExpiresAt: firstExternalTime(subscription.ExpireTime, subscription.ExpiresAt),
	}
	item.DaysRemaining = daysRemainingFromNow(item.ExpiresAt)
	if hasLimit {
		item.LimitUSD = &limit
		remaining := limit - used
		item.RemainingUSD = &remaining
	}
	return item
}

func isRawChatSubscriptionActive(raw json.RawMessage) bool {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return false
	}
	var number int
	if err := json.Unmarshal(raw, &number); err == nil {
		return number == 1
	}
	var value string
	if err := json.Unmarshal(raw, &value); err == nil {
		normalized := strings.ToLower(strings.TrimSpace(value))
		return normalized == "1" || normalized == "active" || normalized == "normal"
	}
	return false
}

func rawChatNumber(raw json.RawMessage) (float64, bool) {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return 0, false
	}
	var number float64
	if err := json.Unmarshal(raw, &number); err == nil {
		return number, true
	}
	var value string
	if err := json.Unmarshal(raw, &value); err == nil {
		parsed, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
		return parsed, err == nil
	}
	return 0, false
}

func rawChatInt64(raw json.RawMessage) int64 {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return 0
	}
	var number int64
	if err := json.Unmarshal(raw, &number); err == nil {
		return number
	}
	var value string
	if err := json.Unmarshal(raw, &value); err == nil {
		parsed, _ := strconv.ParseInt(strings.TrimSpace(value), 10, 64)
		return parsed
	}
	return 0
}

func statusWithRawChatSubscriptionError(result *ExternalSubscriptionStatus, err error, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	if upstreamErr, ok := err.(*externalSubscriptionUpstreamError); ok {
		result.ErrorCode = upstreamErr.Code
		if result.ErrorCode == "" {
			result.ErrorCode = rawChatSubscriptionErrorCode(cfg)
		}
		result.ErrorMessage = upstreamErr.Message
		if strings.TrimSpace(result.ErrorMessage) == "" {
			result.ErrorMessage = fmt.Sprintf("%s subscription API returned an error", cfg.DisplayName)
		}
		result.RefreshedAt = time.Now().UTC()
		return result, nil
	}
	return nil, err
}

func rawChatSubscriptionResponseError(cfg externalSubscriptionProviderConfig, statusCode int, code json.RawMessage, message string) error {
	normalizedCode := externalSubscriptionErrorCode(code)
	if normalizedCode == "" {
		normalizedCode = rawChatSubscriptionErrorCode(cfg)
	}
	normalizedMessage := strings.TrimSpace(message)
	if normalizedMessage == "" {
		normalizedMessage = fmt.Sprintf("%s subscription API returned an error", cfg.DisplayName)
	}
	return &externalSubscriptionUpstreamError{
		StatusCode: statusCode,
		Code:       normalizedCode,
		Message:    normalizedMessage,
		Provider:   cfg.Provider,
		Display:    cfg.DisplayName,
	}
}

func rawChatSubscriptionErrorFromResponse(cfg externalSubscriptionProviderConfig, statusCode int, body []byte) error {
	var raw struct {
		Code    json.RawMessage `json:"code"`
		Message string          `json:"message"`
		Error   string          `json:"error"`
	}
	if err := json.Unmarshal(body, &raw); err == nil {
		message := strings.TrimSpace(raw.Message)
		if message == "" {
			message = strings.TrimSpace(raw.Error)
		}
		return rawChatSubscriptionResponseError(cfg, statusCode, raw.Code, message)
	}
	return rawChatSubscriptionResponseError(cfg, statusCode, nil, "")
}

func rawChatSubscriptionErrorCode(cfg externalSubscriptionProviderConfig) string {
	return fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(cfg.Provider))
}
