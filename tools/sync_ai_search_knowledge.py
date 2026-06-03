#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


DEFAULT_SOURCE = Path(
    "/Users/hinaw/Library/Mobile Documents/com~apple~CloudDocs/obsidian vault/knowledge vault/dev/sub2api-codex-custom-plan.md"
)
DEFAULT_OUTPUT = Path("docs/ai-search/sub2api-user-knowledge.md")
DEFAULT_NAMESPACE = "default"
DEFAULT_INSTANCE = "ai-search"
DEFAULT_ITEM_KEY = "sub2api-user-knowledge.md"
DEFAULT_BASE_URL = "https://api.cloudflare.com/client/v4"
LEGACY_SEED_KEY = "sub2api-ai-search.md"


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        print(f"missing required environment variable: {name}", file=sys.stderr)
        raise SystemExit(1)
    return value


def api_request(method: str, url: str, token: str, body: bytes | None = None, content_type: str | None = None) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    if content_type:
        headers["Content-Type"] = content_type
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", errors="replace")
        print(f"Cloudflare API {method} {url} failed: HTTP {err.code} {raw}", file=sys.stderr)
        raise SystemExit(1)
    return json.loads(raw.decode("utf-8"))


def multipart_body(field_name: str, filename: str, content: bytes, metadata: dict[str, object], wait_for_completion: bool) -> tuple[bytes, str]:
    boundary = "----sub2api-ai-search-knowledge"
    safe_filename = filename.replace('"', "")
    file_type = mimetypes.guess_type(filename)[0] or "text/markdown"
    parts: list[bytes] = []

    def add(headers: list[str], payload: bytes) -> None:
        parts.append(f"--{boundary}\r\n".encode("utf-8"))
        parts.extend(f"{header}\r\n".encode("utf-8") for header in headers)
        parts.append(b"\r\n")
        parts.append(payload)
        parts.append(b"\r\n")

    add(
        [
            f'Content-Disposition: form-data; name="{field_name}"; filename="{safe_filename}"',
            f"Content-Type: {file_type}",
        ],
        content,
    )
    add(
        ['Content-Disposition: form-data; name="metadata"'],
        json.dumps(metadata, ensure_ascii=False).encode("utf-8"),
    )
    add(
        ['Content-Disposition: form-data; name="wait_for_completion"'],
        b"true" if wait_for_completion else b"false",
    )
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def find_item_by_key(base: str, token: str, account: str, namespace: str, instance: str, key: str) -> dict | None:
    query = urllib.parse.urlencode({"search": key, "source": "builtin", "per_page": 50})
    url = f"{base}/accounts/{account}/ai-search/namespaces/{namespace}/instances/{instance}/items?{query}"
    response = api_request("GET", url, token)
    for item in response.get("result", []):
        if item.get("key") == key:
            return item
    return None


def delete_item(base: str, token: str, account: str, namespace: str, instance: str, item_id: str) -> None:
    quoted_item_id = urllib.parse.quote(item_id, safe="")
    url = f"{base}/accounts/{account}/ai-search/namespaces/{namespace}/instances/{instance}/items/{quoted_item_id}"
    api_request("DELETE", url, token)


def upload_item(base: str, token: str, account: str, namespace: str, instance: str, key: str, content: bytes, wait_for_completion: bool) -> dict:
    url = f"{base}/accounts/{account}/ai-search/namespaces/{namespace}/instances/{instance}/items"
    metadata = {
        "title": "Sub2API 用户知识库",
        "url": "/",
        "route": "/",
        "generated_from": "sub2api-codex-custom-plan",
    }
    body, content_type = multipart_body("file", key, content, metadata, wait_for_completion)
    return api_request("POST", url, token, body=body, content_type=content_type)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate and upload the filtered Sub2API AI Search knowledge document.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--namespace", default=os.environ.get("CLOUDFLARE_AI_SEARCH_NAMESPACE", DEFAULT_NAMESPACE))
    parser.add_argument("--instance", default=os.environ.get("CLOUDFLARE_AI_SEARCH_INSTANCE", DEFAULT_INSTANCE))
    parser.add_argument("--item-key", default=os.environ.get("CLOUDFLARE_AI_SEARCH_ITEM_KEY", DEFAULT_ITEM_KEY))
    parser.add_argument("--base-url", default=os.environ.get("CLOUDFLARE_API_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--wait", action="store_true", help="wait for indexing completion where Cloudflare supports it")
    parser.add_argument("--delete-legacy", action="store_true", help="delete the old temporary seed document if present")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    generator = repo_root / "tools" / "generate_ai_search_knowledge.py"
    output = args.output if args.output.is_absolute() else repo_root / args.output
    source = args.source

    subprocess.run(
        [sys.executable, str(generator), "--source", str(source), "--output", str(output)],
        cwd=repo_root,
        check=True,
    )

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    if not account_id:
        account_id = os.environ.get("CLOUDFLARE_AI_ACCOUNT_ID", "").strip()
    token = require_env("CLOUDFLARE_API_TOKEN")

    if not re.fullmatch(r"[a-f0-9]{32}", account_id):
        print("missing or invalid Cloudflare account id; set CLOUDFLARE_ACCOUNT_ID", file=sys.stderr)
        return 1

    base = args.base_url.rstrip("/")
    content = output.read_bytes()

    existing = find_item_by_key(base, token, account_id, args.namespace, args.instance, args.item_key)
    if existing:
        delete_item(base, token, account_id, args.namespace, args.instance, existing["id"])

    if args.delete_legacy and args.item_key != LEGACY_SEED_KEY:
        legacy = find_item_by_key(base, token, account_id, args.namespace, args.instance, LEGACY_SEED_KEY)
        if legacy:
            delete_item(base, token, account_id, args.namespace, args.instance, legacy["id"])

    response = upload_item(base, token, account_id, args.namespace, args.instance, args.item_key, content, args.wait)
    result = response.get("result", {})
    print(json.dumps({
        "item_id": result.get("id"),
        "key": result.get("key"),
        "status": result.get("status"),
        "chunks_count": result.get("chunks_count"),
        "file_size": result.get("file_size"),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
