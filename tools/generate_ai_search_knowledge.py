#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


DEFAULT_SOURCE = Path(
    "/Users/hinaw/Library/Mobile Documents/com~apple~CloudDocs/obsidian vault/knowledge vault/sub2api-codex-custom-plan.md"
)
DEFAULT_OUTPUT = Path("docs/ai-search/sub2api-user-knowledge.md")

FORBIDDEN_PATTERNS: list[tuple[str, str]] = [
    (r"/Users/[^\s`，。；、)）]+", "local filesystem path"),
    (r"sha256:[0-9a-f]{12,}", "container image digest"),
    (r"\b[0-9a-f]{40}\b", "git commit hash or secret-like token"),
    (r"\bd1cf0f9a11253d72f2dde108713d5e76\b", "Cloudflare account id"),
    (r"(?i)\b(api token|secret access key|authorization:\s*bearer|jwt\.secret)\b", "secret term"),
    (r"(?i)\b(docker compose|cherry-pick|worktree|image digest)\b", "deployment implementation term"),
    (r"(开发仓|正式运行源码|运行镜像|备份镜像|容器镜像|提交并推送)", "deployment implementation term"),
]


def source_has(source: str, *needles: str) -> bool:
    return all(needle in source for needle in needles)


def first_match(source: str, pattern: str, fallback: str) -> str:
    match = re.search(pattern, source)
    if not match:
        return fallback
    groups = [group for group in match.groups() if group]
    return groups[0] if groups else match.group(0)


def markdown_section(source: str, heading: str) -> str:
    start = source.find(heading)
    if start < 0:
        return ""
    next_heading = source.find("\n## ", start + len(heading))
    if next_heading < 0:
        return source[start:]
    return source[start:next_heading]


