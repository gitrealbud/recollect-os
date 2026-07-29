# Out of scope and strong defaults

When a request pulls off-target, name the outcome risk and stop or redirect.  
This list is the **current** scope fence — amend when the product evolves.

## Why it exists

Core stays small so continuity and reviewable writes stay easy: no *required* search/embeddings stack, no background agent as default, no separate graph DB as authority.

Optional tools (search, FTS, embeddings-as-finder, more hosts) are fine — [`INTEGRATIONS.md`](./INTEGRATIONS.md). Keep **notes** (especially each project’s Now section) as authority when those tools are present.

## Out of scope for core (product)

| Does not do | Because |
|-------------|---------|
| Keep private vault data out of the public kit | Public surface stays practice + templates |
| Always-on or fully automatic memory products | You own files and accept writes |
| Always-on agent as the default product shape | Continuous unattended writes fight the gate |
| Embeddings / vector DB as a **requirement** | Optional finder only — INTEGRATIONS |
| Separate graph database as source of truth | Markdown + explicit links |
| Value claim with no accept step and no write gate | Different design |

## Tool / agent gates (runtime)

These protect reviewable writes and thin load. The tools enforce several directly.

| Gate | Outcome |
|------|---------|
| No whole-vault dump into context | Continuity without context blowups |
| MCP is not whole-vault export | Attach stays within load defaults |
| Propose ≠ apply (no bulk apply without accept) | Durable edits stay reviewable |
| Restricted topics stay marked | Do not reframe restricted topics to bypass sensitivity marks |
| Search/embedding hits ≠ live truth | Confirm in the note; the project’s Now section wins for status |
| Only real, visible checks | Do not treat fake or invisible quality-gate passes as proof |
| Ad hoc relationship labels | Controlled typed links — RELATIONSHIP-SCHEMA |
| Secrets / credentials / restricted detail in public promote | Membrane intact |
| Auto-sync private ↔ public | Promote is manual and scrubbed |
| Audit / debug logs with vault body content | `.recollect/audit.jsonl` is metadata-only; never public promote |

## Strong defaults (override with an explicit task)

Usually better to follow; override when you name a different task.

| Default | Why it usually helps |
|---------|----------------------|
| Start with **one** living main note, not full life ingest | Value before structure |
| Open **detail notes the task names**, not “every note to be safe” | Keep context small |
| Leave thin; do not invent detail to fill empty shells | Honesty over empty structure |
| One live “now” home per fact | Answerable status |
| Reopen closed trails only with new evidence and explicit agreement | Don’t re-derive settled work |
| Clear exits over counting gates | Process matches write size |
| Prefer real work over simulated exercises as evidence | Evidence over empty exercises |
| Ask first for irreversible changes | Reviewable high-stakes edits |
| Don’t publish private metrics / run logs / provider matrices | Private stays private |
| Don’t submodule private instance into public | No shared state by another name |

## Reminder

**Public** = shared practice + empty templates (evolves).  
**Private** = your instance and data.  
**Optional integrations** = finders and host wiring — not a second source of truth.
