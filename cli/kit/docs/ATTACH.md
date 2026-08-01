# Attach

Point any MCP-capable host at your vault. **Fixtures:** [`../examples/attach/`](../examples/attach/).

## Env

| Variable | Value |
|----------|--------|
| `RECOLLECT_ROOT` | Absolute path to vault root (`RECOLLECT.md` + `vault/`) |

## Typical JSON (`mcpServers`)

```json
{
  "mcpServers": {
    "recollect-os": {
      "command": "recollect-os-mcp",
      "env": { "RECOLLECT_ROOT": "<vault>" }
    }
  }
}
```

Windows global bin: `recollect-os-mcp.cmd`. Or `node` + path to package `dist/src/index.js`.

## Hosts

| Host | Snippet file |
|------|----------------|
| Claude Desktop | `examples/attach/claude-desktop.mcpServers.json` |
| VS Code | `examples/attach/vscode.mcp.json` |
| Grok Build | `examples/attach/grok-build.toml` |
| Kimi / Antigravity | `examples/attach/kimi-code.mcpServers.json` · `antigravity.mcpServers.json` |
| Cursor | `init` already wrote `.cursor/mcp.json` |

## After attach

```text
boot() or boot(pack=overlay)   # routine working-set load
status()                       # personal focus
propose_write → apply_write(accept:true)   # durable; local only
```

Remote HTTP may draft; **accept stays on the vault machine**. Tool contract: [`../mcp/README.md`](../mcp/README.md).

**Known limit:** tools cannot block free-form host file edits.
