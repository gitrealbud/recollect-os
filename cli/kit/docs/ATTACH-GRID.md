# Attach grid — Recollect across hosts & models

**SoT for integration.** Other docs only point here. Living — add rows when verified. Research: **2026-07-29**.

Same vault · same write gate · model interchangeable when MCP tools are attached.  
Runtime: local **stdio** `recollect-os-mcp`. Law-only fallback: [`INTELLIGENCE-CARD.md`](./INTELLIGENCE-CARD.md).

**Known limit:** MCP cannot block host free-form file edits. Durable writes stay reviewable only when the agent uses propose → accept. Fixtures (parse-tested): [`examples/attach/`](../examples/attach/).

```bash
# Unix
npx -y recollect-os init ~/recollect
npx -y recollect-os smoke --root ~/recollect --gate

# Windows (recommended)
npm i -g recollect-os
recollect-os.cmd init %USERPROFILE%\recollect
recollect-os.cmd smoke --root %USERPROFILE%\recollect --gate
```

MCP entry: path printed by `init`, or `npm root -g` → `recollect-os-mcp/dist/src/index.js`.  
Windows documented default: global install → `recollect-os.cmd …`.

| Tier | Meaning |
|------|---------|
| **A** | Full MCP tools (propose → accept) |
| **B** | Law / instructions only — honor-system writes |
| **C** | Bridge / special ops |

| Verified | Meaning |
|----------|---------|
| `yes` | Lived on this machine/path |
| `doc` | Vendor docs only |
| `partial` | Mixed / ACP adjacent |
| `hold` | Real but not cold-path default |

---

## 1. Master grid (scan)

| Surface | Tier | Config locus | Best path | Verified |
|---------|------|--------------|-----------|----------|
| **Cursor** | A | `.cursor/mcp.json` + rule | `recollect-os init` | yes |
| **Claude Desktop** | A | `claude_desktop_config.json` | [`examples/attach/claude-desktop…`](../examples/attach/claude-desktop.mcpServers.json) | doc |
| **Claude Code** | A | `claude mcp` / `.mcp.json` | `claude mcp add --transport stdio …` | doc |
| **VS Code + Copilot** | A | `.vscode/mcp.json` or user MCP | [`examples/attach/vscode.mcp.json`](../examples/attach/vscode.mcp.json) | doc |
| **Windsurf** | A | `~\.codeium\windsurf\mcp_config.json` | Cascade → Manage MCPs | doc |
| **Zed** | A | `settings.json` → `context_servers` | Settings → AI → MCP Servers | doc |
| **Continue** | A | `config.yaml` or `.continue/mcpServers/` | YAML / agent mode | doc |
| **Grok Build** | A | `~/.grok/config.toml` | [`examples/attach/grok-build.toml`](../examples/attach/grok-build.toml) · `grok mcp add` | yes |
| **Grok Build + AGENTS/Card** | B+A | Repo rules + MCP | Card **and** MCP | partial |
| **Grok.com Instructions / Workspaces** | B | grok.com Customize | Thin Card paste | doc |
| **Grok Memory (planter)** | B | Memory settings | 3–7 prefs + vault pointer — not Hub Now | doc |
| **Antigravity (Desktop / CLI)** | A | `~/.gemini/config/mcp_config.json` or Settings → MCP | [`examples/attach/antigravity.mcpServers.json`](../examples/attach/antigravity.mcpServers.json) · §2 Antigravity | yes · 2026-07-29 |
| **Gemini CLI (legacy)** | — | — | **Do not use for individuals** — migrate to Antigravity ([announcement](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)) · same stdio shape | hold |
| **ChatGPT / Codex** | C | Secure MCP Tunnel | `tunnel-client` → local stdio | hold |
| **Buzz (ACP)** | C | Buzz harness | Grok Build ACP + MCP/rules | partial |
| **Any chat (law-only)** | B | System / custom instructions | Intelligence Card | yes |

---

## 2. Snippets (copy)

Placeholders: `<mcp-entry>` = absolute path to `recollect-os-mcp/dist/src/index.js` · `<vault>` = absolute vault root.

### Cursor / Claude Desktop / Windsurf (`mcpServers`)

```json
{
  "mcpServers": {
    "recollect-os": {
      "command": "node",
      "args": ["<mcp-entry>"],
      "env": { "RECOLLECT_ROOT": "<vault>" }
    }
  }
}
```

Cursor: created by `init`. Claude Desktop: `%APPDATA%\Claude\claude_desktop_config.json` (Win) — full quit after save. Windsurf: global `mcp_config.json` only.

### VS Code + Copilot (`servers` + type)

```json
{
  "servers": {
    "recollect-os": {
      "type": "stdio",
      "command": "node",
      "args": ["<mcp-entry>"],
      "env": { "RECOLLECT_ROOT": "<vault>" }
    }
  }
}
```

### Claude Code

```bash
claude mcp add --env RECOLLECT_ROOT=<vault> --transport stdio recollect-os -- node <mcp-entry>
```

### Grok Build

```bash
grok mcp add recollect-os --env RECOLLECT_ROOT=<vault> -- node <mcp-entry>
grok mcp doctor recollect-os
```

