---
title: AI first design system review
updated: 2026-10-20
sources:
  - frontend/src/styles/design-system/kreepai.css
  - frontend/src/components/common/
  - frontend/src/components/keys/EndpointPopover.vue
  - frontend/src/components/admin/usage/UsageTable.vue
  - frontend/src/styles/onboarding.css
  - frontend/src/components/layout/AppSidebar.vue
  - frontend/src/components/layout/AppHeader.vue
  - frontend/src/components/account/EditAccountModal.vue
  - frontend/src/components/admin/account/
  - frontend/src/views/admin/
  - frontend/src/views/user/KeysView.vue
  - frontend/src/views/user/SubscriptionsView.vue
---

# Review scope and ownership

The user reported ten concrete Console discrepancies after the first native visual release. The review covers native AI shared components and twenty representative administrative/personal routes, with separate compiled Console and production gates. AI still owns its original API, authorization, routes, fields, calculations and business data. Host owns one shell and project routing. Earlier “shared layer coverage” did not mean all raw per-page controls were migrated.

| User observation | Correction and owner |
| --- | --- |
| Nested navigation lacks hover | Shared React submenu renders actual motion.li children directly within its own SharedLayoutBg; ref reaches real ul, variants/presence retained. Host, canonical reusable asset and QingZhou share this fix. |
| AI has an invented topbar search | Host disables optional headerSearch for AI: no input, Ctrl/Meta+K handler or empty grid column. QingZhou retains its own current-project search. |
| Language shows national flags | AI LocaleSwitcher uses language code/name only; original locale switching/reload and localization remain. |
| Page buttons appear in topbar | Account/user/group/channel/proxy/external-subscription/dashboard page actions remain in their page, and their useConsoleActions registrations are removed. Original AppHeader controls still Teleport to Host. |
| Tool buttons have wrong shape | Shared ordinary buttons8px, ordinary primary8px, explicit highlighted arcs/confirmations/delete18px, topbar12px and standard refresh follow their separate contracts. Desktop32px/coarse44px, no pressed translation. Automatic polling enabled is not loading. |
| Blue bulk-edit band | Neutral first-level tool module, existing selection counts/operations/disabled conditions retained. |
| Console uses menu symbol as logo | Host uses the existing Kreeper site-logo image, not a newly invented symbol. |
| Several unrelated green badges | Provider/type/group/plan labels are information, sharing blue information geometry; healthy status alone uses success semantics. Real brand marks, subscription warnings and unknown/inactive states remain distinct. |
| Account logo settings missing | Original LogoPicker/custom presets/URL and legacy logo_url compatibility are available in EditAccountModal. Card logo and the original Edit action open it; the redundant More command is removed. Unchanged logo does not rewrite extra data; clearing restores automatic match. |
| External subscriptions at wrong level | Original admin tree groups the existing external-subscription route beneath system settings. Host consumes that tree; no duplicate top-level entry. |

# Additional findings repaired

Public inputs/textareas/searches/selects, date dropdown positioning/scrolling, group options, pagination wrapping/focus and empty feedback now attach to the shared contract while retaining original models, IME, validation and events. Action buttons inside forms have explicit type=button. Real errors win over neutral select state; focused invalid inputs keep red inset; active pagination retains highlighted pressed state.

DataTable loading and external-subscription initial loading use a single small DotMatrix instead of fabricated skeleton rows/cards. Original request branches/columns/empty states remain. Request indicators in setup, Key usage, group/proxy forms, subscriptions, settings, Key management and operational cards reuse LoadingSpinner; manual refresh uses the standard SVG component. No request state is inferred from enabled polling. Specialized business/provider/chart SVGs are retained.

Settings/Key/operational page actions and menu options attach to the existing button/dropdown classes. Subscription cards use neutral surfaces and information badges instead of arbitrary provider-tinted borders/gradients; true expiration/status and usage calculations remain. Key group selection adopts shared panel/input geometry. System logs use a neutral first-level card and white nested runtime panel.

Long native page descriptions are allowed to shrink within the title column, preventing them from pushing account controls beyond the desktop viewport. Mobile header/drawer and Host boundaries remain separately verified. No new formal visual type or global numerical contract is introduced. Chinese category comments mark the real template/style boundaries.

