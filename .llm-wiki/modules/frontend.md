---
title: Frontend Module
updated: 2026-10-12
sources:
  - frontend/src/main.ts
  - frontend/src/App.vue
  - frontend/src/router/
  - frontend/src/stores/
  - frontend/src/views/admin/ExternalSubscriptionsView.vue
  - frontend/src/views/admin/AccountsView.vue
  - frontend/src/views/admin/SettingsView.vue
  - frontend/src/views/user/KeysView.vue
---

# Frontend Module

## Upstream v0.2.12–v0.2.15 integration

The development branch now includes `upstream/main` `9591136d45cef26453348ed9532a7ebbce7cf99c` through merge commit `076106755be184981cafe70411eef60d4cbef101`. Official additions include account priority quick adjustment, the built-in platform catalog, recharge-bonus settings, monitor-v2 settings and the related lifecycle/request reliability fixes. The merge keeps the official presentation contract while leaving the retained external-subscription, logo and account-quota extensions attached to their official surfaces. The source includes the merged update and official-menu restoration; running release evidence belongs to the Project Authority.

## Responsibility

Vue 3/Vite owns route views, client state and API interaction. The maintained presentation is the merged official frontend, including official light/dark mode, component utilities, layout, controls, charts and auth behavior. It is not the former Anthropic/Kreeperai design system.

## Functional Extensions

| Area | Active implementation |
| --- | --- |
| External provider CRUD and Pixel/A6API credential forms | `ExternalSubscriptionsView.vue`, `api/admin/externalSubscriptions.ts` |
| Account quota-bar matching, totals and token windows | `AccountsView.vue`, quota progress utility/composable/modal |
| Entity logo editing/display | Official key/group/channel/monitor forms plus `LogoPicker` and `ProviderBrandIcon` |
| Shared AI-logo library and CDN | `providerBrandIcon.ts`, AI-logo settings APIs |
| Site branding | Official site name/logo settings and safe favicon injection |

The [customization inventory](../concepts/customization-inventory.md) defines the complete active/retired boundary and cross-module persistence paths. External subscription management and account quota consumers enforce admin access. Auth-store changes clear external snapshots independently of mounted UI. Header balances, V1 shared capacity, PWA extensions, the shared menu-icon library and direct menu redirects are removed. Menu icons use official `ImageUpload`; menu visibility, sorting, Markdown/embed and open-button controls follow official code. The account management page renders cards at desktop and mobile sizes while preserving selection, bulk actions, sort, and quota display. Account-local styles compact the cards with 12px padding, 12px card gaps and 6px field-row gaps. Short label/value fields share lines; long metadata spans both columns. Today stats, external quota and proxy details wrap, actions retain icons and labels in one row, and cards keep their own content height. Enabled fields and persistent column preferences remain unchanged.

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
