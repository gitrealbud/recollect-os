---
domain: personal
type: person
id: me
created: {{date}}
updated: {{date}}
home: vault/Me.md
sensitivity_default: normal
sensitivity: normal
# optional:
# display_name:
# roles: []
# locale:
# constraints: []   # refs — use constrained_by edges for hard constraints
# values: []        # short strings or refs
---

# Me

Thin identity home. Durable Me writes are ask-first (see `docs/WRITE-CLASSES.md`).

## Stable

- **Display name:**
- **Roles:** *(optional)*

## Constraints / values

Prefer refs + edges (`constrained_by`, `prefers`) over long prose.

| ref | note |
|-----|------|
| | |

## Edges

| from | rel | to | as_of | note |
|------|-----|----|-------|------|
| vault/Me.md | owns | | {{date}} | |

*(Controlled rel only: `owns` · `active_on` · `constrained_by` · `prefers` · `supersedes`)*

## Links

- [[Preferences]] · [[Map]]
