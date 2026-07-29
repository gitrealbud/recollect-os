---
domain: personal
type: episode
id: {{id}}
date: {{date}}
kind: decision
summary: "{{one-line summary}}"
refs: []
source: operator
sensitivity: normal
home: vault/Daily/{{date}}-{{slug}}.md
# kind ∈ decision | fact | preference_change | event
# source ∈ operator | accepted_agent
# optional: supersedes: <prior path or id>
created: {{date}}
updated: {{date}}
---

# {{title}}

**Kind:** decision · **Date:** {{date}}

## Summary

{{one-line summary}}

## Refs

| ref | role |
|-----|------|
| | |

## Edges

| from | rel | to | as_of | note |
|------|-----|----|-------|------|
| | supersedes | | {{date}} | |

*(Omit edge table when unused. Controlled rel only.)*

## Body

*(Claim-sized. Prefer hub Decision row + this leaf when audit matters.)*
