---
title: Current Documentation Sync State
updated: 2026-10-11
base_commit: 42bc7f6cffe24bcb471608e48e66b4a0afa1f882
head_commit: 9b4e17d2a22c0f03f9a5b2715406834e2c3feb4b
---

# Doc Impact Map

| Changed area | Canonical owner | Evidence |
| --- | --- | --- |
| Official frontend and retained functional extensions | [Customization Inventory](concepts/customization-inventory.md), [Frontend](modules/frontend.md) | Header/monitor fetching removed; entity logos, external subscription management and account quotas retained; auth-store cache invalidation |
| Exact current working-tree diff coverage | [Customization Files](concepts/customization-files.md) | 186 paths: 67 A, 119 M; includes non-ignored new files and uncommitted changes |
| Branding/settings API and non-core cleanup | [Backend](modules/backend.md) | PWA assets/server rendering and legacy theme API removed; public/admin logo presets wired; typed account construction and dedicated quota injection |
| Development preview, verification and release boundary | [Project Authority](../agent.md) | Protection branch; no merge/push/deploy; 3001 HTTP 200 and no PWA metadata |

# Verification

- Official baseline is the already merged local upstream commit, not a remote refresh. The working tree is uncommitted; production still runs its previously released image.
- Full frontend Vitest: 342 files / 2628 tests passed without unhandled errors. Typecheck, lint (zero errors/warnings), i18n completeness 3/3 and production build passed. AccountsView chunk size and stale Browserslist/Node-runtime warnings remain.
- Complete Go gate: `go test -tags 'unit,embed' -p 1 ./... -count=1` passed all 57 tested packages. The final repository package also passed with both tags after proxy-isolation edits. Embedded-web tests and `go build -tags embed ./cmd/server` passed. Go module tidy reports no remaining diff.
- Initial ordinary/embedded rounds exposed a WebSocket reader deadline and an Aliyun transport assertion affected by the local proxy. The WebSocket test passed independently and in the final complete gate. Aliyun fixtures now isolate proxy variables and retain the port while simulating disconnection; the verifier group passed three repetitions and the final full repository package passed.
- The complete unit-tag gate exposed a missing mutex unlock in the account test stub; the stub now defers unlock, and the full admin unit package passes. Stale Pixel/A6API/settings API fixtures were corrected; retired theme tests were removed instead of retaining obsolete contracts.
- Focused retained-function checks cover account token quotas, typed Grok OAuth injection, public/admin logo settings, preset normalization, absence of theme initialization/HTML injection, no header/monitor external-status requests, auth identity/permission invalidation and the API generation guard.
- Embedded frontend assets contain no Apple touch/192/512 PNG icons or manifest. HTML contains no PWA metadata; ordinary site title and safe favicon injection still pass. Header, monitor grid, index HTML and web middleware match the official baseline; ordinary custom site/entity logos remain supported.
- The user-owned 3001 preview remains running: `/home` and proxied public settings return HTTP 200; HTML has the official SVG favicon and no PWA metadata. This is code/HTTP evidence, not authenticated production/browser verification.
- Earlier 82-file/203-test/16-error and 343-file/2627-test counts are superseded intermediate or prior-tree evidence, not the current result.

# Documentation Lint

- 13 Wiki pages, 235 local links and 35 frontmatter sources validated; all 10 articles are reachable within two clicks. The appendix exactly matches 186 current paths/statuses, without duplicate or missing source links.
- Categories: Frontend 42, Backend 67, Tests 32, Generated Ent 18, Documentation 21, Assets 2, Engineering 4.
- The authority symlink remains valid and points to the canonical Obsidian dev document. User-requested feature removal supersedes historical PWA/theme/frontend presentation notes; human README/visual examples remain historical references.
- Git diff whitespace validation passes. Production data, historical migrations, runtime volumes and credentials were not changed; no temporary scripts, binaries or raw test logs are included in the Wiki.
