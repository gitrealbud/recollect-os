# Rules

This kit is small: **markdown notes on disk**, agents that **load little**, and **draft → you accept** before durable edits stick. That is the whole idea.

Filename `LAW.md` is historical. This is not a constitution and not a control plane — just rules for agents using the kit.

Change this file when tools or practice change, not to sound more formal.

---

## What to do (plain)

| Topic | Rule |
|--------|------|
| **Writes** | Draft durable change → human accepts. Safe micro-ops may proceed. Some paths tools refuse. Detail: [`WRITE-CLASSES.md`](./WRITE-CLASSES.md). |
| **What’s current** | Personal focus · project **“what’s true now”** · **short index** (the index is not live status). Don’t keep the same live fact in two places. |
| **This task** | Only a small open set for **this task**. Open more only when needed. Don’t browse the whole vault “just in case.” |
| **Start of session** | Default = one small working-set load (`boot` / `pack=overlay`). Focus-only = `pulse`. Other packs are advanced. Inventory: [`../mcp/README.md`](../mcp/README.md). |
| **Connect** | Prefer tools on the machine that holds the notes. Remote may draft; accept stays local. Mirrors are browse-only. |

**Goals in one line:** files are the record · durable edits are reviewable · context stays small · stop when the task is done.

---

## Labels tools use (optional)

Tool code and MCP need short stable labels so docs and implementations don’t drift. **You do not need this table to use the kit.** Plain speech above is enough for day one.

| Tool label | Plain meaning |
|------------|----------------|
| Vault | notes under a root folder |
| Map / short index | small list of main notes — not live status |
| Hub / main note | home note for one project or area |
| Leaf / detail note | deeper note under a main note |
| Claim | this task / this turn’s work |
| Operator | you |
| Session Now / personal focus | optional personal “what I’m on” strip |
| Hub Now | “what’s true now” on a main note |
| Active Overlay / working set | the small set open for this task (not a second status home) |
| Scratch | throwaway buffer |
| Dual-home | same live fact written in two places — don’t |
| Auto | safe micro-ops tools may do |
| Propose | draft for accept |
| Human-gate | ask first |
| Forbidden | tools won’t apply |
| Domain | `personal` or `business` only |
| Attach / boot pack | how the agent connects and what thin slice it loads |
| Map ≤2 | after the index, open at most two notes unless the task expands |
| Typed links (optional) | controlled `rel` only: `owns` · `active_on` · `constrained_by` · `prefers` · `supersedes` |

If you extend the kit, **define a new tool label in one place** (here or the MCP contract) so prompts don’t invent a second meaning. That is housekeeping, not a speech ideology.

**Older aliases** (for implementers cleaning drift): Protocol-proceed → Auto · Human-required → ask first · “trust ladder” → write gate · Plane L → “what’s true now” on a main note · treating the working set as live status → don’t.

Identity / prefs: durable Me and Preferences are ask-first. Examples: [`WRITE-CLASSES.md`](./WRITE-CLASSES.md).

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
| **Durable / live truth** | Evergreen, endeavor Now, personal focus priorities | draft → accept · ask first when sensitive |

Examples and friction detail: [`WRITE-CLASSES.md`](./WRITE-CLASSES.md). Do not re-essay the class table here.

**Capture hold:** Inbox (or equivalent hold pen) may sit until a hygiene pass — promote is not required the same session.

---

## What to load first

1. This kit (rules + write gate) when structure or durable writes change  
2. **Working set** for this task (compose or load the small open set)  
3. Index and endeavor “what’s true now” **inside** that set  

Keep the index as an index (not biographies). No new top-level vault folders without amending this shape.

---

## Retrieval (defaults)

**Plain:** open only this turn’s small set; expand when the task names more.

