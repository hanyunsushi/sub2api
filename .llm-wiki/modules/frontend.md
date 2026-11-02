---
title: Frontend Module
updated: 2026-11-02
sources:
  - frontend/src/main.ts
  - frontend/src/App.vue
  - frontend/src/router/
  - frontend/src/stores/
  - frontend/src/views/admin/ExternalSubscriptionsView.vue
  - frontend/src/views/admin/AccountsView.vue
  - frontend/src/components/account/AccountUsageCell.vue
  - frontend/src/components/account/UsageProgressBar.vue
  - frontend/src/views/admin/SettingsView.vue
  - frontend/src/views/user/KeysView.vue
---

# Frontend Module

## Current upstream integration

The v0.2.19 source adds feature-gated MCP connections/consent, administrator-key permission management, Grok model diagnostics and group image-count billing. The account platform/status filters persist through the official storage path; the existing accessible secondary-filter panel remains available. External-subscription navigation is retained alongside the MCP entry, including simple mode. Details and source owners are in [Upstream Management and Billing](../guides/upstream-management-and-billing.md).

The frontend uses vue-i18n 11 and the matching message compiler. Vite retains the CSP-compatible runtime alias; JIT compilation is enabled by the library, so the v9-only explicit define is removed. Native and Console ESM builds remain separate verification targets.

## Console opt-in integration

The independent [Console adapter](console-microfrontend.md) adds a separate ESM build, embedded layout/lifecycle and real account-page topbar callbacks. Standalone and Console share the [AI-owned first-design-system visual layer](embedded-design-system.md); business behavior and original backend API ownership remain unchanged.

## Responsibility

Vue 3/Vite owns route views, client state and API interaction. The maintained presentation uses kreeper-first-design-system in the original Vue components, shared styles and instance chart helpers. Existing authentication, feature/role menus, API calls and light/dark preference remain owned by the application. The retired Anthropic/Kreeperai tokens are not reintroduced.

## Functional Extensions

| Area | Active implementation |
| --- | --- |
| External provider CRUD and Pixel/A6API/ModelFlare credential forms | `ExternalSubscriptionsView.vue`, `api/admin/externalSubscriptions.ts` |
| Account quota-bar matching, totals and token windows | `AccountsView.vue`, quota progress utility/composable/modal |
| Entity logo editing/display | Official key/group/channel/monitor forms plus `LogoPicker` and `ProviderBrandIcon` |
| Shared AI-logo library and CDN | `providerBrandIcon.ts`, AI-logo settings APIs |
| Site branding | Official site name/logo settings and safe favicon injection |

The external-subscription editor exposes one bound configuration scheme instead of separate template and balance-strategy selectors. The current presets are seven vendor/authentication contracts: PixelAPI: Access Token, QLhazycoder: Bearer console token, A6API: Cookie + New-API-User, PackyCode: Bearer console token + New-API-User, ModelFlare: Cookie + X-ModelFlare-User, OpenRouter: API Key, and Cloudflare: API Token + Account ID. Each preset fills its actual provider, URL, credential labels, required identifier and account-match keywords. Legacy schemes remain readable when editing old stored providers but are not offered for new configuration; the API still preserves the old enum values for compatibility. The former five generic preset cards are replaced by these seven complete provider presets.

The [customization inventory](../concepts/customization-inventory.md) defines the complete active/retired boundary and cross-module persistence paths. External subscription management and account quota consumers enforce admin access. Auth-store changes clear external snapshots independently of mounted UI. Header balances, V1 shared capacity, PWA extensions, the shared menu-icon library and direct menu redirects are removed. Menu icons use official `ImageUpload`; menu visibility, sorting, Markdown/embed and open-button controls follow official code. The account management page renders cards at desktop and mobile sizes while preserving selection, bulk actions, sort, and quota display. Account-local styles compact the cards with 12px padding, 12px card gaps and 6px field-row gaps. The account grid uses a 260px minimum track width, adding columns when space allows while keeping a full-width single column on narrow screens. Priority labels and controls wrap together when needed, retaining four-digit values and +/- editing. Short label/value fields share lines; long metadata spans both columns. Today stats, external quota and proxy details wrap, actions retain icons and labels in one row, and cards keep their own content height. Enabled fields and persistent column preferences remain unchanged. Shared account-usage statistics rows wrap badges at their available width; each request/token/A-cost/U-cost/estimated-total-cost badge stays on one line, retaining the complete value without clipping.

## Official Behavior

User analytics/filter loading, admin rankings, site billing-mode controls, key expired/exhausted status guards, bulk subscription/key actions, payment, risk-control, operations, provider/model policies and normal monitoring use official implementations. External extensions must not replace these capabilities.

Business flows and modular locales follow the upstream baseline. Shared controls, fonts, motion and layout follow the AI-owned design layer described above; native and Console views use the same implementation. The retired Anthropic theme and landing effects remain removed.

## Development and Verification

Vite retains `VITE_DEV_PROXY_TARGET` and defaults to `http://localhost:8080`. The ignored local `frontend/.env.local` overrides the target to `https://ai.kreeper.cc` for the user-owned 3001 preview. This development proxy is not a source release. Tests isolate child/API requests; retained functional coverage includes logo editing, menu flags, quota progress, Pixel payloads, quota cache invalidation, session changes and absence of header/monitor balance fetching.

Exact current checks, protection point and production status are owned by the [Project Authority](../../agent.md). No browser/authenticated production validation is inferred from typecheck/build or mount tests.

## See Also

- [Customization Inventory](../concepts/customization-inventory.md)
- [Backend](backend.md)
- [Development and Testing](../guides/development-and-testing.md)

AI-owned shared visual adaptation and standalone/Console integration boundaries are described in [Kreepai Shared Design System](embedded-design-system.md).
