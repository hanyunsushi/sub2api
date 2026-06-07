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

type QLHazyCoderSubscriptionSettings = ExternalSubscriptionSettings
type QLHazyCoderSubscriptionStatus = ExternalSubscriptionStatus
type QLHazyCoderSubscriptionItem = ExternalSubscriptionItem

type QLHazyCoderSubscriptionService struct {
	*ExternalSubscriptionService
}

func qlhazycoderSubscriptionProviderConfig() externalSubscriptionProviderConfig {
	return externalSubscriptionProviderConfig{
		Provider:          "qlhazycoder",
		DisplayName:       "qlhazycoder",
		DefaultAPIBaseURL: DefaultQLHazyCoderSubscriptionAPIBaseURL,
		EnabledKey:        SettingKeyQLHazyCoderSubscriptionEnabled,
		APIBaseURLKey:     SettingKeyQLHazyCoderSubscriptionAPIBaseURL,
		APITokenKey:       SettingKeyQLHazyCoderSubscriptionAPIToken,
		UserIDKey:         SettingKeyQLHazyCoderSubscriptionUserID,
		RefreshTokenKey:   SettingKeyQLHazyCoderSubscriptionRefreshToken,
	}
}

func NewQLHazyCoderSubscriptionService(settingService *SettingService) *QLHazyCoderSubscriptionService {
	return &QLHazyCoderSubscriptionService{
		ExternalSubscriptionService: newExternalSubscriptionService(settingService, qlhazycoderSubscriptionProviderConfig()),
	}
}

func normalizeQLHazyCoderSubscriptionAPIBaseURL(raw string) string {
	trimmed := strings.TrimRight(strings.TrimSpace(raw), "/")
	if trimmed == "" || strings.EqualFold(trimmed, "https://shop.qlhazycoder.top") || strings.EqualFold(trimmed, "http://shop.qlhazycoder.top") {
		return DefaultQLHazyCoderSubscriptionAPIBaseURL
	}
	return normalizeExternalSubscriptionAPIBaseURL(raw, DefaultQLHazyCoderSubscriptionAPIBaseURL)
}

func (s *SettingService) GetQLHazyCoderSubscriptionSettings(ctx context.Context) (QLHazyCoderSubscriptionSettings, error) {
	return s.getExternalSubscriptionSettings(ctx, qlhazycoderSubscriptionProviderConfig())
}

type qlhazyCoderEnvelope struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

type qlhazyCoderStatusMetadata struct {
	QuotaDisplayType string             `json:"quota_display_type"`
	QuotaPerUnit     qlhazyCoderFloat   `json:"quota_per_unit"`
	USDExchangeRate  qlhazyCoderFloat   `json:"usd_exchange_rate"`
	USDExchangeRates map[string]float64 `json:"usd_exchange_rates"`
}

type qlhazyCoderUserSelf struct {
	Quota        qlhazyCoderFloat `json:"quota"`
	UsedQuota    qlhazyCoderFloat `json:"used_quota"`
	RequestCount int64            `json:"request_count"`
}

type qlhazyCoderSubscriptionSelf struct {
	BillingPreference string                           `json:"billing_preference"`
	Subscriptions     []qlhazyCoderSubscriptionWrapper `json:"subscriptions"`
	AllSubscriptions  []qlhazyCoderSubscriptionWrapper `json:"all_subscriptions"`
}

type qlhazyCoderSubscriptionWrapper struct {
	Subscription qlhazyCoderSubscriptionRecord `json:"subscription"`
	Plan         *qlhazyCoderPlan              `json:"plan"`
}

type qlhazyCoderSubscriptionRecord struct {
	ID          int64            `json:"id"`
	PlanID      int64            `json:"plan_id"`
	Status      string           `json:"status"`
	StartTime   int64            `json:"start_time"`
	EndTime     int64            `json:"end_time"`
	AmountTotal qlhazyCoderFloat `json:"amount_total"`
	AmountUsed  qlhazyCoderFloat `json:"amount_used"`
	Plan        *qlhazyCoderPlan `json:"plan"`
	Extra       map[string]any   `json:"-"`
}

type qlhazyCoderPlan struct {
	ID    int64  `json:"id"`
	Title string `json:"title"`
	Name  string `json:"name"`
}

type qlhazyCoderFloat float64

func (v *qlhazyCoderFloat) UnmarshalJSON(raw []byte) error {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		*v = 0
		return nil
	}

	var str string
	if err := json.Unmarshal(raw, &str); err == nil {
		parsed, parseErr := strconv.ParseFloat(strings.TrimSpace(str), 64)
		if parseErr != nil {
			return parseErr
		}
		*v = qlhazyCoderFloat(parsed)
		return nil
	}

	var number json.Number
	if err := json.Unmarshal(raw, &number); err == nil {
		parsed, parseErr := strconv.ParseFloat(number.String(), 64)
		if parseErr != nil {
			return parseErr
		}
		*v = qlhazyCoderFloat(parsed)
		return nil
	}

	return infraerrors.ServiceUnavailable("QLHAZYCODER_SUBSCRIPTION_UPSTREAM_ERROR", "failed to parse qlhazycoder account status")
}