1. **Compose or load the working set first** (formal: Active Overlay). Nothing outside it is hot unless a new set is composed under the claim.  
2. This law file is always allowed for write-class / path rules — not a free pass to dump the vault.  
3. Apply domain filter.  
4. **Default working set** (zero typing): personal focus (if present) + ≤2 short-index hits + at most one project “what’s true now”.  
5. **Expanded working set** (task-named only): default + ≤2 detail notes the task names.  
6. Prefer sections over whole megafiles; respect size caps when the host enforces them.  
7. Skip archive and bulk restricted load unless asked.  
8. Prefer not to dump the whole vault into context.  
9. Before new external synthesis, check existing trails; if valid → surface and stop.  
10. Closed-trail reopen: new evidence → draft task edits → human agree.  
11. Do not reframe restricted topics to bypass sensitivity marks.  
12. Research trails live in named detail notes; main note holds a short summary — not full research bodies.  

**Old habit:** browse the whole tree. **Better:** open only a small working set for this task (a fixed recipe is fine — that is not open vault browsing).

When MCP is available: **routine** = default working-set load (`boot` / `overlay`); **focus-only** = `pulse`. Full pack inventory: [`../mcp/README.md`](../mcp/README.md).

---

## First setup

New private vaults: [`START-GUIDE.md`](./START-GUIDE.md). One living **main note**; its “what’s true now” strip is the usual endeavor live writer. The index is Intent router only. Personal focus is optional.

---

## Programmatic attach (optional)

**Plain:** tools load a thin view of the vault — not the whole tree. Routine load = working set; focus-only when that is all you need.

Local **stdio** MCP (and optional HTTP trial) implement the same vault rules.  
Hosts: [`ATTACH.md`](./ATTACH.md). Tool contract and pack inventory: [`../mcp/README.md`](../mcp/README.md).

| Rule | Detail |
|------|--------|
| Thin views | Named boot views over fixed paths — not a vault dump |
| Prefer | **Routine** working-set load (`overlay` / default) · **focus-only** (`pulse`) · who-needed (`attach`) · avoid `full` |
| Writes | Draft → `apply_write(accept)`; refuse paths tools will not apply |
| Live glance | Personal focus ≈ `pulse` / status without intent; project Now ≈ `status(intent)` |
| Away from machine | May **draft** remote; **accept stays on the vault machine** |
| Root | `RECOLLECT_ROOT` (or equivalent) stays under human control |

Do **not** restate the full pack table here — one inventory home (mcp README).

---

## Write defaults

- Capture → inbox with a dated slug unless the human names another path.  
- Daily → dated journal files.  
- Evergreen → promote only when durable; **one canonical home per fact**.  
- Required frontmatter on agent writes: `domain`, `type`, `created`.  
- Recommended: `updated`, `sensitivity` (`normal` | `personal` | `restricted`).  
- Restricted person notes: body banner marking restricted status.  
- Prefer link over duplicate. Do not invent facts; mark uncertainty.  
- Personal focus: update when focus actually changed (**Propose**; no silent rewrite).  
- Class meanings and examples: [`WRITE-CLASSES.md`](./WRITE-CLASSES.md).

### New detail notes need purpose

1. Status: active / parked (or omit)  
2. One-sentence purpose  
3. Index or main-note entry  

Missing any → prefer reject or ask.

Research evidence notes also carry: locked question or purpose, verdict, findings with limits, non-claims when material.

### Thin detail notes

Declare thin status; offer leave-thin or bounded-fill. Prefer no silent expansion.

---

## Where current status lives

Three jobs — personal focus · project “what’s true now” · short index (never live status). Same live fact → one writer only.

| Job | Tool label (optional) | Who updates live status | Not live |
|-----|----------------------|-------------------------|----------|
| **Personal focus** | Session Now | Active context strip (optional) | Index · chat · working set body |
| **Project “what’s true now”** | Hub Now | Main-note `## Now` / pack Live | Index · personal focus · detail bodies · working set body |
| **This turn’s hot set** | working set | **None** (derived view only) | Must not hold a second copy of live facts |
| **Short index** | Map | — | Router only — never live status |

**One place for a live fact.** Prefer pointers over paste. Open detail notes when the task names them.

---

## Weekly loop

On demand: last N days of daily + inbox + personal focus (if present).  
Inbox is a **hold pen** — triage, not “clear same day at all costs.”  
Propose only for filing, promotions, priority refresh.  
Human accepts; apply in a separate step. Skip is allowed.
