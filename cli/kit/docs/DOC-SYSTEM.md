# Docs system

How to navigate and amend this kit without dumping all of `docs/` into context.

Same pattern as a vault (index → status strip → at most two notes). Meta for maintainers — strangers start at README / START.

| Vault pattern | Docs tree |
|---------------|-----------|
| Vault Map (Intent only) | [`Map.md`](./Map.md) |
| Hub + Hub Now | [`Hub.md`](./Hub.md) |
| One home per fact | Topic SoT table below |
| Map ≤2 | After Docs Map, open ≤2 leaves unless claim expands |
| Claim-gated depth | R&A · SCHEMA · archive — not cold-load |
| Write classes | Doc amends: Propose shape in PR/claim; avoid silent-rewrite of law |
| Scope fences | Prefer not to dump whole `docs/` into context; avoid dual-home of the same rule |
| Grids for lookup | Prefer tables; prose = face, paste-seed, ordered procedure |

**Not:** one mega-file. **Yes:** one **pattern** (Map → Hub Now → ≤2) applied to `docs/`. Living — amend via Hub Now when the face or SoT homes change.

---

## Cold load (agents working *on* recollect-os)

```text
docs/Map.md          → Intent row for this claim
docs/Hub.md ## Now   → product live strip (only)
≤2 linked leaves     → prefer not to bulk-read docs/
```

Operators using a **vault** still follow START → vault Map → Hub Now. This file is meta: how the **law kit itself** stays navigable.

---

## Topic SoT (one home)

| Concern | Home | Form |
|---------|------|------|
| Face / thesis | repo `README.md` | Short prose + teaser grids |
| Onboard / load ladder | `START-GUIDE.md` | Grids |
| Attach / planter | `ATTACH-GRID.md` | Grid + snippets |
| Paste seed | `INTELLIGENCE-CARD.md` | Contiguous seed + thin glossary |
| Day-to-day vault work | `WORKING-GUIDE.md` | Flow grids |
| Binding nouns + retrieval | `LAW.md` | Glossary + rules |
| Plain-first language (public + agents) | `TAXONOMY.md` | Layer 1 required on face; Layer 2 formal only in LAW/deeper |
| Write ladder | `WRITE-CLASSES.md` | Grid |
| Scope / gates / defaults | `ANTI-GOALS.md` | Grids |
| Default / Elevated | `LOOPS.md` | Procedure + tables |
| Research ≠ analysis | `RESEARCH-AND-ANALYSIS.md` | Claim-gated |
| Typed edges | `RELATIONSHIP-SCHEMA.md` | Claim-gated |
| Tool contract | `../mcp/README.md` | Tool grids |
| npm publish | `PUBLISH.md` | Short procedure (repo maintainers; not vault init kit) |
| Product live status | `Hub.md` ## Now | Hub Now only |
| Docs architecture | **this file** | Meta |
| Optional finders / compose / extension ladder | `INTEGRATIONS.md` | Claim-gated; not SoT; phases 0–5 + Hold |
| Closed runtime criteria | `archive/RUNTIME-PLAN.md` | Binary criteria only — status stub: `RUNTIME-PLAN.md` |

---

## What “grid-first” means here

Lookup facts → tables in their SoT.  
Duplicate a fact across files → **bug** (same as dual-home).  
Prose wrappers that restate another SoT → cut.

Prose allowed: README thesis · Card paste block · ordered loops (LOOPS / R&A / PUBLISH).

---

## Done when / Kill when / Hold when

| | |
|--|--|
| **Done when** | Stranger: README → START. Vault agent: Map → Hub Now ≤2. Kit agent: Docs Map → Docs Hub Now ≤2. Glossary forks = 0. Smoke asserts docs spine. |
| **Kill when** (*this* docs claim) | Dumping all of `docs/` into a prompt. Treating ATTACH-GRID as the whole product brain. Dual-homing product status outside Hub Now. |
| **Hold when** | Multi-host auto-wire farm; expanding L5 without dogfood. |

---

## Expand / amend

1. New host → row in ATTACH-GRID only.  
2. New binding default → LAW / WRITE / ANTI-GOALS — then Hub Now one-liner if operator-visible.  
3. New intent → Docs Map row (≤2 opens).  
4. History → `docs/archive/`; not Hub Now.

**Public face rule:** do not name a single host as the default path in README / START / Card. Point to ATTACH-GRID. Cursor may be called out only as convenience wire.
