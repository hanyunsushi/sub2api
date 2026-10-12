---
title: Customization Inventory
updated: 2026-10-12
sources:
  - backend/internal/server/routes/admin.go
  - backend/internal/service/external_subscription_config_service.go
  - backend/internal/service/external_subscription_service.go
  - backend/internal/service/setting_branding.go
  - backend/internal/handler/dto/settings.go
  - backend/internal/web/embed_on.go
  - frontend/src/views/admin/ExternalSubscriptionsView.vue
  - frontend/src/views/admin/AccountsView.vue
  - frontend/src/views/admin/SettingsView.vue
  - frontend/src/utils/providerBrandIcon.ts
  - frontend/src/stores/auth.ts
---

# Customization Inventory

## Boundary

The user decision is official frontend presentation and behavior, with existing functional extensions retained. The official baseline is the already merged local `upstream/main` commit `42bc7f6cffe24bcb471608e48e66b4a0afa1f882`. The restoration is committed on `codex/cpa-management` and deployed to OCI. The protection branch is `backup/frontend-before-official-restore-20261011`; exact commits, runtime evidence and rollback state are owned by the Project Authority.

The [file appendix](customization-files.md) accounts for 187 current paths, including working-tree changes, tests, generated code and historical migrations. The earlier 746-path audit described the pre-restoration tree and is not the current inventory. CodeGraph is unavailable in this tool session; evidence comes from Git, source/API wiring, Vue/TypeScript parsing and tests.

## Retained Functional Extensions

### External subscriptions

The admin route `/admin/settings/external-subscriptions` and backend collection `/api/v1/admin/external-subscriptions` retain provider CRUD, statuses/forced refresh, display snapshots and account quota-progress settings. The API does not return saved tokens. Omitted secrets preserve existing credentials. Deleting a built-in provider remains protected by `external_subscription_deleted_default_providers`.

Templates: `newapi_console`, `active_subscriptions`, `buzz_balance`, `openrouter_credits`, `cloudflare_ai_gateway_credits`, `rawchat_subscriptions`, `mimo_token_plan`, `pixel_access_token`. Strategies: `auto`, `pixel_user_quota`, `openai_billing`, `newapi_user_quota`, `newapi_subscription`, `active_subscriptions`, `auth_me_balance`, `active_with_auth_me_balance`.

Built-in providers remain Buzz, TCDMX, qlhazycoder, XHYAPI, Pixel, A6API, liust, PackyCode, OpenRouter, Cloudflare AI Gateway, RawChat and Xiaomi MiMo. Provider probes retain parallel execution, six-second timeouts, per-provider errors, 60-second fresh and 30-minute stale caches and persisted display snapshots.

Pixel retains console Access Token Bearer requests to `/api/status` and `/api/user/self`, provider quota conversion and CNY support, without a refresh-token request. A6API retains browser Cookie plus `New-API-User`. Other protocols and migrations are unchanged by the frontend restoration.

The editor uses official shared components and gray/primary/dark utilities. Header balance summaries and V1 monitor shared-capacity displays are removed; the official header and monitor grid do not fetch or subscribe to external statuses. Remaining admin/editor and account quota consumers retain display snapshots. Auth-store identity and permission changes synchronously clear cached snapshots, and a generation guard prevents pending requests from repopulating cleared browser storage.

### Account external quota bars

`AccountsView` uses a responsive card grid at all viewport widths, while retaining provider matching, external balances/expiry, quota-bar settings, bulk selection/actions and sorting. `DataTable` renders its existing mobile-card cells in the grid, and swipe selection resolves cards by both pointer coordinates. `externalSubscriptionMatch.ts`, `externalSubscriptionQuotaProgress.ts`, `useAccountExternalQuotaProgressSettings.ts` and `ExternalQuotaProgressSettingsModal.vue` support `status_total`, `custom_total` and `token_total`, with custom totals and token reset dates. Backend account-list token statistics and settings persistence remain active. Save failures keep the dialog available and report an error.

### Entity logos and shared libraries

`logo_url` remains persisted for API keys, groups, channels and channel monitors through handler, service, repository, DTO, authentication-cache and generated Ent paths. Migrations 144 and 145 remain unchanged. The official forms retain logo editing and clear-to-empty payloads; group creation/editing supports standard and simple modes. Account logos still read existing `extra.custom_logo_url` or `extra.logo_url` metadata, without a new account column.

