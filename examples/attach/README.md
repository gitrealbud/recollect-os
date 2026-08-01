# Attach fixtures — verified config shapes (not auto-wire)

Replace placeholders before use:

| Placeholder | Meaning |
|-------------|---------|
| `<mcp-entry>` | Absolute path to `recollect-os-mcp/dist/src/index.js` (from `npm root -g` or `init` output) |
| `<vault>` | Absolute vault root (`RECOLLECT.md` + `vault/`) |

| File | Host | Locus |
|------|------|-------|
| [`claude-desktop.mcpServers.json`](./claude-desktop.mcpServers.json) | Claude Desktop | `%APPDATA%/Claude/claude_desktop_config.json` (Win) / `~/Library/Application Support/Claude/…` (macOS) |
| [`vscode.mcp.json`](./vscode.mcp.json) | VS Code + Copilot | `.vscode/mcp.json` or user MCP settings |
| [`grok-build.toml`](./grok-build.toml) | Grok Build | `~/.grok/config.toml` or `grok mcp add …` |
| [`antigravity.mcpServers.json`](./antigravity.mcpServers.json) | Antigravity Desktop / CLI | `~/.gemini/config/mcp_config.json` or Settings → Installed MCP Servers (Standard MCP JSON). **Not** legacy Gemini CLI for individuals. |
| [`kimi-code.mcpServers.json`](./kimi-code.mcpServers.json) | Kimi Code CLI | `~/.kimi-code/mcp.json` (user) · project `.kimi-code/mcp.json` or `.mcp.json` · `/mcp-config` in TUI |

**Manual verify checklist:**

1. Tools list shows `boot` · `status` · `propose_write` · `apply_write`
2. `status` returns personal focus only (no vault dump)
3. Propose Forbidden path → refuse without id
4. Draft then accept (CLI or `apply_write`) lands one file

Attach guide: [`docs/ATTACH.md`](../../docs/ATTACH.md).
