# Working Guide

**What this is for:** day-to-day work after the first main note exists. Same plain voice as [`START-GUIDE.md`](./START-GUIDE.md).

Deeper rules when the task needs them: [`LAW.md`](./LAW.md) · [`WRITE-CLASSES.md`](./WRITE-CLASSES.md) · [`LOOPS.md`](./LOOPS.md) · [`RESEARCH-AND-ANALYSIS.md`](./RESEARCH-AND-ANALYSIS.md) · [`ANTI-GOALS.md`](./ANTI-GOALS.md).

Aimed at continuity + reviewable writes. Defaults below; change them when the task needs it.

---

## What’s true now

Default load: **short index (active main notes only) → main note → its “what’s true now” section only.**

| Holds | Usually not |
|-------|-------------|
| What is true now (short) | Long research bodies |
| One next action | The same fact copied into a second home |
| Live status for this project | Treating the index as the live status body |

**Active vs archived:** the short index only lists main notes that currently answer “what’s true now.” Everything else can still be opened by name — it just stays off the default list. You mark the change; the assistant may suggest.

Flow: read → act or update “what’s true now” → stop when the unit is done → keep durable crumbs only when they should last.

With tools: prefer `status` (optionally with intent); durable edits = draft → you accept → apply.

### What the assistant may do (you still accept)

- Show current status from the obvious main note when the task clearly points at one thing  
- Flag a stale “what’s true now” section in chat (durable fix = draft on that note only)  
- Draft the next sensible change when status clearly implies it  
- Refuse bulk load or the same fact in two places — and offer the small alternative  

---

## Thin vs depth

Short standing summary, done/stop lines, one-line decisions, index rows, and “what’s true now” sections can be **complete** as thin notes. Prefer not to invent filler.

Open a **detail note** only when you ask or the task needs a body. Before creating one: one-sentence purpose · link from the short index or main note · say whether it is an active main note or archived / supporting detail — missing any → prefer reject or ask.

One home per fact. The main note keeps a pointer + one-line verdict, not a second full body. Ordinary markdown links are enough; open [`RELATIONSHIP-SCHEMA.md`](./RELATIONSHIP-SCHEMA.md) only when identity or preferences need typed links.

Language reference: [`TAXONOMY.md`](./TAXONOMY.md).

---

## Common flows

| Need | Do |
|------|-----|
| Track something new | START thin main note (active) |
| Quick idea | Inbox (`capture_inbox` when tools are on) |
| What’s true now? | Short index → “what’s true now” (`status`+intent when tools are on) |
| Update status | Draft update to “what’s true now”; you accept; one next action |
| Go deeper | One named detail note + link |
| Research / analyze | Evidence note first; short main-note summary only after a clear evaluate step — [`RESEARCH-AND-ANALYSIS.md`](./RESEARCH-AND-ANALYSIS.md) |
| Success / abort | Done / stop lines on the main note |
| Context lost | Short index → “what’s true now” |
| Park something | Mark archived (off short index); still findable by name |

---

## Stop conditions (for this run)

```text
Done: <checkable success>
Stop: <checkable abort for this run>
Hold: <optional park>
```

Prefer exits you can check quickly. Strong default stop: you can’t name one thing to track, or you demand whole-life ingest on day one.

After the first main note — only when useful: set done/kill → refresh Now → first research detail note if needed. If Now + next action are clear, do that.
