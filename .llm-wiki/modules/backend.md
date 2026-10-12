---
title: Backend Module
updated: 2026-10-12
sources:
  - backend/cmd/server/
  - backend/internal/handler/
  - backend/internal/service/
  - backend/internal/repository/
  - backend/internal/pkg/apicompat/
  - backend/ent/schema/
  - backend/migrations/
---

# Backend Module

## Upstream v0.2.12–v0.2.15 integration

The development branch now includes `upstream/main` `9591136d45cef26453348ed9532a7ebbce7cf99c` through merge commit `076106755be184981cafe70411eef60d4cbef101`. The official update adds the current typed platform/provider catalog paths, new provider protocol services and routing coverage, recharge-bonus/payment changes, long-context and web-search handling, operations/account-monitor fixes, security hardening and regenerated Ent/Wire artifacts. Local external-subscription and branding services remain separate extensions; deployment facts belong to the Project Authority.

## Merge `upstream/main` and OCI release (2026-09-30)

The development branch merged `upstream/main` at `42bc7f6cffe24bcb471608e48e66b4a0afa1f882` into local cleanup commit `55de1f980` as `88cb179b63d185b8e79f6a89a720eaa3b3e60c49`. Official Claude reset credits, dashboard trend metrics, OpenAI plan/model mappings, CC Switch usage handling and batch image gateway wiring were retained; the historical local presentation policy was preserved at that merge and is superseded by the official-frontend restoration documented in the customization inventory. Ent and Wire code was regenerated.

Current image, release commit, rollback and runtime verification belong to the [Project Authority](../../agent.md), not this module page.

## Upstream v0.2.8 integration and release

The backend merge at upstream `a3eb7ef302961cba716dc78b39b93b60c467db0e` adds OpenCode Go usage, typesafe risk-control, backup/archive, affiliate withdrawal, signed-thinking and paginated CSV export capabilities. Ent and server generated code were rebuilt; `go test ./... -count=1` passed. The OCI application image is `sub2api-custom:codex@sha256:e75f92a14c250ed724df007a30b49505690d4a77d6e2fa714395fd6464db299d`, with the previous image retained as `sub2api-custom:codex-pre-20260924T031408Z` for rollback.

The backend is a Go HTTP service using Gin for routing, Ent for PostgreSQL persistence and Redis for runtime coordination/cache.

## Responsibility

- Own authentication, admin/user APIs, gateway scheduling, provider integrations, usage accounting, monitoring and migrations.
- Keep stateful service lifecycle separate from application image rollout.

## Key Files

| Area | Purpose |
| --- | --- |
| `cmd/server/` | Server executable |
| `internal/handler/` | HTTP boundary |
| `internal/service/` | Business and integration logic |
| `internal/repository/` | Database access |
| `ent/schema/` | Durable entity definitions |
| `migrations/` | Database version changes |

## Current Capability Surface

- Pixel uses template `pixel_access_token` and balance strategy `pixel_user_quota`, implemented by `external_pixel_subscription_service.go::getPixelAccessTokenStatus`. A console Access Token is sent as Bearer authentication to `/api/status` and `/api/user/self` at `https://api.ai-pixel.online`. The `success/data` envelope and flat or nested user `quota`/`used_quota` fields are converted using provider metadata; missing quota is an error, not a zero balance. This strategy never calls the refresh-token endpoint. Known built-in Pixel legacy addresses/strategies are normalized without replacing saved credentials or other providers.
- External subscriptions include an A6API provider using the New API user-quota strategy. It requests `/api/status` and `/api/user/self` with the configured browser `Cookie` header, accepts the nested `data.user.quota`/`used_quota` response, and converts quota units using the provider's `quota_per_unit` as USD. Other New API console providers retain their Bearer-token request path.
- A6API requests also include the configured `New-API-User` value. The upstream endpoint returns `401 Unauthorized` with `New-Api-User header not provided` when the Cookie is valid but this header is absent.

- Group persistence and admin APIs include OpenAI fast-mode controls, reasoning-effort ceilings with downgrade/deny behavior, and per-user public-group restrictions.
- Usage logs and analytics expose request type, native compaction, requested/upstream reasoning effort, billing type and billing mode; the corresponding migrations and repository filters are versioned under `migrations/` and `internal/repository/`.
- Pricing supports long-context cache tiers, one-hour cache writes, image/video/per-request billing and model mappings used by the model plaza and channel/account statistics.
- The dedicated global-pricing page/API and its custom snapshot service are retired. The model plaza and available-channel surfaces still use the LiteLLM pricing fallback and channel/model pricing APIs.
- `internal/pkg/apicompat` maintains Chat Completions, Anthropic Messages and OpenAI Responses bridges. The Anthropic streaming converter now keeps output-item lifecycle balanced and assigns a distinct content index to each text part.
- The `v0.2.1` merge adds upstream request-id lineage, encrypted-content tracking, Codex model-manifest projections, image base64 backfill and additional WebSocket/session-limit safeguards; migrations `232`–`234` are applied by the normal migration runner.
- The `v0.2.7` upstream merge is represented by development commit `48d61795e` and includes model-allowlist/group repair, new provider migrations, subscription bulk operations, Seedance and provider media paths, plugin KV/runtime changes, and the regenerated Ent/Wire artifacts. Local external-subscription quota statistics and rate-multiplier table/bulk management remain available; the retired schedule-lock compatibility and channel-monitor auto-scheduling bindings were removed by the current cleanup.
- Channel monitoring keeps normal probes and quota monitoring with one `account_id`. Multi-account monitor bindings and monitor-driven account auto-scheduling are retired. Migration `241_remove_channel_monitor_account_auto_schedule.sql` removes the retired columns; historical migrations `151` and `152` remain unchanged.

Local external-subscription services, account usage-window integration, entity branding and provider logo handling remain part of the development customization boundary. Normal account scheduling is official; the retired schedule lock and monitor-driven auto-scheduling must not be classified as active local behavior. The frontend is restored to official presentation with functional extensions. The custom-menu DTO matches the official fields, including `hide_open_button`; the local `open_mode` field, shared SVG-icon routes, settings, parser and mutation services are removed. Historical menu-mode/library values are left inert in stored settings; official title and safe favicon injection retain site branding. Dynamic PWA icons/manifests and the obsolete appearance-theme API, fields and defaults are removed. Logo CDN/shared preset settings are returned by public/admin DTOs and HTML injection. Account construction uses the official typed signature; the dedicated external-quota setter remains. The current boundary is catalogued in the customization inventory.

## See Also

- [Customization Inventory](../concepts/customization-inventory.md)
- [System Architecture](../architecture/overview.md)
- [Data Flow](../architecture/data-flow.md)
