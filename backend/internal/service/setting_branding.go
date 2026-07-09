package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

func normalizeAppearanceThemeDefault(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "cloudflare", "anthropic":
		return strings.ToLower(strings.TrimSpace(value))
	default:
		return "cloudflare"
	}
}

func normalizeAILogoCDNBaseURL(value string) string {
	normalized := strings.TrimRight(normalizeHTTPURL(value), "/")
	if normalized == "" {
		return DefaultAILogoCDNBaseURL
	}
	return normalized
}

func normalizeHTTPURL(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}
	parsed, err := url.Parse(trimmed)
	if err != nil || parsed.Host == "" {
		return ""
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return ""
	}
	return parsed.String()
}

func parseCustomAILogoPresetURLs(raw string) []string {
	var values []string
	if strings.TrimSpace(raw) == "" {
		return []string{}
	}
	if err := json.Unmarshal([]byte(raw), &values); err != nil {
		return []string{}
	}
	return normalizeCustomAILogoPresetURLs(values)
}

func normalizeCustomAILogoPresetURLs(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		normalized := normalizeHTTPURL(value)
		if normalized == "" {
			continue
		}
		if _, ok := seen[normalized]; ok {
			continue
		}
		seen[normalized] = struct{}{}
		result = append(result, normalized)
		if len(result) >= 64 {
			break
		}
	}
	return result
}

func customAILogoPresetURLsJSON(values []string) (string, error) {
	normalized := normalizeCustomAILogoPresetURLs(values)
	raw, err := json.Marshal(normalized)
	if err != nil {
		return "", err
	}
	return string(raw), nil
}

func parseCustomMenuSVGIconPresetURLs(raw string) []string {
	var values []string
	if strings.TrimSpace(raw) == "" {
		return []string{}
	}
	if err := json.Unmarshal([]byte(raw), &values); err != nil {
		return []string{}
	}
	return normalizeCustomMenuSVGIconPresetURLs(values)
}

func normalizeCustomMenuSVGIconPresetURLs(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		normalized := normalizeHTTPURL(value)
		if normalized == "" {
			continue
		}
		if _, ok := seen[normalized]; ok {
			continue
		}
		seen[normalized] = struct{}{}
		result = append(result, normalized)
		if len(result) >= 48 {
			break
		}
	}
	return result
}

func customMenuSVGIconPresetURLsJSON(values []string) (string, error) {
	normalized := normalizeCustomMenuSVGIconPresetURLs(values)
	raw, err := json.Marshal(normalized)
	if err != nil {
		return "", err
	}
	return string(raw), nil
}

func (s *SettingService) AppendCustomAILogoPreset(ctx context.Context, rawURL string) ([]string, error) {
	url := normalizeHTTPURL(rawURL)
	if url == "" {
		return nil, infraerrors.BadRequest("INVALID_AI_LOGO_URL", "AI logo URL must be a valid http or https URL")
	}

	currentRaw, err := s.settingRepo.GetValue(ctx, SettingKeyCustomAILogoPresets)
	if err != nil && !errors.Is(err, ErrSettingNotFound) {
		return nil, err
	}
	current := parseCustomAILogoPresetURLs(currentRaw)
	next := normalizeCustomAILogoPresetURLs(append([]string{url}, current...))
	encoded, err := customAILogoPresetURLsJSON(next)
	if err != nil {
		return nil, fmt.Errorf("marshal custom AI logo presets: %w", err)
	}
	if err := s.settingRepo.SetMultiple(ctx, map[string]string{SettingKeyCustomAILogoPresets: encoded}); err != nil {
		return nil, err
	}
	if s.onUpdate != nil {
		s.onUpdate()
	}
	return next, nil
}

