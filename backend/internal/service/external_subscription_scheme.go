package service

import "strings"

type externalSubscriptionSchemeSpec struct {
	template        string
	balanceStrategy string
	authMode        externalSubscriptionAuthMode
}

// externalSubscriptionAuthMode describes the credential headers used by a
// scheme.  It intentionally lives next to the bound template/strategy so the
// request path cannot infer authentication from a provider ID.
type externalSubscriptionAuthMode string

const (
	externalSubscriptionAuthLegacy                   externalSubscriptionAuthMode = "legacy"
	externalSubscriptionAuthAccessToken              externalSubscriptionAuthMode = "access_token"
	externalSubscriptionAuthBearer                   externalSubscriptionAuthMode = "bearer"
	externalSubscriptionAuthBearerWithNewAPIUser     externalSubscriptionAuthMode = "bearer_newapi_user"
	externalSubscriptionAuthCookieWithNewAPIUser     externalSubscriptionAuthMode = "cookie_newapi_user"
	externalSubscriptionAuthCookieWithModelFlareUser externalSubscriptionAuthMode = "cookie_modelflare_user"
	externalSubscriptionAuthOpenRouterAPIKey         externalSubscriptionAuthMode = "openrouter_api_key"
	externalSubscriptionAuthCloudflareTokenAccountID externalSubscriptionAuthMode = "cloudflare_token_account_id"
)

var externalSubscriptionSchemeDefinitions = map[string]externalSubscriptionSchemeSpec{
	ExternalSubscriptionSchemeHejuAPIKey: {
		template:        ExternalSubscriptionTemplateHejuAPIKey,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
		authMode:        externalSubscriptionAuthBearer,
	},
	ExternalSubscriptionSchemePixelAccessToken: {
		template:        ExternalSubscriptionTemplatePixelAccessToken,
		balanceStrategy: ExternalSubscriptionBalanceStrategyPixelUserQuota,
		authMode:        externalSubscriptionAuthAccessToken,
	},
	ExternalSubscriptionSchemeQLHazyCoderBearerToken: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyNewAPISubscription,
		authMode:        externalSubscriptionAuthBearer,
	},
	ExternalSubscriptionSchemeA6APICookieNewAPIUser: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyNewAPIUserQuota,
		authMode:        externalSubscriptionAuthCookieWithNewAPIUser,
	},
	ExternalSubscriptionSchemePackyCodeBearerNewAPIUser: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyNewAPIUserQuota,
		authMode:        externalSubscriptionAuthBearerWithNewAPIUser,
	},
	ExternalSubscriptionSchemeModelFlareCookieUser: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyNewAPIUserQuota,
		authMode:        externalSubscriptionAuthCookieWithModelFlareUser,
	},
	ExternalSubscriptionSchemeOpenRouterAPIKey: {
		template:        ExternalSubscriptionTemplateOpenRouterCredits,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
		authMode:        externalSubscriptionAuthOpenRouterAPIKey,
	},
	ExternalSubscriptionSchemeCloudflareAPITokenAccountID: {
		template:        ExternalSubscriptionTemplateCloudflareAIGatewayCredits,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
		authMode:        externalSubscriptionAuthCloudflareTokenAccountID,
	},
	ExternalSubscriptionSchemeNewAPIUserQuota: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyNewAPIUserQuota,
		authMode:        externalSubscriptionAuthLegacy,
	},
	ExternalSubscriptionSchemeNewAPISubscription: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyNewAPISubscription,
		authMode:        externalSubscriptionAuthLegacy,
	},
	ExternalSubscriptionSchemeActiveSubscriptions: {
		template:        ExternalSubscriptionTemplateActiveSubscriptions,
		balanceStrategy: ExternalSubscriptionBalanceStrategyActiveSubscriptions,
		authMode:        externalSubscriptionAuthLegacy,
	},
	ExternalSubscriptionSchemeBuzzBalance: {
		template:        ExternalSubscriptionTemplateBuzzBalance,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
		authMode:        externalSubscriptionAuthLegacy,
	},
	ExternalSubscriptionSchemeOpenRouterCredits: {
		template:        ExternalSubscriptionTemplateOpenRouterCredits,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
		authMode:        externalSubscriptionAuthLegacy,
	},
	ExternalSubscriptionSchemeCloudflareAIGatewayCredits: {
		template:        ExternalSubscriptionTemplateCloudflareAIGatewayCredits,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
		authMode:        externalSubscriptionAuthLegacy,
	},
	ExternalSubscriptionSchemeRawChatSubscriptions: {
		template:        ExternalSubscriptionTemplateRawChatSubscriptions,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
		authMode:        externalSubscriptionAuthLegacy,
	},
	ExternalSubscriptionSchemeMimoTokenPlan: {
		template:        ExternalSubscriptionTemplateMimoTokenPlan,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
		authMode:        externalSubscriptionAuthLegacy,
	},
	// These are retained only to read older custom settings. They are not
	// offered as current built-in UI schemes unless an existing provider uses
	// one of them.
	ExternalSubscriptionSchemeOpenAIBilling: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyOpenAIBilling,
		authMode:        externalSubscriptionAuthLegacy,
	},
	ExternalSubscriptionSchemeAuthMeBalance: {
		template:        ExternalSubscriptionTemplateActiveSubscriptions,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuthMeBalance,
		authMode:        externalSubscriptionAuthLegacy,
	},
	ExternalSubscriptionSchemeActiveWithAuthMeBalance: {
		template:        ExternalSubscriptionTemplateActiveSubscriptions,
		balanceStrategy: ExternalSubscriptionBalanceStrategyActiveWithAuthMeBalance,
		authMode:        externalSubscriptionAuthLegacy,
	},
}

