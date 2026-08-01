#!/usr/bin/env python3
"""
notion_markup_sync — hybrid Notion ↔ vault markup sync.

Defaults (hard):
  - sync without --direction  → suggest only (no writes)
  - never upload vault/Secrets/
  - never upload sensitivity: restricted
  - exclude .obsidian/, Attachments binaries
  - thin default allowlist: RECOLLECT.md, vault/Map.md, vault/Grok.md
  - --allowlist-all = root *.md + vault/** (skips Secrets/restricted/pipeline)
  - auto LWW requires --i-mean-it
  - live Notion API write requires --live

Env (local only, never commit) — also loaded from .local/notion-sync/.env:
  NOTION_TOKEN=          # or NOTION_API_KEY / NOTION_KEY
  NOTION_DATABASE_ID=
  NOTION_TITLE_PROP=Name
  NOTION_SYNC_ROOT=

Usage:
  python scripts/notion_markup_sync.py status
  python scripts/notion_markup_sync.py suggest
  python scripts/notion_markup_sync.py suggest --allowlist-all
  python scripts/notion_markup_sync.py sync --direction to-notion --live --allowlist-all
  python scripts/notion_markup_sync.py audit-restricted
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCRIPT = "notion_markup_sync"
VERSION = "0.5.0-map"
NOTION_VERSION = "2022-06-28"
# Gentle pacing for Notion rate limits (~3 req/s)
API_SLEEP_SEC = float(os.environ.get("NOTION_API_SLEEP", "0.35"))

THIN_ALLOWLIST = (
    "RECOLLECT.md",
    "vault/Map.md",
    "vault/Grok.md",
)

# Full vault markup map for adopters (not pipeline / product harvest trees)
MAP_TREE_PREFIXES = (
    "vault/",
)
MAP_SKIP_SUBSTRINGS = (
    "/receipts/",
    "/library/archive/",
    "docs/workflow-pipeline",
    "workflow-pipeline",
    "__pycache__",
    "/node_modules/",
)

SECRETS_PREFIX = "vault/Secrets/"
EXCLUDE_DIR_NAMES = frozenset({".obsidian", "Attachments", ".git", "__pycache__", ".local"})
FM_BLOCK = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n?", re.S)
KEY_LINE = re.compile(r"^([A-Za-z0-9_]+)\s*:\s*(.*)$")

HUMAN_GATE_PATHS = frozenset({"RECOLLECT.md", "AGENTS.md", "vault/Map.md"})
AUTO_PREFIXES = (
    "vault/Inbox/",
    "vault/Grok/Working-RAM/",
)

MIRROR_BANNER = (
    "DERIVED MIRROR · SoT = git vault · do not edit as truth · "
    "edits = capture to propose\n\n"
)


def repo_root(explicit: Path | None = None) -> Path:
    env = os.environ.get("NOTION_SYNC_ROOT", "").strip()
    if explicit:
        return explicit.resolve()
    if env:
        return Path(env).resolve()
    return Path(__file__).resolve().parent.parent


def state_dir(root: Path) -> Path:
    return root / ".local" / "notion-sync"


def ensure_state_dirs(root: Path) -> Path:
    d = state_dir(root)
    (d / "receipts").mkdir(parents=True, exist_ok=True)
    (d / "backups").mkdir(parents=True, exist_ok=True)
    (d / "proposals").mkdir(parents=True, exist_ok=True)
    return d


def now_stamp() -> str:
    return datetime.now().strftime("%Y-%m-%d-%H%M")


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_dotenv_files(root: Path) -> list[Path]:
    candidates = [
        state_dir(root) / ".env",
        root / ".env",
        Path(os.environ.get("USERPROFILE", "")) / ".grok" / ".env",
    ]
    loaded: list[Path] = []
    for path in candidates:
        if not path.is_file():
            continue
        try:
            for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
                s = line.strip()
                if not s or s.startswith("#") or "=" not in s:
                    continue
                k, v = s.split("=", 1)
                k, v = k.strip(), v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v
            loaded.append(path)
        except OSError:
            continue
    return loaded


def resolve_token() -> str:
    for k in ("NOTION_TOKEN", "NOTION_API_KEY", "NOTION_KEY"):
        v = os.environ.get(k, "").strip()
        if v:
            return v
    return ""


def resolve_database_id() -> str:
    return os.environ.get("NOTION_DATABASE_ID", "").strip()


def title_prop_name() -> str:
    return os.environ.get("NOTION_TITLE_PROP", "Name").strip() or "Name"


def parse_frontmatter(text: str) -> dict[str, str] | None:
    m = FM_BLOCK.match(text)
    if not m:
        return None
    out: dict[str, str] = {}
    for line in m.group(1).splitlines():
        km = KEY_LINE.match(line.strip())
        if not km:
            continue
        key, val = km.group(1), km.group(2).strip()
        if (val.startswith('"') and val.endswith('"')) or (
            val.startswith("'") and val.endswith("'")
        ):
            val = val[1:-1]
        out[key] = val
    return out


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def to_posix_rel(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def is_secrets(rel: str) -> bool:
    r = rel.replace("\\", "/")
    return r == "vault/Secrets" or r.startswith(SECRETS_PREFIX)


def is_excluded_path(rel: str) -> bool:
    r = rel.replace("\\", "/")
    if is_secrets(r):
        return True
    parts = r.split("/")
    if any(p in EXCLUDE_DIR_NAMES for p in parts):
        return True
    if r.startswith(".local/") or r.startswith(".recollect/") or r.startswith(".env"):
        return True
    return False


def is_restricted_fm(fm: dict[str, str] | None) -> bool:
    if not fm:
        return False
    return fm.get("sensitivity", "").strip().lower() == "restricted"


def write_class_for(rel: str) -> str:
    r = rel.replace("\\", "/")
    if is_secrets(r):
        return "Forbidden"
    if r in HUMAN_GATE_PATHS or r in ("RECOLLECT.md", "AGENTS.md"):
        return "Human-gate"
    for pref in AUTO_PREFIXES:
        if r.startswith(pref):
            return "Auto"
    if r.startswith("vault/"):
        return "Propose"
    return "Propose"


def state_path(root: Path) -> Path:
    return state_dir(root) / "state.jsonl"


def load_state(root: Path) -> dict[str, dict[str, Any]]:
    path = state_path(root)
    out: dict[str, dict[str, Any]] = {}
    if not path.is_file():
        return out
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            p = row.get("path")
            if p:
                out[p] = row
    except (OSError, json.JSONDecodeError):
        pass
    return out


def save_state(root: Path, state: dict[str, dict[str, Any]]) -> None:
    ensure_state_dirs(root)
    path = state_path(root)
    lines = [json.dumps(state[k], ensure_ascii=False) for k in sorted(state.keys())]
    path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


@dataclass
class Candidate:
    rel: str
    abs_path: Path
    exists: bool
    write_class: str
    hash: str | None = None
    sensitivity: str | None = None
    updated: str | None = None
    refused: str | None = None
    action: str = "skip"
    text: str | None = None


def load_candidate(root: Path, rel: str) -> Candidate:
    rel = rel.replace("\\", "/")
    abs_path = root / rel
    c = Candidate(
        rel=rel,
        abs_path=abs_path,
        exists=abs_path.is_file(),
        write_class=write_class_for(rel),
    )
    if is_excluded_path(rel) or is_secrets(rel):
        c.refused = "secrets_or_excluded"
        c.action = "refuse"
        return c
    if not c.exists:
        c.refused = "missing_local"
        c.action = "skip"
        return c
    try:
        text = abs_path.read_text(encoding="utf-8")
    except OSError as e:
        c.refused = f"read_error:{e}"
        c.action = "refuse"
        return c
    fm = parse_frontmatter(text)
    if is_restricted_fm(fm):
        c.refused = "sensitivity_restricted"
        c.action = "refuse"
        c.sensitivity = "restricted"
        return c
    c.hash = content_hash(text)
    c.text = text
    if fm:
        c.sensitivity = fm.get("sensitivity", "normal")
        c.updated = fm.get("updated")
    c.action = "eligible"
    return c


def thin_candidates(root: Path) -> list[Candidate]:
    return [load_candidate(root, rel) for rel in THIN_ALLOWLIST]


def _map_skip(rel: str) -> bool:
    r = rel.replace("\\", "/")
    return any(s in r for s in MAP_SKIP_SUBSTRINGS)


def walk_allowlist_all(root: Path) -> list[Candidate]:
    """Full markup map: vault root practice files + vault/** (never pipeline trees)."""
    seen: set[str] = set()
    out: list[Candidate] = []

    def add_rel(rel: str) -> None:
        rel = rel.replace("\\", "/")
        if rel in seen or is_excluded_path(rel) or _map_skip(rel):
            return
        if "workflow-pipeline" in rel:
            return
        seen.add(rel)
        out.append(load_candidate(root, rel))

    # Vault-root practice files (RECOLLECT.md, README, Map companions, etc.)
    for p in sorted(root.glob("*.md")):
        if p.is_file():
            add_rel(p.name)

    # Vault tree only
    for prefix in MAP_TREE_PREFIXES:
        base = root / prefix.rstrip("/")
        if not base.is_dir():
            continue
        for p in sorted(base.rglob("*.md")):
            if not p.is_file():
                continue
            add_rel(to_posix_rel(p, root))

    return out


def select_candidates(root: Path, allowlist_all: bool) -> list[Candidate]:
    return walk_allowlist_all(root) if allowlist_all else thin_candidates(root)


@dataclass
class Receipt:
    script: str = SCRIPT
    version: str = VERSION
    ts: str = field(default_factory=now_iso)
    command: str = ""
    direction: str = "suggest"
    dry_run: bool = True
    live: bool = False
    allowlist_all: bool = False
    root: str = ""
    paths_touched: list[dict[str, Any]] = field(default_factory=list)
    write_class_applied: list[str] = field(default_factory=list)
    backup_zip: str | None = None
    restricted_refusal_count: int = 0
    secrets_refusal_count: int = 0
    errors: list[str] = field(default_factory=list)
    summary: dict[str, Any] = field(default_factory=dict)
    exit_code: int = 0

    def add_path(self, c: Candidate, extra: dict[str, Any] | None = None) -> None:
        row: dict[str, Any] = {
            "path": c.rel,
            "action": c.action,
            "write_class": c.write_class,
            "exists": c.exists,
            "hash": c.hash,
            "sensitivity": c.sensitivity,
            "refused": c.refused,
        }
        if extra:
            row.update(extra)
        self.paths_touched.append(row)
        if c.refused == "sensitivity_restricted":
            self.restricted_refusal_count += 1
        if c.refused == "secrets_or_excluded" and is_secrets(c.rel):
            self.secrets_refusal_count += 1

    def write(self, root: Path) -> Path:
        ensure_state_dirs(root)
        name = f"{now_stamp()}-run.json"
        path = state_dir(root) / "receipts" / name
        if path.exists():
            for i in range(1, 100):
                alt = state_dir(root) / "receipts" / f"{now_stamp()}-run-{i}.json"
                if not alt.exists():
                    path = alt
                    break
        path.write_text(json.dumps(asdict(self), indent=2) + "\n", encoding="utf-8")
        return path


def notion_request(
    method: str,
    path: str,
    token: str,
    body: dict[str, Any] | None = None,
    timeout: float = 60,
) -> dict[str, Any]:
    url = "https://api.notion.com/v1" + path
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:2000]
        raise RuntimeError(f"Notion HTTP {e.code}: {err_body}") from e


def rt(content: str) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    s = content or ""
    if not s:
        return [{"type": "text", "text": {"content": ""}}]
    for i in range(0, len(s), 1900):
        chunks.append({"type": "text", "text": {"content": s[i : i + 1900]}})
    return chunks


def body_to_blocks(markdown: str) -> list[dict[str, Any]]:
    full = MIRROR_BANNER + (markdown or "")
    blocks: list[dict[str, Any]] = [
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {"rich_text": rt("📦 " + MIRROR_BANNER.strip())},
        }
    ]
    for i in range(0, max(len(full), 1), 1900):
        chunk = full[i : i + 1900] if full else ""
        blocks.append(
            {
                "object": "block",
                "type": "code",
                "code": {
                    "rich_text": [{"type": "text", "text": {"content": chunk}}],
                    "language": "markdown",
                },
            }
        )
    return blocks[:100]


def page_properties(
    rel: str,
    *,
    sensitivity: str | None,
    source_updated: str | None,
    content_hash_val: str | None,
) -> dict[str, Any]:
    title = Path(rel).name
    return {
        title_prop_name(): {
            "title": [{"type": "text", "text": {"content": title[:2000]}}]
        },
        "vault_path": {"rich_text": rt(rel)},
        "source_updated": {"rich_text": rt(source_updated or "")},
        "synced_at": {"rich_text": rt(now_iso())},
        "sensitivity": {"rich_text": rt(sensitivity or "normal")},
        "content_hash": {"rich_text": rt(content_hash_val or "")},
    }


def query_page_by_vault_path(token: str, database_id: str, vault_path: str) -> str | None:
    data = notion_request(
        "POST",
        f"/databases/{database_id}/query",
        token,
        {
            "filter": {
                "property": "vault_path",
                "rich_text": {"equals": vault_path},
            },
            "page_size": 1,
        },
    )
    results = data.get("results") or []
    if not results:
        return None
    return results[0].get("id")


def clear_page_children(token: str, page_id: str) -> None:
    cursor = None
    while True:
        path = f"/blocks/{page_id}/children?page_size=100"
        if cursor:
            path += f"&start_cursor={cursor}"
        data = notion_request("GET", path, token, None)
        for block in data.get("results") or []:
            bid = block.get("id")
            if bid:
                try:
                    notion_request("PATCH", f"/blocks/{bid}", token, {"archived": True})
                except RuntimeError:
                    pass
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
        if not cursor:
            break


def create_page(
    token: str,
    database_id: str,
    rel: str,
    text: str,
    *,
    sensitivity: str | None,
    source_updated: str | None,
    content_hash_val: str | None,
) -> str:
    data = notion_request(
        "POST",
        "/pages",
        token,
        {
            "parent": {"database_id": database_id},
            "properties": page_properties(
                rel,
                sensitivity=sensitivity,
                source_updated=source_updated,
                content_hash_val=content_hash_val,
            ),
            "children": body_to_blocks(text),
        },
    )
    pid = data.get("id")
    if not pid:
        raise RuntimeError(f"create page missing id: {data}")
    return pid


def update_page(
    token: str,
    page_id: str,
    rel: str,
    text: str,
    *,
    sensitivity: str | None,
    source_updated: str | None,
    content_hash_val: str | None,
) -> None:
    notion_request(
        "PATCH",
        f"/pages/{page_id}",
        token,
        {
            "properties": page_properties(
                rel,
                sensitivity=sensitivity,
                source_updated=source_updated,
                content_hash_val=content_hash_val,
            )
        },
    )
    clear_page_children(token, page_id)
    blocks = body_to_blocks(text)
    for i in range(0, len(blocks), 100):
        notion_request(
            "PATCH",
            f"/blocks/{page_id}/children",
            token,
            {"children": blocks[i : i + 100]},
        )


def upsert_to_notion(
    token: str,
    database_id: str,
    c: Candidate,
    state: dict[str, dict[str, Any]],
) -> tuple[str, str]:
    assert c.text is not None
    page_id = None
    st = state.get(c.rel)
    if st and st.get("page_id"):
        page_id = st["page_id"]
    if not page_id:
        page_id = query_page_by_vault_path(token, database_id, c.rel)

    if page_id:
        # skip body rewrite if hash unchanged
        if st and st.get("hash") == c.hash and st.get("page_id") == page_id:
            return "in-sync", page_id
        update_page(
            token,
            page_id,
            c.rel,
            c.text,
            sensitivity=c.sensitivity,
            source_updated=c.updated,
            content_hash_val=c.hash,
        )
        action = "updated"
    else:
        page_id = create_page(
            token,
            database_id,
            c.rel,
            c.text,
            sensitivity=c.sensitivity,
            source_updated=c.updated,
            content_hash_val=c.hash,
        )
        action = "created"

    state[c.rel] = {
        "path": c.rel,
        "page_id": page_id,
        "hash": c.hash,
        "synced_at": now_iso(),
        "sensitivity": c.sensitivity,
    }
    return action, page_id


def cmd_status(root: Path, args: argparse.Namespace) -> int:
    sd = ensure_state_dirs(root)
    loaded = load_dotenv_files(root)
    token = bool(resolve_token())
    db = bool(resolve_database_id())
    thin = [{"path": rel, "exists": (root / rel).is_file()} for rel in THIN_ALLOWLIST]
    receipt = Receipt(
        command="status",
        direction="n/a",
        dry_run=True,
        root=str(root),
        summary={
            "state_dir": str(sd),
            "dotenv_loaded": [str(p) for p in loaded],
            "notion_token_set": token,
            "notion_database_id_set": db,
            "thin_allowlist": thin,
            "version": VERSION,
        },
    )
    rpath = receipt.write(root)
    print(f"{SCRIPT} v{VERSION}")
    print(f"root:      {root}")
    print(f"state:     {sd}")
    print(f"dotenv:    {len(loaded)} file(s)")
    print(f"token:     {'set' if token else 'MISSING'}")
    print(f"database:  {'set' if db else 'MISSING'}")
    print("thin allowlist:")
    for t in thin:
        print(f"  [{'ok' if t['exists'] else 'MISSING'}] {t['path']}")
    print(f"receipt:   {rpath.relative_to(root).as_posix()}")
    if not token or not db:
        print("hint: put NOTION_TOKEN/KEY + NOTION_DATABASE_ID in .local/notion-sync/.env")
    return 0


def cmd_suggest(root: Path, args: argparse.Namespace) -> int:
    load_dotenv_files(root)
    cands = select_candidates(root, getattr(args, "allowlist_all", False))
    state = load_state(root)
    receipt = Receipt(
        command="suggest",
        direction="suggest",
        dry_run=True,
        allowlist_all=getattr(args, "allowlist_all", False),
        root=str(root),
    )
    print(f"suggest — report only  allowlist={'all' if args.allowlist_all else 'thin'}")
    eligible = 0
    for c in cands:
        if c.refused:
            c.action = "refuse"
            print(f"  REFUSE  {c.rel}  ({c.refused})  class={c.write_class}")
        elif not c.exists:
            c.action = "skip"
            print(f"  SKIP    {c.rel}  (missing local)")
        else:
            st = state.get(c.rel)
            if not st:
                verb = "would-create"
            elif st.get("hash") != c.hash:
                verb = "would-update"
            else:
                verb = "in-sync"
            c.action = verb
            eligible += 1
            print(
                f"  {verb:14} {c.rel}  hash={c.hash}  sens={c.sensitivity}  class={c.write_class}"
            )
        receipt.add_path(c)
    receipt.summary = {"candidates": len(cands), "eligible": eligible}
    rpath = receipt.write(root)
    print(f"receipt: {rpath.relative_to(root).as_posix()}")
    return 0


def cmd_sync_to_notion(root: Path, args: argparse.Namespace) -> int:
    load_dotenv_files(root)
    if not getattr(args, "live", False):
        dry_run = True
        live = False
    else:
        dry_run = bool(args.dry_run)
        live = not dry_run

    cands = select_candidates(root, getattr(args, "allowlist_all", False))
    state = load_state(root)
    receipt = Receipt(
        command="sync",
        direction="to-notion",
        dry_run=dry_run or not live,
        live=live,
        allowlist_all=getattr(args, "allowlist_all", False),
        root=str(root),
    )

    token = resolve_token()
    db_id = resolve_database_id()

    if live and not token:
        msg = "NOTION_TOKEN/KEY missing — set .local/notion-sync/.env"
        print(f"ERROR: {msg}", file=sys.stderr)
        receipt.errors.append(msg)
        receipt.exit_code = 1
        print(f"receipt: {receipt.write(root).relative_to(root).as_posix()}", file=sys.stderr)
        return 1
    if live and not db_id:
        msg = "NOTION_DATABASE_ID missing"
        print(f"ERROR: {msg}", file=sys.stderr)
        receipt.errors.append(msg)
        receipt.exit_code = 1
        print(f"receipt: {receipt.write(root).relative_to(root).as_posix()}", file=sys.stderr)
        return 1

    mode = "LIVE" if live else "DRY-RUN"
    print(f"sync --direction to-notion [{mode}]  allowlist={'all' if args.allowlist_all else 'thin'}")

    created = updated = refused = insync = 0
    for c in cands:
        if c.refused or not c.exists:
            c.action = "refuse" if c.refused else "skip"
            if c.refused:
                refused += 1
            print(f"  REFUSE  {c.rel}  ({c.refused or 'missing'})")
            receipt.add_path(c)
            continue

        st = state.get(c.rel)
        if st and st.get("hash") == c.hash and st.get("page_id"):
            planned = "in-sync"
        elif st and st.get("page_id"):
            planned = "would-update" if not live else "update"
        else:
            planned = "would-create" if not live else "create"

        if not live:
            c.action = planned
            print(f"  {planned:14} {c.rel}  hash={c.hash}  class={c.write_class}")
            receipt.add_path(c)
            if planned == "would-create":
                created += 1
            elif planned == "would-update":
                updated += 1
            else:
                insync += 1
            continue

        try:
            action, page_id = upsert_to_notion(token, db_id, c, state)
            c.action = action
            if action == "created":
                created += 1
            elif action == "updated":
                updated += 1
            else:
                insync += 1
            print(f"  {action:14} {c.rel}  page={page_id[:8]}…  hash={c.hash}")
            receipt.add_path(c, {"page_id": page_id})
            if action != "in-sync" and API_SLEEP_SEC > 0:
                time.sleep(API_SLEEP_SEC)
        except Exception as e:  # noqa: BLE001
            msg = f"{c.rel}: {e}"
            print(f"  ERROR   {msg}", file=sys.stderr)
            receipt.errors.append(msg)
            c.action = "error"
            receipt.add_path(c, {"error": str(e)[:500]})
            if API_SLEEP_SEC > 0:
                time.sleep(API_SLEEP_SEC * 2)

    if live:
        save_state(root, state)

    receipt.summary = {
        "created": created,
        "updated": updated,
        "in_sync": insync,
        "refused": refused,
        "errors": len(receipt.errors),
        "live": live,
    }
    rpath = receipt.write(root)
    print(f"receipt: {rpath.relative_to(root).as_posix()}")
    print(
        f"summary: created={created} updated={updated} in-sync={insync} errors={len(receipt.errors)}"
    )
    if receipt.errors and live:
        return 1
    return 0


def cmd_sync_to_local(root: Path, args: argparse.Namespace) -> int:
    load_dotenv_files(root)
    cands = select_candidates(root, getattr(args, "allowlist_all", False))
    receipt = Receipt(
        command="sync",
        direction="to-local",
        dry_run=True,
        root=str(root),
        summary={"note": "to-local stub until P5"},
    )
    print("sync --direction to-local [STUB/DRY]")
    for c in cands:
        if c.refused:
            c.action = "refuse"
            print(f"  REFUSE  {c.rel}  ({c.refused})")
        elif c.write_class in ("Human-gate", "Propose"):
            c.action = "would-propose"
            print(f"  PROPOSE {c.rel}  class={c.write_class}")
        elif c.write_class == "Auto":
            c.action = "would-auto"
            print(f"  AUTO    {c.rel}")
        else:
            c.action = "refuse"
            print(f"  REFUSE  {c.rel}")
        receipt.add_path(c)
    print(f"receipt: {receipt.write(root).relative_to(root).as_posix()}")
    return 0


def cmd_sync_auto(root: Path, args: argparse.Namespace) -> int:
    load_dotenv_files(root)
    if not getattr(args, "i_mean_it", False):
        print(
            "ERROR: sync --direction auto requires --i-mean-it",
            file=sys.stderr,
        )
        receipt = Receipt(
            command="sync",
            direction="auto",
            dry_run=True,
            root=str(root),
            errors=["auto requires --i-mean-it"],
            exit_code=2,
        )
        print(f"receipt: {receipt.write(root).relative_to(root).as_posix()}", file=sys.stderr)
        return 2
    receipt = Receipt(
        command="sync",
        direction="auto",
        dry_run=True,
        root=str(root),
        errors=["auto LWW stub — no writes"],
    )
    print("sync --direction auto --i-mean-it [STUB]")
    for c in select_candidates(root, getattr(args, "allowlist_all", False)):
        c.action = "auto-stub" if not c.refused else "refuse"
        print(f"  STUB    {c.rel}")
        receipt.add_path(c)
    print(f"receipt: {receipt.write(root).relative_to(root).as_posix()}")
    return 0


def cmd_sync(root: Path, args: argparse.Namespace) -> int:
    direction = (args.direction or "suggest").strip().lower()
    if direction in ("", "suggest"):
        return cmd_suggest(root, args)
    if direction == "to-notion":
        return cmd_sync_to_notion(root, args)
    if direction == "to-local":
        return cmd_sync_to_local(root, args)
    if direction == "auto":
        return cmd_sync_auto(root, args)
    print(f"ERROR: unknown --direction {direction!r}", file=sys.stderr)
    return 2


def cmd_audit_restricted(root: Path, args: argparse.Namespace) -> int:
    load_dotenv_files(root)
    ensure_state_dirs(root)
    receipt = Receipt(command="audit-restricted", direction="n/a", dry_run=True, root=str(root))
    restricted_local: list[dict[str, str]] = []
    scanned = 0
    vault = root / "vault"
    if vault.is_dir():
        for p in sorted(vault.rglob("*.md")):
            rel = to_posix_rel(p, root)
            if is_excluded_path(rel):
                continue
            scanned += 1
            try:
                text = p.read_text(encoding="utf-8")
            except OSError as e:
                receipt.errors.append(f"{rel}: {e}")
                continue
            if is_restricted_fm(parse_frontmatter(text)):
                restricted_local.append({"path": rel, "sensitivity": "restricted"})
    secrets_note = "present" if (root / "vault" / "Secrets").is_dir() else "absent"
    receipt.summary = {
        "scanned_md": scanned,
        "restricted_local_count": len(restricted_local),
        "restricted_local": restricted_local[:50],
        "secrets_dir": secrets_note,
    }
    receipt.restricted_refusal_count = len(restricted_local)
    print("audit-restricted (local)")
    print(f"  scanned:    {scanned}")
    print(f"  restricted: {len(restricted_local)}")
    for row in restricted_local[:30]:
        print(f"    {row['path']}")
    print(f"  Secrets/:   {secrets_note}")
    print(f"receipt: {receipt.write(root).relative_to(root).as_posix()}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="notion_markup_sync")
    p.add_argument("--root", type=Path, default=None)
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("status")
    sp_suggest = sub.add_parser("suggest")
    sp_suggest.add_argument("--allowlist-all", action="store_true")
    sp_sync = sub.add_parser("sync")
    sp_sync.add_argument(
        "--direction",
        choices=("suggest", "to-notion", "to-local", "auto"),
        default=None,
    )
    sp_sync.add_argument("--dry-run", action="store_true")
    sp_sync.add_argument("--live", action="store_true")
    sp_sync.add_argument("--i-mean-it", action="store_true")
    sp_sync.add_argument("--allowlist-all", action="store_true")
    sub.add_parser("audit-restricted")
    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    root = repo_root(args.root)
    if args.command == "status":
        return cmd_status(root, args)
    if args.command == "suggest":
        return cmd_suggest(root, args)
    if args.command == "sync":
        return cmd_sync(root, args)
    if args.command == "audit-restricted":
        return cmd_audit_restricted(root, args)
    return 2


if __name__ == "__main__":
    sys.exit(main())
