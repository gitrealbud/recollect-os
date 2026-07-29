# recollect-os

**Local tools and a small practice for agents that work against a markdown vault.**

recollect-os is an operating practice for an agent’s persistent notes — not a computer operating system. Public docs are shared; your vault stays private.

Aimed at two outcomes: **continuity across sessions** (without rebuilding from chat) and **reviewable durable writes**. Your notes stay on your machine.

**npm:** `recollect-os` · `recollect-os-mcp` — not the unrelated packages `recollect` / `recollect-mcp`.

You can ignore every deeper name and still use the system. The three ideas below are enough.

### Prove it in 60 seconds

[**DEMO.md**](./docs/DEMO.md) — cold machine, copy-paste: smoke check → draft a change → accept it → file appears. Unix and Windows paths documented.

### Three ideas (day one)

1. **Notes on disk are the record** — not the chat  
2. **Load little** — short index, at most two notes  
3. **Nothing permanent until you accept**

Full rules live in [`docs/LAW.md`](./docs/LAW.md) when the work needs them. Defaults below are what usually works; amend when evidence says so.

This system is intentionally opinionated about continuity and reviewable writes. If you only want automatic retrieval into chat, other tools may feel lighter.

### What it kills

| Problem | Approach |
|---------|----------|
| Rebuilding context from chat each time | Notes on disk are the source of truth |
| Loading the whole vault into context | After the short index, open at most two notes |
| Silent permanent edits | The agent drafts the change; you review and accept it before it is written |
| Treating scores or drills as proof | Prefer actual work and clear stop conditions |
| Required embeddings / vector DB / graph product | Not required — notes stay the source of truth |

At runtime: some paths cannot be drafted; a draft never permanently writes without your acceptance; `status` shows one “what’s true now” strip per project.

**Known limit:** tools cannot block free-form host file edits. Permanent path = the agent drafts the change; you accept it before it is written.

Out of scope: [`docs/ANTI-GOALS.md`](./docs/ANTI-GOALS.md).

### In practice

Track work in ordinary markdown. The **short index** lists **active main notes** only (notes that currently answer “what’s true now”). Other notes stay findable by name — they are just off the default list. The agent may surface status and draft changes inside those rails; you still accept permanent writes. More depth opens only when the task needs it. Language: [`docs/TAXONOMY.md`](./docs/TAXONOMY.md).

---

## Start

Get a working vault and see status quickly — then connect an agent.

**Unix / macOS:**

```bash
npx -y recollect-os init ~/recollect
npx -y recollect-os smoke --root ~/recollect --gate
npx -y recollect-os status --root ~/recollect
```

**Windows (documented default — `npx` often misses the bin):**

```bash
npm i -g recollect-os
recollect-os.cmd init %USERPROFILE%\recollect
recollect-os.cmd smoke --root %USERPROFILE%\recollect --gate
recollect-os.cmd status --root %USERPROFILE%\recollect
recollect-os.cmd doctor --root %USERPROFILE%\recollect
```

**What you get:** a markdown vault, a local rule that drafts must be accepted before they become permanent, and a short status view.  
**Next:** [60s DEMO](./docs/DEMO.md) · connect any tool-using host — [attach guide](./docs/ATTACH-GRID.md) (fixtures: [`examples/attach/`](./examples/attach/)). Cursor is one-click — `init` can write its project config automatically.  
**Drafts:** `recollect-os propose <path> --file body.md` · `status` lists pending · `accept <id>` or `accept --latest` (exactly one pending).

Upgrades that change the host config: `recollect-os init --rewire` (does not wipe notes).

<details>
<summary>Contributor / monorepo build</summary>

```bash
cd cli && npm install && npm run build
node dist/src/index.js init ~/recollect
```

</details>

**Rules only (no CLI):** copy the [short agent prompt](./docs/INTELLIGENCE-CARD.md) into your agent rules → name one thing to track → accept a short main note → work from its “what’s true now” section.  
Full onboarding: [`docs/START-GUIDE.md`](./docs/START-GUIDE.md).

---

## Attach & integrate

