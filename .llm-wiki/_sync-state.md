---
title: Current Documentation Sync State
updated: 2026-11-03
---

# 设计系统与SF发布同步（2026-11-03）

- Doc Impact Map：现有按钮/选择器/表格/复制栏与真实SF的实现合同归[共享层](modules/embedded-design-system.md)，页面核对归[设计核对](modules/ai-design-review.md)；部署、恢复、并行Console与验收限制归[权威](../agent.md#设计系统与sf发布2026-11-03)，机器摘要归[发布回执](guides/sub2api-design-system-release-20261103.json)。保留合同入口和索引同步。
- 已检查last_synced_commit至HEAD、暂存及未暂存/新增文件；源码a74280177/528cffced已推送并发布，两种前端与ARM64 embed构建、406文件3217测试及类型/lint/i18n/隔离门禁通过。无业务数据/API变更，产品版本保持0.2.19。
- 原生及Console本批52公网/32摘要通过；并行OpenStock推进后49/30通过，192个AI文件原字节保留。原生seal/apply清1目录/2tag，保留当前加三回滚，Console共享保留由并行当前批维护；完整异机image/备份已核验。没有新增认证浏览器或完整恢复演练。
- 文档lint：受影响Wiki链接/锚点、索引反链、源文件引用、JSON、权威软链接及限定diff格式通过；无秘密或构建产物入Git。CodeGraph不可用，不宣称刷新索引。原有本机停用/历史同步dirty内容保留，不纳入本批。

# Scope

Current publication: accumulated native/Console frontend migration plus latest shared hover/material/placeholder synchronization. This is source commit/push only; product0.2.16 and historical deployment evidence remain separate. Schema last_synced_commit is the base; the containing publication commit owns the reviewed increment. The pre-existing OCI operations guide diff is excluded and preserved.

Validation:394 test files/2992 tests pass; full ESLint/typecheck, i18n, standalone build and microfrontend build/artifact checks pass. Four outdated test owners now follow shared RouteSwitch controls, original account Edit, and Headless root scroll-lock cleanup; original API assertions are retained. Neutral/default-arc/header triggers use400ms gray inset hover with unchanged text-2 and fixed rings; emphasis/highlight/copy actions use32px/32% white inset light. Message panels use topbar glass and shared EmptyState uses the supplied transparent SVG. App branding, backend, formal config/data/volumes and product version are unchanged. No current native/production browser acceptance is claimed from these static/test/build checks.

AI dashboard first-request failure, persistent retry, online recovery and response cleanup. Existing brand/login feedback, disabled onboarding, project menus and marketing role/Authentik work are preserved.

# Doc Impact Map

DashboardView and its regression tests map to AI embedded-design-system/dashboard-request-recovery. Host route-and-shell-contract records the difference between child mount readiness and successful business content rendering. Source/test/build, active Console release, native AI image, backups and rollback belong to the two project authorities. No QingZhou or canonical design source changes.

# Verification boundary

Three AI test files/15 tests, changed-source lint, native type/i18n/build and MFE type/build/artifact verification pass. Local compiled native/Console fixtures reproduce a snapshot503 and recover thirteen card containers/three charts via in-page retry;360px and keyboard retry pass. Unit tests separately cover online recovery, listener cleanup, missing required stats and retaining previous successful data. Real production Console dashboard/accounts/settings/monitor content is visible; the original user dashboard tab now runs the repaired release. No production form submission or credential change.

Console assembly rebuilds AI only;155 Host/QingZhou/marketing assets match the active baseline after release-base normalization. Native AI preserves the backend hash,0.2.16 product version, formal mounts and1290 historical static assets. Console7 routes/10 assets and native7 routes/6 assets pass HTTP/digest/cache validation after activation. Separate native authenticated visual acceptance is not claimed. Exact identities, receipt paths and rollback are in agent.md; original request-network cause remains unconfirmed.

Both authority symlinks, Wiki links/two-click reachability, CodeGraph sync and Git diff checks pass. The protected OCI operations-guide diff hash is unchanged. Existing dirty work is preserved; no new commit or memory update.

# 发布与恢复收尾

运维合同及当前产物/恢复材料已同步。源码发布和文档后续提交分别记录；历史数据缺口不伪造恢复点。详细验证与真实运行身份归agent.md及operations-retention。

## Logo and route overlay scroll - 2026-10-24

Scope: Console branding and the AI/marketing scoped route overlay. Source, browser, release and recovery evidence: [Host receipt](/Users/hinaw/console-kreeper/.llm-wiki/guides/logo-scroll-release-20261024.json). Other pending audit edits are preserved separately.
