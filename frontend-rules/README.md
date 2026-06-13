# frontend-rules — ast-grep locator rules (agent change-map)

Structural search rules for precisely locating frontend spots that matter for the
**Anthropic theme** work. Registered via `sgconfig.yml` at the repo root.

These are **locator/lint hints**, not auto-fixers. They give an agent reliable,
structure-aware hit lists (better than plain grep) before editing.

## Run

ast-grep is not vendored. Run via the host binary or npx:

```sh
# scan everything with the registered rules
ast-grep scan

# or a single rule
ast-grep scan --rule frontend-rules/btn-warning-as-action.yml

# ad-hoc structural pattern (no rule file)
ast-grep run --lang ts --pattern 'import $C from "@/views/$_.vue"' frontend/src
```

If `ast-grep` is missing: `npx @ast-grep/cli scan` (or `brew install ast-grep`).

## Rules

| Rule | What it locates | Why it matters (design doc) |
|---|---|---|
| `btn-warning-as-action.yml` | `.btn-warning` folded into the terracotta primary-action selector | Warning is a semantic traffic-light color, must NOT follow terracotta (§3.3) |
| `cold-blue-hardcoded.yml` | hardcoded cold blue/indigo/violet hex | Forbidden as theme color; only `--atelier-focus #3898ec` allowed, for a11y (§3.1, §20) |

## Relationship to `.frontend-index/`

- `.frontend-index/` (from `frontend/scripts/build-frontend-index.mjs`) answers
  **"where is X defined and who uses it"** (class xref, route map, testid registry).
- `frontend-rules/` answers **"find every place matching this structure/anti-pattern"**.

Use the index first to scope, then ast-grep to pin exact nodes, then Read to confirm.
