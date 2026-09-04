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

# Lint

- Broken links: 0 (relative Wiki links and authority entry checked)
- Orphan pages: 0 (all pages reachable from `_index.md`)
- Stale references: 0 in updated Wiki pages
- Unresolved conflicts: 0

The source merge commit is documented and remains unreleased; OCI, production, Cloudflare and backup state were not changed.
