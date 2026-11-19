---
title: Sub2API Wiki 同步状态
updated: 2026-11-19
head_commit: 3a023cbf9cfce0a1c04b6d7fc1fcca442d5730f4
---

## 当前范围

本轮核对 `_schema.md` 基线至 HEAD、暂存和未暂存变化。业务源码检查点为 5acb68f5f；本轮注册邮箱黑名单编辑器和低频前端路由/运维监控表面的设计系统对齐已提交为 5acb68f5f518f9ea49923de4c2512cdacbc699d3，并完成独立应用和 Console Kreepai MFE 发布。实现责任和验证边界已同步到 `modules/embedded-design-system.md` 与项目权威文档。

## Doc Impact Map

- OCI 原生应用版本、镜像、容器、源码标记、迁移、恢复点、回滚和已知验证限制由[项目权威](../agent.md#上游-main-合并与-oci-发布2026-11-18)维护。
- 旧 Docker 兼容构建、默认入口权限验证、候选标签激活与旧静态资源的 Go embed 保留方法由[OCI 指南](guides/oci-operations.md)维护。
- 原生与 Console 独立发布的验收入口由[运行合同](guides/operations-retention.md#当前验收入口)指回权威文档，不复制发布流水账。

## 验证范围

生产验证覆盖健康/版本/镜像身份、7 个本机与公网入口、当前首页资源摘要、841 个旧资源 HTTP 摘要、4911 个部署源文件摘要、312 项迁移摘要，以及环境/挂载、其他 11 容器、账号凭据和设置的一致性。恢复点的 7 项 manifest 在 OCI 与私有异机副本通过 SHA-256 校验。代码测试沿合并记录，4 项上游前端 DOM 时序测试失败仍为限制；不宣称已登录业务、写操作或完整恢复启动验收。Console 静态产物随后续 Console 发布 `console-20261119-low-frequency-d` 已对齐到独立 0.2.23；该静态切换的资源、回滚和未验边界归 Console 低频发布回执。

文档 lint 核对受影响 Wiki 链接/锚点、索引入口、权威软链接、源码引用与 diff 格式；结果由本轮最终回复报告。CodeGraph MCP 未暴露，本轮无结构变更，不宣称索引刷新。


## 本轮设计系统修改与发布

`frontend/src/components/admin/settings/RegistrationEmailBlacklistEditor.vue` 复用 `InfoNotice`、`LoadingSpinner`、`kreepai-status`、`kreepai-detail-panel` 和共享按钮语义；批量禁用使用高亮风险确认弧边。其余低频页面审计收口 `KeyUsageView`、`SetupWizardView`、Legal/404/Model Plaza、Custom Page、Payment result/QR、Redeem、RiskControl、AuditLog、Channel Monitor V2、Ops 卡片，以及第二轮的 Affiliate、Airwallex/Stripe popup、Batch Image Guide；移除高置信度的旧渐变、玻璃、ring、发光、重复彩色图标框与旋转边框加载态，保留 provider/payment/chart/refresh 专项语义。本轮已提交并发布；`pnpm run lint:check`、`pnpm run typecheck`、原生/MFE build 和 MFE namespace 校验通过。全量测试 413 文件/3304 项为 3300 通过、4 失败，仍是上游黑名单弹窗 DOM 时序断言限制。未做生产登录业务验收。

## Console AI MFE 已对齐独立 0.2.23

独立运行时发布后，Console Kreepai 静态入口已发布 `console-20261119-low-frequency-d`，来源、entry/CSS 摘要、恢复点和公网验证归 Console 低频发布回执；本项目独立运行时、数据库、Redis 与迁移事实仍以本页上方 0.2.23 发布记录为准。
