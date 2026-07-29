# Runtime criteria (closed)

**Not cold-load.** Live product status: [`../Hub.md`](../Hub.md) ## Now. Thin status stub: [`../RUNTIME-PLAN.md`](../RUNTIME-PLAN.md).  
Budgets enforced in code: `mcp/src/budgets.ts` (+ tests under `npm test`).

Closed **2026-07-29**. Do not treat this file as a living plan.

## Binary criteria (historical label: elite slice)

Call the runtime slice closed only when **all** are true:

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `init` on empty dir → skeleton + Cursor wire + smoke green | ✅ |
| 2 | Init idempotent; `--rewire` refreshes wire only | ✅ |
| 3 | Smoke asserts root · law docs · `boot(attach)` in-process | ✅ |
| 4 | `status` ≤ Session Now + at most one Hub Now; never vault dump | ✅ |
| 5 | Propose/Human-gate need accept; Forbidden always refuses | ✅ |
| 6 | CLI `status` shows Now + health line | ✅ |
| 7 | Public mcp contract amended same turn as private twin when tools change | ✅ |
| 8 | Lived ≥3 claims before L5 | ✅ 2026-07-29 |
| 9 | Non-goals held (no auto-wire farm · no L5 without evidence · no FS-lock theater) | ✅ |

## Budgets (SoT in code)

| Constant | Value |
|----------|-------|
| Attach pack chars | 12_000 |
| Hub Now chars | 2_000 |
| File read chars | 48_000 |
| Proposal TTL | 24h |

Hardening after close (tests · doctor · audit · CI) does **not** reopen this plan — track in Hub Now.
