# Relationship schema

**What this is for:** typed links between identity, prefs, and hubs — without a parallel graph database.

**Status:** Current shape 2026-07-29 · operating card — amend when lived drift says so.  
**SoT:** Markdown paths + this controlled vocabulary. **No parallel graph DB.**  
**Aligns:** Map ≤2 · one home · Session Now / Hub Now · Auto/Propose/Human-gate/Forbidden  
**Stance:** Recollect `Doc-systems-graph-stance` — typed edges in files; trend validates, does not open Neo4j/OKF/lat.md as SoT.

Load this only when the claim touches identity, prefs, edges, or supersession. Formal names: [`LAW.md`](./LAW.md).

---

## Research basis (anchors, not SSOTs)

| Source | Takeaway for Recollect |
|--------|------------------------|
| Internal `Doc-systems-graph-stance` (9.3) | MD + explicit edges; no side graph; G5 = lived failure only |
| Internal Landscape Agent-Memory | mem0/Graphiti = infra; Recollect stays judgment vault |
| Karpathy LLM-wiki / OKF | Compile into linked MD; path≈identity; index for progressive disclosure |
| GitHub: wikilink-types / typed-links | Untyped `[[links]]` hide *how*; closed vocab + frontmatter sync is the fix |
| Industry consensus | Small closed rel set ≫ 24 ad-hoc types; supersedes is first-class; refuse free-string `rel` |

**Do not:** import Penfield/Graphiti/OKF as vault SoT · auto-extract psychology into Me · 24-type ontology bloat.

---

## Invariants (encoded)

```text
1. One UserModel home per operator → Me.md
2. Live focus = Session Now + active_on edges (no third “StandingContext” file class)
3. One canonical home per fact (path is authority)
4. Links = stable ref (path or id) — never bare display names as keys
5. Edges use controlled rel set only
6. Identity / prefs / restricted / deletes → Human-gate
```

**StandingContext** is a **projection name** only: Session Now strip + `active_on` edges. If projection disagrees with hubs/edges, **hubs + edges win**.

---

## Controlled relation set (v1)

```text
owns | active_on | constrained_by | prefers | supersedes
```

| rel | Meaning |
|-----|---------|
| `owns` | Operator/entity owns a hub or pack |
| `active_on` | Current live focus → hub (requires `as_of`) |
| `constrained_by` | Hard constraint pointer |
| `prefers` | Preference pointer (not soft prose alone) |
| `supersedes` | This home/version replaces prior ref |

**Dropped from v1:** `related_to` (bag risk). Need it → amend this doc after lived pain.  
**Not in v1:** contradicts/causes/… (research-trail vocabulary — use RESEARCH-AND-ANALYSIS leaf, not identity schema).

Unknown `rel` → **Forbidden** agent write.

---

## Entities (thin required FM)

### UserModel → `Me.md`

**Required:** `id` · `updated` · `home` · `sensitivity_default`  
**Optional:** `display_name` · `roles` · `locale` · `constraints` (ref[]) · `values` (short or refs)

### InteractionPrefs → `Preferences.md`

**Required:** `id` · `updated` · `home`  
**Optional:** `tone` · `verbosity` · `challenge_level` · `never[]` · `prefer[]` · `tools_bias[]` · `supersedes`

### Session Now (projection)

Home: `RECOLLECT.md` → `## Active context` (or equivalent).  
Focus edges: `UserModel -active_on→ HubRef` with `as_of`.  
Optional open_loops / hold as thin lists — not a second live SoT.

### Hub Now

Unchanged: endeavor `## Now` sole endeavor writer.

### Episode → Daily / Decisions / leaf

**Required when used:** `id` · `date` · `kind` (decision|fact|preference_change|event) · `summary` · `refs[]` · `source` (operator|accepted_agent) · `sensitivity` · `home`  
**Optional:** `supersedes`

### Edge

| Field | Rule |
|-------|------|
| `from` / `to` | ref (path or id) |
| `rel` | controlled enum only |
| `as_of` | required for `active_on` |
| `note` | ≤1 clause |
| `home` | where declared (hub FM / Session Now / edge table on hub — **not** a new Map live column) |

Vault Map stays Intent router. Do not store live `active_on` as Map truth.

Representation: YAML frontmatter list **or** small markdown table with same fields. Grepable. Plugin-optional.

---

## Supersession

```text
New accepted write at canonical home
  → supersedes → old ref (or version)
  → readers load latest non-superseded at home
  → old retained for audit, not default load
```

Ended focus: supersede or close `active_on` with end `as_of` — do not leave dual active hubs for the same fact.

---

## Write classes (cite)

| Write | Class |
|-------|--------|
| Me / Preferences / restricted / deletes / domain flip | Human-gate |
| New Episode with refs; edge table on hub; Map Intent row | Propose |
| Scratch / Inbox capture | Auto (existing) |
| Unknown `rel` · bare-name keys when id/path exists · dual Session/Hub Now for same fact | Forbidden |

---

## Implementation order

```text
0 law bind (this doc + LAW/WORKING/Card links)     ✅ 2026-07-29
1 templates (me / preferences / episode)             ✅ 2026-07-29
2 starter example (fictional active_on + supersedes) ✅ 2026-07-29
3 agent rules cite + deny-grep smoke on starter      ✅ 2026-07-29
→ stop and use
4 private promote (propose/accept only)
5 MCP validate only on lived schema drift
```

---

## Success tests

1. Stranger creates valid Me/Preferences from templates in one pass.  
2. Agent cannot land `rel: likes` / `related_to` without law amend.  
3. Starter shows `active_on` + Episode `refs` + `supersedes`.  
4. Private promote is Propose→accept, never silent.  
5. Map ≤2 and one home still hold — schema adds discipline, not a second SoT.

## Non-goals

Neo4j / GraphRAG as SoT · OKF field port · auto-extract UserModel · full historical re-link · companion “feel known” product · 24-type ontology.
