import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  copyFile,
  ensureDir,
  findKitRoot,
  isVaultRoot,
  resolveMcpDist,
  todayIso,
  writeFile,
  writeIfMissing,
} from "./fsutil.js";

const LAW_DOCS = [
  "ENTRY.md",
  "LAW.md",
  "WRITE-CLASSES.md",
  "START-GUIDE.md",
  "ATTACH.md",
  "DEMO.md",
] as const;

const VAULT_TEMPLATES = [
  ["experiment-hub.md", "hub.md"],
  ["me.md", "me.md"],
  ["preferences.md", "preferences.md"],
  ["episode.md", "episode.md"],
  ["map.md", "map.md"],
] as const;

export type InitOptions = {
  target: string;
  rewire?: boolean;
  mcpDist?: string;
};

export type InitResult = {
  root: string;
  created: boolean;
  rewired: boolean;
  message: string;
};

function defaultMcpEntry(root: string, mcpDist: string): object {
  return {
    mcpServers: {
      "recollect-os": {
        command: "node",
        args: [mcpDist],
        env: { RECOLLECT_ROOT: root },
      },
    },
  };
}

function cursorRuleBody(): string {
  return `---
description: Recollect vault — thin load, reviewable writes
globs:
alwaysApply: true
---

# Recollect (project wire)

You are the Recollect assistant for this vault.

Talk plain. Three ideas only unless the work expands:
1. Notes are the record — not the chat.
2. One short note per thing — its “what’s true now” section answers current status.
3. Nothing permanent until the human accepts — permanent changes are proposed; they accept them.

- Prefer tools when available for status, reading notes, and proposing changes.
- Permanent changes: draft → human accepts. Do not silent-write paths the tools refuse.
- After onboarding ends: short index → that note’s “what’s true now” section only (at most two notes).
- Onboarding starts by default until the human ends it — see docs/ENTRY.md and docs/START-GUIDE.md.
- On refuse: one plain sentence + one doc link. No jargon lecture.

Known limit: tools cannot block free-form host file edits. Permanent path = draft then accept.
`;
}

function recollectStub(date: string): string {
  return `# Recollect — vault practice

Read this before any vault note read/write.
Shared practice docs live under \`docs/\`. Canonical public shape: recollect-os \`docs/LAW.md\`.

## Domains

\`personal\` | \`business\` only. No dual-domain notes (use two notes + link).

## Live surfaces

| Scope | Writer |
|-------|--------|
| Personal focus | \`## Active context\` below |
| Project status | hub \`## Now\` / pack Live |
| Index | Intent only — never live status |

Permanent changes: draft then you accept. Some paths tools will not apply.

## Active context

*(Personal focus · ≤15 lines)*

- *(empty — set after first claim)*

### Edges (focus)

| from | rel | to | as_of | note |
|------|-----|----|-------|------|
| vault/Me.md | active_on | | ${date} | fill hub path when focused |

*(Controlled rels only: owns · active_on · constrained_by · prefers · supersedes. Do not put live focus on the index.)*

## Folder map

| Path | For |
|------|-----|
| \`vault/Inbox/\` | capture |
| \`vault/Daily/\` | dated journals |
| \`vault/Map.md\` | short index |
| \`vault/\` root | personal evergreen after promote |
| \`vault/Business/\` | business only |

Created: ${date}
`;
}

function fillTemplate(kit: string, name: string, date: string): string {
  const src = path.join(kit, "templates", name);
  return fs
    .readFileSync(src, "utf8")
    .replaceAll("{{date}}", date)
    .replaceAll("{{id}}", "episode")
    .replaceAll("{{slug}}", "episode")
    .replaceAll("{{title}}", "Episode")
    .replaceAll("{{one-line summary}}", "");
}

function gitignoreBody(): string {
  return `.recollect/
.env
.env.*
*.log
.DS_Store
`;
}

