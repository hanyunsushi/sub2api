---
title: Wiki Sync State
updated: 2026-10-15
---

# Doc Impact Map

| Changed surface | Documentation owner | Evidence |
| --- | --- | --- |
| Upstream v0.2.16 merge | Backend module and project authority | Merge commit `4a399b4f91e2b5eedf0be7db55ac955aa00b79b8`; Ent/Wire regeneration; group i18n and Gemini cache migrations |
| Vendor-bound external-subscription schemes | Backend/frontend modules and external-subscription inventory | The editor submits one `scheme`; the server binds legacy template/strategy values and authentication headers, migrates seven built-in providers from broad schemes, and exposes seven complete provider presets |
| OCI application-only release | Project Authority and OCI operations guide | Clean archive, rollback tag, PostgreSQL/application-data backups, explicit image metadata, bounded healthy switch, unchanged PostgreSQL/Redis and formal volumes |
| Production verification | Project Authority | OCI application-only release verified on 2026-10-15; seven vendor/authentication schemes remain active in stored provider configuration |

# Verification

- Merge source: `upstream/main` `dcde68aa5881ba7eea569ff1d98a860fba1d8b8c`; merge commit `4a399b4f91e2b5eedf0be7db55ac955aa00b79b8`.
- Release source: `4a399b4f91e2b5eedf0be7db55ac955aa00b79b8`; production binary reports Sub2API `0.2.16`, commit `4a399b4f91e2`, built `2026-10-15T08:54:00Z`.
- The OCI build completed frontend i18n completeness, Vite production build and Go embedded compilation. Existing Browserslist, dynamic-import and large-chunk warnings remain non-blocking.
- The release used a clean archive with SHA-256 `5d3e70f758e413d959c3572028b270a6eacd5b26bac23c9a1149525397dc5ebe`; the local documentation symlink and AppleDouble/`.DS_Store` residues were excluded.
- Backup integrity passed for the PostgreSQL custom-format dump, `pg_restore -l`, application-data archive and source/rollback metadata. Secrets are not recorded here.
- The active application is healthy. `/health`, `/home`, `/login` and `/admin/settings/external-subscriptions` returned HTTP 200 through the OCI loopback bind and the public entry point.
- Migrations `242_group_i18n.sql`, `243_gemini_cached_contents.sql`, `244_gemini_cached_contents_channel_usage.sql` and `245_gemini_cached_contents_mutation_lease.sql` are recorded in production.
- PostgreSQL and Redis container IDs/start times and the three formal volumes were unchanged. The release did not use `docker compose down -v`.
- Production `external_subscription_providers` contains seven providers mapped to distinct schemes: `pixel_access_token`, `qlhazycoder_bearer_token`, `cloudflare_api_token_account_id`, `openrouter_api_key`, `a6api_cookie_newapi_user`, `packycode_bearer_newapi_user`, and `modelflare_cookie_user`.

# Documentation Lint

- The authority symlink, reciprocal Wiki links and source references remain valid; the exact volatile release identifiers are owned by the authority document.
- No credentials, cookies, generated bundles or long deployment logs are committed.
