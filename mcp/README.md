# recollect-os-mcp

Local **stdio** MCP for [Recollect](https://github.com/gitrealbud/recollect-main)-shaped vaults.

**npm name:** `recollect-os-mcp` — *not* the unrelated npm package `recollect-mcp` (SQLite memory).  
**Vault stays Markdown-only.** This package is an adapter: resolve paths, enforce policy, mediate writes.

Audit: [`AUDIT.md`](./AUDIT.md). Runtime plan: [`../docs/RUNTIME-PLAN.md`](../docs/RUNTIME-PLAN.md).  
Tool contract SoT for adopters: **this file** + [`../docs/ATTACH.md`](../docs/ATTACH.md).

**Status:** **v0.4.5-overlay** — local stdio + remote HTTP JWT + **vault-api REST** + code-side API + **Agent Frame Seed** + `boot(overlay)`.  
HTTP MCP: `boot` · `status` · `resolve_intent` · `read_note` · `capture_inbox` · `propose_write`.  
**`apply_write` not on HTTP** — accept locally.  
Companion REST (same process): `/vault-api/*` for UI tree list/read (optional write). Accept/apply stays vault-local.  
Code-side: `import { RecollectCodeApi } from 'recollect-os-mcp/code-api'`.

**Writes (plain):** draft durable change → human accepts; safe capture may proceed; some paths refuse. Formal classes: [`../docs/WRITE-CLASSES.md`](../docs/WRITE-CLASSES.md).

### Agent frame (connection seed)

At connect, the server sends a short plain frame: notes on disk are the record; load little; draft then human accepts; no invented facts; no dual live facts.  
Also reinforced on routine boot and in tool descriptions. Constant: `AGENT_FRAME_SEED` in package (`recollect-os-mcp/agent-frame-seed`).

---

## Tools — shipped (v0.3)

| Tool | Behavior |
|------|----------|
| `boot` | Thin view over fixed paths — **not** a vault dump. Default = **routine working-set load**. Optional `pack` for advanced slices. |
| `resolve_intent` | Match short-index Intent rows → ≤3 matches × ≤2 vault paths. Not full-text search. |
| `read_note` | One vault-relative path. Refuses traversal, `Secrets/`, `Archive/`, `People/`, `sensitivity: restricted` |
| `capture_inbox` | Write `vault/Inbox/YYYY-MM-DD-HHmm-slug.md` with `domain: personal`, **`type: note`**. Safe micro-op when you invoke it. |

### Boot load (mass 4 — plain first)

| Need | What to call | `pack` id |
|------|--------------|-----------|
| **Routine** (default) | One load of this turn’s working set: recipe + personal focus + short-index intent | `overlay` (also bare `boot`) |
| **Focus-only** | Personal focus strip only | `pulse` |
| **Who is needed** | Focus + Me + Preferences + index intent | `attach` |

Other packs are **advanced slices** (open only when the task needs that slice):

| pack | Contents |
|------|----------|
| `law` | Practice law without Active context |
| `map_intent` | Map preamble + Intent + research pack rows |
| `map_index` | Map identity → sensitivity indexes |
| `who` | `Me.md` + `Preferences.md` only |
| `full` | Four-file sterile pack (avoid for routine) |

**Live surfaces (plain):** personal focus ≈ `pulse` / status without intent · project “what’s true now” ≈ `status(intent=…)` · short index is never live. Prefer routine or focus-only over `full`.

### Write gate (v0.3)

| Tool | Behavior |
|------|----------|
| `status` | Personal focus ± one project “what’s true now”; no counters; no whole vault |
| `propose_write` | Draft only → `.recollect/proposals/<id>.json` (TTL 24h). **Never** durable-writes the vault |
| `apply_write` | `{ proposal_id, accept: true }` — only MCP path to apply drafts that need accept. Refuse paths tools will not apply. CLI twin: `recollect-os accept <id>` |

---

## Install / attach

**Host snippets:** [`../docs/ATTACH.md`](../docs/ATTACH.md) · [`../examples/attach/`](../examples/attach/).

```bash
npx -y recollect-os init ~/recollect
```

`init` wires **Cursor**. Other hosts: use the grid (Grok Build, **Kimi Code**, Antigravity, Claude, VS Code, …). Windows: `npm i -g recollect-os` if `npx` misses the bin; `--rewire` after upgrades.

**Monorepo build:**

```bash
cd mcp && npm install && npm run build
```

Point any host’s stdio config at `mcp/dist/src/index.js` with `RECOLLECT_ROOT` = vault root. Never commit machine paths as the shared source of truth.

**Windows / Git Bash paths:** `RECOLLECT_ROOT` accepts native Windows paths (`C:\Users\…\vault`) and common MSYS/Git Bash forms (`/c/Users/…/vault` or the double-converted `C:\c\Users\…\vault`). The server resolves whichever form points at a real vault.

After `capture_inbox` / `apply_write`, **git commit is your / the host’s duty**.

**Known limit:** gate = tool-mediated writes only.

## Experimental remote HTTP (short-lived JWT · remote draft · accept local)

Connect tools over the network without a sticky session (stateless Streamable HTTP MCP).

**Auth (solo operator):** short-lived **HS256 JWT** signed with a local secret. Mint a token, pass it as `Authorization: Bearer <jwt>`. Default TTL **10 minutes** (max 1 hour). Audience `recollect`.  
**On HTTP MCP (`/mcp`):** `boot` · `status` · `resolve_intent` · `read_note` · `capture_inbox` · `propose_write`.  
**Not on HTTP MCP:** `apply_write` (accept stays local) · directory list · search.

**Companion vault REST (`/vault-api`, same server):** for apps that need a **file tree** (MCP deliberately has no list tool). Same Bearer.  
`GET /vault-api/health` · `GET /vault-api/notes` · `GET /vault-api/note?path=` · `PUT|DELETE /vault-api/note` only if `RECOLLECT_VAULT_API_WRITE=1` (host disk; not a substitute for local accept).  
Refuses traversal and `Secrets/`.

Legacy static `RECOLLECT_HTTP_TOKEN` still works for migration; prefer JWT.

```bash
cd mcp && npm run build
export RECOLLECT_ROOT=/absolute/path/to/vault
export RECOLLECT_HTTP_JWT_SECRET='at-least-32-characters-of-secret!!'
npm run start:http
# other shell:
export RECOLLECT_HTTP_JWT_SECRET='at-least-32-characters-of-secret!!'
TOKEN=$(npm run -s mint -- --ttl 600)
# Authorization: Bearer $TOKEN  →  POST http://127.0.0.1:3927/mcp
```

| Env | Required | Default |
|-----|----------|---------|
| `RECOLLECT_ROOT` | yes | — |
| `RECOLLECT_HTTP_JWT_SECRET` | preferred (≥32) | — |
| `RECOLLECT_HTTP_JWT_SECRET_FILE` | alt | path to secret |
| `RECOLLECT_HTTP_JWT_AUD` | no | `recollect` |
| `RECOLLECT_HTTP_JWT_ISS` | no | `recollect-os-mcp` |
| `RECOLLECT_HTTP_TOKEN` | legacy (≥16) | static bearer fallback |
| `RECOLLECT_HTTP_HOST` | no | `127.0.0.1` |
| `RECOLLECT_HTTP_PORT` | no | `3927` |
| `RECOLLECT_AUDIT` | no | `0` disables audit log |

**Mint CLI:** `recollect-os-mcp-mint` · `npm run mint -- --ttl 300 --sub operator`

**Smoke (server already running):**

```bash
export RECOLLECT_HTTP_URL=http://127.0.0.1:3927
export RECOLLECT_HTTP_JWT_SECRET='same-as-server'
export RECOLLECT_HTTP_TOKEN=$(npm run -s mint)
npm run smoke:http
```

**HTTP tools:** `boot` · `status` · `resolve_intent` · `read_note` · `capture_inbox` · `propose_write`.  
**Not on HTTP:** `apply_write` (accept stays local — stdio or `recollect-os accept <proposal_id>`).

Prefer localhost + tunnel. JWT short TTL limits blast if leaked. Not a multi-tenant OAuth product.

**Remote draft loop:**

```text
HTTP propose_write → proposal_id
local: recollect-os accept <proposal_id>   # or stdio apply_write
git commit  # your duty
```

## Code-side tool calls (thin API)

Keeps multi-note work out of the model context. Same write safety: drafts need your accept.

```js
import { RecollectCodeApi } from "recollect-os-mcp/code-api";

// Same machine as the vault (densest):
const api = RecollectCodeApi.fromRoot(process.env.RECOLLECT_ROOT);
const focus = await api.status();
const one = await api.resolveAndReadFirst("career"); // one path, not a dump
// draft only — then accept locally:
// await api.proposeWrite({ path, content });
await api.close();

// Remote HTTP (JWT from mint):
// const api = RecollectCodeApi.fromHttp({ url: "http://127.0.0.1:3927/mcp", token });
```

Example: `npm run example:code-side`  
Anti-patterns are listed on `CODE_SIDE_ANTI_PATTERNS` in the module.

Language: plain on faces; formal names in [`docs/LAW.md`](../docs/LAW.md).

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