func (s *QLHazyCoderSubscriptionService) GetStatus(ctx context.Context) (*QLHazyCoderSubscriptionStatus, error) {
	settings, err := s.settingService.getExternalSubscriptionSettings(ctx, qlhazycoderSubscriptionProviderConfig())
	if err != nil {
		return nil, err
	}
	auth := normalizeQLHazyCoderSubscriptionAuth(settings.APIToken)
	if auth.UserID == "" {
		auth.UserID = strings.TrimSpace(settings.UserID)
	}
	settings.APIToken = auth.Token

	result := &ExternalSubscriptionStatus{
		Provider:      "qlhazycoder",
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
	if err := s.getQLHazyCoderJSON(ctx, settings, auth, "/api/status", &metadata); err != nil {
		return s.statusWithQLHazyCoderError(result, err)
	}
	converter := newQLHazyCoderQuotaConverter(metadata)
	result.Currency = converter.currency

	var user qlhazyCoderUserSelf
	if err := s.getQLHazyCoderJSON(ctx, settings, auth, "/api/user/self", &user); err != nil {
		return s.statusWithQLHazyCoderError(result, err)
	}

	var subscription qlhazyCoderSubscriptionSelf
	if err := s.getQLHazyCoderJSON(ctx, settings, auth, "/api/subscription/self", &subscription); err != nil {
		return s.statusWithQLHazyCoderError(result, err)
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

func (s *QLHazyCoderSubscriptionService) getQLHazyCoderJSON(ctx context.Context, settings ExternalSubscriptionSettings, auth qlhazyCoderSubscriptionAuth, path string, out any) error {
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
		return infraerrors.ServiceUnavailable("QLHAZYCODER_SUBSCRIPTION_UPSTREAM_ERROR", "failed to query qlhazycoder account status")
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return qlhazyCoderErrorFromResponse(resp.StatusCode, resp.Bytes(), envelope)
	}
	if !envelope.Success {
		return qlhazyCoderErrorFromResponse(resp.StatusCode, resp.Bytes(), envelope)
	}
	if err := json.Unmarshal(envelope.Data, out); err != nil {
		return infraerrors.ServiceUnavailable("QLHAZYCODER_SUBSCRIPTION_UPSTREAM_ERROR", "failed to parse qlhazycoder account status")
	}
	return nil
}

type qlhazyCoderSubscriptionAuth struct {
	Token  string
	UserID string
}

func normalizeQLHazyCoderSubscriptionAuth(raw string) qlhazyCoderSubscriptionAuth {
	auth := qlhazyCoderSubscriptionAuth{Token: strings.TrimSpace(raw)}
	if auth.Token == "" {
		return auth
	}

	var wrapped struct {
		Data        json.RawMessage `json:"data"`
		Token       string          `json:"token"`
		AccessToken string          `json:"access_token"`
		UserID      any             `json:"id"`
		UserIDAlt   any             `json:"user_id"`
	}
	if err := json.Unmarshal([]byte(auth.Token), &wrapped); err == nil {
		auth.UserID = qlhazyCoderUserIDString(wrapped.UserID)
		if auth.UserID == "" {
			auth.UserID = qlhazyCoderUserIDString(wrapped.UserIDAlt)
		}
		switch {
		case strings.TrimSpace(wrapped.Token) != "":
			auth.Token = strings.TrimSpace(wrapped.Token)
		case strings.TrimSpace(wrapped.AccessToken) != "":
			auth.Token = strings.TrimSpace(wrapped.AccessToken)
		case len(wrapped.Data) > 0 && string(wrapped.Data) != "null":
			var dataString string
			if err := json.Unmarshal(wrapped.Data, &dataString); err == nil && strings.TrimSpace(dataString) != "" {
				auth.Token = strings.TrimSpace(dataString)
			} else {
				var dataObject struct {
					Token       string `json:"token"`
					AccessToken string `json:"access_token"`
					UserID      any    `json:"id"`
					UserIDAlt   any    `json:"user_id"`
				}
				if err := json.Unmarshal(wrapped.Data, &dataObject); err == nil {
					auth.UserID = qlhazyCoderUserIDString(dataObject.UserID)
					if auth.UserID == "" {
						auth.UserID = qlhazyCoderUserIDString(dataObject.UserIDAlt)
					}
					if strings.TrimSpace(dataObject.Token) != "" {
						auth.Token = strings.TrimSpace(dataObject.Token)
					} else if strings.TrimSpace(dataObject.AccessToken) != "" {
						auth.Token = strings.TrimSpace(dataObject.AccessToken)
					}
				}
			}
		}
	}

	auth.Token = strings.TrimSpace(auth.Token)
	if strings.HasPrefix(strings.ToLower(auth.Token), "bearer ") {
		auth.Token = strings.TrimSpace(auth.Token[len("bearer "):])
	}
	return auth
}

func qlhazyCoderUserIDString(value any) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(typed)
	case float64:
		return strconv.FormatInt(int64(typed), 10)
	case json.Number:
		return strings.TrimSpace(typed.String())
	default:
		return strings.TrimSpace(fmt.Sprint(typed))
	}
}