func (s *SettingService) DeleteCustomAILogoPreset(ctx context.Context, rawURL string) ([]string, error) {
	url := normalizeHTTPURL(rawURL)
	if url == "" {
		return nil, infraerrors.BadRequest("INVALID_AI_LOGO_URL", "AI logo URL must be a valid http or https URL")
	}

	currentRaw, err := s.settingRepo.GetValue(ctx, SettingKeyCustomAILogoPresets)
	if err != nil && !errors.Is(err, ErrSettingNotFound) {
		return nil, err
	}
	current := parseCustomAILogoPresetURLs(currentRaw)
	next := make([]string, 0, len(current))
	for _, item := range current {
		if item != url {
			next = append(next, item)
		}
	}
	encoded, err := customAILogoPresetURLsJSON(next)
	if err != nil {
		return nil, fmt.Errorf("marshal custom AI logo presets: %w", err)
	}
	if err := s.settingRepo.SetMultiple(ctx, map[string]string{SettingKeyCustomAILogoPresets: encoded}); err != nil {
		return nil, err
	}
	if s.onUpdate != nil {
		s.onUpdate()
	}
	return next, nil
}

func (s *SettingService) AppendCustomMenuSVGIconPreset(ctx context.Context, rawURL string) ([]string, error) {
	url := normalizeHTTPURL(rawURL)
	if url == "" {
		return nil, infraerrors.BadRequest("INVALID_CUSTOM_MENU_SVG_ICON_URL", "custom menu SVG icon URL must be a valid http or https URL")
	}

	currentRaw, err := s.settingRepo.GetValue(ctx, SettingKeyCustomMenuSVGIconPresets)
	if err != nil && !errors.Is(err, ErrSettingNotFound) {
		return nil, err
	}
	current := parseCustomMenuSVGIconPresetURLs(currentRaw)
	next := normalizeCustomMenuSVGIconPresetURLs(append([]string{url}, current...))
	encoded, err := customMenuSVGIconPresetURLsJSON(next)
	if err != nil {
		return nil, fmt.Errorf("marshal custom menu SVG icon presets: %w", err)
	}
	if err := s.settingRepo.SetMultiple(ctx, map[string]string{SettingKeyCustomMenuSVGIconPresets: encoded}); err != nil {
		return nil, err
	}
	if s.onUpdate != nil {
		s.onUpdate()
	}
	return next, nil
}

func (s *SettingService) DeleteCustomMenuSVGIconPreset(ctx context.Context, rawURL string) ([]string, error) {
	url := normalizeHTTPURL(rawURL)
	if url == "" {
		return nil, infraerrors.BadRequest("INVALID_CUSTOM_MENU_SVG_ICON_URL", "custom menu SVG icon URL must be a valid http or https URL")
	}

	currentRaw, err := s.settingRepo.GetValue(ctx, SettingKeyCustomMenuSVGIconPresets)
	if err != nil && !errors.Is(err, ErrSettingNotFound) {
		return nil, err
	}
	current := parseCustomMenuSVGIconPresetURLs(currentRaw)
	next := make([]string, 0, len(current))
	for _, item := range current {
		if item != url {
			next = append(next, item)
		}
	}
	encoded, err := customMenuSVGIconPresetURLsJSON(next)
	if err != nil {
		return nil, fmt.Errorf("marshal custom menu SVG icon presets: %w", err)
	}
	if err := s.settingRepo.SetMultiple(ctx, map[string]string{SettingKeyCustomMenuSVGIconPresets: encoded}); err != nil {
		return nil, err
	}
	if s.onUpdate != nil {
		s.onUpdate()
	}
	return next, nil
}

func (s *SettingService) UpdateAppearanceThemeDefault(ctx context.Context, theme string) (string, error) {
	normalized := normalizeAppearanceThemeDefault(theme)
	if normalized != strings.ToLower(strings.TrimSpace(theme)) {
		return "", infraerrors.BadRequest("INVALID_APPEARANCE_THEME_DEFAULT", "appearance theme default must be cloudflare or anthropic")
	}
	if err := s.settingRepo.SetMultiple(ctx, map[string]string{SettingKeyAppearanceThemeDefault: normalized}); err != nil {
		return "", err
	}
	if s.onUpdate != nil {
		s.onUpdate()
	}
	return normalized, nil
}
