---
title: Sub2API Wiki
updated: 2026-10-12
---

[Project Authority](../agent.md)

# Architecture

- [System Overview](architecture/overview.md) - Runtime components and boundaries
- [Data Flow](architecture/data-flow.md) - Request and state lifecycle
- [Directory Structure](architecture/directory-structure.md) - Source layout

# Modules

- [Frontend](modules/frontend.md) - Vue application boundaries
- [Backend](modules/backend.md) - Go service boundaries

# Concepts

- [Customization Inventory](concepts/customization-inventory.md) - Official frontend, retained functional extensions, persistence and retired boundaries
- [Customization Files](concepts/customization-files.md) - Complete baseline diff with file categories and Git status

# Guides

- [Development and Testing](guides/development-and-testing.md) - Minimal local workflow
- [OCI Operations and Artifact Retention](guides/oci-operations.md) - Safe application-only release, rollback, and cleanup
- [OCI Authentik OIDC](guides/oci-authentik-oidc.md) - Isolated Authentik deployment and OIDC handoff boundary
