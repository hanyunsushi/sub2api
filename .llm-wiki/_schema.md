---
title: Sub2API Wiki Schema
updated: 2026-11-04
last_synced_commit: 8a12fa2856573984857f923754ac674c8180e3bd
commit_policy: committed-base-plus-reviewed-publication
publication_scope: containing-commit
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
