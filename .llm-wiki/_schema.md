---
title: Sub2API Wiki Schema
updated: 2026-09-06
last_synced_commit: 5b10ba4c2aca14c4bd71321da41d4a01cea4932e
commit_policy: committed
authority_entry: ../agent.md
---

# Project Metadata

| Field | Value |
| --- | --- |
| Project Name | Sub2API |
| Languages | Go 1.27, TypeScript/Vue 3 |
| Frameworks | Gin, Ent, Vite, Vue Router, Pinia |
| Database | PostgreSQL 16 |
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
