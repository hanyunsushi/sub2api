---
title: Kreepai Shared Design System
updated: 2026-10-23
sources:
  - frontend/src/styles/design-system/
  - frontend/tailwind.config.js
  - frontend/src/components/layout/AuthLayout.vue
  - frontend/src/components/common/
  - frontend/src/styles/design-system/chart-style.ts
  - frontend/src/components/charts/
  - frontend/src/components/user/dashboard/UserDashboardCharts.vue
  - frontend/src/views/admin/DashboardView.vue
  - frontend/src/utils/page-loading.ts
  - frontend/src/utils/shift5.ts
  - frontend/src/styles/design-system/motion.css
  - frontend/src/App.vue
  - frontend/src/router/index.ts
  - frontend/src/api/client.ts
---

# Shared visual layer

`styles/design-system/kreepai.css` and its self-hosted fonts are owned by the AI application and imported by both `main.ts` and the independent MFE entry. Tailwind uses the same Apple primary palette and font roles in both builds. Native `index.html`/owned embedded surfaces carry `kreepai-design-system`; the MFE compiler scopes the shared rules to those surfaces and overlays. `runtime/` owns mounting, routing, API/Host integration and page geometry only. Vue, existing menus, permissions, forms and business handlers remain in place.

The adapter defines the four first-design-system font roles (Fraunces / Source Han Serif SC headings; Inter / Resource Han Rounded CN body) and Courier Prime numeric/code role. Fonts and OFL licenses are self-hosted inside this artifact with hashed URLs, not borrowed from Host source or its deployment directory. Attribution is retained in the asset directory. AWS Typography was read directly: monospace data categories and 14/20 body, 12/16 help, and heading hierarchy are distinguished from local overrides.

## Covered responsibility boundaries

- Shared buttons: 32px desktop / 44px coarse pointer, neutral/default-arc, 8px ordinary blue emphasis, explicit18px highlighted confirmation arcs, red transparent delete, static pressed geometry, visible keyboard focus and original disabled/busy state.
- Inputs, neutral select triggers and dropdowns, read-only focus, pagination, switch/checkbox state, shared status badges, dialogs, toasts and inline 16px DotMatrix waiting.
- Neutral 18px first-level cards at 250 gray and white nested cards. Account table wrappers are transparent layout, not an extra module depth; account cards stay gray. Original long-value badges and usage logic are not removed.
- Account action row keeps original callbacks/confirmations while adopting shared geometry and delete semantics.
- AuthLayout keeps one parent across login/register/forgot-password in both builds, switching only the form; persistent API errors use the original error message. It provides the existing authentication slots in the design system's split layout, with a single-column form below 860px and zero whole-panel corners. It does not implement SSO, change login fields/providers, submit test credentials or rewrite OAuth callback configuration.
- External subscription cards retain all provider schemes, original credentials behavior and original balance/quota calculations.
- Admin dashboard summary icons are neutral, numeric values retain their independent font role, and the original refresh handler stays in its original page control.

Semantic Chinese comments mark the template and CSS boundaries. All generated stylesheet rules remain under the Kreepai native CSS scope; explicit root-plus-boundary specificity overrides upstream component-scoped styles without changing Host styles. The scope is not a JavaScript or security sandbox. The embedded layout is light, matching the current Host; the native dark preference retains the application’s existing slate tokens as an explicit local compatibility treatment, rather than a new global design-system theme.

## Dashboard request recovery

`views/admin/DashboardView.vue` keeps a persistent, accessible error notice and an in-page retry action when its initial snapshot request fails or omits required statistics. It never substitutes invented zero values. A successful retry restores the existing charts and metrics; a later refresh failure retains the last successful data. An `online` event retries only a failed, idle dashboard. Unmount removes that listener and invalidates outstanding response sequences, preventing stale requests from updating the disposed page. Authentication, query parameters, snapshot endpoints and permissions remain owned by the original API/client.

The notice uses the existing neutral card, semantic error icon and ordinary secondary button, with wrapping text and keyboard operation; it adds no new design-system visual type. Dashboard tests cover initial failure, retry, online recovery/listener cleanup, stale chart responses and preserving successful data.

## Charts and data integrity

`styles/design-system/chart-style.ts` supplies explicit per-instance Chart.js styling to the existing usage/distribution/dashboard, operational, channel-monitor and payment chart instances in both builds. The shared AWS ordered palette applies to categorical data; semantic dataset colors retain their meaning. Input arrays are not mutated. No global plugin registration or mutation of `Chart.defaults` is used.

