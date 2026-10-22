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
- [Console OIDC Backend](modules/console-oidc-backend.md) - Original-site and Console callback compatibility.
- [Console Microfrontend](modules/console-microfrontend.md) - Independent Console ESM adapter and embedded lifecycle.

- [Frontend](modules/frontend.md) - Vue application boundaries
- [Backend](modules/backend.md) - Go service boundaries

# Concepts

- [Customization Inventory](concepts/customization-inventory.md) - Official frontend, retained functional extensions, persistence and retired boundaries
- [Customization Files](concepts/customization-files.md) - Complete baseline diff with file categories and Git status

# Guides

- [Development and Testing](guides/development-and-testing.md) - Minimal local workflow
- [OCI Operations and Artifact Retention](guides/oci-operations.md) - Safe application-only release, rollback, and cleanup
- [OCI Authentik OIDC](guides/oci-authentik-oidc.md) - Isolated Authentik deployment and OIDC handoff boundary

- [Kreepai Shared Design System](modules/embedded-design-system.md)

- [AI design review](modules/ai-design-review.md)

- [发布、备份与保留合同](guides/operations-retention.md)