func canonicalExternalSubscriptionSchemeForProviderID(providerID string) (string, bool) {
	switch strings.TrimSpace(strings.ToLower(providerID)) {
	case "heju", "hejuapi":
		return ExternalSubscriptionSchemeHejuAPIKey, true
	case "pixel":
		return ExternalSubscriptionSchemePixelAccessToken, true
	case "qlhazycoder":
		return ExternalSubscriptionSchemeQLHazyCoderBearerToken, true
	case "a6api":
		return ExternalSubscriptionSchemeA6APICookieNewAPIUser, true
	case "packycode":
		return ExternalSubscriptionSchemePackyCodeBearerNewAPIUser, true
	case "modelflare":
		return ExternalSubscriptionSchemeModelFlareCookieUser, true
	case "openrouter":
		return ExternalSubscriptionSchemeOpenRouterAPIKey, true
	case "cloudflare":
		return ExternalSubscriptionSchemeCloudflareAPITokenAccountID, true
	default:
		return "", false
	}
}

func canonicalExternalSubscriptionScheme(scheme string) bool {
	switch strings.TrimSpace(strings.ToLower(scheme)) {
	case ExternalSubscriptionSchemeHejuAPIKey,
		ExternalSubscriptionSchemePixelAccessToken,
		ExternalSubscriptionSchemeQLHazyCoderBearerToken,
		ExternalSubscriptionSchemeA6APICookieNewAPIUser,
		ExternalSubscriptionSchemePackyCodeBearerNewAPIUser,
		ExternalSubscriptionSchemeModelFlareCookieUser,
		ExternalSubscriptionSchemeOpenRouterAPIKey,
		ExternalSubscriptionSchemeCloudflareAPITokenAccountID:
		return true
	default:
		return false
	}
}

func externalSubscriptionSchemeRequiresUserID(scheme string) bool {
	switch strings.TrimSpace(strings.ToLower(scheme)) {
	case ExternalSubscriptionSchemeA6APICookieNewAPIUser,
		ExternalSubscriptionSchemePackyCodeBearerNewAPIUser,
		ExternalSubscriptionSchemeModelFlareCookieUser,
		ExternalSubscriptionSchemeCloudflareAPITokenAccountID:
		return true
	default:
		return false
	}
}

func externalSubscriptionAuthModeForConfig(cfg externalSubscriptionProviderConfig) externalSubscriptionAuthMode {
	definition, ok := externalSubscriptionSchemeSpecFor(cfg.Scheme)
	if !ok || definition.authMode == "" {
		return externalSubscriptionAuthLegacy
	}
	return definition.authMode
}

func externalSubscriptionSchemeSpecFor(scheme string) (externalSubscriptionSchemeSpec, bool) {
	definition, ok := externalSubscriptionSchemeDefinitions[strings.TrimSpace(strings.ToLower(scheme))]
	return definition, ok
}

func externalSubscriptionSchemeForPair(template, strategy string) string {
	template = strings.TrimSpace(strings.ToLower(template))
	strategy = strings.TrimSpace(strings.ToLower(strategy))
	if strategy == "" {
		strategy = defaultExternalSubscriptionBalanceStrategy("", template)
	}

	if template == ExternalSubscriptionTemplateHejuAPIKey {
		return ExternalSubscriptionSchemeHejuAPIKey
	}
	// Vendor schemes are selected from the provider ID during normalization.
	// Pair-only fallback is for custom/legacy records, except for the unique
	// Pixel template/strategy pair which is safe to identify without a vendor.
	if template == ExternalSubscriptionTemplatePixelAccessToken && strategy == ExternalSubscriptionBalanceStrategyPixelUserQuota {
		return ExternalSubscriptionSchemePixelAccessToken
	}
	for scheme, definition := range externalSubscriptionSchemeDefinitions {
		if !canonicalExternalSubscriptionScheme(scheme) && definition.template == template && definition.balanceStrategy == strategy {
			return scheme
		}
	}

	// `auto` is a legacy selector. Resolve it using the same template default
	// used by the runtime, so old settings still receive one bound scheme.
	if strategy == ExternalSubscriptionBalanceStrategyAuto {
		return externalSubscriptionSchemeForPair(template, defaultExternalSubscriptionBalanceStrategy("", template))
	}
	return ""
}

func externalSubscriptionSchemeForProvider(provider externalSubscriptionStoredProvider) string {
	if scheme := strings.TrimSpace(strings.ToLower(provider.Scheme)); scheme != "" {
		if _, ok := externalSubscriptionSchemeSpecFor(scheme); ok {
			return scheme
		}
	}
	return externalSubscriptionSchemeForPair(provider.Template, effectiveExternalSubscriptionBalanceStrategy(provider))
}
