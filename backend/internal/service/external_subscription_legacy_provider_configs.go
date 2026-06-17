package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type BuzzBalanceSettings struct {
	Enabled    bool
	APIBaseURL string
	APIToken   string
}

func (s *SettingService) GetBuzzBalanceSettings(ctx context.Context) (BuzzBalanceSettings, error) {
	values, err := s.settingRepo.GetMultiple(ctx, []string{
		SettingKeyBuzzBalanceEnabled,
		SettingKeyBuzzBalanceAPIBaseURL,
		SettingKeyBuzzBalanceAPIToken,
	})
	if err != nil {
		return BuzzBalanceSettings{}, fmt.Errorf("get buzz balance settings: %w", err)
	}
	return BuzzBalanceSettings{
		Enabled:    values[SettingKeyBuzzBalanceEnabled] == "true",
		APIBaseURL: normalizeBuzzBalanceAPIBaseURL(values[SettingKeyBuzzBalanceAPIBaseURL]),
		APIToken:   strings.TrimSpace(values[SettingKeyBuzzBalanceAPIToken]),
	}, nil
}

func normalizeBuzzBalanceAPIBaseURL(raw string) string {
	base := strings.TrimSpace(raw)
	if base == "" {
		return DefaultBuzzBalanceAPIBaseURL
	}
	base = strings.TrimRight(base, "/")
	parsed, err := url.Parse(base)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return DefaultBuzzBalanceAPIBaseURL
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return DefaultBuzzBalanceAPIBaseURL
	}
	return base
}

func firstExternalTime(values ...json.RawMessage) *time.Time {
	for _, raw := range values {
		if parsed := parseExternalTimeRaw(raw); parsed != nil {
			return parsed
		}
	}
	return nil
}

func parseExternalTimeRaw(raw json.RawMessage) *time.Time {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return nil
	}
	var str string
	if err := json.Unmarshal(raw, &str); err == nil {
		return parseExternalTimeString(str)
	}
	var number json.Number
	if err := json.Unmarshal(raw, &number); err == nil {
		value, err := strconv.ParseFloat(number.String(), 64)
		if err != nil {
			return nil
		}
		if value > 1e12 {
			value = value / 1000
		}
		seconds := int64(value)
		if seconds <= 0 {
			return nil
		}
		parsed := time.Unix(seconds, 0).UTC()
		return &parsed
	}
	return nil
}

func parseExternalTimeString(value string) *time.Time {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	if parsed, err := time.Parse(time.RFC3339, trimmed); err == nil {
		return &parsed
	}
	for _, layout := range []string{
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006/01/02 15:04:05",
		"2006/01/02 15:04",
	} {
		if parsed, err := time.ParseInLocation(layout, trimmed, time.UTC); err == nil {
			return &parsed
		}
	}
	if parsed, err := time.Parse("2006-01-02", trimmed); err == nil {
		return &parsed
	}
	if number, err := strconv.ParseFloat(trimmed, 64); err == nil {
		if number > 1e12 {
			number = number / 1000
		}
		seconds := int64(number)
		if seconds > 0 {
			parsed := time.Unix(seconds, 0).UTC()
			return &parsed
		}
	}
	return nil
}

func buzzBalanceProviderConfig() externalSubscriptionProviderConfig {
	return externalSubscriptionProviderConfig{
		Provider:          "buzz",
		DisplayName:       "Buzz",
		DefaultAPIBaseURL: DefaultBuzzBalanceAPIBaseURL,
		EnabledKey:        SettingKeyBuzzBalanceEnabled,
		APIBaseURLKey:     SettingKeyBuzzBalanceAPIBaseURL,
		APITokenKey:       SettingKeyBuzzBalanceAPIToken,
		UserIDKey:         "",
		RefreshTokenKey:   "",
	}
}

func isBuzzBalanceProviderID(id string) bool {
	return strings.TrimSpace(strings.ToLower(id)) == "buzz"
}
