---
title: Console Microfrontend Adapter
updated: 2026-10-19
sources:
  - backend/internal/handler/auth_oidc_console.go
  - backend/internal/handler/auth_oidc_oauth.go
  - backend/internal/handler/auth_oidc_console_test.go
  - frontend/src/runtime/
  - frontend/src/router/index.ts
  - frontend/src/App.vue
  - frontend/vite.config.ts
  - frontend/scripts/microfrontend-css-scope.mjs
---

# Kreepai Console adapter

This is an opt-in independent ESM build for the separate Kreeper Console Host. The standalone build, business APIs and authorization remain owned by this repository. No production deployment is implied.

`frontend/src/runtime/microfrontend.ts` exports `mount`, returning `navigate`, `dispatchTopbarAction`, `logout` and `unmount`. The context supplies `initialPath`, `onNavigate`, `onTopbarActions` and optional `onSession`/`onNavigation`. Embedded routes use memory history; the Host owns browser history and prefixes. `console-actions.ts` registers real page callbacks and action state without changing standalone page visuals.

Native CSS `@scope` contains the build stylesheet. Root typography/tokens can reach owned overlays, but viewport layout does not. The scope is a style boundary, not a security sandbox. Build-time helpers stay local to each independent repository, with no dependency on the Host source tree.

The ordinary router keeps Web History. Embedded AppLayout keeps AppHeader mounted and Teleports only its original controls into the Host topbar target. Embedded App mounts the original AppSidebar headlessly outside route-owned layouts: original menu computations run, but its sidebar DOM and global theme initialization do not. Existing public/admin settings, billing-mode labels, custom entries and simple-mode filters provide the Host navigation tree. Independent auth state publishes only username/admin/authenticated descriptors, never tokens. Onboarding autostart remains disabled. The AI-owned [shared visual layer](embedded-design-system.md) supplies the same first-design-system content styles to standalone and Console builds; only integration geometry belongs to runtime.

`console-navigation.ts` supplies original public home, Key usage and model plaza outside AppLayout, respecting backend mode, plaza enablement and authentication requirements; only anonymous-safe leaves carry `public: true`. The Host sidebar shows only home while anonymous and the original permission-filtered business tree while authenticated; public Key usage/model-plaza remain search/title descriptors with `sidebar:false`. The full filtered tree remains available for search and titles. `console-topbar.ts` supplies login/registration according to the real session, current route and registration/backend-mode settings, or a dashboard action on authenticated public pages. Model-plaza login preserves its original return destination. Sanitized documentation and the original two-language switch/reload handler remain topbar controls, with language/book icons rendered by the fixed Host style. The embedded Host theme remains fixed.

`createConsoleActionBridge` merges application controls with page refresh/create handlers; old-page cleanup cannot clear replacement handlers or application controls, and dispatch respects disabled/loading state. The mount adapter merges real authenticated sidebar menus and republishes when settings/session change. Embedded HomeView, KeyUsageView and ModelPlazaView omit their own public navigation; home/Key usage theme initialization cannot change the Host document theme. Standalone headers/theme behavior and original router guards remain intact.

The optional `onPageLayout` callback reports the resolved route's standalone/full-page presentation separately from business content. Public metadata selects `page`; authenticated `model-plaza?embedded=1` keeps AppLayout's `content` mode. The Host retains its navigation and removes only its extra dashboard padding/max-width for full pages. MFE-only `runtime/page-layout.css` maps the existing minimum heights and auth single-column rules to the available `console-page` region. Current page markup, fonts, colors and internal padding/margins remain intact; standalone CSS/builds do not import this adapter stylesheet.

Only the MFE Vue compilation redirects static body Teleports to `#console-kreepai-overlays`; standalone templates remain untouched. CSS includes the original Tailwind utilities within the application scope. Requests compile with `VITE_API_BASE_URL=/api/kreepai/api/v1`; setup status still uses `/setup/status`. Embedded 401/ops redirects call the child router rather than leaving the Host. Unmount aborts requests, stops auth/subscription background work, removes route hooks/prefetch and owned overlays, and disposes Pinia without erasing persistent credentials.

