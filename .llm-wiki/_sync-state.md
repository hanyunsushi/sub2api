---
title: Current Documentation Sync State
updated: 2026-09-05
base_commit: 6ee4493112bddb2516c2470fde93d7e67ddbe9c0
head_commit: 84db8fcb309bfcc15616d7c5e9d95fdd635dbe94
---

# Impact

| Changed area | Canonical owner | Updated docs | Evidence |
| --- | --- | --- | --- |
| Project workflow and verification rules | `agent.md` authority | authority + testing guide | `SKILL-RUNTIME.md`, `llm-wiki/SKILL.md`, current `frontend/package.json` |
| Frontend account responsive change | `.llm-wiki` module/architecture context | authority pending item + frontend module context | fixed 22.5rem tracks after mobile cascade; account responsive/menu contracts 8/8, typecheck, lint, build, diff check |
| Frontend shared mobile cards, semantic status chips and teleported profile menu | `.llm-wiki/modules/frontend.md` + authority pending item | responsive contracts + current verification boundary | source contract 3/3, affected Vitest 47/47, typecheck, lint, build, diff check, `3001` HTTP 200 |
| Official upstream merge: backend schema, migrations, gateway and Responses compatibility | `.llm-wiki/modules/backend.md` + authority | backend capability and merge-gate sections | merge `84db8fcb3` with upstream `ab99d56e9` / `v0.2.1`; `go generate ./ent`; `go test ./... -count=1` passed |
| Official upstream merge: frontend usage, group policy and pricing surfaces | `.llm-wiki/modules/frontend.md` + authority | frontend capability and merge-gate sections | upstream `ab99d56e9`; typecheck/build/lint passed; lint retained 5 warnings |
| Local customization preservation during merge | authority + frontend/backend module context | custom boundary and release state | seven conflicts resolved explicitly; no unresolved conflicts; Kreepai/Anthropic UI and external-subscription boundaries retained |
| OCI full release of merged source | authority runtime snapshot | release commit, image, rollback, backup and health evidence | OCI image `sub2api-custom:codex` at `sha256:a60eadd31c7c7b14e2bfe6eb248b54c63a8d7249eeffddb0bf34c8261f64650d`; backup checksums passed; local/public health and version `0.2.1` verified |

# Lint

- Broken links: 0 (relative Wiki links and authority entry checked)
- Orphan pages: 0 (all pages reachable from `_index.md`)
- Stale references: 0 in updated Wiki pages
- Unresolved conflicts: 0

The source merge commit `84db8fcb3` is deployed to OCI as source commit `84db8fcb3`; PostgreSQL/Redis, Cloudflare, Bridge, website and backup data were not replaced. The release rollback tag and pre-release source copy remain available.