`LogoPicker`, `ProviderBrandIcon`, group badges/selectors and monitor/channel/key/group rows display these logos without restoring the old theme. Authenticated shared-library endpoints remain `/api/v1/settings/ai-logo-presets` and `/api/v1/settings/custom-menu-svg-icon-presets`. Frontend and backend AI-logo limits are both 64; menu icons are limited to 48. Public/admin settings retain CDN configuration and normalized HTTP(S) custom URLs.

### Custom menus and site branding

Official menu SVG rendering, sorting, user/admin visibility and Markdown/embed behavior are retained, with the local shared SVG-icon library and `open_mode` (`iframe` or `redirect`). `CustomPageView` redirects only HTTP(S) embedded URLs and keeps official API-prefix handling, Markdown sanitation and drag behavior. `hide_open_button` is now retained by the Go DTO as well as the frontend, including a JSON round-trip regression test.

Official site name/logo and safe favicon injection remain. PWA metadata, Apple touch/192/512 PNG assets, manifests, icon-version injection and server PNG rendering are removed. The embedded web provider returns only official public settings; no-logo fallback is the official SVG favicon. Logo CDN and shared preset fields are wired through public/admin settings and initial HTML injection.

## Restored Official Frontend

Bootstrap, light/dark theme, Tailwind/base CSS, Home/auth/recovery pages, navigation, tables, selects, dialogs, charts, usage, ranking, subscriptions, payment, risk and operational screens are restored to the merged official baseline except the explicit extensions above and focused correctness/whitespace fixes. Official user analytics charts/filter loading, admin rankings, key status guards, billing-mode selector and numerical fallback handling are no longer removed by the local presentation layer.

Removed: Anthropic/Kreeperai global theme and repair/text-action CSS, forced-light lifecycle, custom fonts, landing WebGL/OGL and decorative assets, local route-shell/hover/card/mobile contracts, legacy locale override trees, custom chunk-recovery logic, local frontend-index script and Anthropic ast-grep theme rules. Official tests are restored; obsolete local visual-contract tests are removed, while functional tests are retained or replaced by mount/API tests.

The earlier branded card/grace decoration and priority +/- shortcuts are not restored; the account card layout uses the official shared components and utilities. Priority remains available through official account edit/bulk-edit flows. User page-size behavior and monitor availability semantics follow official code.

Human README/layout/auth guides and `frontend-rules/README.md` are retained as historical documents, not active design authority. Their theme examples do not authorize reintroducing removed code. The authority and current Wiki supersede them.

## Backend Compatibility and Retirement

The retired `appearance_theme_default` constant, DTO fields, defaults, parser, update method, route and tests are removed. Historical stored values are neither queried nor returned; this source cleanup does not mutate a production database. Notification-email verification retains the official bilingual HTML and footer; site name and code are escaped, and both displayed expiry values derive from the shared verification TTL.

The account-handler constructor uses the official typed signature; account external quota configuration remains attached through its dedicated setter and Wire provider. The dormant foreign-key error helper and unused Go dependencies/checksums are removed. Supporting fixes retain the frontend auth-source-default fallback, pinned Docker pnpm version, entrypoint read/execute permissions, legal-document build-context handling and the Vite development proxy. The extra `update-ca-certificates` command was removed because no custom CA is copied into the image. The notification-email template keeps official markup while escaping interpolated values and using the actual TTL. `openai_gateway_count_tokens.go`, `instructions_gpt5_2.txt`, Stripe SVG, several controls and DTO field rearrangements differ only in whitespace/formatting or declaration order; they are not additional custom runtime features. General Responses token accounting is therefore not listed as a retained local behavior against this baseline.

CPA/Codex management, dedicated global pricing, schedule locks, monitor-driven multi-account auto-scheduling, Cloudflare AI Search, Creepee SSO, the old custom email template and bracket/rollback CSS remain retired. Historical migrations 108/151/152 are kept with removal migrations 231/241; they are not active UI or service entrypoints.

## Verification Boundary

Current test/build results and deployment status belong to the [Project Authority](../../agent.md). Tests prove source contracts, not authenticated production rendering or live provider credentials. Production has received the earlier frontend restoration; the account-card source change is uncommitted and not deployed. Vite defaults to `http://localhost:8080`; the ignored local `frontend/.env.local` keeps the user-owned 3001 preview pointed at production API `https://ai.kreeper.cc`. This proxy setting does not deploy code.

## See Also

[Frontend](../modules/frontend.md)

[Backend](../modules/backend.md)

[File Appendix](customization-files.md)