# Settings responsive layout and controls

`frontend/src/views/admin/SettingsView.vue` retains the original nine horizontal sections through the application-owned `RouteSwitch`. It does not use QingZhou's secondary sidebar. The same 16px outer /12px inner /4px track animates one following surface over240ms, supports arrow/Home/End keys, and confines narrow scrolling to the track. Original `activeTab`, form state, API/save handlers and `.settings-main` request/Shift5 gate remain. The main region fills the available width; existing560px field-container responsiveness remains.

Initial settings navigation loads the whole page. Later section changes keep the horizontal navigation and prepare only settings-main. Desktop/mobile, touch/keyboard/reduced-motion and compiled/native acceptance are recorded separately below and in authority. Earlier secondary-sidebar receipts are superseded by this explicit user correction.

# Seventeen-point detail review, 2026-10-19

| User observation | Application correction |
| --- | --- |
| Oversized external subscription cards | Grid uses actual content width, auto-fill/minmax(min(100%,260px),1fr),12px gap; cards size to content, amounts wrap and heading/metadata remain readable. |
| Refresh shape/hover | Existing standard RefreshButton,32px SVG with400ms hover rotation and original refreshAll/loading guard. |
| Add subscription | Ordinary emphasis8px, fixed1px ring and32px/32% white inset-light hover,400ms ease in/out. |
| Shared hover/material publication | Neutral/default-arc/header triggers keep text-2 and gray inset hover. Primary/copy/confirmation actions keep blue/white and white inset light.400ms ease in/out; no ring expansion. Message panels use topbar glass; empty-state illustrations use supplied SVG.394 files/2992 tests, lint/typecheck/i18n/native+MFE build pass. Source publication only; production evidence is separate. |
| Iframe explanation | Existing InfoNotice geometry: status, accent-soft,10/12 padding,20px circular !. |
| Locale selected color | Neutral current-row surface, no national flags, original locale model/reload. |
| Backend mode color | Neutral nested option surface, original boolean and description. |
| Settings navigation | Original horizontal sections through RouteSwitch, no invented secondary sidebar. |
| Granularity popup | Actual Teleport portal:16px panel,12px padding,40px rows/44px coarse,8px neutral options, no checkmark reservation. |
| Model/ranking switch | Single following animated surface; existing chart state, source and metric events. |
| Header balance | Main balance font-weight400. |
| Sticky table shadows | DataTable/header boundaries use thin1px neutral separators; no gradient shadow. Canonical content/CSS synced under user authorization. |
| Create user | Ordinary emphasis8px. |
| Attribute configuration | Ordinary neutral button;200ms box-shadow interpolation, no element scaling/reflow. |
| User avatar | Original identity deterministically selects the canonical six-color palette; no status semantics. |
| Create group | Ordinary emphasis8px. |
| Monitor V2/V1 tabs | RouteSwitch preserves original v2/legacy values and handlers. |
| Top-right new-monitor and other primary actions | Ordinary emphasis8px; explicit risk/confirmation arc remains18px. |