The plugin applies the body font to labels and tooltips, Courier Prime to numeric ticks, 12/16 chart text and neutral grids. It remeasures live charts when the self-hosted numeric font is ready. Reduced-motion preference changes disable animation live; restoring motion reinstates raw `chart.config.options.animation`, never the resolved options Proxy. Listener ownership is tracked per chart and removed on destroy.

Categorical series follow the directly verified AWS order (up to the existing 12-series user trend); Apple semantic status/progress colors are not replaced. Shared donut charts display at most five slices: first four entries in the original metric ordering plus the summed tail labelled “其他 (N)”. Complete table rows, ordering, totals and drilldown handlers are preserved. The visible explanatory note distinguishes chart aggregation from business records; five-or-fewer and empty inputs do not invent data. Model distribution panels use their own available width to stack the donut above the table; minimum readable cell widths and padding prevent numeric overlap, with horizontal scrolling confined to the complete table. Canvas elements have accessible image labels; broader chart accessibility is not inferred from that alone.

Official sources read for this adaptation: [Data visualization colors](https://cloudscape.design/foundation/visual-foundation/data-vis-colors/) and [Typography](https://cloudscape.design/foundation/visual-foundation/typography/), with the ordered color values checked against `@cloudscape-design/design-tokens`. The local first-design-system contract still owns font families, module depth, geometry and 260px trend height. This does not claim every specialized chart is visually audited.

## Native shell details

The native shell uses 264/72px sidebar tracks and a 64px glass header. `AppSidebar` now passes its original role/feature-filtered tree into the same `KreeperSidebarMenu` and React Motion source as Console. The local structural menu type avoids adding Naive UI; `motion/react` uses the existing runtime. Shared projection, subtree transitions, group labels, icon tracks and keyboard handling are retained, while standalone owns navigation, theme and mobile state. The brand glass, subdued corner version, body-font header title and continuous mobile-menu SVG match Console; desktop native scrolling and the 300px mobile drawer keep their respective gutters. Business content uses the original AI 16/24/32px responsive padding and fills its available width without a 1360px cap. Named `kreepai-content` containers apply the original 768/1024px thresholds to actual content width; native and embedded AppLayout share the same content class. Console uses the Shell application-owned content mode with zero extra Host padding, maximum width or centering margin. QingZhou content defaults do not define global design-system geometry for other applications. Original role/feature-filtered menu groups remain; filtering uses their labels/paths and preserves children. At <=768px the original mobile drawer takes over, with 300px width and a backdrop above the header. The account/locale/subscription menus share a per-header mutual-exclusion state, with keyboard Escape/focus cleanup. The original backend language reload behavior remains.

Native `styles/design-system/native.css` and `PageScrollbar.vue` reserve the desktop 16px rail with an 8px centered thumb; <=768px removes both rail and slot. Native document scrolling is retained. Embedded mode does not mount this rail or import native document CSS; Host owns scrolling. Scroll drag/cancel/unmount listeners are cleaned up.

Shared selectors cover the actual Select Teleport portal, not only a historical class: 16px panel/12px padding/8px rows, 40px desktop rows; original search/keyboard handlers are unchanged. Original modal locking/focus is kept above the 130px header stack via z1000. Narrow toasts cannot exceed the viewport. Shared inline waiting uses the small DotMatrix rather than request-specific spinner icons.

## Request-gated loading and motion

The application-owned `utils/page-loading.ts` and `utils/shift5.ts` are imported by the ordinary App/router/API path, so standalone and MFE builds use one preparation lifecycle. Router navigation resets the prior transition, starts a new load token and prepares the content scope; failed/error navigation cancels only its current token. `api/client.ts` wraps the real Axios adapter with `trackPageRequest`, releasing each tracked request on success or failure. Later refresh/polling does not start a page entrance by itself.

`App.enterRoute` waits for Vue and selects the actual authentication/content root for `runShift5Enter`. The entrance waits for tracked requests, Vue/paint quietness and the existing font/media readiness boundary, then checks requests again. It ends the DotMatrix wait and yields a paint before starting the inherited Shift5 sequence. Reduced motion still waits for readiness and finishes without the reveal movement. New navigation and App teardown reset transition state; stale tokens cannot finish a newer load. Native and compiled-MFE slow-response timing is verified: no Shift5 animation starts during the wait, and the small DotMatrix is absent when189ms cover/1008ms block reveal starts. Unit checks cover failed requests and superseded load tokens. Provider-specific retries and physical mobile hardware remain separate acceptance items.

`NavigationProgress.vue` now reads `pageLoading` and the shared visible-region positioning helper. `AuthLayout` combines that state with the original navigation state; its DotMatrix/inert region is the right form pane. App keeps the authentication parent across modes and requests `animate=false` there. Native navigation belongs to the native layout; Console navigation belongs to Host. Neither should be treated as a child page's loading/animation target. Browser checks confirm native authentication modes retain the identical aside DOM with no reveal movement; compiled MFE readiness uses the Host content region and excludes its persistent navigation.

The existing design-system timings, DotMatrix size and visual categories remain authoritative. `SettingsView.selectSettingsTab` retains local `activeTab` through horizontal `RouteSwitch` selection, resets the prior transition, starts a settings-scoped page load against `.settings-main`, updates the tab, then runs Shift5 after Vue updates. App's whole-route preparing gate excludes this target, preserving the horizontal section navigation. The loading-position helper checks `.settings-main` before the Host layout fallback, keeping the indicator in the changing section. Responsive/control ownership is documented in the [detail review](ai-design-review.md#settings-responsive-layout-and-controls); section-only animation receipts confirm the persistent section navigation receives no Shift5 animation.

## Verification boundary

Use the original Vitest/jsdom configuration, typecheck, standalone build and MFE build. Real compiled-ESM checks must cover populated accounts, long amounts, dropdowns/dialogs, touch/keyboard, anonymous and ordinary-user navigation, route switching and cleanup. Shared layer coverage does not prove every specialized route, chart/brand treatment, payment or OAuth flow has been reviewed. Production deployment and real authentication are independent gates.

## See Also

- [Console adapter](console-microfrontend.md)
- [Frontend](frontend.md)
- [Wiki Index](../_index.md)

认证整页分栏采用0圆角专项，不能继承18px卡片角；品牌、输入与按钮仍保持各自圆角。持久外壳、二级模式导航与右侧局部点阵由[Console模块](console-microfrontend.md#persistent-embedded-authentication-shell)维护，canonical认证/loading/motion规范和完整示范同步。


## Native and Console detail review

The [2026-10-19 detail review](ai-design-review.md) corrects original control placement, nested navigation, branding, account-logo editing and semantic badge colors, then extends shared primitives to original per-page controls. Ordinary8px and explicit arc18px controls are distinct; the earlier blanket18px mapping was incomplete. Review evidence and release identifiers belong to authority.

## Detail contracts

Ordinary neutral/default-arc and gray header triggers use the shared gray inset-shadow hover with unchanged text-2; emphasis/highlight actions retain Apple blue and animate32px/32% white inset light. Enter/leave are400ms ease, outer rings stay1px and keyboard focus remains independent. Primary page actions are8px, explicit confirmations18px. StandardRefresh retains its own SVG motion. RouteSwitch owns240ms following surface, local horizontal overflow and keyboard selection; settings/monitor/model panels preserve their original state models. InfoNotice uses the canonical20px ! icon/status and10/12 inset. Identity avatars reuse stable six-color mapping. Sticky table boundaries are1px separators without gradients; popup/tooltip shadows are independent. Raw route/auth matrices explicitly use accent rather than inherited body gray. See [the seventeen-point review](ai-design-review.md#seventeen-point-detail-review-2026-10-19).

## Date and overlay adapters

`components/common/date-range/` executes copied first-design-system React runtime/CSS/motion tokens via `SystemDateRangePicker.vue`; original source/license retained under frontend/vendor/date-range-picker. DateRangePicker supplies original8 localized shortcuts and original query payload. Operations adds time fields beside that natural-day picker and preserves ISO event order. App-only placement reveals calendars via actual native scrolling ancestor (Console body or standalone document), leaving persistent Shell outside the content animation. Select separates pending from selected feedback, anchors to realbutton rect and shifts its readable panel inside viewport; TablePageLayout has auto vertical gutter. Native/MFE import the same source. Source-copy AST/contract and actual popup interaction/geometry are distinct validation.

## Complete time-filter composition

`components/common/DateRangeFields.vue` composes the canonical `date-range/SystemDateRangePicker.vue` with optional original wall-clock inputs and independently clearable endpoints. Calendar Apply updates start/end before one change event; Cancel does not emit a query. Local `YYYY-MM-DD` is parsed at local midnight, not through UTC date-only parsing. Existing minutes, open endpoints, preset payloads, external dialog confirmation and business-specific ISO conversion stay with the caller. The copied React/CSS/motion tokens and MIT attribution are unchanged source assets, not a second Vue calendar implementation.

Relative minute/hour/day windows use the existing RouteSwitch indicator and original model values. Existing dashboard/user/usage wrappers continue to preserve their own quick ranges. Shared calendar owners include AuditLogView, OpsSystemLogTable, RiskControlView, AdminAffiliateRecordsTable, KeyUsageView and prompt-audit EventWorkspace/FilterDeleteDialog. OpsDashboardHeader keeps the original custom-range confirmation and clock composition; OpsAlertEventsCard (current/history) and OpsOpenAITokenStatsCard use the same range-switch category. The [review inventory](ai-design-review.md#time-filter-inventory-and-monitor-controls) records the boundaries. Expiration, scheduled publication and editable profile dates remain record fields rather than query filters.

MonitorHero uses RouteSwitch for 7/15/30 days and standard RefreshButton for its existing refresh event. AutoRefreshButton reserves the full selected countdown label using an aria-hidden grid cell and tabular numbers; the visible countdown is overlaid in the same cell, preventing tick-dependent resizing without duplicate accessible text. Native and embedded builds share these owners; the Host adds no time-query semantics.

## Logo URL field typography

SettingsView's Logo CDN URL input and custom Logo URL textarea both explicitly use the existing `font-mono` role (self-hosted Courier Prime) for machine-readable address values. Their label spans retain the normal body role, and existing size/line height, editability, binding and line-splitting behavior stay unchanged. Native and embedded builds consume the same template and shared font rule; no blanket textarea or global-input override is introduced.

## Default public homepage

HomeView's default marketing branch uses page `--bg`, neutral first-level card surfaces and actual-content container queries. The original24px inset/1152px maximum remain application choices; the Host does not impose QingZhou content sizing. Hero columns switch at720px of actual content, and feature cards use240px minimums with narrow single-column wrapping. Card hover/leave use the shared250ms neutral shadow with unchanged geometry/background. Three42px/12px icon frames contain neutral currentColor SVGs; <=640px frames become38px while retaining12px corners.

The terminal demonstration is the existing dark code category: solid#1e1e1e/#eee,18px radius and12.5px Courier Prime, no perspective, translation, base shadow, traffic-light decorations or neon syntax colors. Existing command/response text and line/cursor animations remain; reduced motion exposes every line immediately. HTTP200 alone retains the design-system success encoding. Page and card backgrounds use no gradients.

Provider cards use the four official local assets in `frontend/src/assets/provider-logos/`, with URLs and SHA256 provenance in SOURCES.md. Imported PNGs may inline as Vite data URLs; SVGs are immutable bundled files. All render32px with intrinsic proportions, no letter placeholders or runtime external requests. Official artwork colors/embedded gradients remain inside the brand images, separate from neutral page/card CSS. Provider capability uses information badges, rather than a healthy-state claim or blue outline/ring.

Only the default branch is restyled. Custom HTML/URL and compact-home precedence, existing settings/auth initialization, model-plaza gating, document/GitHub links and login/user/admin CTA destinations remain original. Native standalone controls remain standalone; embedded mode retains Host navigation. The global Console home entry belongs to [Host route contract](/Users/hinaw/console-kreeper/.llm-wiki/architecture/route-and-shell-contract.md#global-console-homepage-entry).

## Operations time-filter responsive layout

OpsSystemLogTable separates its original relative RouteSwitch and DateRangeFields into a time-filter grid using360px minimum tracks bounded by100% of the actual card. Other query fields use180px minimum tracks; no viewport-based five-column assumption includes the retained sidebars. The relative values, clocks, open endpoints and explicit Search handler remain original. The time-field cell establishes its own inline-size container; the date trigger is bounded by100cqi of that cell rather than the previous short placeholder's animated root width. React can still observe the intrinsic button and animate the original single surface/root width. At narrow widths the RouteSwitch alone can scroll horizontally; no options are removed.

DateRangeFields supplies the existing localized select-date-range label as its placeholder. Shared calendar CSS keeps32px desktop/44px coarse minimum heights, but uses auto height for the trigger and root with6px vertical padding. Full long date words may wrap without protruding from a fixed-height button; original React/CSS prefix, observers, spring parameters, panel geometry, keyboard and Apply/Cancel semantics remain. The same reviewed calendar adaptation is synchronized to the canonical reusable CSS/specification; QingZhou's historical source snapshot/native deployment is not changed by this AI rollout.

OpsDashboardHeader groups selectors, its unified OpsTimeRangePicker and original actions in a content-container grid. Below720px they stack; from720px selectors/actions share one row while the picker has a full row; from1120px the groups may share a row. The picker owns the original five relative queries and custom local-minute composition inside one standard calendar surface; there is no separate relative RouteSwitch or custom-time dialog.

## Operations controls and surface depth

The header/overview is one first-level `card` using `--card`; its health, metric and system submodules explicitly use `--bg` with18px corners. Transparent layout wrappers do not add a depth. Legacy white/ring/shadow on the parent and gray backgrounds on these submodules no longer reverse the design-system hierarchy. Detail actions keep their original callbacks and shared ordinary-button styles without former link underline/blue/bold utilities.

The shared native-checkbox rule explicitly draws16px/4px controls rather than relying on browser `appearance:auto`, which can ignore corners. Native checked/indeterminate/disabled state, labels and Vue models remain authoritative; accent/white marks, neutral unchecked border, no mouse focus halo and2px keyboard outline follow the existing checkbox contract. Forced-color mode restores native appearance. System-log runtime fields use180px minimum tracks, its boolean labels/actions wrap at actual module width, and coarse-pointer labels retain44px targets. Changes remain in the AI template/shared stylesheet and are consumed by both deployment forms; the Host adds no visual override.

## Unified operations time picker and original menus

OpsTimeRangePicker supplies the original5m/30m/1h/6h/24h options to the standard calendar's preset rail, with local start/end clocks rendered inside that same panel. Original Apply commits one change; Cancel/Escape/outside dismissal discard the draft. Relative presets still emit the original rolling time_range, while calendar or clock edits emit custom ISO endpoints before the parent timeRange change. Exact range comparison distinguishes minute presets on the same day. Committed custom clocks reopen unchanged; inverted/empty drafts cannot apply. The root/trigger keep their original Motion implementation, month ref bridge and intrinsic measurement. Narrow footer layout gives the full date/time summary a separate row from actions.

The canonical reusable calendar owns optional formatRangeLabel/isSameRange/renderRangeControls/onPresetSelect/canApplyRange hooks, each disabled by omission. They contain no application queries or timezone conversion. Original reference/CSS prefix/spring tokens stay intact; the reviewed default-path AST contract strips only these hooks plus the existing month ref bridge. Existing natural-day consumers are unchanged. The separate realtime QPS/TPS window remains independent from the historical query.

AccountActionMenu removes its redundant Logo command; EditAccountModal retains the original Logo configuration. LocaleSwitcher options use a2px grid gap, and AppHeader's account chevron follows only dropdownOpen with its200ms rotation/low-motion end state. MonitorCard always uses ProviderBrandIcon: explicit monitor Logo URL first, name-based provider recognition next, then the platform/model fallback. This consumes public monitor/settings metadata and never fetches protected account credentials. PixelAPI's official site favicon is bundled as a shared fallback, with source/hash in provider-logos/SOURCES.md; explicit monitor/account logos retain priority.


## Popup positioning and onboarding scope

Shared Select centers its fixed-width panel on the actual trigger. If centering crosses the8px viewport boundary, it uses the trigger's left or right edge, then clamps the result. The readable200px minimum, available width, vertical placement, scrolling/resize and keyboard/mouse state remain original. Canonical overlay guidance records the same alignment rule.

Driver appends its popover before creating its first SVG overlay. onPopoverRender moves the popover into the MFE overlay root; onHighlighted also moves that later-created overlay. Before each later highlight, the old popover is synchronously returned to body because Driver replaces it using body.removeChild; the replacement immediately re-enters scope in its render callback. Native mode keeps its original parent. Three sidebar step targets map to Host data-console-route attributes; page field targets and original actions are unchanged. Cross-project teardown destroys the driver before disposing Pinia/removing overlays, releasing body classes and keyboard/click listeners. Same-app navigation keeps the interactive flow. This fixes replay from AppHeader without introducing a second guide implementation.

MonitorHero uses the shared success/warning StatusBadge and original overall labels. MonitorCard uses a neutral250ms card shadow; background, dimensions and position do not change on hover/focus. The header balance adopts the original user-table body numeral styling (the original text-sm/font-medium role and normal letter spacing), removing its forced monospace/negative tracking. These native owners are consumed by standalone and Console; the Host adds no body stylesheet.

## Shared feedback and permanently disabled onboarding

The prior Driver replay/scope implementation above is historical and is superseded. AppLayout removes all tour startup and AppHeader removes replay; useOnboardingTour is an inert compatibility API independent of localStorage. No user preference or reset can start a tour. Existing store/data-tour cleanup remains compatible but cannot create a driver.

Toast maps existing appStore.toasts into shared FeedbackMessages (nonmodal, existing timers/close). BaseDialog uses the supplied Headless/Motion FeedbackSurface with original business slots, widths and closing flags. Vue retains content ownership and React owns the animated surface; stable per-module title IDs, topmost Escape, focus restore and animation exit release are verified. SettingsView changes preloaded tabs directly; PluginsView uses InfoNotice, and the checkbox neutral border follows border-strong. Canonical docs/assets/showcase are synchronized; native and Console consume this same frontend. Full implementation and deployment evidence are recorded in [authority](../../agent.md#反馈源码统一与永久关闭引导2026-10-20当前已部署).

## Login validation and message painting

LoginView uses novalidate to suppress the browser's unstyleable native validation bubble. Its existing validateForm still gates email, password, captcha and agreement before auth calls; validationToastMessage continues to create the original feedback. Accessible inline errors expose the same messages through aria-invalid/describedby. LoginAgreementPrompt removes stale utility overrides and uses the existing native checkbox contract; acceptance/rejection and storage revision logic remain original.

FeedbackMessages uses a20px filled Apple semantic circle and white mark. Message stacks retain16px paint padding around the animated panels inside their scrolling boundary; panel edges remain16px from the viewport. This prevents rectangular clipping of motion/shadows, while preserving nonmodal behavior, original dismiss timers and optional actions. Shared canonical/QZ copies match, except AI retains its existing LoadingSpinner import. The Host's private brand font preload is independent of this app's body fonts. Runtime and rollback evidence belong to [authority](../../agent.md#登录校验与反馈绘制修正2026-10-20当前已部署).

## Design-sync production release 2026-10-22

The 2026-10-22 release restored confirmation motion only. The current AI contract below supersedes its ordinary-modal motion; the Naive provider belongs to the canonical reusable system, while AI keeps its existing Headless lifecycle. Main-action hover uses the 32px/32% white inner-light layer with 400ms entry/exit; ordinary/default-arc hover retains the gray inset treatment and text-2. The feedback stack/material, default white-background design-system logo and desktop SVG empty/result states are sourced from the shared design-system assets. Native product logos and route/business behavior remain app-owned.

The pushed frontend commit `2091a0f0eb6ae8ff0d87b5c0c5125de4fa70c42a` was embedded into the application image without changing the `0.2.16` product version or backend source. Runtime image/container identity, nine local routes, public health/home/login, unchanged PostgreSQL/Redis and volumes, database/appdata backups and rollback tag are recorded in [project authority](../../agent.md#设计系统反馈修复部署2026-10-22已部署). Public HTTP checks are not production authenticated visual acceptance.


## Account-page review and native modal motion

All modal `FeedbackSurface` instances use opacity and scale(.95→1), entering250ms easeOut and leaving200ms easeIn; the backdrop only fades. `BaseDialog` defaults to `fade-scale`, and modal surfaces enforce this even for historical callers requesting `source`. Perspective, rotation, blur and spring remain exclusive to the nonmodal upper-right `FeedbackMessages` stack. Modal panels use the existing18px card surface, border and flyout shadow. Headless still owns focus, topmost Escape, scroll locking and exit cleanup; Vue keeps forms, original widths, async actions and events. This is the user's AI-specific motion restoration, not a new global animation category.

AccountActionMenu joins the existing16px dropdown surface with12px padding,8px/40px neutral items and8px anchor gap. Real menu measurement, viewport clamping, conditional credential operations and callbacks remain original. Account scheduling uses the existing accessible `Toggle`,40×23px track/17px thumb, with the original disabled state and server callback.

DataTable's desktop/card defaults, AvailableChannelsTable's two responsive branches and the empty user-subscriptions page all use `EmptyState`. It centers the supplied160×100px transparent SVG and12.5/20 body text, while retaining translated titles/descriptions and caller actions. Loading and failures remain distinct states. These shared owners are included in both native and MFE builds; compiled MFE validation is separate from deployment.