Original account/user/group/channel/proxy/external-subscription/dashboard refresh/create controls stay in their original page in both modes. These pages no longer register page actions with the Host; only original header/public navigation controls are published. The earlier page-action promotion is superseded by the user’s explicit placement correction. BaseDialog preserves its focus/confirmation model and temporarily borrows/restores the Host body scroll lock while one or more embedded dialogs are open. The router initializes authentication per store instance so switching away/back restores the same persisted session into a fresh Pinia store.

Build: `cd frontend && pnpm run build:microfrontend`. Output is `frontend/output/microfrontend/` with `kreepai-microfrontend.js`, `style.css` and hashed assets. Scripts explicitly read `vite.config.ts`; ignored generated `vite.config.js` must not shadow source configuration. Artifact verification checks public ESM exports, scoped CSS, API prefix and Teleport adapter. ESLint ignores generated `output/` artifacts; source lint does not parse bundled vendor code. Other local scripts remain ignored.

Release builds may set `CONSOLE_MFE_ASSET_BASE` and `CONSOLE_MFE_OUT_DIR` to pin assets to an immutable Console version and stage output outside the default output. The artifact verifier follows the selected directory. The embedded auth layout also resolves its default logo through the selected asset base. These options apply only to MFE builds; standalone output, Web History and API configuration retain their original behavior. The [Host release guide](/Users/hinaw/console-kreeper/.llm-wiki/guides/releases.md) owns packaging, provenance, activation and rollback; it does not redeploy this backend.

## Optional application version

The mount context accepts optional `onVersion(version: string)`. Its scoped `watchEffect` publishes `appStore.siteVersion`, which comes from the real public settings response, alongside the existing independent session/navigation updates. Disposal stops that publication with the mount subscriptions. The Host stages the version in `ConsolePresentation` and displays it only for the owning project; older Hosts/children need not implement the extension. This does not substitute a frontend package or Console release number for an application version.