Connect any tool-using host — see the [attach guide](./docs/ATTACH-GRID.md). Cursor is one-click. Same vault, same draft-then-accept behaviour; the model is interchangeable.

- **Any capable host:** [attach guide](./docs/ATTACH-GRID.md) (Cursor, Grok Build, Claude Desktop/Code, VS Code, Windsurf, Zed, Continue, rules-only, …).
- **Cursor convenience:** `init` writes the project config automatically.
- **No tools:** copy the [short agent prompt](./docs/INTELLIGENCE-CARD.md) into agent rules.

Optional search / compose with other systems: [`docs/INTEGRATIONS.md`](./docs/INTEGRATIONS.md).

Tool list and host details: [`mcp/README.md`](./mcp/README.md).

**Limit:** the draft-then-accept behaviour applies to tool-mediated writes. Hosts can still edit files outside the tools.

---

## How the agent should behave

Three ideas — same as day one:

| Outcome | Practice |
|---------|----------|
| **Notes are the record** | Files on disk, not the chat. After the short index, open at most two notes. |
| **One short note per thing** | That note’s “what’s true now” section answers current status. The index is not live status. |
| **Nothing permanent until you accept** | Permanent changes are drafted; you accept them (or refuse). |

**Separation:** public repo = shared practice + templates. Private vault = your instance and data. No shared state.

### What actually happens

```text
1. Look at the short index
2. Open the note’s “what’s true now” section (at most two notes)
3. Draft any permanent change
4. You accept (or refuse)
```

Do not invent evidence. Do not treat chat as the store of record. Stop when the task is done.

<details>
<summary>Full practice (power users)</summary>

| Outcome | Default practice |
|---------|------------------|
| **Know the current shape** | Skim [`docs/LAW.md`](./docs/LAW.md) before creating or rewriting notes. |
| **One answer to “what’s true now?”** | That note’s status section; optional personal focus; don’t copy the same fact twice. |
| **Keep context small** | After the index, open at most two notes unless the task expands. |
| **Reuse prior work** | Before new external research, check for an existing trail. If valid → surface and stop. |
| **Separate evidence from advice** | Evidence note first; short summary on the main note only after a clear evaluate step — [`docs/RESEARCH-AND-ANALYSIS.md`](./docs/RESEARCH-AND-ANALYSIS.md). |
| **Reviewable permanent edits** | Some writes are safe to auto · drafts need accept · irreversible asks first · some paths tools won’t apply — [`docs/WRITE-CLASSES.md`](./docs/WRITE-CLASSES.md). |
| **Match process to stakes** | Routine vs high-stakes — [`docs/LOOPS.md`](./docs/LOOPS.md). |
| **Know when to stop** | Name done conditions / stop conditions for *this* run before multi-step work. |
| **Out of scope** | [`docs/ANTI-GOALS.md`](./docs/ANTI-GOALS.md). |

Full decision tree: [`docs/LOOPS.md`](./docs/LOOPS.md) · formal names: [`docs/LAW.md`](./docs/LAW.md).

</details>

**Docs index / product status (maintainers):** [`docs/Map.md`](./docs/Map.md) · [`docs/Hub.md`](./docs/Hub.md).

---

## What’s in this repo

```text
README.md                 ← overview + one-command start
docs/DEMO.md              ← 60-second demonstration
docs/Map.md · Hub.md      ← docs index + product status
docs/START-GUIDE.md       ← onboarding
docs/ATTACH-GRID.md       ← host attach
docs/INTEGRATIONS.md      ← optional integrations
docs/INTELLIGENCE-CARD.md ← short agent prompt (copy into rules)
docs/LAW.md + related     ← full rules (open when needed)
docs/TAXONOMY.md          ← plain-first language reference
cli/ · mcp/ · templates/ · examples/
LICENSE
```

Further core tool expansion waits on real usage evidence. Optional integrations: [`docs/INTEGRATIONS.md`](./docs/INTEGRATIONS.md). Publish: [`docs/PUBLISH.md`](./docs/PUBLISH.md).

---

## License

MIT — see [LICENSE](./LICENSE).
