# recollect-os

Local **CLI + kit** for markdown vaults: init, smoke, status. Notes on disk; durable AI edits draft then you accept.

Not a black-box memory product. Not the unrelated npm package `recollect` (browser DB).

Repo: [recollect-main](https://github.com/gitrealbud/recollect-main).

## Start (one command)

```bash
npx -y recollect-os init ~/recollect
```

```bash
npx -y recollect-os smoke --root ~/recollect
npx -y recollect-os status --root ~/recollect
```

Init convenience-wires **Cursor**. For Claude Desktop, VS Code, Windsurf, Zed, or any other **stdio MCP** host, paste the server block from the [repo README](https://github.com/gitrealbud/recollect-main#attach-any-mcp-capable-model) / [`mcp/README.md`](../mcp/README.md). Same vault. Same write gate. Model is interchangeable.

**Windows:** if `npx` misses the bin:

```bash
npm i -g recollect-os
recollect-os.cmd init %USERPROFILE%\recollect
recollect-os.cmd smoke --root %USERPROFILE%\recollect
```

Rewire after upgrade: `recollect-os init --rewire` (never wipes notes).

## Commands (local clone)

```bash
cd cli
npm install
npm run build

node dist/src/index.js init [dir]
node dist/src/index.js init [dir] --rewire
node dist/src/index.js smoke --root [dir]
node dist/src/index.js status --root [dir] [--intent "…"]
```

## Undo

See `UNDO.md` written into the vault. Removing `.cursor/rules/recollect.mdc` and `.cursor/mcp.json` reverses Cursor wire; vault files remain. Other hosts: remove the `recollect-os` entry from that app’s MCP config.

## Publish

See [`docs/PUBLISH.md`](../docs/PUBLISH.md).
