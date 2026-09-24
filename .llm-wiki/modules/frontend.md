---
title: Frontend Module
updated: 2026-09-24
sources:
  - frontend/src/main.ts
  - frontend/src/App.vue
  - frontend/src/router/
  - frontend/src/stores/
  - frontend/src/views/admin/UsageView.vue
  - frontend/src/views/user/UsageView.vue
  - frontend/src/views/admin/GroupsView.vue
---

# Frontend Module

## Upstream v0.2.8 integration and release

The merged frontend includes the upstream v0.2.8 account usage, risk-control, backup/archive, affiliate withdrawal, signed-thinking and paginated-export surfaces while preserving the local Anthropic/Kreeperai styling, external-subscription controls and existing route contracts. The production OCI image was built from the merged source and verified through representative public routes and a static asset.

The frontend is a Vue 3 single-page application built with Vite. `main.ts` creates the app, Pinia, router and i18n, applies appearance settings, then mounts after initial navigation is ready.

## Responsibility

- Own route views, admin/user interaction, client state, API calls and presentation.
- Do not treat client state or local configuration as proof of provider-side balances, quotas or production health.

## Key Files

| File/area | Purpose |
| --- | --- |
| `src/main.ts` | Bootstrap and global style registration |
| `src/App.vue` | Setup gate, public settings, auth-driven polling |
| `src/router/` | Routes and document titles |
| `src/api/` | Typed API clients |
| `src/stores/` | Pinia state and lifecycle management |
| `src/views/` | Route-level screens |

## Style Ownership

- `src/style.css` owns base tokens and shared theme rules. `src/styles/targeted-visual-repair.css` owns maintained component and route contracts that intentionally run after the base sheet.
- `src/styles/final-bracket-repair.css` and `src/styles/bracket-rollback-eof.css` remain ordered global interaction/rollback layers; their later position is intentional for shared and teleported elements.
- When cleaning cascade duplication, remove only declarations later overridden by the same exact selector in the same media/supports context. Keep state, portal, and responsive branches separate, and verify computed winners remain unchanged.

## Current Capability Surface

- Admin and user usage views share request-type, compaction and billing filters with date-range analytics; queries normalize new request types to the legacy stream parameter where the API still requires it.
- Group management exposes the official OpenAI fast-mode and reasoning-effort policy controls while retaining the local route-shell and Anthropic/Kreepai presentation contract.
- Channel/model pricing surfaces render long-context cache tiers, image/video/per-request billing and provider/model branding through the shared API contracts.
- The `v0.2.1` merge adds account upstream-request-ID header editing, Codex manifest account controls, refreshed account/channel/group usage surfaces and the corresponding localized labels while retaining the local visual contract.
- The `v0.2.7` merge adds the upstream provider/account/group controls, model-allowlist terminology, bulk subscription/key flows and refreshed operational views. TypeScript compilation and Vite production bundling pass; the locale completeness gate still reports divergence between retained local customization keys and the upstream locale schema.
- AccountsView restores the local account-card table contract: 300px minimum auto-fit tracks, external quota progress controls, one-minute calling grace state, semantic calling/paused row classes, text actions and highlighted More menu. Rate multiplier changes remain in table and bulk-edit flows; no card shortcut popup is exposed.
- SettingsView uses text-only `route-tabs settings-route-tabs` with a shared moving indicator and preserves custom-menu ordering/open-mode controls. AccountActionMenu supports both viewport-anchored and legacy row-position invocation so teleported menus remain usable across account-card layouts.

## Responsive Visual Contracts

- `DataTable` exposes `.data-table-mobile-cards` and `.data-table-mobile-card` for the shared narrow-screen card renderer. Cards are capped at 22.5rem and return to full width below 480px.
- AccountsView keeps its table-backed account cards on `300px`-minimum `auto-fit` grid tracks at wide and `mobile-mode` widths; the tracks share remaining space to align the row with the container edges, and below 480px the single track returns to full width. The shared generic mobile card renderer remains capped at `22.5rem`.
- AccountsView does not expose a separate rate-multiplier shortcut in the card corner; rate changes remain available through the account table editing flows.
- Channel monitor loading and populated grids share `.monitor-channel-card-grid` and `.monitor-channel-card` and follow the same narrow-screen cap.
- Profile identity/status chips and account status indicators use solid semantic backgrounds with light text; other badges retain the neutral Atelier treatment.
- `FloatingDropdown` menus are teleported to `body`; profile-menu bracket rollback therefore lives in `bracket-rollback-eof.css` with a body-level selector.

These selectors are source-level contracts for focused tests and computed-style checks when a real browser pass is required; they do not imply a production release.

## See Also

- [Backend Module](backend.md)
- [Development and Testing](../guides/development-and-testing.md)
