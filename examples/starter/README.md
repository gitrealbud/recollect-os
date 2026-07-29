# Starter example pack

Minimal graph showing Recollect shape + **relationship schema** on a real topic: communicating with AI.

| File | Role |
|------|------|
| `Map.md` | Intent router (never live) |
| `Session-Now.md` | Example Session Now + `active_on` |
| `Me.md` · `Preferences.md` | UserModel / InteractionPrefs (fictional Alex) |
| `Communicating with AI.md` | Thin hub (Thesis · Now · Edges · Research index) |
| `Communicating with AI — research.md` | Claim-gated evidence leaf |
| `…decision-thin-hub.md` | Episode · `supersedes` fat-hub |
| `…decision-fat-hub.md` | Superseded episode (audit only) |

**Default load:** Map → hub `## Now` only.  
Open research / episodes only when the claim names evidence or supersession.

**rel v1 (only):** `owns` · `active_on` · `constrained_by` · `prefers` · `supersedes`  
See `docs/RELATIONSHIP-SCHEMA.md`. Smoke: `npm test` in `cli/` includes starter deny-grep.

Copy into a private vault and adapt. Not a full life dump.
