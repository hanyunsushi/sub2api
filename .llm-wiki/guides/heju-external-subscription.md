---
title: 合聚 API 外部订阅接入调研
updated: 2026-10-24
sources:
  - https://www.hejuapi.com/docs/quickstart/token-balance-api
  - https://www.hejuapi.com/docs/quickstart/api-key-management
  - backend/internal/service/external_subscription_config_service.go
  - backend/internal/service/external_subscription_scheme.go
  - backend/internal/service/external_subscription_service.go
  - backend/internal/service/external_subscription_heju.go
  - backend/internal/service/external_subscription_heju_test.go
  - frontend/src/views/admin/ExternalSubscriptionsView.vue
  - frontend/src/utils/externalSubscriptionQuotaProgress.ts
---

# 接入边界

合聚官方文档提供模型 API Key 的只读余额/额度接口。`heju_api_key` 方案已实现，内置ID为 `hejuapi`，使用下列两条接口；发布与配置验收状态由项目权威维护。

## 推荐凭据和请求

站点根地址为 `https://www.hejuapi.com`，不加 `/v1`。两个请求均只需要现有模型调用密钥：`Authorization: Bearer <完整 sk-密钥>`，不需要 Cookie、New-Api-User、账户密码或系统访问令牌。

| 请求 | 用途 | 成功判据 |
| --- | --- | --- |
| `GET /api/usage/account` | Key 所属账号的共享钱包余额 | JSON `success === true` |
| `GET /api/usage/token/` | 当前 Key 的累计消耗、剩余额度、限额及到期时间 | JSON `code === true` |

只读命令示意，凭据从私有环境变量读取，不放到 URL：

```sh
curl --fail-with-body --max-time 15 'https://www.hejuapi.com/api/usage/account' \
  -H "Authorization: Bearer $HEJU_API_KEY"
curl --fail-with-body --max-time 15 'https://www.hejuapi.com/api/usage/token/' \
  -H "Authorization: Bearer $HEJU_API_KEY"
```

## 字段与单位

| 官方字段 | 解释及处理 |
| --- | --- |
| account `data.remaining`、`data.unit` | 已换算的账号余额与单位；不能再除以 500000，不能自行按市场汇率换算 |
| token `data.total_used` | 此 Key 的累计计费额度，除以 500000；不是今日用量、模型 token 数或整个账号的累计消耗 |
| token `data.total_available` | 此 Key 的剩余配额，有限额时除以 500000；不是账号钱包余额 |
| token `data.total_granted` | 此 Key 的剩余加已用配额，除以 500000；不是账号累计充值 |
| token `data.unlimited_quota` | 为 true 时表示 Key 不限额，不能把零/负的 total_available 当成钱包耗尽 |
| token `data.expires_at` | 秒级 Unix 时间戳，0 表示 Key 不过期；不代表套餐到期时间 |

500000 是官网于核对日期公布的当前额度换算单位。公开 `/api/status` 响应未提供 `quota_per_unit`、`quota_display_type`、`usd_exchange_rate`，不能假定现有 New API 控制台换算器能自动推断合聚单位。

## 对现有聚合的影响

“合聚：API Key”方案使用独立响应解析，复用现有服务端凭据保存、并发/超时、快照与账号匹配机制。不要复用要求控制台凭据的 Pixel/A6API/PackyCode 方案来解释这组模型 Key 接口。

现有 `ExternalSubscriptionStatus` 的 used/remaining/total 和 `buildAccountExternalQuotaProgressMeta` 假定额度来自同一统计范围。合聚账号余额与单条 Key 消耗属于不同范围，不能直接填入同一进度条并用“账号余额 + Key 已用”推导总额度。实现将账号钱包余额与 Key 额度/累计消耗分开：账号 `remaining_usd` 只存钱包，`token_quota` 保存Key统计，不生成账号总额度/账号累计消耗；有限额 Key 的进度可用自身 total_granted/total_used/total_available，不限额 Key 显示账号余额并明确不限额。两边都有效时，较小的非负剩余额度只作为金额上限参考。

这两个只读接口不提供套餐列表、订阅周期或套餐到期日。不能据此生成虚构的活跃订阅条目。若需要套餐数据，须另行核对相应接口。

## 认证与异常

官网建议手动刷新或每 1–5 分钟查询，429 时退避。累计消耗是缓存快照，不能视为实时对账数据。503/解析失败应保留错误或带时间的旧快照，不能写成余额 0。

令牌只读接口允许仍存在的禁用、过期、耗尽 Key 查询其自身配额；账号余额接口对状态、到期和 IP 限制更严格。查询成功不证明模型可调用。

另一份[密钥管理文档](https://www.hejuapi.com/docs/quickstart/api-key-management)描述的是账户管理权限：系统访问令牌搭配 `New-Api-User: public_id`，其中 public_id 不是数据库数字用户 ID。本只读接法无需生成该管理令牌。

## 验证证据和限制

2026-10-24读取官网上述两份文档，并实现独立的 `external_subscription_heju.go` 适配、前端预设与数据展示。无凭据 GET 的实际结果为 `/api/status` HTTP 200、`/api/usage/token/` HTTP 401（Token not provided）、`/api/usage/account` HTTP 401（A valid API key is required）。随后在用户配置/发布授权下，从现有合聚模型账号复用密钥，服务器直接向官网执行上述两条只读GET均200：账号余额29.032322 USD，Key不限额、累计15480008原始额度、expires_at=0；累计换算30.960016。没有调用模型或创建管理权限。真实有限额分支未实测，由HTTP夹具回归验证；部署、配置和回滚证据归项目权威。

## See Also

- [Customization Inventory](../concepts/customization-inventory.md#external-subscriptions)
- [Backend Module](../modules/backend.md)
- [Project Authority](../../agent.md)
