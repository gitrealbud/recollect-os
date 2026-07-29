# Research and analysis

**What this is for:** separate *evidence* from *decisions* so advice stays defensible.

How Recollect runs research and analysis as separate skills.  
Companion to [`WORKING-GUIDE.md`](./WORKING-GUIDE.md) · [`LOOPS.md`](./LOOPS.md). Formal names: [`LAW.md`](./LAW.md).

---

## Internal findings (from lived run · 2026-07-29)

Research and analysis were merged on a starter claim (“communicating with AI”). Result: correct consensus, weak defensibility.

| Gap | Effect |
|-----|--------|
| No locked research question | Search defaulted to “what guides say” |
| No source bar | Vendor and practitioner treated equally |
| No contradiction pass | Consensus only |
| No Done when on research | One search wave = stop |
| Analysis not separated | Practices written without a fixed bar |
| No pure evaluate step | Nothing could FAIL |

### Binding split — evidence vs decision

- **Research** = what is known (evidence / detail note).
- **Analysis** = what it means for this task (short main-note summary after PASS).

Prefer not to paste research bodies into the main note.  
Do not invent analysis not supported by the leaf or an explicit assumption.

---

## Research loop

```text
1. Lock question (one sentence) + Done when
2. Search with a source bar (primary / dated / non-vendor when elevated)
3. Extract findings as rows: finding · support · limit
4. Note contradictions
5. Stop when Done when is met — or HOLD if evidence is thin
6. Write leaf: verdict · findings · non-claims · source classes
7. Hub gets only operating residue (practices / one-line verdict)
```

Routine claims may compress steps 2–4.  
Elevated claims do not skip contradiction or Done when.

---

## Analysis loop

```text
1. Inputs: research leaf verdict + claim
2. Generate proposed structure (practices, rules, decision)
3. Evaluate against fixed bar:
   - Grounding — ties to finding or explicit assumption
   - Contradiction — conflicts acknowledged or resolved
   - Actionability — applicable without re-research
   - Density — every item changes behavior
   - Scope — does not overclaim sources
4. Only PASS advances to hub write
5. NEEDS_IMPROVEMENT → refine (cap) → else HOLD
```

Evaluator judges only. Does not rewrite.

---

## Connection

```text
Claim
  → Research loop → leaf (evidence SoT)
  → Analysis loop → hub residue (operating SoT)
  → Write (after accept when Propose / Human-gate)
  → Exit test (checkable quickly)
```

Claim-gated: open the research leaf only when the claim needs evidence.  
Thin is complete: analysis may conclude the hub stays minimal.

---

## External landscape (how other groups treat these skills)

Synthesized 2026-07-29 from public agent-skill and research-system material.

### Pattern: skills as packaged methodology

Groups package research/analysis as **reusable skill files** (often markdown SOPs), not one-off prompts:

- Load methodology when the task matches (company analysis framework, lit review, stats practice).
- Skills reduce repeated prompting and keep procedure consistent across sessions.
- Risk called out in the wild: generic or “AI-slop” skills that encode weak methods at scale.

### Pattern: research as trail, not summary

Strong research skills emphasize:

- Define the question before gathering
- Credible sources and freshness
- Separate facts from interpretation
- Mark uncertainty
- Output a **trail**: question → method → sources → evidence → synthesis → caveats → next steps

Judgment is treated as the product, not link collection.

### Pattern: multi-agent research systems

Anthropic-style research systems use:

- Lead planner that persists the plan in memory
- Specialized subagents for search slices
- Synthesis + “enough?” decision before exit
- Citation pass so claims stay attributed

Human eval still catches what automated judges miss.

### Pattern: evaluate before expanding docs

Skill-authoring guidance (e.g. Claude skill best practices):

- Build evaluations before long documentation
- Iterate against baseline behavior
- Workflows for research synthesis as sequential steps with verification

### Pattern: chain research → analysis → artifact

Common pipeline: research skill outputs a structured brief; analysis or writing skill consumes it. Output of one skill is input to the next — same idea as leaf → hub residue.

### What Recollect already aligns with

| External pattern | Recollect fit |
|------------------|--------------|
| Trail over dump | Research leaf + Research index |
| Question + stop | Done when / Kill when |
| Pure evaluate | Quality gate (judge only) |
| Packaged methodology | docs + claim-gated leaves, not ambient vault dump |
| Human on irreversible | Write classes |

### What to borrow carefully

- Explicit **source bar** and **contradiction** step (often underspecified in thin hubs).
- **Eval-first** when locking a repeating research/analysis skill.
- Avoid bloating into multi-agent theatre for routine claims; keep Default vs Elevated.

---

## Operating rule

Apply the full research/analysis loops when the claim is net-new evidence work or must meet a fixed bar.  
Compress for routine.  
Do not require the operator to learn loop names — the assistant applies them when the claim requires research or analysis.
