# Optional integrations

Wiring you can add. **None of this is required.** Core Recollect works with notes on disk + rules + optional MCP write gate.

If you do not use a row below, ignore it. If you do, keep this rule:

> **Files and Hub Now stay the source of truth.** Search, embeddings, and host automation are finders and conveniences—not a second memory authority.

---

## Extension ladder (phased)

Add side-cars only after dogfood names real friction. Promote into core only if almost everyone needs it **and** it does not re-introduce [ANTI-GOALS](./ANTI-GOALS.md) failure modes.

| Phase | What ships | Gate to start / advance |
|-------|------------|-------------------------|
| **0** | This ladder + optional-compose rules | Always (docs only) |
| **1** | Dogfood published path · Verified ATTACH-GRID rows · friction notes | Lived attach; Verified=`yes` only after dogfood |
| **2** | Optional `doctor` / `status` flags (thin default) | Need clearer health signals |
| **3** | Promote / scrub helpers (`promote --dry-run`) | Need safer private→public share; **accept still required** |
| **4** | Local FTS side-car (paths only) | Friction: cannot locate notes with Map+editor search |
| **5** | Embeddings-as-finder (ranked paths only) | Friction remains after FTS; hits ≠ live truth |
| **Hold** | Auto-wire farm · L5 tool growth · required search/embeddings/graph | Evidence that current tools fail; no default authority change |

**Sequence:** dogfood → name friction → smallest optional side-car → document here / ATTACH-GRID → promote to core only with evidence.

**Avoid:** making finders required; always-on writers; bulk-apply / auto-accept; dumping retrieval into context; growing day-one face (README / START / Card) with finder concepts.

---

## Hosts and models (attach) — Phase 1

Full matrix, snippets, tiers: [`ATTACH-GRID.md`](./ATTACH-GRID.md).

| You want | Use |
|----------|-----|
| Cursor one-command | `npx -y recollect-os init` |
| Other MCP host | Grid row + `RECOLLECT_ROOT` |
| Chat only | Intelligence Card paste |

Extra host rows can be added as people verify them. Unused rows cost nothing. Friction capture template: [`examples/friction-capture.md`](../examples/friction-capture.md).

---

## Health signals — Phase 2

Default `status` / `doctor` stay thin.

| Flag | Purpose |
|------|---------|
| `doctor --verbose` | Audit tail (metadata only) |
| `doctor --git` | Unmediated durable dirty paths |
| `doctor --install-hook` | Opt-in pre-commit mediation warn |
| `doctor --sensitivity` | Restricted notes missing body banner |

Do not treat scores or synthetic drills as proof — prefer real work.

---

## Promote / scrub — Phase 3

```bash
recollect-os promote --dry-run [--root dir]
```

Reports membrane risks (restricted / Secrets / credential-like paths). **Does not write.** Any public promote still needs human scrub + propose→accept. Never auto-sync private ↔ public.

---

## Find / search (optional side-car) — Phase 4–5

Recollect does not ship full-text search or embeddings. You can still find notes with tools you already have:

| Approach | Phase | Notes |
|----------|-------|--------|
| Editor search (VS Code, Cursor, Obsidian, ripgrep) | now | Fast local find; no change to rules |
| Local FTS (e.g. SQLite FTS5, Obsidian Omnisearch) | **4** when friction | Index the vault folder; results open **paths into the vault**, not replace Hub Now |
| Embeddings / vector store | **5** after FTS if needed | Similarity recall only; **do not** treat hits as “what is true now”; confirm in the note |
| Host-native memory (e.g. product Memory features) | optional | Fine for short prefs; point at vault path; do not dual-home live status |

**Agent rule when search is available:** use it to *locate* candidates, then read the note (index → ≤2 still applies to what you load deep). Do not bulk-load search dumps into context.

**Contract if/when a finder ships in-repo:** return paths (and optional one-line titles) only; never write index hits into Hub Now; never become default authority.

---

## Intelligence systems (compose)

Recollect is meant to sit under an agent stack, not replace it.

| Layer | Role |
|-------|------|
| Your model / agent host | Reasoning and tools |
| Recollect MCP | Thin load + propose/accept writes |
| Your vault | Durable facts and Hub Now |
| Optional search index | Discovery only |
| Optional project rules (AGENTS.md, etc.) | Pointer to Card + vault path |

Pattern: agent boots → Recollect `status` / Map → Hub Now → act → durable change via propose/accept → other systems stay consumers of the same files.

---

## Template / schema packs (on demand)

| Pack | When to open |
|------|----------------|
| [`RELATIONSHIP-SCHEMA.md`](./RELATIONSHIP-SCHEMA.md) | Identity / prefs / typed edges |
| [`RESEARCH-AND-ANALYSIS.md`](./RESEARCH-AND-ANALYSIS.md) | Evidence vs advice claims |

Do not load packs into day-one context. Claim names them.

---

## Multi-host

Manual attach per host is supported (grid). Automated “wire every IDE” is **Hold** — not required for value. Add a host when you need it; skip the rest.

---

## What stays out of core

| Not required in core | Why |
|----------------------|-----|
| Embeddings / vector DB | Must not become SoT |
| Background always-on agent | Unsupervised writes fight the gate |
| Parallel graph DB | Markdown + links remain authority |
| Bulk-apply / auto-accept | Durable edits stay reviewable |

Optional tools may exist beside the vault. They must not silently write durable state without the same accept discipline you use for the vault.
