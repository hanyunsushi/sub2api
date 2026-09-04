---
title: Frontend Module
updated: 2026-09-04
sources:
  - frontend/src/main.ts
  - frontend/src/App.vue
  - frontend/src/router/
  - frontend/src/stores/
---

# Frontend Module

The frontend is a Vue 3 single-page application built with Vite. `main.ts` creates the app, Pinia, router and i18n, applies appearance settings, then mounts after initial navigation is ready.

## Responsibility

- Own route views, admin/user interaction, client state, API calls and presentation.
- Do not treat client state or local configuration as proof of provider-side balances, quotas or production health.

## Key Files

| File/area | Purpose |
| --- | --- |
| `src/main.ts` | Bootstrap and global style registration |
| `src/App.vue` | Setup gate, public settings, auth-driven polling |
| `src/router/` | Routes and document titles |
| `src/api/` | Typed API clients |
| `src/stores/` | Pinia state and lifecycle management |
| `src/views/` | Route-level screens |

## Responsive Visual Contracts

- `DataTable` exposes `.data-table-mobile-cards` and `.data-table-mobile-card` for the shared narrow-screen card renderer. Cards are capped at 22.5rem and return to full width below 480px.
- AccountsView keeps its table-backed account cards on fixed `22.5rem` maximum grid tracks at wide and `mobile-mode` widths; below 480px the single track returns to full width. This prevents cards from expanding with a wider parent through `1fr` tracks.
- Channel monitor loading and populated grids share `.monitor-channel-card-grid` and `.monitor-channel-card` and follow the same narrow-screen cap.
- Profile identity/status chips and account status indicators use solid semantic backgrounds with light text; other badges retain the neutral Atelier treatment.
- `FloatingDropdown` menus are teleported to `body`; profile-menu bracket rollback therefore lives in `bracket-rollback-eof.css` with a body-level selector.

These selectors are source-level contracts for focused tests and computed-style checks when a real browser pass is required; they do not imply a production release.

## See Also

- [Backend Module](backend.md)
- [Development and Testing](../guides/development-and-testing.md)
