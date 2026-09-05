---
title: Data Flow
updated: 2026-09-03
sources:
  - frontend/src/main.ts
  - frontend/src/App.vue
  - backend/internal
---

# Data Flow

## Request Lifecycle

```text
Browser -> Tunnel/proxy -> Gin route -> auth/middleware -> service/repository
                                                    -> PostgreSQL/Redis
                                                    <- response
```

The frontend bootstraps injected settings, initializes Pinia and i18n, waits for router readiness, then mounts. After mount it checks setup status and loads public settings. Authentication changes drive subscription polling and announcement loading; logout clears those stores.

Usage analytics follow the same boundary: route views normalize filters, typed API clients call the admin/user usage handlers, and repositories read the migrated usage dimensions from PostgreSQL. Dashboard summaries and tables therefore share request type, compaction and billing semantics without moving durable state into the frontend.

## State Boundaries

- PostgreSQL is the source of durable users, accounts, groups, settings, usage and monitor history.
- Redis is runtime cache/coordination state and must be backed up separately.
- External provider responses are not replaced by local rate or balance configuration values.

## See Also

- [System Architecture](overview.md)
- [Frontend Module](../modules/frontend.md)
- [Backend Module](../modules/backend.md)
