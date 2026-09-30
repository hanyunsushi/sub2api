---
title: Frontend Module
updated: 2026-09-30
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

## Merge `upstream/main` and OCI release (2026-09-30)

The frontend portion of merge commit `88cb179b63d185b8e79f6a89a720eaa3b3e60c49` retains official usage, dashboard metric, model whitelist, OpenAI plan and CC Switch behavior while preserving the current Anthropic/Kreeperai labels, semantic colors, toolbar, overlay and table contracts. The final frontend gates passed: Vitest `398/398` files and `2931/2931` tests, typecheck, lint with 0 errors and 5 existing warnings, i18n `3/3`, and production build.

The OCI application image built from the code commit is `sub2api-custom:codex@sha256:d914d2372f2a3dc23ed9a616265598f63241b63da8861724233b97d4865d9afd`; the public version is `0.2.11`. Production representative routes and assets returned 200. Documentation-only changes after the image build are not part of the running image.

## Upstream v0.2.8 integration and release

The merged frontend includes the upstream v0.2.8 account usage, risk-control, backup/archive, affiliate withdrawal, signed-thinking and paginated-export surfaces while preserving the local Anthropic/Kreeperai styling, external-subscription controls and existing route contracts. The production OCI image was built from the merged source and verified through representative public routes and a static asset.

The frontend is a Vue 3 single-page application built with Vite. `main.ts` creates the app, Pinia, router and i18n, applies appearance settings, then mounts after initial navigation is ready.

## Official/custom behavior boundary and verification

- Official behavior is kept aligned with the upstream contract. Local Anthropic/Kreeperai visual and interaction behavior remains in place for shared controls, toolbars, overlays and tables; the Klein blue theme is not restored.
- `src/utils/platformColors.ts` keeps platform labels and icon identity while mapping shared surfaces, borders, text and controls to Anthropic semantic variables instead of provider-specific color ramps.
- `SettingsView` test mounts stub the optional settings APIs, affiliate API and child pickers that otherwise request public settings during mount. This keeps the test contract representative without making network calls.
- Final frontend gates: Vitest `398/398` files and `2931/2931` tests passed with no unhandled errors; `pnpm run typecheck` passed; `pnpm run lint:check` passed with 0 errors and 5 pre-existing warnings; `pnpm run build` passed with i18n completeness `3/3`; `git diff --check` passed. The code was then released to OCI as the application-only release documented at the top of this page.

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
- `src/styles/text-action-contract.css` is the single global text-control contract for shared and teleported elements. It keeps the current underline hover/focus behavior, transparent filter rows and native selected checkmarks; generated marker pseudo-elements and rollback layers are not part of the active contract.
- `src/styles/targeted-visual-repair.css` owns maintained component and route contracts that intentionally run after the base sheet. Retired page-specific selectors and compatibility-only utility rules must be removed instead of being overridden by a later cascade.

## Current Capability Surface

- The admin external-subscription form identifies the A6API provider and labels its credential field as a browser login Cookie. The value is sent only to the backend configuration flow; model API keys are not presented as a supported balance credential.
- The A6API form keeps the User ID field visible even with `NewAPI User Quota`, because A6API requires the `New-API-User` header alongside the Cookie.

- Admin and user usage views share request-type, compaction and billing filters with date-range analytics; queries normalize new request types to the legacy stream parameter where the API still requires it.
- Group management exposes the official OpenAI fast-mode and reasoning-effort policy controls while retaining the local route-shell and Anthropic/Kreepai presentation contract.
- Channel/model pricing surfaces render long-context cache tiers, image/video/per-request billing and provider/model branding through the shared API contracts.
- The `v0.2.1` merge adds account upstream-request-ID header editing, Codex manifest account controls, refreshed account/channel/group usage surfaces and the corresponding localized labels while retaining the local visual contract.
- The `v0.2.7` merge adds the upstream provider/account/group controls, model-allowlist terminology, bulk subscription/key flows and refreshed operational views. TypeScript compilation, locale completeness checks and Vite production bundling pass.
- `SubscriptionsView` preserves the local Anthropic/Kreeperai toolbar, teleported dropdown and table styling while restoring the upstream subscription-management contracts: selectable bulk subscription actions, official current-user assignment search through `adminAPI.users.list`, up-to-100-user batch assignment, partial-failure retention for retry, selection clearing on page/sort/filter changes, and links from each user to filtered admin usage records. The history filter continues to use the usage search endpoint so deleted users remain discoverable in subscription history.
- AccountsView restores the local account-card table contract: 300px minimum auto-fit tracks, external quota progress controls, one-minute calling grace state, semantic calling/paused row classes, text actions and highlighted More menu. Rate multiplier changes remain in table and bulk-edit flows; no card shortcut popup is exposed.
- SettingsView uses text-only `route-tabs settings-route-tabs` with a shared moving indicator and preserves custom-menu ordering/open-mode controls. AccountActionMenu supports both viewport-anchored and legacy row-position invocation so teleported menus remain usable across account-card layouts.
- The dedicated global-pricing route, view, API client and page-specific styles are removed. Pricing remains available through the model plaza, available-channel and admin channel/model-pricing surfaces.
- Channel-monitor forms expose only the quota monitor's single `account_id`; the retired multi-account auto-scheduling controls and schedule-lock UI are removed. Batch account management keeps its unrelated `account_ids` flows.

## Responsive Visual Contracts

- `DataTable` exposes `.data-table-mobile-cards` and `.data-table-mobile-card` for the shared narrow-screen card renderer. Cards are capped at 22.5rem and return to full width below 480px.
- AccountsView keeps its table-backed account cards on `300px`-minimum `auto-fit` grid tracks at wide and `mobile-mode` widths; the tracks share remaining space to align the row with the container edges, and below 480px the single track returns to full width. The shared generic mobile card renderer remains capped at `22.5rem`.
- AccountsView does not expose a separate rate-multiplier shortcut in the card corner; rate changes remain available through the account table editing flows.
- Channel monitor loading and populated grids share `.monitor-channel-card-grid` and `.monitor-channel-card` and follow the same narrow-screen cap.
- Profile identity/status chips and account status indicators use solid semantic backgrounds with light text; other badges retain the neutral Atelier treatment.
- `FloatingDropdown` menus are teleported to `body`; the profile menu is covered by the body-level rules in `text-action-contract.css`.

These selectors are source-level contracts for focused tests and computed-style checks when a real browser pass is required; they do not imply a production release.

## See Also

- [Backend Module](backend.md)
- [Development and Testing](../guides/development-and-testing.md)
