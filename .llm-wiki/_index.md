---
title: Sub2API Wiki
updated: 2026-10-12
---

[Project Authority](../agent.md)

# Architecture

- [System Overview](architecture/overview.md) - Runtime components and boundaries
- [Data Flow](architecture/data-flow.md) - Request and state lifecycle
- [Directory Structure](architecture/directory-structure.md) - Source layout

# Modules
- [Console OIDC Backend](modules/console-oidc-backend.md) - Original-site and Console callback compatibility.
- [Console Microfrontend](modules/console-microfrontend.md) - Independent Console ESM adapter and embedded lifecycle.

- [Frontend](modules/frontend.md) - Vue application boundaries
- [Backend](modules/backend.md) - Go service boundaries

# Concepts

- [Customization Inventory](concepts/customization-inventory.md) - Official frontend, retained functional extensions, persistence and retired boundaries
- [Customization Files](concepts/customization-files.md) - Complete baseline diff with file categories and Git status

# Guides

- [AI仅导航保留SF发布](guides/nav-svg-scope-release-20261104.json) - 业务SVG复原、双入口源码/运行与恢复边界

- [AI侧栏设计样式修正](guides/ai-sidebar-style-fix-20261103.json) - 16px图标、状态继承、正式桌面/手机实测与发布边界

- [AI侧栏跨Vue运行时修复](guides/ai-sidebar-runtime-fix-20261103.json) - 空白菜单根因、桌面真实交互、备份与保留

- [设计系统与SF双入口发布](guides/sub2api-design-system-release-20261103.json) - 0.2.19源码、运行、恢复与验证边界

- [Sub2API 0.2.19 发布回执](guides/sub2api-upstream-v0219-release-20261102.json) - 双入口、迁移、恢复及验证边界

- [Upstream Management and Billing](guides/upstream-management-and-billing.md) - MCP OAuth, scoped admin keys and migration boundaries
- [合聚 API 外部订阅接入](guides/heju-external-subscription.md) - 官方只读接入、凭据、单位与账号/Key统计范围
- [Development and Testing](guides/development-and-testing.md) - Minimal local workflow
- [OCI Operations and Artifact Retention](guides/oci-operations.md) - Safe application-only release, rollback, and cleanup
- [OCI Authentik OIDC](guides/oci-authentik-oidc.md) - Isolated Authentik deployment and OIDC handoff boundary

- [Kreepai Shared Design System](modules/embedded-design-system.md)

- [AI design review](modules/ai-design-review.md)

- [发布、备份与保留合同](guides/operations-retention.md)

- [合聚配置与双入口发布](guides/heju-release-20261024.json) - 脱敏产物、验证和恢复边界。
