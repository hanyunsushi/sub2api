---
title: Directory Structure
updated: 2026-10-11
sources:
  - backend/
  - frontend/src/
  - deploy/
---

# Directory Structure

| Path | Responsibility |
| --- | --- |
| `backend/cmd/` | Executable entry points, including the server |
| `backend/internal/handler/` | HTTP handlers and route-facing behavior |
| `backend/internal/service/` | Domain and integration services |
| `backend/internal/repository/` | Persistence access |
| `backend/ent/` | Ent schema, generated model and migration support |
| `backend/migrations/` | Versioned database migrations |
| `frontend/src/api/` | HTTP API clients |
| `frontend/src/components/` | Reusable Vue components |
| `frontend/src/views/` | Route-level pages |
| `frontend/src/stores/` | Pinia state and polling lifecycles |
| `frontend/src/router/` | Route definitions and title resolution |
| `frontend/src/style.css`, `frontend/src/styles/` | Official base and onboarding styles; no local repair/text-action layer |
| `deploy/` | Compose files and deployment helpers |

The local frontend locator generator and theme-specific ast-grep rules are retired. CodeGraph metadata is structural support, not application behavior.

## See Also

- [System Architecture](overview.md)
- [Frontend Module](../modules/frontend.md)
- [Backend Module](../modules/backend.md)