func (s *QLHazyCoderSubscriptionService) statusWithQLHazyCoderError(result *ExternalSubscriptionStatus, err error) (*QLHazyCoderSubscriptionStatus, error) {
	if upstreamErr, ok := err.(*externalSubscriptionUpstreamError); ok {
		result.ErrorCode = upstreamErr.Code
		if result.ErrorCode == "" {
			result.ErrorCode = "QLHAZYCODER_SUBSCRIPTION_UPSTREAM_ERROR"
		}
		result.ErrorMessage = upstreamErr.Message
		if strings.TrimSpace(result.ErrorMessage) == "" {
			result.ErrorMessage = "qlhazycoder account API returned an error"
		}
		result.RefreshedAt = time.Now().UTC()
		return result, nil
	}
	return nil, err
}

func qlhazyCoderErrorFromResponse(statusCode int, body []byte, envelope qlhazyCoderEnvelope) error {
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
		code = "QLHAZYCODER_SUBSCRIPTION_UPSTREAM_ERROR"
	}
	if message == "" {
		message = "qlhazycoder account API returned an error"
	}
	return &externalSubscriptionUpstreamError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
		Provider:   "qlhazycoder",
		Display:    "qlhazycoder",
	}
}

type qlhazyCoderQuotaConverter struct {
	currency     string
	quotaPerUnit float64
	exchangeRate float64
}

func newQLHazyCoderQuotaConverter(metadata qlhazyCoderStatusMetadata) qlhazyCoderQuotaConverter {
	currency := strings.ToUpper(strings.TrimSpace(metadata.QuotaDisplayType))
	if currency == "" {
		currency = "CNY"
	}
	quotaPerUnit := float64(metadata.QuotaPerUnit)
	if quotaPerUnit <= 0 {
		quotaPerUnit = 500000
	}
	exchangeRate := float64(metadata.USDExchangeRate)
	if exchangeRate <= 0 {
		exchangeRate = 1
	}
	if rate, ok := metadata.USDExchangeRates[currency]; ok && rate > 0 {
		exchangeRate = rate
	}
	return qlhazyCoderQuotaConverter{
		currency:     currency,
		quotaPerUnit: quotaPerUnit,
		exchangeRate: exchangeRate,
	}
}

func (c qlhazyCoderQuotaConverter) amount(raw qlhazyCoderFloat) float64 {
	value := float64(raw) / c.quotaPerUnit
	if c.currency == "CNY" || c.currency == "RMB" {
		value *= c.exchangeRate
	}
	return value
}

func isQLHazyCoderActiveSubscription(record qlhazyCoderSubscriptionRecord, now time.Time) bool {
	status := strings.ToLower(strings.TrimSpace(record.Status))
	if status != "" && status != "active" && status != "生效" {
		return false
	}
	if record.EndTime > 0 && time.Unix(record.EndTime, 0).Before(now) {
		return false
	}
	return true
}

func qlhazyCoderSubscriptionItemFromAPI(wrapper qlhazyCoderSubscriptionWrapper, converter qlhazyCoderQuotaConverter) ExternalSubscriptionItem {
	record := wrapper.Subscription
	groupName := strings.TrimSpace(fmt.Sprintf("Subscription #%d", record.ID))
	plan := wrapper.Plan
	if plan == nil {
		plan = record.Plan
	}
	if plan != nil {
		if title := strings.TrimSpace(plan.Title); title != "" {
			groupName = title
		} else if name := strings.TrimSpace(plan.Name); name != "" {
			groupName = name
		}
	}
	limit := converter.amount(record.AmountTotal)
	used := converter.amount(record.AmountUsed)
	remaining := limit - used
	item := ExternalSubscriptionItem{
		ID:           record.ID,
		GroupID:      record.PlanID,
		GroupName:    groupName,
		Status:       strings.TrimSpace(record.Status),
		Window:       "subscription",
		LimitUSD:     &limit,
		UsedUSD:      used,
		RemainingUSD: &remaining,
	}
	if item.Status == "" {
		item.Status = "active"
	}
	if record.EndTime > 0 {
		expiry := time.Unix(record.EndTime, 0).UTC()
		item.ExpiresAt = &expiry
		item.DaysRemaining = daysRemainingFromNow(&expiry)
	}
	return item
}
