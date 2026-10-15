---
title: Wiki Sync State
updated: 2026-10-15
---

# Doc Impact Map

| Changed surface | Documentation owner | Evidence |
| --- | --- | --- |
| Vendor-bound external-subscription schemes | Backend/frontend modules and external-subscription inventory | The editor submits one `scheme`; the server binds legacy template/strategy values and authentication headers, migrates seven built-in providers from broad schemes, and exposes seven complete provider presets |
| OCI application-only release | Project Authority and OCI operations guide | Clean archive, rollback tag, PostgreSQL/application-data backups, explicit image metadata, bounded healthy switch, unchanged PostgreSQL/Redis and formal volumes |
| Production verification | Project Authority | OCI application-only release verified on 2026-10-15; seven vendor/authentication schemes are active in stored provider configuration |

# Verification

- Release source: `b77d9063b3bd7f43969593bf93883f8b18963827`; production binary reports Sub2API `0.2.15`, commit `b77d9063b3bd`, built `2026-10-15T02:07:06Z`.
- The OCI build completed frontend i18n completeness, Vite production build and Go embedded compilation. Existing Browserslist, dynamic-import and large-chunk warnings remain non-blocking.
- The release used a clean archive with SHA-256 `6380dca490b24290b67bfd685ad74d76191b29ad46b143ec4f2af62feb343947`; the local documentation symlink and AppleDouble/`.DS_Store` residues were excluded.
- Backup integrity passed for the PostgreSQL custom-format dump, application-data archive, source marker and rollback marker; `pg_restore -l` also passed. Secrets are not recorded here.
- The active application is healthy. `/health`, `/home`, `/login` and `/admin/settings/external-subscriptions` returned HTTP 200 through the OCI loopback bind and the public entry point. The public external-subscription bundle contains all seven vendor markers, `scheme`, and “配置方案”.
- PostgreSQL and Redis container IDs/start times and the three formal volumes were unchanged. The release did not use `docker compose down -v`.
- Production `external_subscription_providers` contains seven providers mapped to distinct schemes: `pixel_access_token`, `qlhazycoder_bearer_token`, `cloudflare_api_token_account_id`, `openrouter_api_key`, `a6api_cookie_newapi_user`, `packycode_bearer_newapi_user`, and `modelflare_cookie_user`.

# Documentation Lint

- The authority symlink, reciprocal Wiki links and source references remain valid; the exact volatile release identifiers are owned by the authority document.
- No credentials, cookies, generated bundles or long deployment logs are committed.
