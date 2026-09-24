---
title: Backend Module
updated: 2026-09-24
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

- Group persistence and admin APIs include OpenAI fast-mode controls, reasoning-effort ceilings with downgrade/deny behavior, and per-user public-group restrictions.
- Usage logs and analytics expose request type, native compaction, requested/upstream reasoning effort, billing type and billing mode; the corresponding migrations and repository filters are versioned under `migrations/` and `internal/repository/`.
- Pricing supports long-context cache tiers, one-hour cache writes, image/video/per-request billing and model mappings used by the model plaza and channel/account statistics.
- `internal/pkg/apicompat` maintains Chat Completions, Anthropic Messages and OpenAI Responses bridges. The Anthropic streaming converter now keeps output-item lifecycle balanced and assigns a distinct content index to each text part.
- The `v0.2.1` merge adds upstream request-id lineage, encrypted-content tracking, Codex model-manifest projections, image base64 backfill and additional WebSocket/session-limit safeguards; migrations `232`–`234` are applied by the normal migration runner.
- The `v0.2.7` upstream merge is represented by development commit `48d61795e` and includes model-allowlist/group repair, new provider migrations, subscription bulk operations, Seedance and provider media paths, plugin KV/runtime changes, and the regenerated Ent/Wire artifacts. Local external-subscription quota statistics, rate-multiplier and schedule-lock admin compatibility remain available.

The local Kreepai/Anthropic route-shell, external-subscription services, account scheduling/brand fields and provider logo handling remain part of the development customization boundary while upstream behavior is integrated around them.

## See Also

- [System Architecture](../architecture/overview.md)
- [Data Flow](../architecture/data-flow.md)
