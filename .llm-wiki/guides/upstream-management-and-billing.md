---
title: Upstream Management and Billing
updated: 2026-11-02
sources:
  - backend/internal/config/config.go
  - backend/internal/server/routes/mcp.go
  - backend/internal/managementmcp/
  - backend/internal/service/mcp_oauth_service.go
  - backend/internal/pkg/adminaccess/
  - backend/internal/server/routes/admin.go
  - backend/ent/schema/group.go
  - backend/migrations/
  - frontend/src/components/admin/settings/AdminAccessKeysSettings.vue
  - frontend/src/views/user/MCPView.vue
  - frontend/src/views/auth/MCPOAuthAuthorizeView.vue
  - frontend/src/components/account/GrokModelDiagnosticsPanel.vue
---

# Upstream Management and Billing

## Management MCP

`RegisterMCPRoutes` dispatches an explicit tool catalog through the existing user/admin handlers, retaining resource ownership, audit and permission checks. Authentication uses OAuth authorization code with S256 PKCE; model API keys, browser JWTs and administrator keys are not MCP credentials. Consent defaults to user scope and read-only access. Administrator write grants require TOTP step-up. Protocol details and the tool catalog remain in the upstream-owned [MCP guide](../../docs/mcp.md).

`MCPConfig.PublicURL` must explicitly identify the root `/api/v1/mcp` endpoint. An empty value disables the service and its sidebar entry. Do not derive a Console MCP URL from its frontend prefix: discovery lives at the origin root, and the upstream configuration does not support a subpath deployment. Configuring a production MCP endpoint requires a separate deployment/configuration task.

The frontend routes are `/settings/mcp` and `/oauth/mcp/authorize`. `FeatureFlags.mcp` follows the public `mcp_enabled` setting. The native/Console menu continues to include local external-subscription settings; simple mode can expose both entries according to their existing flags.

## Administrator keys

`AdminAccessKeysSettings` owns scoped-key creation, expiry, IP limits and account/global permission selection. Sensitive key actions reuse step-up authentication. Full-access compatibility requires explicit confirmation; it is not the default. Existing legacy keys retain rotation/deletion controls. Backend policy enforcement and the canonical request examples are in [Administrator API Keys](../../docs/admin-api-keys.md).

The enclosing SettingsView tests stub this independently tested child so settings/payment fixtures do not issue unmocked key-management requests.

## Schema and data changes

| Migration | Effect when a deployment runs migrations |
| --- | --- |
| `246_enable_gemini_image_generation_groups.sql` | Enables `allow_image_generation` for existing Gemini/Antigravity groups currently set to false |
| `247_scoped_admin_api_keys.sql` | Creates administrator-key storage and the logical deletion field |
| `248_group_image_count_billing.sql` | Adds group `image_count_billing`, default false, used by OpenAI/Composite image billing |
| `249_mcp_oauth.sql` | Creates OAuth grants, single-use code digests and rotating credential digests |

These source migrations do not prove that a production database has applied them. Before deployment, account for migration 246's update of existing group settings as well as the new tables/column. Runtime, backup and release facts belong only to the project authority.

## Retained integration boundaries

Account cards, quota windows, logo handling, Heju and other external subscriptions, Console OIDC callbacks and the separate ESM/CSS/Teleport build remain local extensions. The account secondary-filter panel retains its state, labels and regression tests alongside upstream persisted platform/status filters. Ent generation resolves column offsets against the combined schema, including local branding fields.

## See Also

- [Project Authority](../../agent.md)
- [Frontend](../modules/frontend.md)
- [Backend](../modules/backend.md)
- [Console Microfrontend](../modules/console-microfrontend.md)
- [Development and Testing](development-and-testing.md)
