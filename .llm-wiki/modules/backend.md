---
title: Backend Module
updated: 2026-09-03
sources:
  - backend/cmd/server/
  - backend/internal/handler/
  - backend/internal/service/
  - backend/internal/repository/
  - backend/ent/schema/
---

# Backend Module

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

## See Also

- [System Architecture](../architecture/overview.md)
- [Data Flow](../architecture/data-flow.md)
