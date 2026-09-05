---
title: System Architecture
updated: 2026-09-03
sources:
  - backend/cmd/server
  - frontend/src/main.ts
  - deploy/docker-compose.yml
---

# System Architecture

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Go 1.27, Gin, Ent |
| Frontend | Vue 3, Vite, TypeScript, Pinia |
| Persistence | PostgreSQL 16 |
| Cache | Redis |
| Delivery | Docker Compose; OCI loopback service behind Cloudflare Tunnel |

## Component Diagram

```text
Browser -> Cloudflare Tunnel -> Sub2API HTTP server
                                  |-> PostgreSQL
                                  |-> Redis
                                  |-> provider/upstream APIs
```

The frontend is built and served by the application image. The backend owns authentication, routing, persistence, gateway scheduling, provider integrations and admin APIs. PostgreSQL and Redis are stateful services and are not routine release targets.

## See Also

- [Data Flow](data-flow.md)
- [Directory Structure](directory-structure.md)
- [Project Authority](../../agent.md)
