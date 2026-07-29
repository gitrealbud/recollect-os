# recollect-os-mcp

Local **stdio** MCP for [Recollect](https://github.com/gitrealbud/recollect-os)-shaped vaults.

**npm name:** `recollect-os-mcp` — *not* the unrelated npm package `recollect-mcp` (SQLite memory).  
**Vault stays Markdown-only.** This package is an adapter: resolve paths, enforce policy, mediate writes.

Audit: [`AUDIT.md`](./AUDIT.md). Runtime plan: [`../docs/RUNTIME-PLAN.md`](../docs/RUNTIME-PLAN.md).  
Private twin notes: Recollect `CONNECTORS.md` §10 — **amend same turn as this file**.

**Status:** **v0.3.7** — read/boot + `status` · `propose_write` · `apply_write` · JSON envelopes (`ok`/`code`/`message`) · privacy-safe `.recollect/audit.jsonl`.  
CLI twin: `recollect-os propose` / `recollect-os accept` (see [`docs/DEMO.md`](../docs/DEMO.md)).  
No further core tools until published-path usage justifies it.

Write gate classes (formal): **Auto · Propose · Human-gate · Forbidden** — plain meanings in [`../docs/LAW.md`](../docs/LAW.md).

---

## Tools — shipped (v0.3)

| Tool | Behavior |
|------|----------|
| `boot` | Views over fixed paths. `pack`: **`pulse`** (default) · **`attach`** · `law` · `map_intent` · `map_index` · `who` · `full` |
| `resolve_intent` | Match index Intent rows → ≤3 matches × ≤2 vault paths. Not full-text search. |
| `read_note` | One vault-relative path. Refuses traversal, `Secrets/`, `Archive/`, `People/`, `sensitivity: restricted` |
| `capture_inbox` | Write `vault/Inbox/YYYY-MM-DD-HHmm-slug.md` with `domain: personal`, **`type: note`**. **Auto** when you invoke it. |

### `boot` packs

| pack | Contents |
|------|----------|
| `pulse` | `RECOLLECT.md` → `## Active context` only (personal focus strip) |
| `attach` | pulse + who + map_intent (≤12k chars) — dialed-in recipe |
| `law` | `RECOLLECT.md` without Active |
| `map_intent` | Map preamble + Intent + Research packs |
| `map_index` | Map Identity → Sensitivity indexes |
| `who` | `Me.md` + `Preferences.md` |
| `full` | All four files (minimal attach pack) |

**Live surfaces:** personal focus ≈ `pulse`. Project Now ≈ resolve → read hub `## Now` / pack Live. The index is not live status.

### Write gate (v0.3)

| Tool | Behavior |
|------|----------|
| `status` | Personal focus ± one project Now; no counters; no whole vault |
| `propose_write` | Draft only → `.recollect/proposals/<id>.json` (TTL 24h). **Never** durable-writes the vault |
| `apply_write` | `{ proposal_id, accept: true }` only path to apply Propose/Human-gate drafts via MCP. Forbidden always refuses. CLI twin: `recollect-os accept <id>` |

---

## Install / attach

**Host matrix + snippets:** [`../docs/ATTACH-GRID.md`](../docs/ATTACH-GRID.md) (attach source of truth).

```bash
npx -y recollect-os init ~/recollect
```

`init` wires **Cursor**. Other hosts: use the grid. Windows: `npm i -g recollect-os` if `npx` misses the bin; `--rewire` after upgrades.

**Monorepo build:**

```bash
cd mcp && npm install && npm run build
```

Point any host’s stdio config at `mcp/dist/src/index.js` with `RECOLLECT_ROOT` = vault root. Never commit machine paths as the shared source of truth.

After `capture_inbox` / `apply_write`, **git commit is your / the host’s duty**.

**Known limit:** gate = tool-mediated writes only.

## Policy (encoded)

- Open ≤2 spirit: no list/search dump; resolve_intent caps paths; one path per `read_note`
- Auto writes: Inbox only via `capture_inbox`; personal-only
- Restricted: hard refuse on read; capture never sets `restricted`
- Logs: stderr only

## Tests

```bash
npm test
```

## License

MIT