def build_markdown(source: str) -> str:
    r2_source = markdown_section(source, "## R2 灾备状态") or source
    backup_time = first_match(r2_source, r"每天\s+`?([0-9]{1,2}:[0-9]{2})`?", "03:00")
    retention_days = first_match(r2_source, r"(?:保留策略为|下对象)\s*([0-9]+)\s*天", "30")

    lines: list[str] = [
        "# Sub2API 用户知识库",
        "",
        "本文件由 Sub2API canonical 运维文档生成，只保留适合用户和管理员搜索的产品知识、FAQ 和操作说明。",
        "本文件面向网页搜索和问答场景，只描述用户可见功能、数据范围和常见问题。",
        "",
    ]

    if source_has(source, "Cloudflare AI Search", "AI Search"):
        lines.extend(
            [
                "## AI Search",
                "",
                "登录后的网页控制台右上角有常驻的 `Ask AI` 入口，位置在公告铃左侧。点击后会在屏幕中央弹出聊天窗口，用户可以直接提问常见问题、功能说明、备份说明和账号管理说明。",
                "浏览器只请求 Sub2API 后端接口，后端再查询 Cloudflare AI Search；Cloudflare 凭据不会暴露给前端。",
                "实例名称使用 `ai-search`，界面文案使用 `Ask AI`，不使用 Help 作为名称。",
                "知识库由 Sub2API 后端通过 Cloudflare API 每 3 天按用户版知识文档重新上传一次；同步前会删除同名旧索引和遗留临时索引，避免过期内容混入搜索。",
                "登录用户使用 Cloudflare 官方聊天组件，基于知识库给出自然语言回答并附带来源；点击窗口外区域、关闭按钮或按 Esc 即可关闭，最近的对话会保留在窗口侧栏。",
                "",
            ]
        )

    if source_has(source, "R2 灾备状态"):
        lines.extend(
            [
                "## R2 灾备",
                "",
                f"生产数据库已启用 Cloudflare R2 灾备，计划在每天 {backup_time} 自动生成 PostgreSQL 备份。",
                f"备份保留策略为 {retention_days} 天，旧备份会按生命周期规则自动清理。",
                "灾备主要覆盖 Sub2API 的 PostgreSQL 业务数据，包括用户、账号、API key、分组、设置、用量、计费、Codex 元数据和运维相关表。",
                "灾备不等于整台机器快照；运行环境配置、缓存、日志、本机认证文件和第三方本机服务配置需要单独管理。",
                "如果 R2 访问密钥丢失，可以在 Cloudflare 重新创建有权限的凭据。已有 R2 对象不会因为旧密钥失效而被删除。",
                "",
            ]
        )

    if source_has(source, "CPA", "Codex"):
        lines.extend(
            [
                "## Codex 账号管理",
                "",
                "管理员后台提供 Codex/CPA 账号管理能力，可查看认证账户、上传认证文件、删除文件账号、启停账号、打开 OAuth 授权、维护分组、备注、标签和显示名称。",
                "分组、备注、显示名称、标签、排序等管理元数据保存在 Sub2API 数据库中，因此同一账号在不同浏览器登录后能看到一致配置。",
                "真实认证文件、OAuth、刷新状态和部分运行状态仍由 CPA/CLIProxyAPI 负责。",
                "失败账号卡片会显示 CPA 返回的错误码和错误文字，方便定位授权或上游问题。",
                "",
            ]
        )

    if source_has(source, "Buzz", "TCDMX"):
        lines.extend(
            [
                "## 余额和外部订阅",
                "",
                "右上角余额区域会展示系统余额，并可展示 BuzzAI、TCDMX 等外部订阅摘要。",
                "账号管理页会按账号来源展示外部订阅余额、期限和官网入口；期限缺失时显示为长期。",
                "BuzzAI 和 TCDMX 的密钥只保存在后端设置中，前端只显示配置状态和订阅摘要，不回显敏感值。",
                "Mimo 当前公开文档能确认兼容 OpenAI/Anthropic 推理接口，但没有稳定公开的余额或订阅期限查询接口，因此暂不作为自动余额来源。",
                "",
            ]
        )

    lines.extend(
        [
            "## 数据保存在哪里",
            "",
            "GitHub 保存源代码和随代码维护的文档。",
            "Sub2API 的用户、账号、API Key、分组、设置、用量、计费和 Codex 元数据等业务状态保存在 PostgreSQL。",
            "Redis 主要用于缓存、队列、限流或临时状态，不作为主要长期数据源。",
            "Cloudflare R2 适合保存数据库备份和对象文件，不适合直接替代 PostgreSQL 的实时关系型读写。",
            "Cloudflare AI Search 保存可检索的知识索引；它用于搜索和问答，不是业务数据库。",
            "",
            "## FAQ 如何累积",
            "",
            "适合公开给用户搜索的 FAQ、功能说明和操作说明应先写入受控文档，再由后端定时同步到 Cloudflare AI Search。",
            "用户在搜索框里输入的问题默认不会自动保存成 FAQ；如果以后需要沉淀用户问题，应单独增加反馈、日志或审核流程。",
            "更新知识库时应删除或替换旧索引，避免搜索结果混入过期说明。",
            "",
            "## 常见问题",
            "",
            "### AI Search 可以帮助用户使用网站吗？",
            "",
            "可以。用户登录后可以点击右上角 `Ask AI` 打开聊天窗口，用自然语言提问网站功能、账号管理、备份范围和常见问题，并得到带来源的回答。",
            "",
            "### 整份运维文档能直接作为知识库吗？",
            "",
            "不建议。运维文档包含开发路径、发布记录、部署状态和内部操作细节。知识库应使用过滤后的用户版文档，只保留可搜索的产品和操作说明。",
            "",
            "### R2 能接管全部数据吗？",
            "",
            "不能。R2 是对象存储，适合备份和文件，不适合作为 Sub2API 主业务数据库。结构化业务数据仍应由 PostgreSQL 承担。",
            "",
            "### R2 密钥丢失后数据还在吗？",
            "",
            "还在。丢失访问密钥通常只影响当前凭据访问能力，可以重新创建有权限的凭据来访问已有对象。",
            "",
        ]
    )
    return "\n".join(lines).strip() + "\n"


def validate_public_markdown(markdown: str) -> list[str]:
    errors = []
    for pattern, label in FORBIDDEN_PATTERNS:
        if re.search(pattern, markdown):
            errors.append(label)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the public AI Search knowledge document from the Sub2API canonical operations document.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true", help="fail if the output file is not up to date")
    args = parser.parse_args()

    source_path = args.source.expanduser()
    output_path = args.output
    if not source_path.exists():
        print(f"source document not found: {source_path}", file=sys.stderr)
        return 1

    source = source_path.read_text(encoding="utf-8")
    markdown = build_markdown(source)
    errors = validate_public_markdown(markdown)
    if errors:
        print("generated knowledge document contains forbidden content:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if args.check:
        existing = output_path.read_text(encoding="utf-8") if output_path.exists() else ""
        if existing != markdown:
            print(f"knowledge document is out of date: {output_path}", file=sys.stderr)
            return 1
        return 0

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(markdown, encoding="utf-8")
    print(f"wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
