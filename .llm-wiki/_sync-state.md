---
title: Wiki Sync State
updated: 2026-10-12
---

# Doc Impact Map

| Changed surface | Documentation owner | Evidence |
| --- | --- | --- |
| Account-local card density | Frontend module and customization inventory | Padding/gaps, inline fields, wrapping and content height; all enabled information retained |
| Verification and dev/prod boundary | Project Authority | Focused checks and isolated responsive browser comparison; local preview changed, production unchanged |

# Verification

- Source changes are limited to `AccountsView.vue` presentation; shared DataTable, backend/API, external subscriptions and persisted column visibility are unchanged.
- Focused Vitest: 5 files / 90 tests pass, covering cards, selection, account bulk edit, priority and usage. Frontend typecheck, lint, i18n completeness 3/3 and final production build pass. Existing chunk/Browserslist/dynamic-import warnings remain.
- With all fields enabled, simulated account cards retain every visible text value at 1440/390/360px; the external-quota card measures 958px before and 616px after. Ordinary cards measure 578px. This is fixture evidence, not a universal height or production observation.
- Responsive checks include dark mode at 360px, no page/card overflow, and OAuth multi-window usage/reset timestamps with scheduling scores. Selection of six rows, server sort/persistence, More-menu and quota-dialog open/close pass; console has no errors or framework overlay.
- Existing 3001 preview is preserved. The compact-card change is development-only; actual production source/image/rollback and prior menu-restoration release remain owned by the authority.

# Documentation Lint

- 13 Wiki pages, 228 local links and 35 source references have no missing targets; articles are reachable within two clicks.
- The appendix still matches 186 paths (65 A, 121 M) against `upstream/main`; no source path was added or removed.
- Authority symlink is valid, and `git diff --check` passes. Temporary browser/scripts/logs are outside the repository; credentials and build outputs are not documented.
