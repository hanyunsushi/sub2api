---
title: Wiki Sync State
updated: 2026-10-12
---

# Doc Impact Map

| Changed surface | Documentation owner | Current evidence |
| --- | --- | --- |
| Menu icon picker, direct navigation, settings/types/DTO | Frontend module and customization inventory | Official SVG input and `CustomPageView`; retired menu extension removed |
| Shared SVG-icon routes/services and settings persistence | Backend module and customization inventory | No source references to the retired menu library; AI-logo library remains |
| Development tree vs official baseline | Customization file appendix | 186 paths: 65 A, 121 M |
| Verification and OCI release | Project Authority | Source checks and OCI release verified; exact runtime data owned by Project Authority |

# Source Verification

- Vitest: 377 files and 2901 tests pass; no failed tests or unhandled errors.
- Frontend typecheck, lint, i18n completeness 3/3 and production build pass. Existing chunk-size/Browserslist/dynamic-import warnings remain.
- Complete Go `go test -tags=unit,embed ./... -count=1` and embedded server build pass.
- Official menu visibility/open-button mount and JSON round-trip tests remain. Retired opening-mode/library tests are removed. `CustomPageView` exactly matches `upstream/main`.
- Logo/CDN/shared AI-logo settings, Pixel/A6API, account cards/quota bars and external-cache identity/request protection remain unchanged.
- All 318 prior production migration files have matching source hashes. The merged official update adds three SQL migrations and two migration tests; no historical migration is modified or removed.
- PostgreSQL dump and app data are backed up before rollout; rollback/source details belong to the authority. Existing provider/account/menu settings are fingerprinted without exposing values. The user-owned 3001 preview remains available.

# Documentation Lint

- 13 Wiki pages, 228 local links and 35 source references checked with no missing targets; articles are reachable within two clicks.
- The appendix matches 186 current paths/statuses; ignored preview configuration is excluded.
- Agent authority symlink is valid. No credentials, build artifacts or raw logs are included in the Wiki.
- `git diff --check` passes. Runtime verified by active image/version, health, public settings/routes/JS, three applied upstream SQL migrations and durable configuration fingerprints. Initial rollback was triggered by the inclusion of a volatile display snapshot in the fixed-settings fingerprint; backup comparison confirmed durable values unchanged and the corrected gate passed. PostgreSQL/Redis identities/start times/mounts and app mount remain unchanged. Older rollback tags were reduced to three; no volumes or infrastructure were changed.
