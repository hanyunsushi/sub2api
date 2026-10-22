---
title: OCI Operations and Artifact Retention
updated: 2026-10-17
---

# OCI Operations and Artifact Retention

The OCI runtime uses Compose project `sub2api-oci`. Replace only the `sub2api` application service with `docker compose -p sub2api-oci up -d --no-deps --wait --wait-timeout 150 sub2api`; PostgreSQL, Redis, and all formal data volumes stay in place.

Transfer a clean Git archive and reject `.DS_Store` and `._*` residues before building. Preserve archive modes when extracting under a restricted umask (`tar --no-same-owner -xpzf`). The Dockerfile sets the entrypoint mode with `COPY --chmod=755`; adding only execute bits to a 600 file leaves the nonroot runtime unable to read it. Verify the actual container mode, active/tag image IDs, and healthy state before declaring success. An explicit bounded health wait must capture failure logs and roll back on error.

Build from a clean committed archive, pass COMMIT/VERSION/DATE build arguments, verify the candidate binary with `-version`, then confirm the active container/tag image IDs. Capture the release rollback tag, old source, full database dump, app data archive, migration-source hashes and pre/post container mounts without publishing credentials. Integration checks must also verify saved secrets and unrelated provider configurations are preserved. Exact current release evidence is owned by the [Project Authority](../../agent.md).

The bound external-subscription scheme release on 2026-10-15 followed this application-only path: clean archive, rollback tag, PostgreSQL/application-data backups, image build with explicit metadata, and `up -d --no-deps --wait` for `sub2api`. The exact image digest, container IDs, route checks and backup location are recorded in the [Project Authority](../../agent.md); this guide intentionally does not duplicate volatile release identifiers.

Sub2API retains the active `sub2api-custom:codex` image plus exactly the three newest `sub2api-custom:codex-pre-*` rollback tags. Review the explicit OCI tag list and active image reference before deleting old tags. Keep backups and formal volumes; shared builder caches and other projects remain outside routine application release cleanup. Recheck rollback count, active/tag identity and health afterward.

For separately authorized shared-host cache cleanup, the persistent entry is `/Users/hinaw/.local/share/oci-maintenance/oci-retention-cleanup.sh`, replacing the missing dated task-directory helper. It defaults to dry-run with a private plan; review the exact image IDs and protected inventory, then run `--apply --plan /absolute/path/to/plan.json`. This rebuilt mode preserves every tagged image and every volume, requires exactly three Sub2API/website rollback tags, rejects plan drift and concurrent builds, and only removes untagged images without digests or container references plus unused builder cache. It verifies container/service identity, mounts, protected file hashes and local application health afterward. It does not install a timer or implement the historical QingZhou volume-purge mode. Operational verification is owned by the [Project Authority](../../agent.md).

Never use `docker compose down -v`, a volume-enabled prune, or a broad image deletion. Preserve `sub2api-oci_sub2api_data`, `sub2api-oci_postgres_data`, and `sub2api-oci_redis_data`; verify `/health`, representative routes, active digest, and volume mounts after any release or cleanup.
