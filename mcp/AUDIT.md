# recollect-mcp — attach audit

Internal dogfood + live-fence log for the stdio adapter.  
**Not** a vault dump. No private metrics or life content.

**Status:** MCP package **0.4.5-overlay** · live fence Phase 4 criteria closed 2026-07-29.  
**Live fence SoT:** `cli/test/gate-doctor.test.ts` (`live-fence L1-L3 under npm test`) — not a standalone script.

## Lived failure modes

| Mode | Gate / fix |
|------|------------|
| Host edited product Now free-form | Free-form host edits sit outside tool accept path — Card + `doctor --git` |
| Accept after TTL | `PROPOSAL_EXPIRED` → re-propose |
| Forbidden Secrets propose | No id — expected (`smoke --gate`) |
| Multiple pending + `--latest` | Pass explicit id from `status` |
| Windows `npx` misses bin | `npm i -g` → `recollect-os.cmd` |
| Dual MCP catalog (thin `user-recollect` vs full `recollect`) | Enable full server for `propose_write`; CLI `accept` still works |
| `doctor`/`status` failed private vault (no `docs/LAW.md`) | **Fixed 0.3.6** — private law = `RECOLLECT.md` |

Add rows from real use (no PII). **No L5** until evidence says current tools are insufficient.

## Live fence (Phase 4)

| ID | Claim | Outcome |
|----|-------|---------|
| L1 | propose → apply thin hub | PASS — no pre-accept write |
| L2 | status(intent) → product Now / hub ## Now | PASS |
| L3 | Forbidden + capture + accept:false | PASS |

Closed runtime criteria: [`docs/archive/RUNTIME-PLAN.md`](../docs/archive/RUNTIME-PLAN.md).
