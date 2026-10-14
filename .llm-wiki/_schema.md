---
title: Sub2API Wiki Schema
updated: 2026-10-15
last_synced_commit: 9109a5a5e6b9f4e04cfe27a1a1027741c19f5c6e
commit_policy: committed
authority_entry: ../agent.md
---

# Project Metadata

| Field | Value |
| --- | --- |
| Project Name | Sub2API |
| Languages | Go 1.27, TypeScript/Vue 3 |
| Frameworks | Gin, Ent, Vite, Vue Router, Pinia |
| Database | PostgreSQL 18 (OCI runtime) |
| Cache | Redis |
| Package Manager | Go modules, pnpm |
| Test Framework | Go test, Vitest, ESLint, vue-tsc |

# Document Inventory

| Asset | Owner | Update rule |
| --- | --- | --- |
| `agent.md` | project authority | project/runtime/process facts change |
| `.llm-wiki/` | llm-wiki | architecture/module/API facts change |
| `AGENTS.md` | project rules | Agent behavior rules change |
| `README*`, `docs/` | human docs | manual unless explicitly requested |

# Wiki Conventions

- Articles use `kebab-case.md` and are reachable from `_index.md` within two clicks.
- Source references use stable file paths and symbols; line numbers are snapshot evidence only.
- No `_log.md`; Git owns history. Do not store secrets, long logs or one-off debugging notes.
