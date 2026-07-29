# Current rules

Current shape for agents that work against a file-native judgment vault.  
**Living:** amend via task + product Now strip / PR when lived evidence says so.

**Plain-first (public surfaces):** day-one docs use everyday English only — *notes are the record · one short note per thing · nothing permanent until you accept · “what’s true now”*. Formal names below are **this file’s glossary** (and deeper docs that link here). Do not put formal names on README / START / Card / DEMO faces.

**Quick aliases (plain → formal):** main note → Hub · Now section → Hub Now · index → Vault Map · detail note → Leaf · task → Claim · you → Operator · draft for accept → Propose · ask first → Human-gate · won’t apply → Forbidden · open ≤2 → Map ≤2 · routine / high-stakes → Default / Elevated.

## Outcomes this shape targets

| Outcome | How this doc helps |
|---------|-------------------|
| Continuity across sessions | Files are source of truth; thin load; one “what’s true now?” home per endeavor |
| Reviewable durable writes | Propose → accept; ask first for irreversible; some paths tools won’t apply |
| Keep context small | Index → ≤2 notes unless the task expands; depth when named |
| Clear stop | Done when / kill when for *this* run |

## Glossary (canonical)

**One home.** Formal names below; plain aliases for operator talk. Do not fork meanings elsewhere — link here.

### Must-know (v1 · ≤20)

| Formal | Plain | Meaning |
|--------|-------|---------|
| **Vault** | notes / vault | Markdown tree — source of truth |
| **Law** | rules / this kit | This doc + write classes + loops + anti-goals |
| **Vault Map** | index | Intent index only — not a live status surface |
| **Hub** | main note | Living home for one endeavor (even when thin) |
| **Leaf** | detail note | Depth under a hub, opened when the task names it |
| **Claim** | task | One named unit of work |
| **Operator** | you / human | Person with accept / abort authority |
| **Session Now** | personal focus | Optional personal operating strip (Active context) |
| **Hub Now** | Now section | Endeavor live strip — hub `## Now` (or pack Live state) |
| **Scratch** | scratch | Ephemeral working buffer — overwrite-OK |
| **Write class** | write gate | Auto · Propose · Human-gate · Forbidden (no “ladder” in plain talk) |
| **Auto** | safe auto | Reversible / protocol micro-ops — tools may proceed |
| **Propose** | draft for accept | Agent drafts; human accepts before apply |
| **Human-gate** | ask first | Irreversible or sensitive — ask before write |
| **Forbidden** | won’t apply | Tools will not apply; not “try carefully” |
| **Domain** | personal / business | Frontmatter `personal` \| `business` only |
| **Attach** | MCP attach | Host load of thin boot views |
| **Map ≤2** | open ≤2 | After the index, open at most two notes unless the task expands |

### Load when the task needs them

