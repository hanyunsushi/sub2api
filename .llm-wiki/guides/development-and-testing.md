---
title: Development and Testing
updated: 2026-09-04
---

# Development and Testing

## Prerequisites

- Go version from `backend/go.mod` (currently 1.27.0).
- pnpm with the committed `frontend/pnpm-lock.yaml`.
- PostgreSQL and Redis only for tests or local backend flows that require them.

## Focused Frontend Change

```bash
pnpm --dir frontend exec vitest run <focused-tests>
pnpm --dir frontend run typecheck
pnpm --dir frontend run lint:check
pnpm --dir frontend run build
git diff --check
```

Use `http://localhost:3001` only when the task needs a local preview. One representative browser pass is enough for behavior that source/tests cannot prove; do not repeat screenshots or DevTools checks after every small edit.

## Backend or Cross-Module Change

```bash
go test ./... -count=1
make test
make build
git diff --check
```

For migrations, authentication, payment, network or production data changes, record backup, rollback and runtime checks in the project authority before release.

## Upstream Merge

1. Verify the remote `upstream/main` SHA and create a local protection branch.
2. Merge with `git merge --no-commit --no-ff`, preserving local custom fields, route-shells, visual contracts and external-subscription behavior while taking official additions.
3. Regenerate Ent output after schema changes, then run the backend full suite and frontend gates above.
4. Review the complete diff and commit the development merge. Do not infer a production, OCI or backup update from a successful local merge.

## See Also

- [Project Authority](../../agent.md)
- [System Architecture](../architecture/overview.md)
