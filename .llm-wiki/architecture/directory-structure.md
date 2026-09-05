---
title: Directory Structure
updated: 2026-09-03
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
| `frontend/src/styles/` | Global and targeted visual rules |
| `deploy/` | Compose files and deployment helpers |

Generated frontend locator/index data is validation support and is not a source-of-truth document.

## See Also

- [System Architecture](overview.md)
- [Frontend Module](../modules/frontend.md)
- [Backend Module](../modules/backend.md)
