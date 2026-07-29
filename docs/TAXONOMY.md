# Taxonomy — plain-first reference

**Purpose:** Single source of truth for language used on public faces and by agents.  
**Rule:** Public surfaces and agent prompts use Layer 1 only. Formal names live in LAW.md and deeper docs.  
**Updated:** 2026-07-29 — active / archived notes · short-index rule · agent may (inside the rails).

## Layer 1 — Public + Agent surfaces (required)

Use these exact phrases. Do not invent alternatives.

| Concept | Canonical plain language |
|---------|--------------------------|
| Source of truth | Notes on disk are the record — not the chat |
| Context limit | Load little — short index, at most two notes |
| Write safety | The agent drafts the change; you accept it before it is written |
| Live status | “what’s true now” section |
| Main note | main note |
| Detail note | detail note |
| Short index | short index — the default list of **active main notes** only |
| Active note | a note that currently answers “what’s true now” for something you care about |
| Archived note | still in your notes, findable by name, but **not** on the short index |
| Config (Cursor) | project config / Cursor config |
| Optional docs | optional integrations |
| Stop conditions | done conditions / stop conditions |
| Stakes | routine / high-stakes |
| Connect tools | connect tools / MCP attach |
| Membrane | Shared docs are public; this vault is private |
| Free-form edits | Tools cannot block free-form host file edits — that is outside the accepted write path |
| Unit of work | one task / this turn’s work |
| Sensitive notes | private or sensitive notes — do not export or paste into public drafts |

### Short-index rule (Layer 1)

1. The **short index** lists **active main notes** only.  
2. **Archived notes** stay in the system and can be opened when named — they do not appear in the default list.  
3. You decide what is active vs archived (the agent may suggest a change; you accept any durable move).  
4. No automatic hiding, no automatic cleanup, no background rewrite.

### What the agent may do (Layer 1 — still human-accept)

Because load limits and write safety already hold, the agent **may**:

| May | Bound |
|-----|--------|
| Open the right main note and show “what’s true now” when the task clearly points at one thing | Only when the short index (or status) makes the target obvious; otherwise ask |
| Say when a “what’s true now” section looks out of date | Flag in the conversation first; durable fix = draft on **that one note** only |
| Draft the next sensible change when status clearly implies it | Still waits for your accept |
| Refuse loading many notes at once, or writing the same fact in two places | Offer the constrained alternative immediately |

The agent **may not**: permanent writes without accept · silent archive · invent automatic memory or graphs · dump the whole notes set.

## Layer 2 — Formal (LAW.md and deeper only)

These names are valid inside the full rules kit and **private** vault law. Never put them on README, START-GUIDE, Intelligence Card, or DEMO first-contact text.

| Formal | Plain equivalent |
|--------|------------------|
| Vault | notes / vault |
| Law | rules / this kit |
| Vault Map | short index / index |
| Hub | main note |
| Leaf | detail note |
| Claim | task / unit of work |
| Claim pack / Turn | this turn’s allowed files / one unit of work |
| Operator | you / human |
| Session Now | personal focus |
| Hub Now | “what’s true now” section |
| Scratch | scratch / temporary working buffer |
| Write class | write gate |
| Auto | safe auto |
| Propose | draft (needs accept) |
| Human-gate | ask first |
| Forbidden | not allowed by tools / won’t apply |
| Map ≤2 | open at most two notes |
| Default / Elevated | routine / high-stakes |
| Attach | connect tools / MCP attach |
| Domain | personal / business (note kind) |
| Restricted / sensitivity | private or sensitive notes |
| Dual-home | same live fact written in two places (don’t) |
| Boot (pulse / attach / …) | start pack / dialed-in load |
| Soft-Gate | event-gated integrity check — **private / research only; never public face** |
| Plane L | endeavor live-strip architecture — **DensityForge pack only; not a synonym for “what’s true now”** |
| Phase L | continuous continuity (private calibration) — never invent for ceremony |

## Layer 3 — Tool identifiers (do not rewrite)

These are real CLI / MCP names. Keep them as-is.

- `propose`
- `accept`
- `smoke --gate`
- `status`
- `boot`
- `resolve_intent`
- `read_note`
- `capture_inbox`
- `propose_write`
- `apply_write`
- `proposal_id`
- File names (`LAW.md`, `WRITE-CLASSES.md`, `TAXONOMY.md`, etc.)

## Deprecated surface language (remove on sight)

| Old surface term | Replace with |
|------------------|--------------|
| the gate | (describe the behaviour instead) |
| bypass the gate | free-form edits can skip draft/accept |
| propose → accept (as named protocol) | the agent drafts the change; you accept it before it is written |
| draft-then-accept rule / path | the agent drafts the change; you accept it before it is written |
| project wire / host wire | project config / Cursor config |
| side-cars | optional integrations |
| evaluate pass | evaluate step |
| done when / kill when (as slogan) | done conditions / stop conditions |
| constraint loop | 60-second demonstration / demonstration loop |
| Now section (capitalised as proper noun) | “what’s true now” section |
| trust ladder / write ladder (everyday) | write classes / write gate |
| Plane L (everyday synonym for live status) | “what’s true now” / Hub Now (formal private) |
| memory OS / bare “pack” (everyday boot) | notes practice / this kit · named pack only when needed |
| cold storage / inactive (as vague status) | archived note (off the short index) or detail note not in active use |
| automatic decay / auto-archive | (do not use — you mark active vs archived) |

## Enforcement

- README, START-GUIDE, INTELLIGENCE-CARD, DEMO → Layer 1 only.
- LAW.md, WRITE-CLASSES, LOOPS, and deeper docs may use Layer 2.
- **Private vault law** may use Layer 2; agent **explanations** to the human should still prefer Layer 1.
- Soft-Gate · Phase L · scoreboards · trajectories → private only; never public face or portfolio export.
- Agents: explain in Layer 1; call tools with Layer 3 names.
- When a new term appears on a public face, either map it here or remove it.

## Audit pointer

Private vault scan + jargon backlog (2026-07-29): Recollect vault `Grok/Taxonomy-Vault-Audit-2026-07-29` (not shipped in this public tree).
