---
title: Current Documentation Sync State
updated: 2026-09-04
base_commit: 6ee4493112bddb2516c2470fde93d7e67ddbe9c0
head_commit: 6ee4493112bddb2516c2470fde93d7e67ddbe9c0
---

# Impact

| Changed area | Canonical owner | Updated docs | Evidence |
| --- | --- | --- | --- |
| Project workflow and verification rules | `agent.md` authority | authority + testing guide | `SKILL-RUNTIME.md`, `llm-wiki/SKILL.md`, current `frontend/package.json` |
| Frontend account responsive change | `.llm-wiki` module/architecture context | authority pending item + frontend module context | fixed 22.5rem tracks after mobile cascade; account responsive/menu contracts 8/8, typecheck, lint, build, diff check |
| Frontend shared mobile cards, semantic status chips and teleported profile menu | `.llm-wiki/modules/frontend.md` + authority pending item | responsive contracts + current verification boundary | source contract 3/3, affected Vitest 47/47, typecheck, lint, build, diff check, `3001` HTTP 200 |
| Missing documentation entry points | project infrastructure | `agent.md`, `_schema.md`, `_index.md` | filesystem and `git status` inspection |

# Lint

- Broken links: 0 (relative Wiki links and authority entry checked)
- Orphan pages: 0 (all pages reachable from `_index.md`)
- Stale references: 0 in newly created Wiki pages
- Unresolved conflicts: 0

The repository has uncommitted frontend changes; the sync state records the audited HEAD and does not claim those changes are released.
