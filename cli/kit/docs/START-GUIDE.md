# Start Guide

**Start:** Onboarding starts by default unless you already finished it or switched to normal work.  
**End:** Only you end onboarding.

Recollect is a small practice and local tools for an AI working in your markdown notes. It aims at **continuity across sessions** and **reviewable permanent writes**—so you are not rebuilding from chat every time.

It is not fully automatic memory. You accept permanent changes; the assistant loads little and asks before permanent writes when the tools are attached.

### How deep to go

| When | Open |
|------|------|
| **Day one** | The three ideas below — nothing else |
| **When you need more** | The rest of this guide |
| **Full rules (optional)** | [`LAW.md`](./LAW.md) — only when the work actually needs them |

You only need three ideas today. Everything else opens only when the work actually needs it.

---

## Day one

1. **Notes on disk are the record** — not the chat.  
2. **Load little** — short index, at most two notes.  
3. **Nothing permanent until you accept** — the assistant drafts; you approve.

### Active vs archived (plain)

| Kind | Meaning |
|------|---------|
| **Active main note** | Currently answers “what’s true now” for something you care about — it may appear on the **short index** |
| **Archived note** | Still in your notes, findable by name — **not** on the short index |

You choose what is active. The assistant may suggest; durable changes wait for your accept. No automatic hiding.

---

## When to open more

Stay on day one until a real need shows up. Then open only the matching depth:

| Situation | What to do |
|-----------|------------|
| “What’s true now?” | Short index (active main notes only) → that note’s **what’s true now** section (at most two notes) |
| Saving a real change (with tools) | Assistant drafts → you accept |
| Needs research or careful analysis | Open the research guide only if needed |
| About you, preferences, or sensitive deletes | Ask you first |
| Argument about the rules | Full rules ([`LAW.md`](./LAW.md)) — one short reason, not a lecture |
| Language / wording | [`TAXONOMY.md`](./TAXONOMY.md) |

If something is refused, one short reason and one link—not a lecture.

---

## Install

**Unix:**

```bash
npx -y recollect-os init ~/recollect
npx -y recollect-os smoke --root ~/recollect --gate
```

**Windows (recommended):**

```bash
npm i -g recollect-os
recollect-os.cmd init %USERPROFILE%\recollect
recollect-os.cmd smoke --root %USERPROFILE%\recollect --gate
```

Connect your AI host: [`ATTACH-GRID.md`](./ATTACH-GRID.md) — any capable host/model; Cursor is one-click. Fixtures: [`examples/attach/`](../examples/attach/).

**Known limit:** tools cannot block free-form host edits. Permanent path = propose → accept.

| Path | Do |
|------|----|
| **Any MCP host** | Grid has the snippet (Grok Build, Claude, VS Code, Windsurf, **Antigravity**, …) |
| **Cursor** | `init` already wrote the wire — open the vault folder |
| **No tools yet** | Paste [`INTELLIGENCE-CARD.md`](./INTELLIGENCE-CARD.md); approve writes yourself |

Then use the path below.

---

## First notes (onboarding)

1. Name **one** thing to track (or use what you already said).  
2. At most one short follow-up question.  
3. Propose one short note: title, one-line summary, what’s true now + next step.  
4. Write it only after you accept.  
5. More items the same way until you say you’re done.

You end onboarding by saying you’re done, that’s enough, stop onboarding, or by moving on to normal work.

Don’t explain indexes, detail notes, or research process unless you ask.

---

## After the first note

| Need | Do |
|------|-----|
| Find it later | Short index → that note’s **what’s true now** section |
| Stop unasked edits | Connect tools → propose → accept |
| See pending drafts | `recollect-os status` → `accept <id>` or `accept --latest` (exactly one) · or the host’s apply step |
| More depth | One detail note when the task actually needs it |
| Life vs work separation | Full rules when that comes up |

Default after onboarding: short index → **what’s true now** only. Don’t reload this guide every session.

---

## Defaults (usually)

- Accept before permanent writes (when tools mediate them).  
- Short notes can be finished notes.  
- One place per fact keeps “what’s true now?” answerable.  
- More detail only when you ask or the task requires it.

| Kind of thing | Where |
|---------------|--------|
| Disposable | Skip or Inbox |
| Worth seeing again | Short main note |
| Needs a long body later | Detail note, only when named |

**You** choose what to track and what to accept.  
**Assistant** keeps structure light and proposes before saving.

---

## More docs when needed

| Need | File |
|------|------|
| Day-to-day after first note | `WORKING-GUIDE.md` |
| Research / analysis | `RESEARCH-AND-ANALYSIS.md` |
| Full rules (optional) | [`LAW.md`](./LAW.md) |
| Write detail / loops / scope | `WRITE-CLASSES.md` · `LOOPS.md` · `ANTI-GOALS.md` |
| Identity / links | `RELATIONSHIP-SCHEMA.md` |
| Tools / hosts | `ATTACH-GRID.md` · `mcp/README.md` |
