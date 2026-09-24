---
title: Current Documentation Sync State
updated: 2026-09-25
base_commit: da1f1049e
head_commit: 2d7f8cab8
---

# Impact

The A6API external-subscription provider now uses browser Cookie authentication for the New API `/api/status` and `/api/user/self` endpoints, parses nested `data.user` quota fields, and converts quota units to USD with `quota_per_unit`. The admin form labels the credential as login Cookie. The focused and full backend/frontend release gates passed.

The OCI application-only release from `2d7f8cab8` runs as `sub2api-custom:codex@sha256:6ba4e7420f6674e8a0f1363ee562c96abb30427e64ca74f81de9c3d9213b4723`, with rollback `sub2api-custom:codex-pre-20260925T013307Z@sha256:e75f92a14c250ed724df007a30b49505690d4a77d6e2fa714395fd6464db299d`. An AppleDouble transfer residue was removed before the successful rebuild; application, PostgreSQL and Redis are healthy, formal volumes are unchanged, and representative local/public routes return 200.

The development branch merged `upstream/main` at `a3eb7ef302961cba716dc78b39b93b60c467db0e` (`v0.2.8`) in `98f6d208d`; the plugin account snapshot denylist was then updated for the upstream `Account.ScheduleLocked` field in `104c5a14e`. The merge retained local Anthropic/Kreeperai, external-subscription and Responses compatibility contracts while integrating upstream OpenCode Go usage, typesafe risk control, backup/archive, affiliate withdrawal, signed thinking and paginated CSV export capabilities. Full Go tests and frontend typecheck/lint/build passed.

The OCI application-only release uses `sub2api-custom:codex@sha256:e75f92a14c250ed724df007a30b49505690d4a77d6e2fa714395fd6464db299d`, with rollback `sub2api-custom:codex-pre-20260924T031408Z@sha256:e6779b6bb1df4148db0c044dbebf54f81c1ff46472322a3b77edf4e43e6b15fc`. The application, PostgreSQL and Redis remained healthy with restart count 0; formal volumes were unchanged. Local and public representative routes and static assets returned HTTP 200, and the public version is `0.2.8`.

The development branch merged `upstream/main` at `1a9d49e16` (upstream `v0.2.7`) into local commit `48d61795e`, then fixed the runtime locale completeness contract in `eb2bbf01f`. Conflicts were resolved with upstream functionality retained and local account/external-subscription/visual contracts restored. The OCI application image was released from the resulting source; stateful services and volumes were unchanged.

The account-card and admin-settings route-tab repair is committed as `bc64e2cb3` and released to OCI as `sub2api-custom:codex@sha256:e6779b6bb1df4148db0c044dbebf54f81c1ff46472322a3b77edf4e43e6b15fc`. A transient failed container start was caused by an AppleDouble `._001_init.sql` residue from an interrupted source transfer; all `._*` source residues were removed before the successful application-only rebuild. Rollback remains `sub2api-custom:codex-pre-20260920T054450Z@sha256:3188f4db60f64c2e4749d0cd55cf91e28191ceab794e37eee1a48ac8d4b08d0f`.

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
| Account-card and settings route-tab repair | `.llm-wiki/modules/frontend.md` + authority | frontend module, authority release section | `bc64e2cb3`; focused account/settings contracts, `vue-tsc`, Vite build and diff check passed; OCI active digest `sha256:e6779b6b...`; health, routes and formal volumes verified |
| Frontend custom CSS cascade cleanup | `.llm-wiki/modules/frontend.md` + authority | style ownership contract and audit result | Removed 185 strictly shadowed declarations and 49 empty rules; 5,504 selector/property/context winners matched before/after; the only remaining exact scoped duplicates are three intentional legacy-browser fallbacks; full Vitest surfaced 177 unrelated failures and 2,437 passes |
| Upstream v0.2.8 merge and OCI application release | authority + frontend/backend modules | merge capabilities, test gates and runtime snapshot | Merge `98f6d208d`, snapshot fix `104c5a14e`; `go test ./... -count=1`, frontend typecheck/lint/build and diff check passed; image `sha256:e75f92...299d`; rollback `sha256:e6779b...15fc`; routes/assets 200; formal volumes and stateful containers unchanged |
| A6API Cookie balance integration and OCI release | `.llm-wiki/modules/backend.md`, `.llm-wiki/modules/frontend.md`, authority | Cookie auth, nested quota parsing, USD conversion, credential label, release digest and rollback state | Commit `2d7f8cab8`; full Go/frontend gates passed; image `sha256:6ba4e742...b4723`; rollback `sha256:e75f92...299d`; metadata residue removed; health, routes, version and formal volumes verified |

# Lint

- Broken links: 0 (relative Wiki links and authority entry checked)
- Orphan pages: 0 (all pages reachable from `_index.md`)
- Stale references: 0 in updated Wiki pages
- Unresolved conflicts: 0
- Build caveat: `pnpm run build` now passes after the completeness test was aligned with runtime modular/legacy locale merging and the missing English/Chinese UI keys were filled; lint retains 5 pre-existing warnings and Vite reports existing chunk-size/deprecation warnings.

The OCI runtime is deployed from `2d7f8cab8` (based on the merged upstream `v0.2.8` source) as `sub2api-custom:codex@sha256:6ba4e7420f6674e8a0f1363ee562c96abb30427e64ca74f81de9c3d9213b4723`; rollback is retained under `sub2api-custom:codex-pre-20260925T013307Z`. PostgreSQL/Redis containers and formal volumes, Cloudflare, Bridge, website and backup data were not replaced.
