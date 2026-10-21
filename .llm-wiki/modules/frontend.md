---
title: Frontend Module
updated: 2026-10-19
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

## Upstream v0.2.12–v0.2.15 integration

The development branch now includes `upstream/main` `9591136d45cef26453348ed9532a7ebbce7cf99c` through merge commit `076106755be184981cafe70411eef60d4cbef101`. Official additions include account priority quick adjustment, the built-in platform catalog, recharge-bonus settings, monitor-v2 settings and the related lifecycle/request reliability fixes. The merge keeps the official presentation contract while leaving the retained external-subscription, logo and account-quota extensions attached to their official surfaces. The source includes the merged update and official-menu restoration; running release evidence belongs to the Project Authority.

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

`main.ts`, `App.vue`, `style.css`, Tailwind, the modular locales and shared controls follow the official baseline. Local repair/text-action CSS, forced Anthropic theme, custom fonts, OGL/landing effects, legacy locale trees and visual source-contract tests are removed. Component-local styles only frame the retained new tools using official utilities.

## Development and Verification

Vite retains `VITE_DEV_PROXY_TARGET` and defaults to `http://localhost:8080`. The ignored local `frontend/.env.local` overrides the target to `https://ai.kreeper.cc` for the user-owned 3001 preview. This development proxy is not a source release. Tests isolate child/API requests; retained functional coverage includes logo editing, menu flags, quota progress, Pixel payloads, quota cache invalidation, session changes and absence of header/monitor balance fetching.

Exact current checks, protection point and production status are owned by the [Project Authority](../../agent.md). No browser/authenticated production validation is inferred from typecheck/build or mount tests.

## See Also

- [Customization Inventory](../concepts/customization-inventory.md)
- [Backend](backend.md)
- [Development and Testing](../guides/development-and-testing.md)

AI-owned shared visual adaptation and standalone/Console integration boundaries are described in [Kreepai Shared Design System](embedded-design-system.md).
