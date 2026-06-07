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

func (s *ExternalSubscriptionService) getNewAPIConsoleSubscriptionStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, cfg)
	if err != nil {
		return nil, err
	}
	auth := normalizeQLHazyCoderSubscriptionAuth(settings.APIToken)
	if auth.UserID == "" {
		auth.UserID = strings.TrimSpace(settings.UserID)
	}
	settings.APIToken = auth.Token

	result := &ExternalSubscriptionStatus{
		Provider:      cfg.Provider,
		Enabled:       settings.Enabled,
		Configured:    settings.APIToken != "",
		Currency:      "CNY",
		SiteURL:       settings.APIBaseURL,
		Subscriptions: []ExternalSubscriptionItem{},
	}
	if !settings.Enabled || settings.APIToken == "" {
		return result, nil
	}

	var metadata qlhazyCoderStatusMetadata
	if err := s.getNewAPIConsoleJSON(ctx, settings, auth, cfg, "/api/status", &metadata); err != nil {
		return statusWithNewAPIConsoleError(result, err, cfg)
	}
	converter := newQLHazyCoderQuotaConverter(metadata)
	result.Currency = converter.currency

	var user qlhazyCoderUserSelf
	if err := s.getNewAPIConsoleJSON(ctx, settings, auth, cfg, "/api/user/self", &user); err != nil {
		return statusWithNewAPIConsoleError(result, err, cfg)
	}

	var subscription qlhazyCoderSubscriptionSelf
	if err := s.getNewAPIConsoleJSON(ctx, settings, auth, cfg, "/api/subscription/self", &subscription); err != nil {
		return statusWithNewAPIConsoleError(result, err, cfg)
	}

	result.Subscriptions = make([]ExternalSubscriptionItem, 0, len(subscription.Subscriptions))
	var totalLimit float64
	var hasLimit bool
	var earliestExpiry *time.Time

	now := time.Now()
	for _, wrapper := range subscription.Subscriptions {
		record := wrapper.Subscription
		if !isQLHazyCoderActiveSubscription(record, now) {
			continue
		}
		item := qlhazyCoderSubscriptionItemFromAPI(wrapper, converter)
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
	if result.ActiveCount == 0 {
		result.UsedUSD = converter.amount(user.UsedQuota)
		remaining := converter.amount(user.Quota)
		result.RemainingUSD = &remaining
	}
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func (s *ExternalSubscriptionService) getNewAPIConsoleJSON(ctx context.Context, settings ExternalSubscriptionSettings, auth qlhazyCoderSubscriptionAuth, cfg externalSubscriptionProviderConfig, path string, out any) error {
	var envelope qlhazyCoderEnvelope
	req := s.client.R().
		SetContext(ctx).
		SetHeader("Authorization", "Bearer "+settings.APIToken).
		SetSuccessResult(&envelope)
	if auth.UserID != "" {
		req.SetHeader("New-API-User", auth.UserID)
	}
	resp, err := req.Get(settings.APIBaseURL + path)
	if err != nil {
		return infraerrors.ServiceUnavailable(newAPIConsoleSubscriptionErrorCode(cfg), fmt.Sprintf("failed to query %s account status", cfg.DisplayName))
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return newAPIConsoleErrorFromResponse(cfg, resp.StatusCode, resp.Bytes(), envelope)
	}
	if !envelope.Success {
		return newAPIConsoleErrorFromResponse(cfg, resp.StatusCode, resp.Bytes(), envelope)
	}
	if err := json.Unmarshal(envelope.Data, out); err != nil {
		return infraerrors.ServiceUnavailable(newAPIConsoleSubscriptionErrorCode(cfg), fmt.Sprintf("failed to parse %s account status", cfg.DisplayName))
	}
	return nil
}

func statusWithNewAPIConsoleError(result *ExternalSubscriptionStatus, err error, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	if upstreamErr, ok := err.(*externalSubscriptionUpstreamError); ok {
		result.ErrorCode = upstreamErr.Code
		if result.ErrorCode == "" {
			result.ErrorCode = newAPIConsoleSubscriptionErrorCode(cfg)
		}
		result.ErrorMessage = upstreamErr.Message
		if strings.TrimSpace(result.ErrorMessage) == "" {
			result.ErrorMessage = fmt.Sprintf("%s account API returned an error", cfg.DisplayName)
		}
		result.RefreshedAt = time.Now().UTC()
		return result, nil
	}
	return nil, err
}

func newAPIConsoleErrorFromResponse(cfg externalSubscriptionProviderConfig, statusCode int, body []byte, envelope qlhazyCoderEnvelope) error {
	code := ""
	if statusCode == http.StatusUnauthorized {
		code = strconv.Itoa(statusCode)
	}
	message := strings.TrimSpace(envelope.Message)
	if code == "" || message == "" {
		var raw struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
			Error   string `json:"error"`
		}
		if err := json.Unmarshal(body, &raw); err == nil {
			if message == "" {
				message = strings.TrimSpace(raw.Message)
			}
			if message == "" {
				message = strings.TrimSpace(raw.Error)
			}
		}
	}
	if code == "" {
		code = newAPIConsoleSubscriptionErrorCode(cfg)
	}
	if message == "" {
		message = fmt.Sprintf("%s account API returned an error", cfg.DisplayName)
	}
	return &externalSubscriptionUpstreamError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
		Provider:   cfg.Provider,
		Display:    cfg.DisplayName,
	}
}

func newAPIConsoleSubscriptionErrorCode(cfg externalSubscriptionProviderConfig) string {
	return fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(cfg.Provider))
}
