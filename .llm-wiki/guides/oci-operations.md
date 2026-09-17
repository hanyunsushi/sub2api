---
title: OCI Operations and Artifact Retention
updated: 2026-09-17
---

# OCI Operations and Artifact Retention

The OCI runtime uses Compose project `sub2api-oci`. Replace only the `sub2api` application service with `docker compose -p sub2api-oci up -d --no-deps sub2api`; PostgreSQL, Redis, and all formal data volumes stay in place.

The shared retention workflow is `/Users/hinaw/Documents/Codex/2026-09-17/oci/oci-retention-cleanup.sh`. Run it without arguments for a dry-run and use `--apply` only after reviewing the exact deletion list. Sub2API retains the active `sub2api-custom:codex` image plus exactly the three newest `sub2api-custom:codex-pre-*` rollback tags. Unreferenced tagged images, disposable candidates, dangling images, and builder cache are removed only after health checks; rollback counts and zero-cache assertions are checked afterward.

Never use `docker compose down -v`, a volume-enabled prune, or a broad image deletion. Preserve `sub2api-oci_sub2api_data`, `sub2api-oci_postgres_data`, and `sub2api-oci_redis_data`; verify `/health`, representative routes, active digest, and volume mounts after any release or cleanup.
