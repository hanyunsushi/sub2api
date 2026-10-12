---
title: Wiki Sync State
updated: 2026-10-12
---

# Doc Impact Map

| Changed surface | Documentation owner | Evidence |
| --- | --- | --- |
| Account usage badge layout | Frontend module and customization inventory | `AccountUsageCell` and `UsageProgressBar` wrap badge rows while preserving each complete value |
| Baseline comparison | Customization file appendix | Two additional modified shared components; 188 paths, 65 A and 123 M |
| Verification and dev/prod boundary | Project Authority | User-marked localhost geometry, isolated long-value fixture, focused checks; no production release |

# Verification

- Source commit: `34c84b0def46058bec47c71bac5f8c4901b96883`. Only two shared usage components change, adding `flex-wrap` to three statistic strips and `shrink-0 whitespace-nowrap` to their badges. No DataTable, card width, data/API or persistence change.
- Focused Vitest: 3 files / 82 tests pass. Frontend typecheck, lint, i18n completeness 3/3 and production build pass; existing chunk/Browserslist/dynamic-import warnings remain. `git diff --check` passes.
- On the user-marked localhost page at 1167x816, `939 req`, `166.5M`, `A $123.49` and `U $123.49` are preserved; U-cost wraps inside its field. A DOM/computed-style check finds 48 usage badges across 15 cards within their fields. This local rendering uses the existing preview session; it is not a new production release or provider-balance audit.
- An isolated fixture renders the real DataTable, AccountUsageCell and UsageProgressBar components with the account-page styles and long values. It covers API Key, Gemini service-account, OpenAI OAuth and Anthropic OAuth, including `预计总费用 $2469.80`. Restoring the old CSS reproduces seven badge overflows and 19 split values at the observed card width; corrected CSS has zero of either across 25 badges, with identical text.
- Corrected fixture checks at 1440/390/360px and an explicit 260px card in English/dark mode preserve all 25 badges, including `Est. total $2469.80`, with no statistic-strip/field overflow or split values.
- The prior compact/narrow card fixture used shorter fees and did not cover the reported combination. Its blanket wording is qualified in the authority; current long-value evidence addresses that gap.
- Existing 3001 preview is preserved. Production remains the authority's last release; no OCI, database, volume or deployment action is performed.

# Documentation Lint

- 13 Wiki pages, 230 local links and 37 source references have no missing targets; articles are reachable within two clicks. The appendix exactly matches 188 Git paths (65 A, 123 M). Authority symlink and reciprocal index links are valid.
- Temporary fixture and browser tab are removed after verification; no credentials, generated bundle or screenshot is committed.
