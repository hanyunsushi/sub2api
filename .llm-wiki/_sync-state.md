---
title: Current Documentation Sync State
updated: 2026-09-04
base_commit: 6ee4493112bddb2516c2470fde93d7e67ddbe9c0
head_commit: e142d91e4ac274e55a7b494d02568e7e60007980
---

# Impact

| Changed area | Canonical owner | Updated docs | Evidence |
| --- | --- | --- | --- |
| Project workflow and verification rules | `agent.md` authority | authority + testing guide | `SKILL-RUNTIME.md`, `llm-wiki/SKILL.md`, current `frontend/package.json` |
| Frontend account responsive change | `.llm-wiki` module/architecture context | authority pending item + frontend module context | fixed 22.5rem tracks after mobile cascade; account responsive/menu contracts 8/8, typecheck, lint, build, diff check |
| Frontend shared mobile cards, semantic status chips and teleported profile menu | `.llm-wiki/modules/frontend.md` + authority pending item | responsive contracts + current verification boundary | source contract 3/3, affected Vitest 47/47, typecheck, lint, build, diff check, `3001` HTTP 200 |
| Official upstream merge: backend schema, migrations, gateway and Responses compatibility | `.llm-wiki/modules/backend.md` + authority | backend capability and merge-gate sections | merge `e142d91e4`; `go generate ./ent`; `go test ./... -count=1` passed |
| Official upstream merge: frontend usage, group policy and pricing surfaces | `.llm-wiki/modules/frontend.md` + authority | frontend capability and merge-gate sections | upstream `b1748c4ea`; typecheck/build/lint passed; focused Vitest 59/64 |
| Local customization preservation during merge | authority + frontend/backend module context | custom boundary and non-release status | merge parents reviewed; no unresolved conflicts; no OCI/production/backup changes |
| OCI full release of merged source | authority runtime snapshot | release commit, image, rollback, backup and health evidence | OCI image `sub2api-custom:codex` at `sha256:20743041896a69cec57517eb93d4414ffa93c1912afdbf22930ea2a242b91b99`; backup checksums passed; local/public health and version `0.2.0` verified |

# Lint

- Broken links: 0 (relative Wiki links and authority entry checked)
- Orphan pages: 0 (all pages reachable from `_index.md`)
- Stale references: 0 in updated Wiki pages
- Unresolved conflicts: 0

The source merge commit `e142d91e4` is deployed to OCI as source commit `68a4085e0`; PostgreSQL/Redis, Cloudflare, Bridge, website and backup data were not replaced. The release rollback tag and pre-release source copy remain available.
