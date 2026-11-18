---
title: Sub2API Wiki 同步状态
updated: 2026-11-19
head_commit: cbf753cfb664719ca5f91869e65476a19f15d607
---

## 当前范围

本轮核对 `_schema.md` 基线至 HEAD、暂存和未暂存变化。业务源码检查点为 cbf753cfb；本轮增量只更新部署事实与操作指南，源码、配置和数据库结构由已推送的上游合并提供。

## Doc Impact Map

- OCI 原生应用版本、镜像、容器、源码标记、迁移、恢复点、回滚和已知验证限制由[项目权威](../agent.md#上游-main-合并与-oci-发布2026-11-18)维护。
- 旧 Docker 兼容构建、默认入口权限验证、候选标签激活与旧静态资源的 Go embed 保留方法由[OCI 指南](guides/oci-operations.md)维护。
- 原生与 Console 独立发布的验收入口由[运行合同](guides/operations-retention.md#当前验收入口)指回权威文档，不复制发布流水账。

## 验证范围

生产验证覆盖健康/版本/镜像身份、7 个本机与公网入口、当前首页资源摘要、841 个旧资源 HTTP 摘要、4911 个部署源文件摘要、312 项迁移摘要，以及环境/挂载、其他 11 容器、账号凭据和设置的一致性。恢复点的 7 项 manifest 在 OCI 与私有异机副本通过 SHA-256 校验。代码测试沿合并记录，4 项上游前端 DOM 时序测试失败仍为限制；不宣称已登录业务、写操作或完整恢复启动验收。Console 静态产物随后续 Console 发布 `console-20261119-sub2api-v023-a` 已对齐到独立 0.2.23；该静态切换的资源、回滚和未验边界归 Console 对齐回执。

文档 lint 核对受影响 Wiki 链接/锚点、索引入口、权威软链接、源码引用与 diff 格式；结果由本轮最终回复报告。CodeGraph MCP 未暴露，本轮无结构变更，不宣称索引刷新。


## Console AI MFE 已对齐独立 0.2.23

独立运行时发布后，Console Kreepai 静态入口已发布 `console-20261119-sub2api-v023-a`，来源、entry/CSS 摘要、恢复点和公网验证归 Console 对齐回执；本项目独立运行时、数据库、Redis 与迁移事实仍以本页上方 0.2.23 发布记录为准。