function undoDoc(): string {
  return `# Undo init wire (vault stays)

To reverse **Cursor / MCP wiring** without deleting notes:

1. Delete \`.cursor/rules/recollect.mdc\` (and \`.cursor/mcp.json\` if you no longer want project MCP).
2. Remove any user-level MCP entry that pointed \`RECOLLECT_ROOT\` here.
3. Optionally delete \`UNDO.md\` and this note.

**Do not** delete \`RECOLLECT.md\` or \`vault/\` unless you intend to destroy the vault.
`;
}

export function initVault(opts: InitOptions): InitResult {
  const root = path.resolve(opts.target);
  const kit = findKitRoot();
  const mcpDist = resolveMcpDist(opts.mcpDist);
  const date = todayIso();

  if (isVaultRoot(root)) {
    if (!opts.rewire) {
      return {
        root,
        created: false,
        rewired: false,
        message: `Vault already exists at ${root}\nRECOLLECT_ROOT=${root}\nRefuse recreate. Use: recollect init "${root}" --rewire`,
      };
    }
    wireCursor(root, mcpDist);
    writeFile(path.join(root, "UNDO.md"), undoDoc());
    return {
      root,
      created: false,
      rewired: true,
      message: `Rewired Cursor + MCP for existing vault.\nRECOLLECT_ROOT=${root}\nMCP entry: ${mcpDist}`,
    };
  }

  if (fs.existsSync(root)) {
    const entries = fs.readdirSync(root).filter((e) => e !== ".git");
    if (entries.length > 0 && !opts.rewire) {
      throw new Error(
        `Target not empty and not a vault: ${root}. Use an empty dir or --rewire on an existing vault.`
      );
    }
  }

  ensureDir(root);
  ensureDir(path.join(root, "vault", "Inbox"));
  ensureDir(path.join(root, "vault", "Daily"));
  ensureDir(path.join(root, "vault", "Business"));
  ensureDir(path.join(root, "vault", "Templates"));
  ensureDir(path.join(root, ".recollect", "proposals"));
  ensureDir(path.join(root, "docs"));

  writeIfMissing(path.join(root, "RECOLLECT.md"), recollectStub(date));
  writeIfMissing(
    path.join(root, "vault", "Me.md"),
    fillTemplate(kit, "me.md", date)
  );
  writeIfMissing(
    path.join(root, "vault", "Preferences.md"),
    fillTemplate(kit, "preferences.md", date)
  );
  writeIfMissing(path.join(root, ".gitignore"), gitignoreBody());
  writeFile(path.join(root, "UNDO.md"), undoDoc());

  const mapSrc = path.join(kit, "templates", "map.md");
  const mapBody = fs
    .readFileSync(mapSrc, "utf8")
    .replaceAll("{{date}}", date);
  writeIfMissing(path.join(root, "vault", "Map.md"), mapBody);

  for (const [srcName, destName] of VAULT_TEMPLATES) {
    if (srcName === "map.md") continue; // Map is vault root, not Templates/
    const src = path.join(kit, "templates", srcName);
    if (fs.existsSync(src)) {
      copyFile(src, path.join(root, "vault", "Templates", destName));
    }
  }

  for (const doc of LAW_DOCS) {
    const src = path.join(kit, "docs", doc);
    if (fs.existsSync(src)) {
      copyFile(src, path.join(root, "docs", doc));
    }
  }

  wireCursor(root, mcpDist);

  return {
    root,
    created: true,
    rewired: true,
    message: `Created vault at ${root}\nRECOLLECT_ROOT=${root}\nCursor rule + .cursor/mcp.json written.\nMCP dist: ${mcpDist}\nNext: recollect smoke --root "${root}"`,
  };
}

function wireCursor(root: string, mcpDist: string): void {
  writeFile(path.join(root, ".cursor", "rules", "recollect.mdc"), cursorRuleBody());
  writeFile(
    path.join(root, ".cursor", "mcp.json"),
    JSON.stringify(defaultMcpEntry(root, mcpDist), null, 2) + "\n"
  );
}

export function defaultInitTarget(): string {
  return path.join(os.homedir(), "recollect");
}
