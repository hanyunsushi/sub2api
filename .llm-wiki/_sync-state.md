---
title: Current Documentation Sync State
updated: 2026-10-12
base_commit: 9591136d45cef26453348ed9532a7ebbce7cf99c
head_commit: 076106755be184981cafe70411eef60d4cbef101
---

# Doc Impact Map

| Changed area | Canonical owner | Evidence |
| --- | --- | --- |
| Official frontend and retained functional extensions | [Customization Inventory](concepts/customization-inventory.md), [Frontend](modules/frontend.md) | Official v0.2.12–v0.2.15 updates merged; account cards, retained extensions, cache invalidation and generation guard preserved |
| Exact current source diff coverage | [Customization Files](concepts/customization-files.md) | 190 paths: 68 A, 122 M against upstream/main; ignored local preview config excluded |
| Mail, build and test fixes | [Customization Inventory](concepts/customization-inventory.md), [Backend](modules/backend.md) | Official email template retained with escaping/shared TTL; pinned pnpm, legal docs and entrypoint permissions retained; redundant CA update removed |
| Development merge, verification and release boundary | [Project Authority](../agent.md) | Merge `076106755be184981cafe70411eef60d4cbef101` is verified but not deployed; production remains on `27a0dc7b1`; user-owned 3001 preview remains |

# Verification

- The current source baseline is upstream/main `9591136d45cef26453348ed9532a7ebbce7cf99c`; merge commit `076106755be184981cafe70411eef60d4cbef101` is pushed to the development branch but not deployed. Production and rollback evidence remain owned by the Project Authority.
- Full frontend Vitest after the upstream merge: 377 files / 2901 tests passed without unhandled errors. The earlier account-card focused suite was 5 files / 70 tests; the current merge gate is the full suite. Typecheck, lint (zero errors/warnings), i18n completeness 3/3 and production build passed. AccountsView chunk size and stale Browserslist/Node-runtime warnings remain.
- Complete Go gate: `go test -tags=unit,embed ./... -count=1` passed all packages; generation for Ent and Wire also passed. The final repository package also passed with both tags after proxy-isolation edits. The generated Ent and Wire outputs are clean after generation; the frontend build refreshed the embedded web assets.
- Initial ordinary/embedded rounds exposed a WebSocket reader deadline and an Aliyun transport assertion affected by the local proxy. The WebSocket test passed independently and in the final complete gate. Aliyun fixtures now isolate proxy variables and retain the port while simulating disconnection; the verifier group passed three repetitions and the final full repository package passed.
- The complete unit-tag gate exposed a missing mutex unlock in the account test stub; the stub now defers unlock, and the full admin unit package passes. Stale Pixel/A6API/settings API fixtures were corrected; retired theme tests were removed instead of retaining obsolete contracts.
- Focused retained-function checks cover account token quotas, typed Grok OAuth injection, public/admin logo settings, preset normalization, absence of theme initialization/HTML injection, no header/monitor external-status requests, auth identity/permission invalidation and the API generation guard.
- Notification-email body regression test passes, retaining official bilingual copy/footer while checking HTML escaping and that both displayed expiry values use the shared 15-minute TTL. Account cards were checked at 1440, 390 and 360 px with no horizontal overflow; the QA log also records sort, selection and quota settings interactions.
- Vite source defaults to `http://localhost:8080`; ignored `frontend/.env.local` keeps the 3001 preview proxied to production API. Preview `/home` and `/api/v1/settings/public` return 200 after the override.
- Embedded frontend assets contain no Apple touch/192/512 PNG icons or manifest. HTML contains no PWA metadata; ordinary site title and safe favicon injection still pass. Header, monitor grid, index HTML and web middleware match the official baseline; ordinary custom site/entity logos remain supported.
- The user-owned 3001 preview remains running: `/home` and proxied public settings return HTTP 200; HTML has the official SVG favicon and no PWA metadata. This is code/HTTP evidence, not authenticated production/browser verification.
- Earlier 82-file/203-test/16-error and 343-file/2627-test counts are superseded intermediate or prior-tree evidence, not the current result.
- The merge gate passed typecheck, lint, i18n completeness 3/3, production build and `git diff --check`; build warnings remain non-blocking. Prior release OCI Docker frontend/i18n and embedded backend builds passed. Candidate/running `-version` match `27a0dc7b1`; entrypoint is 755, app health is green, the rollback image and database/app-data backups are recorded, and PostgreSQL/Redis identities/start times/mounts are unchanged.
- Runtime health and representative-route evidence still refers to the prior account-card deployment; this upstream merge was not deployed. Public JS/CSS contain official presentation and retained Pixel/account quota features; PWA metadata and legacy theme field are absent. Provider/brand/menu and 37 existing account credential fingerprints are unchanged. This is HTTP/static/runtime evidence, not authenticated browser/provider verification.
- Clean archive transfer excludes AppleDouble/DS_Store; database dump and app data are backed up, migration files match the prior source. The new account-card rollback tag and prior rollback tags remain. This release did not remove images or caches; other projects and formal volumes are untouched.

# Documentation Lint

- 13 Wiki pages and all 10 articles remain reachable within two clicks. The appendix matches 190 current paths/statuses; ignored local preview configuration is intentionally excluded.
- Categories: Frontend 42, Backend 68, Tests 35, Generated Ent 18, Documentation 21, Assets 2, Engineering 4.
- The authority symlink remains valid and points to the canonical Obsidian dev document. User-requested feature removal supersedes historical PWA/theme/frontend presentation notes; human README/visual examples remain historical references.
- Git diff whitespace validation passes. Durable configuration, credentials, historical migrations and runtime volumes were preserved; no temporary scripts, binaries or raw test logs are included in the Wiki.
