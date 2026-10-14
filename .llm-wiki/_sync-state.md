---
title: Wiki Sync State
updated: 2026-10-15
---

# Doc Impact Map

| Changed surface | Documentation owner | Evidence |
| --- | --- | --- |
| Bound external-subscription schemes | Backend/frontend modules and external-subscription inventory | The editor submits one `scheme`; the server derives legacy template/strategy values and exposes only four current schemes for new configuration |
| OCI application-only release | Project Authority and OCI operations guide | Clean archive, rollback tag, PostgreSQL/application-data backups, explicit image metadata, bounded healthy switch, unchanged PostgreSQL/Redis and formal volumes |
| Production verification | Project Authority | Local and public route checks plus static bundle evidence for `scheme`, “配置方案” and the four current scheme identifiers |

# Verification

- Release source: `cd5896d8ed1b82a519836b396d8932adbeeaa784`; production binary reports Sub2API `0.2.15`, commit `cd5896d8e`, built `2026-10-14T15:52:13Z`.
- The OCI build completed frontend i18n completeness, `vue-tsc`, Vite production build and Go embedded compilation. Existing Browserslist, dynamic-import and large-chunk warnings remain non-blocking.
- The release used a clean archive with SHA-256 `10664dbdcd875d33845b99e81f602dbbd732c62d1f3e235bd428b9d84acf76de`; the local documentation symlink and AppleDouble/`.DS_Store` residues were excluded.
- Backup integrity passed for the PostgreSQL dump, application-data archive, runtime Compose file, environment fingerprint, source marker and rollback marker; `pg_restore -l` also passed. Secrets are not recorded here.
- The active application is healthy. `/health`, `/home`, `/login` and `/admin/settings/external-subscriptions` returned HTTP 200 both through the OCI loopback bind and `https://ai.kreeper.cc`. The route bundle contains `scheme`, “配置方案”, `pixel_access_token`, `newapi_user_quota`, `openrouter_credits` and `cloudflare_ai_gateway_credits` locally and publicly.
- PostgreSQL and Redis container IDs/start times and the three formal volumes were unchanged. The release did not use `docker compose down -v`.

# Documentation Lint

- The authority symlink, reciprocal Wiki links and source references remain valid; the exact volatile release identifiers are owned by the authority document.
- No credentials, cookies, generated bundles or long deployment logs are committed.