Native and MFE page preparation now share the application-owned [request-gated loading and motion](embedded-design-system.md#request-gated-loading-and-motion). Runtime remains the mount/route/style/Host bridge; it does not maintain a second motion system or acquire Host navigation as a page animation target. Version publication and the mount-to-page-loading handoff have source evidence; their final tests/browser receipts are pending.

## Initial project readiness

Mount resolves the real public configuration before publishing the initial action/session set. The Host stages those events and current page handlers, then commits a complete topbar presentation; it keeps the operation group hidden/inert with preserved geometry while pending. This does not change original standalone authentication or handlers.

## Independent authentication in Console

Backend compatibility is implemented in `backend/internal/handler/auth_oidc_console.go`. For the exact preserved Console Host, OIDC start/callback use the same additional Console API callback and return to `/kreepai/auth/oidc/callback`. All other hosts retain the original settings; the issuer/client, account identity mapping, PKCE/state/nonce checks and token issuance remain owned by the AI backend. The Console gateway must namespace temporary OAuth and pending-flow cookie paths, including deletion, under `/api/kreepai`. Registration and gateway instructions are owned by the [Host OIDC guide](/Users/hinaw/console-kreeper/.llm-wiki/guides/console-oidc.md). Local signed-provider tests validate token-exchange redirect URI, token issuance, original configuration and missing-proof rejection; they do not prove production Authentik login.

Embedded memory history uses `/kreepai` as its href base; internal child paths remain unchanged. The returned `logout` waits for the original auth store, then replaces the child route with `/login`. The Host serializes this with unmount and clears only this project's menu snapshot. AI tokens and QingZhou HttpOnly cookies remain independent; no token or Cookie content is sent through the Host session descriptor.

The gateway and return-route handoffs belong to the [Host route contract](/Users/hinaw/console-kreeper/.llm-wiki/architecture/route-and-shell-contract.md). Local source-built backend acceptance does not prove production credentials, TLS or external IdP success.

## See Also

- [Project Authority](../../agent.md) — current verification and production boundary.
- [Wiki Index](../_index.md)

## Persistent embedded authentication shell

For Login/Register/ForgotPassword, `App` retains one shared `AuthLayout` around RouterView. `embeddedAuthShellKey` lets the original view layouts provide only their existing form/footer slots inside it. Standalone builds use the same persistent authentication shell; unrelated routes keep their original form/handler ownership. `AuthModeNavigation` supplies the design system's secondary baseline navigation using original child routes and only the existing redirect query. Registration visibility follows the loaded public registration/backend settings; original guards and closed-registration feedback remain enforced.

The existing navigation-loading state drives only the right form pane's inert/busy state and delayed small DotMatrix. Left description, brand and mode navigation remain mounted. Whole-page panel/aside/main corners are zero; input/button/logo geometry keeps its own rules. The aside stays at the available viewport height beneath the 64px Host header, so form length does not recenter it. The original views, captcha/terms, validation and authentication APIs are reused unchanged.

## Signed-in sidebar visibility

The Host renders the published original permission/feature-filtered business tree after this application reports an authenticated session; static groups and nested routes are retained. Confirmed anonymous sessions show only the homepage. The Host preserves the original known menu across page switches and restores only a per-tab display snapshot on reload while this application independently checks its session; topbar/body preparation does not replace navigation with a loading row. Logout immediately removes protected sidebar entries, while explicitly public descriptors remain available to search/title resolution. Login, registration and account actions stay in the topbar. This is a Host presentation change, with no modification to this adapter's existing menu computations, router guards or backend authorization.

## Original navigation and header controls

The optional `topbarTarget` and `onHeader({ mounted, title, ready? })` context preserve one Host header. `useConsoleHeader` leaves controls in their original application Vue/router/store context and isolates cleanup by owner symbol. `useConsoleLogout` requests the existing Host session queue; independent operation retains the original logout callback. Original menu icon renderers, sanitized custom SVG, disabled/default-expansion metadata are passed with the existing permission-filtered tree.

Shared sidebar Motion distinguishes initial disclosure from later insertion, preserving stagger/close animation while avoiding invisible `closed` rows after authentication or settings arrive. The Host uses real default expansion for new groups without overriding manual collapse. The canonical design-system component/specification and its delayed-menu showcase carry the same fix.

AppHeader supplies original announcements, configured docs, model plaza, LocaleSwitcher, subscription progress, available/frozen/total balance, avatar/name/role, profile/API keys, configured contact support, administrator GitHub/onboarding and original logout. Its original subscription store cache/dedup request gates full topbar readiness; failure releases other controls. AI-owned shared CSS adapts both original standalone and embedded controls to 32px/12px and touch44px geometry.

The embedded account trigger keeps pointer/focus opening compatible with click and Enter/Escape. Touch toggles from the pointerdown state, preventing focusin followed by click from immediately closing the menu. The same interaction applies to standalone; per-header account/locale/subscription menus are mutually exclusive.

## Application-owned navigation lifetime

Embedded `App.vue` mounts the original `<AppSidebar headless />` once across public homepage and authenticated routes. AppLayout mounts its ordinary sidebar only standalone, avoiding duplicate menu publishers. Original admin/personal/user menus, role/feature filters, billing labels and custom entries are reused unchanged.

`useConsoleNavigation(items, ready)` forwards preparation through optional `setNavigationReady`. The original AppSidebar holds readiness until initial batch-image access and administrator settings loading settle; MFE mount awaits `navigationPrepared` before returning its handle. Initial Host presentation therefore receives the complete resolved tree, including on the public homepage, without a shortened dashboard-only fallback or temporary anonymous tree. Later settings/session changes still publish. The standalone sidebar lifecycle and backend authorization are unchanged. Current verification and Console-only deployment belong to [Project Authority](../../agent.md#console首页刷新菜单修正2026-10-19).


## Persistent Host navigation presentation

Console retains the last original permission-filtered menu during content/topbar preparation and restores its per-tab descriptor/SVG display snapshot across refresh. The original application session, router guards, feature checks and backend remain authoritative; confirmed anonymous/logout retract protected entries immediately. No username, token or session credential is stored by this navigation cache. This Host presentation policy does not move auth ownership into the shell.