```toml
[mcp_servers.recollect-os]
command = "node"
args = ["<mcp-entry>"]
env = { RECOLLECT_ROOT = "<vault>" }
```

Also merges `.cursor/mcp.json` unless `[compat.cursor] mcps = false`.

### Antigravity (Gemini successor) — `mcpServers`

**Lived 2026-07-29 (Windows):** Desktop MCP Tools + Standard MCP JSON; `status` + `boot` → `ok: true`; Session Now from private vault. Individual / free **Gemini CLI** and **Gemini Code Assist for individuals** no longer auth — use [Antigravity](https://antigravity.google) instead ([migration](https://antigravity.google/docs/cli/gcli-migration)).

| Locus | Path |
|-------|------|
| **Global MCP profile** | `~/.gemini/config/mcp_config.json` (Win: `%USERPROFILE%\.gemini\config\mcp_config.json`) |
| **Workspace** | `.agents/mcp_config.json` (when present) |
| **UI** | Settings → Customizations → Installed MCP Servers · or paste **Standard MCP JSON (`mcpServers`)** |

```json
{
  "mcpServers": {
    "recollect-os": {
      "command": "node",
      "args": ["<mcp-entry>"],
      "env": { "RECOLLECT_ROOT": "<vault>" }
    }
  }
}
```

Fixture: [`examples/attach/antigravity.mcpServers.json`](../examples/attach/antigravity.mcpServers.json).

**Windows notes**

- Write JSON as **UTF-8 without BOM** (BOM → parse error: unexpected `﻿`).
- Prefer forward slashes in paths, or double-escaped backslashes.
- `<mcp-entry>` examples:
  - Global npm: `…/node_modules/recollect-os/node_modules/recollect-os-mcp/dist/src/index.js` (under `npm root -g`)
  - Monorepo dogfood: `…/public-recollect-os/mcp/dist/src/index.js` (rebuild after pull: `cd mcp && npm run build`)
- Private Recollect vault root has `RECOLLECT.md` + `vault/` — **not** the public docs-only clone alone.
- `smoke --gate` may FAIL kit **docs spine** on a private vault (no shipped `docs/LAW.md`); **boot / status still valid**. Use attach prove, not full kit smoke, for private roots.

**Prove**

1. Tools list includes `boot` · `status` · `propose_write` · `apply_write`.  
2. Agent: *Call recollect-os status with no intent. Session Now only.*  
3. Expect `ok: true` and Active context — no whole-vault dump.

### Zed

```json
{
  "context_servers": {
    "recollect-os": {
      "command": "node",
      "args": ["<mcp-entry>"],
      "env": { "RECOLLECT_ROOT": "<vault>" }
    }
  }
}
```

Prefer the in-app “Add Local Server” modal if the settings shape drifts.

### Continue

```yaml
mcpServers:
  - name: recollect-os
    command: node
    args: ["<mcp-entry>"]
    env:
      RECOLLECT_ROOT: <vault>
```

Agent mode required.

### ChatGPT / Codex (hold)

Use OpenAI **Secure MCP Tunnel** + `tunnel-client` with `--mcp-command` pointing at `node <mcp-entry>` and `RECOLLECT_ROOT`. Not the cold-story default.

---

## 3. Law-only / planter (Tier B)

| Method | Plant | Do not |
|--------|-------|--------|
| **Intelligence Card** | [`INTELLIGENCE-CARD.md`](./INTELLIGENCE-CARD.md) seed | Whole vault |
| **START extraction** | Day-one path only | Reload on ordinary sessions |
| **Grok Custom Instructions / Workspaces** | Thin Card + files-are-SoT + ask before durable writes | Secrets · restricted · live Now as Memory |
| **Grok Memory planter** | Short durable prefs + “vault is on disk at …” | Treating Memory as Hub/Session Now |
| **Repo AGENTS.md** | Pointer to this grid + Card | Forking vault law into product trees |
| **Buzz ACP** | Persona + boot order; Recollect via Grok Build MCP | Replacing the write gate |

---

## 4. Limits

- MCP cannot block free-form edits outside tools.
- Tier B = no enforced accept path.
- Multi-host auto-wire farm deferred — this doc is **manual attach**.

**When dogfooding a host:** set Verified → `yes` + date; note Windows PATH quirks; capture friction with [`examples/friction-capture.md`](../examples/friction-capture.md) in a **private** vault (not this repo).

### Dogfood checklist (Phase 1)

1. Cold path: init or attach → `smoke --gate` green on that host.
2. Thin load: `status` shows one Now strip; Map → ≤2 notes for a real task.
3. Write gate: propose → `accept` (or MCP apply with accept) lands; Forbidden path refuses.
4. Outside the gate: note free-form edit honesty; optional `doctor --git`.
5. Only then: Verified=`yes` on the grid row. Extension asks go to INTEGRATIONS phases — do not grow Card/START.


Sources: Anthropic Claude Desktop/Code · VS Code MCP · Windsurf Cascade · Zed MCP · Continue MCP · [xAI Grok Build MCP](https://docs.x.ai/build/features/mcp-servers) · [Antigravity MCP](https://antigravity.google/docs/mcp) · [Gemini CLI → Antigravity migration](https://antigravity.google/docs/cli/gcli-migration) · OpenAI Secure MCP Tunnel.
