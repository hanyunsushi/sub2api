---
title: Current Documentation Sync State
updated: 2026-09-14
base_commit: 9f12bad52e44e682a8ff126324d0bf92e012b4b1
head_commit: 5f2fba16ad5ba81c3a44f5e828bdd260d651493b
---

# Impact

Dashboard embedding policy now permits exactly the production website and localhost/127.0.0.1 port 3100 for GET/HEAD only. Full Go tests and targeted trailing-slash/HEAD tests pass. The application-only OCI release and rollback image are recorded in the authority; stateful container IDs, start times and mounts match before/after. The real AI frame renders in an isolated website session without CSP errors; cross-origin SSO is not claimed. Source scope: the two middleware security-header files; documentation scope: data-flow, authority and schema.

| Changed area | Canonical owner | Updated docs | Evidence |
| --- | --- | --- | --- |
| Project workflow and verification rules | `agent.md` authority | authority + testing guide | `SKILL-RUNTIME.md`, `llm-wiki/SKILL.md`, current `frontend/package.json` |
| Frontend account responsive change | `.llm-wiki` module/architecture context | authority pending item + frontend module context | account tracks use 300px minimum auto-fit and fill the container; shared generic mobile cards remain 22.5rem; focused contract 4/4, typecheck, lint, index, build, diff check |
| Frontend shared mobile cards, semantic status chips and teleported profile menu | `.llm-wiki/modules/frontend.md` + authority pending item | responsive contracts + current verification boundary | source contract 3/3, affected Vitest 47/47, typecheck, lint, build, diff check, `3001` HTTP 200 |
| Official upstream merge: backend schema, migrations, gateway and Responses compatibility | `.llm-wiki/modules/backend.md` + authority | backend capability and merge-gate sections | merge `84db8fcb3` with upstream `ab99d56e9` / `v0.2.1`; `go generate ./ent`; `go test ./... -count=1` passed |
| Official upstream merge: frontend usage, group policy and pricing surfaces | `.llm-wiki/modules/frontend.md` + authority | frontend capability and merge-gate sections | upstream `ab99d56e9`; typecheck/build/lint passed; lint retained 5 warnings |
| Local customization preservation during merge | authority + frontend/backend module context | custom boundary and release state | seven conflicts resolved explicitly; no unresolved conflicts; Kreepai/Anthropic UI and external-subscription boundaries retained |
| OCI full release of merged source | authority runtime snapshot | release commit, image, rollback, backup and health evidence | OCI image `sub2api-custom:codex` at `sha256:91834d9f7093c9d09fe4ae723b4c9787787f5c0e4747de48476af8564260a681`; backup checksums passed; local/public health and version `0.2.1` verified |
| KreeperAI admin dashboard iframe policy | `backend/internal/server/middleware/security_headers.go` and tests | `agent.md`, security/runtime module context | New image `sub2api-custom:codex` digest `sha256:b6156e884c745dde520b70bcc2e68d0331105b3bf3a11d197c501b70b045a376`; only `GET`/`HEAD /admin/dashboard` allows `https://www.kreeper.cc`, other admin/API responses retain frame protections; full Go tests and public header probes passed |

# Lint

- Broken links: 0 (relative Wiki links and authority entry checked)
- Orphan pages: 0 (all pages reachable from `_index.md`)
- Stale references: 0 in updated Wiki pages
- Unresolved conflicts: 0

The runtime code tree from `9f12bad52` is deployed to OCI; changes through `5f2fba16a` after the image build only update Wiki metadata, and the development/production source trees are equal. PostgreSQL/Redis, Cloudflare, Bridge, website and backup data were not replaced. The release rollback tag and pre-release source copy remain available.
