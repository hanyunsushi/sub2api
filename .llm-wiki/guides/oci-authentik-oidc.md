---
title: OCI Authentik OIDC
updated: 2026-09-26
---

# Purpose

Authentik is deployed as a separate OIDC identity service on OCI. It is independent from the Sub2API application, its PostgreSQL/Redis services, and the existing Cloudflare Tunnel until a public hostname and routing change are explicitly approved.

# Runtime Boundary

| Item | Current value |
| --- | --- |
| OCI host | `140.245.43.76` |
| Project directory | `/home/ubuntu/authentik-oci` |
| Compose project | `authentik-oci` |
| Image | `ghcr.io/goauthentik/server:2026.8.3` |
| HTTP bind | `127.0.0.1:19000` -> container `9000` |
| HTTPS bind | `127.0.0.1:19443` -> container `9443` |
| Services | `server`, `worker`, isolated `postgresql` |
| Persistent volume | `authentik-oci_database` |

The official Compose file is downloaded from `https://docs.goauthentik.io/compose.yml`. The `.env` file is host-local, mode `600`, and contains generated database and Authentik secrets. Secrets are never stored in this wiki, Git, or chat output.

# Verification Contract

The deployment was verified with the following runtime checks:

- Authentik PostgreSQL, server, and worker report healthy.
- `/-/health/live/` and `/-/health/ready/` return HTTP 200.
- `/if/flow/initial-setup/` and `/if/admin/` return HTTP 200 after initial startup.
- Only loopback listeners `127.0.0.1:19000` and `127.0.0.1:19443` are added.
- Existing `sub2api`, `sub2api-postgres`, `sub2api-redis`, and `kreeper-website` containers remain running with restart count `0`.

# Next Handoff

The initial setup page is ready locally. Public HTTPS exposure, DNS/Tunnel routing, Authentik bootstrap admin creation, and Sub2API OIDC client configuration remain separate operations requiring a hostname and explicit routing decision. Do not treat the local-only deployment as a complete public SSO integration.

See also: [OCI Operations and Artifact Retention](oci-operations.md), [Project Authority](../../agent.md).
