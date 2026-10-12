---
title: Current Documentation Sync State
updated: 2026-10-12
base_commit: 42bc7f6cffe24bcb471608e48e66b4a0afa1f882
head_commit: 62608ac87
---

# Doc Impact Map

| Changed area | Canonical owner | Evidence |
| --- | --- | --- |
| Official frontend and retained functional extensions | [Customization Inventory](concepts/customization-inventory.md), [Frontend](modules/frontend.md) | Account cards restored with selection, sorting and quota behavior; cache invalidation and generation guard retained |
| Exact current working-tree diff coverage | [Customization Files](concepts/customization-files.md) | 187 paths: 68 A, 119 M, including untracked regression coverage; ignored local preview config excluded |
| Mail, build and test fixes | [Customization Inventory](concepts/customization-inventory.md), [Backend](modules/backend.md) | Official email template retained with escaping/shared TTL; pinned pnpm, legal docs and entrypoint permissions retained; redundant CA update removed |
| Development preview, verification and release boundary | [Project Authority](../agent.md) | Earlier official restoration is deployed; current account-card/email/proxy-source adjustments remain uncommitted and undeployed; user-owned 3001 preview remains |

# Verification

- Official baseline is the already merged local upstream commit, not a remote refresh. The restoration commit is pushed and deployed to OCI; the exact current runtime and rollback state belong to the Project Authority.
- Full frontend Vitest: 342 files / 2630 tests passed without unhandled errors. Latest focused frontend suite: 5 files / 70 tests passed. Typecheck, lint (zero errors/warnings), i18n completeness 3/3 and production build passed. AccountsView chunk size and stale Browserslist/Node-runtime warnings remain.
- Complete Go gate: `go test -tags 'unit,embed' -p 1 ./... -count=1` passed all 57 tested packages. The final repository package also passed with both tags after proxy-isolation edits. Embedded-web tests and `go build -tags embed ./cmd/server` passed. Go module tidy reports no remaining diff.
- Initial ordinary/embedded rounds exposed a WebSocket reader deadline and an Aliyun transport assertion affected by the local proxy. The WebSocket test passed independently and in the final complete gate. Aliyun fixtures now isolate proxy variables and retain the port while simulating disconnection; the verifier group passed three repetitions and the final full repository package passed.
- The complete unit-tag gate exposed a missing mutex unlock in the account test stub; the stub now defers unlock, and the full admin unit package passes. Stale Pixel/A6API/settings API fixtures were corrected; retired theme tests were removed instead of retaining obsolete contracts.
- Focused retained-function checks cover account token quotas, typed Grok OAuth injection, public/admin logo settings, preset normalization, absence of theme initialization/HTML injection, no header/monitor external-status requests, auth identity/permission invalidation and the API generation guard.
- Notification-email body regression test passes, retaining official bilingual copy/footer while checking HTML escaping and that both displayed expiry values use the shared 15-minute TTL. Account cards were checked at 1440, 390 and 360 px with no horizontal overflow; the QA log also records sort, selection and quota settings interactions.
- Vite source defaults to `http://localhost:8080`; ignored `frontend/.env.local` keeps the 3001 preview proxied to production API. Preview `/home` and `/api/v1/settings/public` return 200 after the override.
- Embedded frontend assets contain no Apple touch/192/512 PNG icons or manifest. HTML contains no PWA metadata; ordinary site title and safe favicon injection still pass. Header, monitor grid, index HTML and web middleware match the official baseline; ordinary custom site/entity logos remain supported.
- The user-owned 3001 preview remains running: `/home` and proxied public settings return HTTP 200; HTML has the official SVG favicon and no PWA metadata. This is code/HTTP evidence, not authenticated production/browser verification.
- Earlier 82-file/203-test/16-error and 343-file/2627-test counts are superseded intermediate or prior-tree evidence, not the current result.
- Release rechecks: 53 targeted frontend tests passed. OCI Docker frontend/i18n and embedded backend builds passed. Candidate/running `-version` match the published source commit; entrypoint is 755, app health is green and PostgreSQL/Redis identities/start times/mounts are unchanged.
- Local/public health and representative routes are 200. Public JS/CSS contain official presentation and retained Pixel/account quota features; PWA metadata and legacy theme field are absent. Provider/brand/menu and 37 existing account credential fingerprints are unchanged. This is HTTP/static/runtime evidence, not authenticated browser/provider verification.
- Clean archive transfer excludes AppleDouble/DS_Store; database dump and app data are backed up, migration files match the prior source. Three rollback tags remain after removing five old tags. Other projects, formal volumes and shared caches are untouched.

# Documentation Lint

- 13 Wiki pages and all 10 articles remain reachable within two clicks. The appendix matches 187 current paths/statuses, including one untracked regression test; ignored local preview configuration is intentionally excluded.
- Categories: Frontend 42, Backend 67, Tests 33, Generated Ent 18, Documentation 21, Assets 2, Engineering 4.
- The authority symlink remains valid and points to the canonical Obsidian dev document. User-requested feature removal supersedes historical PWA/theme/frontend presentation notes; human README/visual examples remain historical references.
- Git diff whitespace validation passes. Durable configuration, credentials, historical migrations and runtime volumes were preserved; no temporary scripts, binaries or raw test logs are included in the Wiki.