LoadingSpinner content, NavigationProgress route/section and AuthLayout waiting all explicitly use the system accent (#007aff); button loaders inherit their button foreground. The route/auth raw matrix previously inherited gray body color even after LoadingSpinner was corrected. Numeric diagonal phases,9-dot geometry,16/20px sizes, real request gate and reduced-motion behavior are preserved. Button box-shadow was missing from the previous transition list; browser frame sampling now verifies continuous intermediate ring values, not only matching endpoints.

Scope is visual/application-owned frontend only. Both native and MFE builds import these changes; no auth/backend/API or business calculations are replaced. No new formal visual category or font/chart numerical change. Synthetic browser fixtures contain reserved example domains and fake identities only; production checks must remain read-only.

# Source snapshots and verification boundaries

The previous24 warnings were stale QingZhou source snapshots/coverage, not24 AI visual defects. The earlier detail-review baseline included reviewed source/build/runtime changes, updated patterns and an explicit integration/visual review record:110 sources/55 patterns/273 package hashes with no drift, independent typecheck,47 contract checks and Vite build. Those receipts predate the loading/version/settings increment above. Its reviewed optional-version runtime snapshot and canonical Shell/reference assets are synchronized; current audit110sources/55patterns/273hashes and48 isolated contracts/typecheck/build pass. Neither baseline establishes current browser/production behavior.

Final native/compiled/production evidence and current release/rollback identifiers belong to [Project Authority](../../agent.md) and [Host authority](/Users/hinaw/console-kreeper/agent.md). Browser fixtures are local synthetic data; payment settlement, external OAuth, all provider-specific states and physical mobile hardware are separate acceptance boundaries. No production credentials or real account data are stored here.

## See also

- [Shared visual layer](embedded-design-system.md)
- [Console adapter](console-microfrontend.md)
- [Frontend](frontend.md)
- [Wiki index](../_index.md)

## Current acceptance and production

84 related unique tests, modified-source lint/typecheck/native and sealed three-project builds pass. Native/compiled external/settings at8 widths360..1920 and compiled users/groups/monitor at6 widths show no document overflow. Ordinary/emphasis rings each yield25 intermediate computed shadows, blue20px route matrix13 intermediate phase values, route following surface30 positions; touch44px, keyboard and reduced motion pass. Read-only production IAB session after refreshing toConsole-M confirms actual3-column cards,8px creates, standard refresh, balance400,9 horizontal settings tabs/canonical notice and1px/no-shadow user-table boundaries. Native/public route and artifact hashes pass. Exact releases/rollback/image and source fingerprints belong to authority. No claims about unexercised payment/provider write paths or physical mobile hardware.

## Dashboard, menus, dates and operations review

- Main header balance remains400 and uses a local compact letter-spacing; no value/format API changes.
- Recent usage tokens/actual_cost uses RouteSwitch and retains original setUserTrendMetric/query events.
- Shared Select measures its actual trigger button. Border-box preferred width is max(200px,trigger width), shifted inside8px viewport edges; scrolling/resizing reanchors it. Pending pointer/keyboard row and selected surface are mutually exclusive; pointer exit restores selection. Disabled, grouped, remote search, Enter/Escape/Tab behavior remain.
- DateRangePicker now adapts the canonical React/Motion date picker and exact CSS/tokens/license. Original eight presets and local YYYY-MM-DD /preset change payload remain, across midnight too. Native page scrolling reveals the full opened calendar; observers/rAF clean up at unmount. This is application placement, not a new calendar animation implementation.
- Operations custom range retains5m/30m/1h/6h/24h shortcuts. The custom dialog composes the same single-month day calendar with original time inputs; only original confirmation emits both ISO timestamps before custom timeRange. Dates are not silently rounded to whole days. No backend query/metrics calculations change.
- OpsDashboardHeader replaces its malformed title path with the existing chart SVG. Overview/health/metric/system grids and related chart rows use actual content-container widths; complete long values wrap instead of shrinking into viewport-driven12 columns. Tables keep local scrolling, empty tables no longer reserve an unnecessary vertical gutter.

Brand/logo/version placement is owned by Host/canonical Shell; native AI keeps its independent branding. Dependencies pin React19.2/motion14.3/lucide0.577 with Vue bridge; browser scope applies to the MFE aggregate CSS as before. Source provenance remains canonical/source-reference; runtime acceptance and deployment are separate in authority.

Acceptance:27 related tests/lint/typecheck and native/sealedMFE builds pass. Both builds'Ops/promo layouts at8 widths360..1920 have no page overflow; empty table fills839px withauto gutter. Dropdown pending is unique and clears on exit; calendar8presets/apply/cancel, custom date+time ISO order and44px touch/reduced-motion pass. CanonicalReact/CSS/motion copies arebyte-identical. ProductionP existing-session read-only checks confirm version/logo/balance/new calendar/ops/emptytable without setting saves. Native frontend9132093c6346 keeps original committed backend and volumes. Exact release/backup/source hashes belong toauthority, fixture screenshots are synthetic.

## Arrowless overlays and account card controls

Button hover/click hints use the existing arrowless Tooltip/Popover contract. Removed16 empty decorative diamonds/triangles from HelpTooltip, EndpointPopover, UsageTable and the group create/edit hints; onboarding also hides its library arrow. Transparent hover bridges, close/Escape/outside-click handlers, positioning and content are retained. Navigation chevrons, copy actions and semantic status dots are unaffected. Native and embedded builds share these component sources.

Account card sorting now uses the existing Select with the original sortable columns, handleSort, direction and account-table-sort persistence. The direction action is the standard neutral18px btn-arc. Shared card-hover/data-card shadows interpolate250ms ease in both directions; background, position and geometry remain stable, and reduced-motion keeps its established immediate final state. These are existing overlay, selector, standard-arc and hover categories; no new visual type, typography, chart palette or upstream/business behavior is introduced.

Validation:16 focused HelpTooltip/Select/account tests, changed-source lint, typecheck/native build and sealed MFE build. Real native and compiled browser fixtures record31/30 distinct shadow values, unchanged geometry/background,10 sort options in a200px/16px menu, preserved priority/descending storage, zero tooltip arrow children and a transparent0-border hit bridge. Six viewport widths360..1920 have no document overflow; coarse controls44px and reduced-motion verified. Production release facts belong to[authority](../../agent.md); fixture data is synthetic.

## Time-filter inventory and monitor controls

| Query owner | Shared control | Preserved business boundary |
| --- | --- | --- |
| Admin/user dashboard and usage reports | Existing DateRangePicker → SystemDateRangePicker | Existing quick dates, local-day conversion and request events |
| AuditLogView | RouteSwitch + DateRangeFields with clocks | Original preset IDs, custom confirmation and timezone ISO query |
| OpsDashboardHeader | RouteSwitch + existing canonical custom calendar/clocks | 5m/30m/1h/6h/24h and explicit confirmation order |
| OpsSystemLogTable | RouteSwitch + DateRangeFields with clocks | Other filters, endpoints and existing search behavior |
| OpsAlertEventsCard current/history and OpsOpenAITokenStatsCard | RouteSwitch | Original relative windows, selection and pagination |
| RiskControlView, prompt-audit EventWorkspace | DateRangeFields with clocks | Original filter payload and refresh events |
| Prompt-audit FilterDeleteDialog | RouteSwitch + DateRangeFields with clocks | Preview, validation and destructive confirmation unchanged |
| AdminAffiliateRecordsTable and public KeyUsageView | DateRangeFields; RouteSwitch for public presets | Original date strings, endpoint clear and query handlers |
| Public MonitorHero | RouteSwitch + RefreshButton | Original 7/15/30-day values and refresh handler |

Calendar/clock/clear behavior belongs to [the native shared layer](embedded-design-system.md#complete-time-filter-composition). AutoRefreshButton reserves the full selected-interval countdown width. Record expiry, scheduling, subscription metadata and profile dates are deliberately excluded from this query-filter inventory.

Focused component tests verify minute/endpoint preservation and prompt-audit confirmation behavior; browser fixtures verify calendar Apply/Cancel, real query payload order, stable countdown geometry and representative layouts at360..1920px. These synthetic tests do not establish every production dataset or perform destructive/production queries. Current build, deployment and read-only production evidence belong to [authority](../../agent.md).

## Logo URL field consistency

The custom Logo URL list already used `font-mono` while its adjacent CDN URL input inherited the body family. Both address-value controls now use the same existing monospace role; labels remain body text. This uses existing 填写框 / 数字展示 categories, with no new font assets, size rule or API setting semantics. Console favicon/Apple/Web App identity is Host-owned and documented in its [route contract](/Users/hinaw/console-kreeper/.llm-wiki/architecture/route-and-shell-contract.md#browser-and-installed-web-app-identity); it does not overwrite standalone AI branding.

## Default homepage visual review

| User finding | Application-owned correction |
| --- | --- |
| Decorative gradient background | Solid page-role color; remove blurred circles and grid decoration |
| Perspective/glowing terminal | Existing dark code surface,18px/12.5px mono, neutral syntax and stationary geometry |
| Provider letter placeholders | Four official locally bundled marks with source/hash provenance |
| Blue provider outlines/rings | Neutral first-level cards without base border/shadow; capability information badges |
| Colored feature illustrations | Three neutral currentColor SVGs in42px/12px icon frames |
| Immediate card hover | Shared250ms shadow interpolation in both directions |

Actual content width controls hero/features, preserving original application inset and maximum. Native and compiled Console browser checks cover360/390/768/1024/1167/1440/1920px, local/inline image loading, neutral card geometry, hover/leave interpolation, reduced motion and readable complete code. The original13 HomeView mode/gating/destination tests remain passing; no custom home HTML/URL, compact mode, authentication/API or settings behavior is rewritten. Exact runtime/release facts and static-versus-browser evidence belong to [authority](../../agent.md). Console's new global homepage route belongs to its own Shell, not this application's sidebar permissions.

## Operations system-log time filters

The original md:grid-cols-5 forced the seven relative presets and the date-plus-clock composition into individual narrow columns at1167px with the sidebar present. Time controls now use an independent full-width grid; normal input fields flow in their own minimum-width grid. The original query values, explicit Search, retention settings, reset/cleanup callbacks and backend remain unchanged. Date placeholder follows the existing locale and the trigger/root expand vertically for complete wrapped date text. An application cell-width constraint lets an applied long date grow beyond its former short-placeholder width; native header toolbar wrapping closes the separate mobile overflow found during verification.

See [shared layout ownership](embedded-design-system.md#operations-time-filter-responsive-layout). Browser verification must cover empty and applied long dates, all seven presets at sufficient content width, native/Console expanded and collapsed shells,360/390px touch, dialog bounds, Cancel without query and original minute/timezone query values. Static tests and production runtime/deployment evidence remain separately owned by [authority](../../agent.md).

## Operations header and runtime controls

| Finding | Existing-contract correction |
| --- | --- |
| Header time range squeezed into150px | Unified standard calendar with the five original minute/hour shortcuts inside its preset rail and one Apply/Cancel for dates/clocks |
| Browser-default caller/sampling/access-log boxes | Shared explicit16px/4px checkbox drawing, native models and keyboard/forced-color semantics retained |
| Detail buttons underline on hover | Remove former link utilities; shared ordinary-button interaction remains |
| Reversed overview/submodule backgrounds | First-level250-gray card; nested health/metric/system modules white |

The system-log runtime settings grid also uses its actual content width. Existing values, search/save/reset callbacks, permissions, thresholds, chart palettes and query/timezone semantics remain original. Review at360/390/768/1024/1167/1280/1440/1920px must inspect internal option visibility, computed surface depth, detail hover, checkbox model toggles without save, keyboard focus,44px touch targets, dark contrast and high-contrast appearance. See [implementation ownership](embedded-design-system.md#operations-controls-and-surface-depth); release/runtime evidence belongs to authority.

## Unified time entry and menu/monitor review

The top operations query uses the standard calendar surface with internal5m/30m/1h/6h/24h shortcuts and local-minute fields. A preset or day/clock draft does not query before Apply, and dismissals retain the committed value. Query precision, cross-midnight behavior and rolling preset values remain original. Native and Console browser acceptance covers full custom labels, one active minute preset, eight content widths and a separate final narrow-footer check preventing action overlap.

The redundant account Logo command is removed only from More; the original Edit configuration remains. Language hover targets keep2px separation, account chevrons rotate with their own expanded state, and public monitor logos consistently use explicit URL/name/provider resolution. Pixel's official local fallback and Cloudflare's shared preset are verified independently from custom URL loading. See [shared owners](embedded-design-system.md#unified-operations-time-picker-and-original-menus). Exact test/build/browser/deployment and rollback evidence belongs to project authority.


## Adaptive menus and guide replay

Select popups need center/left/right anchor checks, viewport bounds and resize coverage. Public monitor acceptance covers the shared degraded status badge and continuous neutral shadow with stable card geometry. Header balance uses the same body numeric role as the user-table balance.

Guide replay must display a styled fixed popover and overlay inside the MFE scope, advance from welcome through the real sidebar route to the page's create action without submitting, close with Escape, and release all layers/body flags on project exit. Standalone retains its original flow. Confirmed project update markers are Host-owned metadata, independent of the current panel's checking/error status; see [Host ownership](/Users/hinaw/console-kreeper/.llm-wiki/architecture/route-and-shell-contract.md#project-update-memory-and-onboarding-anchors).
