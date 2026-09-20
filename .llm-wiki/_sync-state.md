---
title: Current Documentation Sync State
updated: 2026-09-20
base_commit: 48d61795e
head_commit: da1f1049e
---

# Impact

The development branch merged `upstream/main` at `1a9d49e16` (upstream `v0.2.7`) into local commit `48d61795e`, then fixed the runtime locale completeness contract in `eb2bbf01f`. Conflicts were resolved with upstream functionality retained and local account/external-subscription/visual contracts restored. The OCI application image was released from the resulting source; stateful services and volumes were unchanged.

Dashboard embedding policy now permits exactly the production website and localhost/127.0.0.1 port 3100 for GET/HEAD only. Full Go tests and targeted trailing-slash/HEAD tests pass. The application-only OCI release and rollback image are recorded in the authority; stateful container IDs, start times and mounts match before/after. The real AI frame renders in an isolated website session without CSP errors; cross-origin SSO is not claimed. Source scope: the two middleware security-header files; documentation scope: data-flow, authority and schema.

| Changed area | Canonical owner | Updated docs | Evidence |
| --- | --- | --- | --- |
| Project workflow and verification rules | `agent.md` authority | authority + testing guide | `SKILL-RUNTIME.md`, `llm-wiki/SKILL.md`, current `frontend/package.json` |
| Frontend account responsive change | `.llm-wiki` module/architecture context | authority pending item + frontend module context | account tracks use 300px minimum auto-fit and fill the container; shared generic mobile cards remain 22.5rem; focused contract 4/4, typecheck, lint, index, build, diff check |
| Frontend shared mobile cards, semantic status chips and teleported profile menu | `.llm-wiki/modules/frontend.md` + authority pending item | responsive contracts + current verification boundary | source contract 3/3, affected Vitest 47/47, typecheck, lint, build, diff check, `3001` HTTP 200 |
| Official upstream merge: backend schema, migrations, gateway and Responses compatibility | `.llm-wiki/modules/backend.md` + authority | backend capability and merge-gate sections | merge `84db8fcb3` with upstream `ab99d56e9` / `v0.2.1`; `go generate ./ent`; `go test ./... -count=1` passed |
| Official upstream merge: frontend usage, group policy and pricing surfaces | `.llm-wiki/modules/frontend.md` + authority | frontend capability and merge-gate sections | upstream `ab99d56e9`; typecheck/build/lint passed; lint retained 5 warnings |
| Local customization preservation during merge | authority + frontend/backend module context | custom boundary and release state | seven conflicts resolved explicitly; no unresolved conflicts; Kreepai/Anthropic UI and external-subscription boundaries retained |
| OCI full release of merged source | authority runtime snapshot | release commit, image, rollback, backup and health evidence | `eb2bbf01f` released as `sub2api-custom:codex@sha256:3188f4db60f64c2e4749d0cd55cf91e28191ceab794e37eee1a48ac8d4b08d0f`; rollback tag points to `sha256:b40f7cf9fdf6033f4e0d9f429b1526098b4eab526239bec0c945567accb782ff`; local/public health, routes and version `0.2.7` verified; formal volumes unchanged |
| KreeperAI admin dashboard iframe policy | `backend/internal/server/middleware/security_headers.go` and tests | `agent.md`, security/runtime module context | New image `sub2api-custom:codex` digest `sha256:b6156e884c745dde520b70bcc2e68d0331105b3bf3a11d197c501b70b045a376`; only `GET`/`HEAD /admin/dashboard` allows `https://www.kreeper.cc`, other admin/API responses retain frame protections; full Go tests and public header probes passed |
| Upstream v0.2.7 merge and locale contract repair | backend/frontend modules + authority | backend/frontend module pages, authority merge state | `go generate ./ent`, `go generate ./cmd/server`, `go test ./...` passed; merged modular/legacy locale completeness, `vue-tsc`, Vite build and lint passed; OCI release verified |

# Lint

- Broken links: 0 (relative Wiki links and authority entry checked)
- Orphan pages: 0 (all pages reachable from `_index.md`)
- Stale references: 0 in updated Wiki pages
- Unresolved conflicts: 0
- Build caveat: `pnpm run build` now passes after the completeness test was aligned with runtime modular/legacy locale merging and the missing English/Chinese UI keys were filled; lint retains 5 pre-existing warnings and Vite reports existing chunk-size/deprecation warnings.

The OCI runtime is deployed from `eb2bbf01f` as `sub2api-custom:codex@sha256:3188f4db60f64c2e4749d0cd55cf91e28191ceab794e37eee1a48ac8d4b08d0f`; the pre-release application image is retained under `sub2api-custom:codex-pre-20260920T040934Z`, and the pre-release source copy remains available. PostgreSQL/Redis containers and formal volumes, Cloudflare, Bridge, website and backup data were not replaced.