| Formal | Plain | Meaning |
|--------|-------|---------|
| **Edge / rel** | typed link | Controlled vocabulary — [`RELATIONSHIP-SCHEMA.md`](./RELATIONSHIP-SCHEMA.md) |
| **Docs Map** | docs index | Intent router for this kit (`docs/Map.md`) — not live |
| **Docs Hub Now** | product Now | Product live strip (`docs/Hub.md` ## Now) |
| **First contact** | first setup | Nothing tracked yet — [`START-GUIDE.md`](./START-GUIDE.md) |
| **Default / Elevated** | routine / high-stakes | Loop modes — [`LOOPS.md`](./LOOPS.md) |

### Deprecated (do not use)

| Old | Use instead |
|-----|-------------|
| Plane L | **Hub Now** / Now section |
| Protocol-proceed | **Auto** |
| Human-required / Never silent | **Human-gate** |

Identity, prefs, typed edges, supersession: load [`RELATIONSHIP-SCHEMA.md`](./RELATIONSHIP-SCHEMA.md) when the task touches them. Scope refusals: [`ANTI-GOALS.md`](./ANTI-GOALS.md).

## What a vault is

- Markdown files under a known tree are the source of truth.
- Agents read this kit + the index before free-form note hunting.
- Product code, chat logs, and tool transcripts are not the vault.

## Domains

| Domain | Placement | Default |
|--------|-----------|---------|
| Personal | Root evergreen, daily, inbox | Default unless task opens business |
| Business | Business subtree only | Prefer two notes + a link over mixing domains in one note |

## Critical path

1. This kit (rules + write gate + loops + out-of-scope)
2. Index — Intent only
3. Now section for the matched endeavor (optional personal focus strip)

Keep the index as an index (not biographies). Grow top-level folders only when amending this shape.

## Retrieval (defaults)

1. Read this kit first when the task changes structure or durable notes.
2. Read the index. Prefer not to re-paste its tables unless useful.
3. Apply domain filter.
4. Prefer: personal focus (if present) → Map Intent → Now section → identity/prefs → task-linked detail notes → recent daily → targeted search.
5. After the index: open ≤2 linked notes unless the task expands.
6. Skip archive and bulk restricted load unless asked.
7. Prefer not to dump the whole vault into context — keeps continuity without chat re-derive.
8. Before new external synthesis, check existing trails; if valid → surface and stop.
9. Closed-trail reopen: new evidence → proposed task edits → human agree. Reopen only with new evidence and explicit agreement.
10. Do not reframe restricted topics to bypass sensitivity marks. Prefer explicit sensitivity over silent expansion.
11. Research trails live in named detail notes. Main note holds a short summary — not full research bodies.

## First setup

New private vaults: follow [`START-GUIDE.md`](./START-GUIDE.md). One living **main note**; its Now section is the usual endeavor live writer. The index is Intent router only. Personal focus is optional.

## Programmatic attach (optional)

Local **stdio** MCP implements the same outcomes on any capable host/model.  
Host matrix + snippets: [`ATTACH-GRID.md`](./ATTACH-GRID.md). Tool contract: [`../mcp/README.md`](../mcp/README.md).

- Thin boot views; Map Intent ≤2; propose → `apply_write(accept)`; Forbidden paths get no apply path.
- Personal focus ≈ `boot(pulse)`; Now section ≈ `status(intent)`.
- `RECOLLECT_ROOT` stays on the human’s machine.

## Write defaults

- Capture → inbox with a dated slug unless the human names another path.
- Daily → dated journal files.
- Evergreen → promote only when durable; one canonical home per fact.
- Required frontmatter on agent writes: `domain`, `type`, `created`.
- Recommended: `updated`, `sensitivity` (`normal` | `personal` | `restricted`).
- Restricted person notes: body banner marking restricted status.
- Prefer link over duplicate. Do not invent facts; mark uncertainty.
- Personal focus: update when focus actually changed (Propose; avoid silent rewrite).

### New detail notes need purpose

New operational detail notes usually ship with:
1. Status: active / parked (or omit)
2. One-sentence purpose
3. Index or main-note entry

Missing any → prefer reject or ask — keeps the index honest.

Research evidence notes also carry: locked question or purpose, verdict, findings with limits, non-claims when material.

### Thin detail notes

On a known-thin detail note: declare thin status, offer leave-thin or bounded-fill. Prefer no silent expansion.

## Live surfaces

| Scope | Formal | Usual writer | Not live |
|-------|--------|--------------|----------|
| Session (optional) | Session Now (personal focus) | Active context strip | Index · chat |
| Endeavor | Hub Now (Now section) | Hub `## Now` / pack Live | Index · personal focus · detail-note bodies |
| Map | — | — | Intent router only |

Prefer one home for the same live fact. Pointers over paste. Open detail notes when the task names them. Research in detail notes; short summary on the main note.

## Weekly loop

On demand: last N days of daily + inbox + personal focus (if present).  
Propose only for filing, promotions, priority refresh.  
Human accepts; apply in a separate step. Skip is allowed.
