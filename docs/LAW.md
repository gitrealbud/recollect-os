# Rules

This kit is small: **markdown notes on disk**, agents that **load little**, and **draft → you accept** before durable edits stick.

The filename `LAW.md` is historical. These are ordinary rules for agents and tools—not a second language system.

Change this file when tools or practice change.

---

## What to do

| Topic | Rule |
|--------|------|
| **Writes** | Draft durable change → human accepts. Safe micro-ops may proceed. Some paths tools refuse. Detail: [`WRITE-CLASSES.md`](./WRITE-CLASSES.md). |
| **What’s current** | Personal focus · project **“what’s true now”** · **short index** (the index is not live status). Don’t keep the same live fact in two places. |
| **This task** | Only a small open set for **this task**. Open more only when needed. Don’t browse the whole vault “just in case.” |
| **Start of session** | Default = one small working-set load (`boot` with pack `overlay`). Focus-only = pack `pulse`. Other packs are advanced. Inventory: [`../mcp/README.md`](../mcp/README.md). |
| **Connect** | Prefer tools on the machine that holds the notes. Remote may draft; accept stays local. Mirrors are browse-only. |

**Goals:** files are the record · durable edits are reviewable · context stays small · stop when the task is done.

Identity and Preferences: ask first before durable edits. Examples: [`WRITE-CLASSES.md`](./WRITE-CLASSES.md).

---

## What a vault is

- Markdown under a known root is the source of truth.
- Product code, chat logs, and tool transcripts are **not** the vault.
- Agents load a **working set** — not free-form whole-tree hunting.

## Domains

| Domain | Placement | Default |
|--------|-----------|---------|
| Personal | Root evergreen, daily, inbox | Default unless the task opens business |
| Business | Business subtree only | Prefer two notes + a link over mixing domains in one note |

## Scratch vs durable notes

| Kind | Holds | Write stance |
|------|--------|--------------|
| **Scratch / reversible** | Working buffers, hold-pen capture, safe micro-ops | tools may proceed when safe |
| **Durable notes** | Evergreen, project “what’s true now,” personal focus priorities | draft → accept · ask first when sensitive |

**Capture hold:** Inbox may sit until a hygiene pass — promote is not required the same session.

---

## What to load first

1. This kit (rules + write gate) when structure or durable writes change  
2. **Working set** for this task  
3. Short index and project “what’s true now” **inside** that set  

Keep the index as an index (not biographies). No new top-level vault folders without amending this shape.

---

## Retrieval

Open only this turn’s small set; expand when the task names more.

1. Load the working set first. Nothing outside it is hot unless you rebuild the set for the task.  
2. This rules file is always allowed for write/path rules — not a free pass to dump the vault.  
3. Apply domain filter.  
4. **Default working set:** personal focus (if present) + ≤2 short-index hits + at most one project “what’s true now”.  
5. **Expanded working set:** default + ≤2 detail notes the task names.  
6. Prefer sections over whole megafiles; respect size caps when the host enforces them.  
7. Skip archive and bulk restricted load unless asked.  
8. Prefer not to dump the whole vault into context.  
9. Before new external synthesis, check existing trails; if valid → surface and stop.  
10. Closed-trail reopen: new evidence → draft task edits → human agree.  
11. Do not reframe restricted topics to bypass sensitivity marks.  
12. Research trails live in named detail notes; main note holds a short summary.

**Better habit:** open only a small working set for this task (a fixed recipe is fine).

When MCP is available: **routine** = working-set load (`boot` / `overlay`); **focus-only** = `pulse`. Pack list: [`../mcp/README.md`](../mcp/README.md).

---

## First setup

New private vaults: [`START-GUIDE.md`](./START-GUIDE.md). One living **main note**; its “what’s true now” strip is the usual project live writer. The short index only routes. Personal focus is optional.

---

## Connect tools (optional)

Tools load a **thin view** of the vault — not the whole tree.

Local **stdio** MCP (and optional HTTP trial) follow these same rules.  
Hosts: [`ATTACH.md`](./ATTACH.md). Tool contract and pack list: [`../mcp/README.md`](../mcp/README.md).

| Rule | Detail |
|------|--------|
| Thin views | Named boot packs over fixed paths — not a vault dump |
| Prefer | Working-set load (`overlay`) · focus-only (`pulse`) · who-needed (`attach`) · avoid `full` |
| Writes | Draft → `apply_write(accept)`; refuse paths tools will not apply |
| Live glance | Personal focus ≈ `pulse` / status without intent; project now ≈ `status(intent)` |
| Away from machine | May **draft** remote; **accept stays on the vault machine** |
| Root | `RECOLLECT_ROOT` (or equivalent) stays under human control |

Do **not** restate the full pack table here — one inventory home (mcp README).

---

## Write defaults

- Capture → inbox with a dated slug unless the human names another path.  
- Daily → dated journal files.  
- Evergreen → promote only when durable; **one home per fact**.  
- Required frontmatter on agent writes: `domain`, `type`, `created`.  
- Recommended: `updated`, `sensitivity` (`normal` | `personal` | `restricted`).  
- Restricted person notes: body banner marking restricted status.  
- Prefer link over duplicate. Do not invent facts; mark uncertainty.  
- Personal focus: update when focus actually changed (draft → accept; no silent rewrite).  
- Write gate detail: [`WRITE-CLASSES.md`](./WRITE-CLASSES.md).

### New detail notes need purpose

1. Status: active / parked (or omit)  
2. One-sentence purpose  
3. Index or main-note entry  

Missing any → prefer reject or ask.

Research evidence notes also carry: locked question or purpose, verdict, findings with limits, non-claims when material.

### Thin detail notes

Declare thin status; offer leave-thin or bounded-fill. Prefer no silent expansion.

### Typed links (optional)

If frontmatter uses typed links, only these five words:  
`owns` · `active_on` · `constrained_by` · `prefers` · `supersedes`.  
No free-string relationship labels.

---

## Where current status lives

Three jobs — personal focus · project “what’s true now” · short index (never live status). Same live fact → one writer only.

| Job | Who updates live status | Not live |
|-----|-------------------------|----------|
| **Personal focus** | Optional strip in rules / Active context | Index · chat · working set body |
| **Project “what’s true now”** | Main-note `## Now` (or pack live strip) | Index · personal focus · detail bodies · working set body |
| **This turn’s hot set** | **None** (derived view only) | Must not hold a second copy of live facts |
| **Short index** | — | Router only — never live status |

**One place for a live fact.** Prefer pointers over paste. Open detail notes when the task names them.

---

## Weekly loop

On demand: last N days of daily + inbox + personal focus (if present).  
Inbox is a **hold pen** — triage, not “clear same day at all costs.”  
Draft filing, promotions, and priority refresh for accept.  
Human accepts; apply in a separate step. Skip is allowed.
