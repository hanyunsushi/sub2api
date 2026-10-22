# Sub2API AI Search Knowledge Base

## Overview

Sub2API uses Cloudflare AI Search instance `ai-search` to answer product, operations, backup, and account-management questions from the authenticated web console. The browser calls the Sub2API backend endpoint `/api/v1/ai-search/search`; the backend then calls Cloudflare. Cloudflare credentials are never exposed to frontend code.

## Header Search

The web console shows an `AI Search` search box in the top-right header, immediately to the left of the announcement bell. The visible product name is `AI Search`, not `Help`.

## Cloudflare AI Search Runtime

The Cloudflare account has an AI Search instance named `ai-search` in the `default` namespace. It uses hybrid retrieval with vector and keyword search, result fusion by reciprocal rank fusion, maximum 8 results, match threshold 0.2, and keyword match mode `or`.

The public search endpoint is enabled at:

`https://c98b93c6-bafe-4679-89df-823c1298e966.search.ai.cloudflare.com/search`

The backend can also use the official Cloudflare API when a token is configured. Runtime configuration keys:

- `cloudflare_ai.account_id`
- `cloudflare_ai.ai_search_instance_id`
- `cloudflare_ai.ai_search_api_token`
- `cloudflare_ai.ai_search_api_base_url`
- `cloudflare_ai.ai_search_public_endpoint_url`

Equivalent environment variables use uppercase names with underscores, for example `CLOUDFLARE_AI_AI_SEARCH_API_TOKEN`.

## Secrets

Cloudflare API tokens and R2 S3 secret access keys must not be written to frontend files, GitHub, documentation, logs, or browser-visible settings. If a Cloudflare or R2 key is lost, create a new key with the required permissions and update the backend or automation that uses it. Existing R2 objects remain stored; losing an access key does not delete bucket data.

## R2 Disaster Recovery

The R2 disaster-recovery bucket is `sub2api-backups`. Production PostgreSQL backups use prefix `sub2api/prod/postgres/`. Lifecycle cleanup for that prefix deletes old objects after 30 days. Backups should be restored by creating or using valid R2 credentials, downloading the relevant backup object, and restoring it into the target database according to the recorded operations document.

## Knowledge Storage

AI Search knowledge can be stored as indexed items inside the Cloudflare AI Search instance, or as source documents in R2 if an R2 source is configured later. The current web console integration reads from Cloudflare AI Search through the backend proxy. GitHub stores source code and documentation, while runtime database state lives in the production Postgres service managed by Docker Compose.

## Sub2API Runtime Layout

The development repository is `/Users/hinaw/sub2api-src`. The production-running source worktree is `/Users/hinaw/sub2api-prod-src`. The Docker Compose runtime is `/Users/hinaw/sub2api`. The symlink hub `/Users/hinaw/sub2api-project` is not the source of truth for implementation changes.

## Common User Questions

### Can AI Search help users use the website?

Yes. Authenticated users can search FAQ-style documentation and operational notes directly from the web console header. The search box sends queries to Sub2API, and Sub2API fetches relevant Cloudflare AI Search chunks.

### Where are FAQ and user questions stored?

Curated FAQ content should live as source documents in GitHub or a controlled storage source such as R2, then be indexed by Cloudflare AI Search. User-submitted questions are not automatically stored unless a logging or feedback feature is intentionally added.

### Where is backend state stored?

GitHub stores source code. The running backend state is mainly in the production Postgres database and Redis service under the Docker Compose runtime. Environment variables, Docker Compose files, data volumes, and the canonical operations document describe how production is configured.

### Can Cloudflare R2 take over everything?

R2 is suitable for object backups and source documents, not as a direct replacement for the relational application database or all runtime environment state. Use R2 for disaster recovery backups and AI Search source documents; keep Postgres for structured application state.

### Will R2 disaster recovery update automatically and delete old backups?

Automatic update depends on the backup automation schedule. Old backup deletion is handled by the R2 lifecycle rule for the backup prefix, currently 30 days for `sub2api/prod/postgres/`.
