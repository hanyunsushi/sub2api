package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

type externalAuthMeBalanceResponse struct {
	Balance        qlhazyCoderFloat `json:"balance"`
	PointsBalance  qlhazyCoderFloat `json:"points_balance"`
	TotalRecharged qlhazyCoderFloat `json:"total_recharged"`
}

func (s *ExternalSubscriptionService) getStatusWithBalanceStrategy(ctx context.Context, cfg externalSubscriptionProviderConfig, template string, strategy string) (*ExternalSubscriptionStatus, error) {
	switch strategy {
	case ExternalSubscriptionBalanceStrategyAuto, "":
		return s.getStatusForTemplate(ctx, cfg, template)
	case ExternalSubscriptionBalanceStrategyNewAPIUserQuota:
		return s.getNewAPIConsoleUserQuotaStatus(ctx, cfg)
	case ExternalSubscriptionBalanceStrategyNewAPISubscription:
		return s.getNewAPIConsoleSubscriptionStatus(ctx, cfg)
	case ExternalSubscriptionBalanceStrategyActiveSubscriptions:
		return s.GetStatus(ctx)
	case ExternalSubscriptionBalanceStrategyAuthMeBalance:
		return s.getAuthMeBalanceStatus(ctx, cfg)
	case ExternalSubscriptionBalanceStrategyActiveWithAuthMeBalance:
		return s.getActiveSubscriptionsWithAuthMeBalanceFallback(ctx, cfg)
	default:
		return nil, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_BALANCE_STRATEGY_INVALID", "external subscription provider balance strategy is invalid")
	}
}

func (s *ExternalSubscriptionService) getStatusForTemplate(ctx context.Context, cfg externalSubscriptionProviderConfig, template string) (*ExternalSubscriptionStatus, error) {
	switch template {
	case ExternalSubscriptionTemplateNewAPIConsole:
		return s.getNewAPIConsoleSubscriptionStatus(ctx, cfg)
	case ExternalSubscriptionTemplateActiveSubscriptions:
		return s.GetStatus(ctx)
	case ExternalSubscriptionTemplateBuzzBalance:
		return s.getBuzzBalanceSubscriptionStatus(ctx, cfg)
	case ExternalSubscriptionTemplateOpenRouterCredits:
		return s.getOpenRouterCreditsStatus(ctx, cfg)
	case ExternalSubscriptionTemplateCloudflareAIGatewayCredits:
		return s.getCloudflareAIGatewayCreditsStatus(ctx, cfg)
	case ExternalSubscriptionTemplateRawChatSubscriptions:
		return s.getRawChatSubscriptionStatus(ctx, cfg)
	default:
		return nil, infraerrors.BadRequest("EXTERNAL_SUBSCRIPTION_TEMPLATE_INVALID", "external subscription provider template is invalid")
	}
}

func (s *ExternalSubscriptionService) getNewAPIConsoleUserQuotaStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
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

	result.UsedUSD = converter.amount(user.UsedQuota)
	remaining := converter.amount(user.Quota)
	result.RemainingUSD = &remaining
	result.ActiveCount = 0
	result.Subscriptions = []ExternalSubscriptionItem{}
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func (s *ExternalSubscriptionService) getAuthMeBalanceStatus(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
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

	var account externalAuthMeBalanceResponse
	if err := s.getJSON(ctx, settings, "/api/v1/auth/me", &account); err != nil {
		if upstreamErr, ok := err.(*externalSubscriptionUpstreamError); ok {
			result.ErrorCode = upstreamErr.Code
			if result.ErrorCode == "" {
				result.ErrorCode = fmt.Sprintf("%s_SUBSCRIPTION_UPSTREAM_ERROR", strings.ToUpper(cfg.Provider))
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

	balance := float64(account.Balance)
	result.RemainingUSD = &balance
	result.RefreshedAt = time.Now().UTC()
	return result, nil
}

func (s *ExternalSubscriptionService) getActiveSubscriptionsWithAuthMeBalanceFallback(ctx context.Context, cfg externalSubscriptionProviderConfig) (*ExternalSubscriptionStatus, error) {
	status, err := s.GetStatus(ctx)
	if err != nil {
		return nil, err
	}
	if status.RemainingUSD != nil || status.TotalLimitUSD != nil || status.ErrorCode != "" || !status.Enabled || !status.Configured {
		return status, nil
	}
	fallback, err := s.getAuthMeBalanceStatus(ctx, cfg)
	if err != nil {
		return nil, err
	}
	if fallback.RemainingUSD == nil || fallback.ErrorCode != "" {
		return status, nil
	}
	fallback.ActiveCount = 0
	fallback.Subscriptions = []ExternalSubscriptionItem{}
	return fallback, nil
}
