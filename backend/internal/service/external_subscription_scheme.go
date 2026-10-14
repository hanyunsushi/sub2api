package service

import "strings"

type externalSubscriptionSchemeSpec struct {
	template        string
	balanceStrategy string
}

var externalSubscriptionSchemeDefinitions = map[string]externalSubscriptionSchemeSpec{
	ExternalSubscriptionSchemePixelAccessToken: {
		template:        ExternalSubscriptionTemplatePixelAccessToken,
		balanceStrategy: ExternalSubscriptionBalanceStrategyPixelUserQuota,
	},
	ExternalSubscriptionSchemeNewAPIUserQuota: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyNewAPIUserQuota,
	},
	ExternalSubscriptionSchemeNewAPISubscription: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyNewAPISubscription,
	},
	ExternalSubscriptionSchemeActiveSubscriptions: {
		template:        ExternalSubscriptionTemplateActiveSubscriptions,
		balanceStrategy: ExternalSubscriptionBalanceStrategyActiveSubscriptions,
	},
	ExternalSubscriptionSchemeBuzzBalance: {
		template:        ExternalSubscriptionTemplateBuzzBalance,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
	},
	ExternalSubscriptionSchemeOpenRouterCredits: {
		template:        ExternalSubscriptionTemplateOpenRouterCredits,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
	},
	ExternalSubscriptionSchemeCloudflareAIGatewayCredits: {
		template:        ExternalSubscriptionTemplateCloudflareAIGatewayCredits,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
	},
	ExternalSubscriptionSchemeRawChatSubscriptions: {
		template:        ExternalSubscriptionTemplateRawChatSubscriptions,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
	},
	ExternalSubscriptionSchemeMimoTokenPlan: {
		template:        ExternalSubscriptionTemplateMimoTokenPlan,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuto,
	},
	// These are retained only to read older custom settings. They are not
	// offered as current built-in UI schemes unless an existing provider uses
	// one of them.
	ExternalSubscriptionSchemeOpenAIBilling: {
		template:        ExternalSubscriptionTemplateNewAPIConsole,
		balanceStrategy: ExternalSubscriptionBalanceStrategyOpenAIBilling,
	},
	ExternalSubscriptionSchemeAuthMeBalance: {
		template:        ExternalSubscriptionTemplateActiveSubscriptions,
		balanceStrategy: ExternalSubscriptionBalanceStrategyAuthMeBalance,
	},
	ExternalSubscriptionSchemeActiveWithAuthMeBalance: {
		template:        ExternalSubscriptionTemplateActiveSubscriptions,
		balanceStrategy: ExternalSubscriptionBalanceStrategyActiveWithAuthMeBalance,
	},
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

	for scheme, definition := range externalSubscriptionSchemeDefinitions {
		if definition.template == template && definition.balanceStrategy == strategy {
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
