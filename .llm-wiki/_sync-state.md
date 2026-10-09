---
title: Current Documentation Sync State
updated: 2026-10-10
base_commit: 88cb179b63d185b8e79f6a89a720eaa3b3e60c49
head_commit: 3e2fb5cffba5568f1b31c9d1941a03d887300949
---

# Doc Impact Map

| Changed area | Canonical owner | Evidence |
| --- | --- | --- |
| Pixel Access Token protocol, quota conversion and narrow legacy migration | [Backend](modules/backend.md) | Dedicated strategy tests, configuration migration tests, live provider/admin API |
| Pixel preset, credential label, hidden refresh/user fields and save payload | [Frontend](modules/frontend.md) | Vue mount regression test, typed API enums, production-served JS |
| Nonroot entrypoint permissions and safe source transfer | [OCI Operations](guides/oci-operations.md) | Dockerfile explicit 755 mode, actual running container stat |
| Application-only release, rollback, backup, health and preserved configuration | [Project Authority](../agent.md) | OCI pre/post container and configuration fingerprints, authenticated balance refresh, public routes/assets |

# Verification

- Full backend tests, frontend typecheck/build and diff check passed.
- Full Vitest: 399 files and 2932 tests passed; lint: 0 errors, 5 existing warnings.
- Production Pixel balance refresh returned CNY without error; saved token, other providers, stateful containers and formal mounts were preserved.
- Public version remains 0.2.11. Health, representative routes and Pixel template JS returned 200.
- Documentation-only commits after the code baseline do not change the running image. Exact release IDs and monetary snapshots belong only to the authority.

# Documentation Lint

- Wiki links and authority entry resolve; all article pages are reachable from the index.
- Updated source paths exist, agent.md remains a valid authority symlink, and no credentials or raw logs are included.
- This file records only the current impact map; Git owns prior sync history.
