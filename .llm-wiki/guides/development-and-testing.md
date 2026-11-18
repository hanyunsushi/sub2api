---
title: Development and Testing
updated: 2026-11-18
---

## 上游 main 合并验证（2026-11-18）

`upstream/main` `2af3f1e15c98c893a89255a037f551046883b8c` 已合并到本地 `codex/cpa-management`，合并提交为 `5872efc59cfbcd246aff7ce8a7e1a298b49a1d96`。合并门禁通过：`go generate ./ent`、`go generate ./cmd/server`、`go test -tags=unit,embed ./... -count=1`、`pnpm run typecheck`、`pnpm run lint:check`、`pnpm run build` 和 `pnpm run build:microfrontend`（含微前端产物校验）。`pnpm run test:run` 当前 413 个文件/3304 项中 3300 项通过；4 项失败均在 `RegistrationEmailBlacklistEditor.spec.ts`，表现为 React/Headless 弹窗关闭后测试立即查询仍存在的 DOM，未据此修改业务实现或宣称全量测试通过。

## 本机服务的停用与恢复

本机预览的当前开关状态见[项目权威文档](../../agent.md#本机服务状态2026-10-23)。需要恢复开机预览时，依次执行 `launchctl enable gui/$(id -u)/com.hinaw.sub2api-frontend-3001` 和 `launchctl bootstrap gui/$(id -u) "$HOME/Library/LaunchAgents/com.hinaw.sub2api-frontend-3001.plist"`；按需临时预览仍可使用原pnpm开发入口。

# Development and Testing

## Prerequisites

- Go version from `backend/go.mod` (currently 1.27.3).
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
go test -tags 'unit,embed' -p 1 ./... -count=1
make test
make build
git diff --check
```

After the frontend build, additionally run `go test -tags embed ./internal/web -count=1` for embedded branding/static assets.

The `unit` tag includes settings/DTO/API contract tests excluded by the ordinary Go command. Use one package worker when local concurrent Go builds cause test deadlines. Network fixtures must isolate proxy variables and retain their listening port when simulating disconnects; do not make tests depend on a reused closed port.

For migrations, authentication, payment, network or production data changes, record backup, rollback and runtime checks in the project authority before release.

## Upstream Merge

1. Verify the remote `upstream/main` SHA and create a local protection branch.
2. Merge with `git merge --no-commit --no-ff`, preserving entity logos, external subscriptions, account cards and Console integration while accepting upstream business additions and retaining the current AI-owned shared design layer. Do not restore retired visual contracts.
3. Regenerate Ent output after schema changes, then run the backend full suite and frontend gates above.
4. Build the native frontend and Console microfrontend, including CSS/API/Teleport artifact checks. Keep focused tests for local UI that an upstream deletion would otherwise remove.
5. Review the complete diff and commit the development merge. Do not infer a production, OCI or backup update from a successful local merge.

## See Also

- [Project Authority](../../agent.md)
- [System Architecture](../architecture/overview.md)
