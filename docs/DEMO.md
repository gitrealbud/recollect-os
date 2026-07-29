# 60-second demonstration of the actual constraints

**Purpose:** One short, reproducible loop proving the core constraints are real and enforced.  
**Audience:** Strangers evaluating the public face — method-shape + fictional example only.  
**Runtime:** `recollect-os` / `recollect-os-mcp` **0.3.7+** (CLI `propose` + `accept`; captured 2026-07-29).  
**Not shown:** private scores, internal process IDs, life data, trajectories.

## Three ideas (plain language only)

1. **Notes on disk are the record** — not the chat  
2. **Load little** — short index, at most two notes  
3. **Nothing permanent until you accept**

## The loop (checkable)

```text
cold start
  → smoke --gate (refuses durable write without accept)
  → propose a change (file does not exist yet)
  → you accept
  → file appears
  → stop
```

**Binary exit (must all be true):**

| Check | Expected |
|-------|----------|
| `smoke --gate` | PASS including `no durable write without accept:true` |
| Before accept | Target path **missing** on disk |
| After propose | Still **missing**; `proposal_id` printed |
| After accept | Target path **exists** |
| `status` | Pending draft cleared for that id (or no longer listed) |

Falsifiable in under two minutes on a clean machine.

---

## Copy-paste block (binary path)

### Windows (documented default)

`npx` often misses the bin on Windows. Prefer global install:

```bat
npm i -g recollect-os

set ROOT=%USERPROFILE%\recollect-demo
if exist "%ROOT%" rmdir /s /q "%ROOT%"

recollect-os.cmd init %ROOT%
recollect-os.cmd smoke --root %ROOT% --gate
recollect-os.cmd status --root %ROOT%

REM body file (or copy examples/demo/claim-hub.md from the repo)
> %TEMP%\claim-hub.md echo ---
>> %TEMP%\claim-hub.md echo domain: personal
>> %TEMP%\claim-hub.md echo type: note
>> %TEMP%\claim-hub.md echo created: 2026-07-29
>> %TEMP%\claim-hub.md echo ---
>> %TEMP%\claim-hub.md echo.
>> %TEMP%\claim-hub.md echo # Demo Claim Hub
>> %TEMP%\claim-hub.md echo.
>> %TEMP%\claim-hub.md echo **Purpose:** Public demo of draft then accept. Fictional only.
>> %TEMP%\claim-hub.md echo.
>> %TEMP%\claim-hub.md echo ## Now
>> %TEMP%\claim-hub.md echo.
>> %TEMP%\claim-hub.md echo - Demo claim accepted.
>> %TEMP%\claim-hub.md echo - Next: stop.

if exist "%ROOT%\vault\Demo Claim Hub.md" del "%ROOT%\vault\Demo Claim Hub.md"
echo exists_before=
dir "%ROOT%\vault\Demo Claim Hub.md" 2>nul || echo false

recollect-os.cmd propose "vault/Demo Claim Hub.md" --file %TEMP%\claim-hub.md --root %ROOT%
echo exists_after_propose=
dir "%ROOT%\vault\Demo Claim Hub.md" 2>nul || echo false

REM Use the proposal_id printed by propose (smoke may leave other pending drafts,
REM so accept --latest is unreliable right after smoke --gate).
recollect-os.cmd accept <proposal_id> --root %ROOT%
echo exists_after_accept=
dir "%ROOT%\vault\Demo Claim Hub.md"

recollect-os.cmd status --root %ROOT%
```

### Unix / macOS

```bash
npm i -g recollect-os   # or: npx -y recollect-os … on each line

ROOT="$HOME/recollect-demo"
rm -rf "$ROOT"

recollect-os init "$ROOT"
recollect-os smoke --root "$ROOT" --gate
recollect-os status --root "$ROOT"

BODY="$(mktemp)"
cat > "$BODY" <<'EOF'
---
domain: personal
type: note
created: 2026-07-29
---

# Demo Claim Hub

**Purpose:** Public demo of draft then accept. Fictional only.

## Now

- Demo claim accepted.
- Next: stop.
EOF

test -f "$ROOT/vault/Demo Claim Hub.md" && echo "exists_before=true" || echo "exists_before=false"

recollect-os propose "vault/Demo Claim Hub.md" --file "$BODY" --root "$ROOT"
test -f "$ROOT/vault/Demo Claim Hub.md" && echo "exists_after_propose=true" || echo "exists_after_propose=false"

# Use the proposal_id printed by propose (smoke may leave other pending drafts)
recollect-os accept <proposal_id> --root "$ROOT"

test -f "$ROOT/vault/Demo Claim Hub.md" && echo "exists_after_accept=true" || echo "exists_after_accept=false"
ls -la "$ROOT/vault/Demo Claim Hub.md"
recollect-os status --root "$ROOT"
```

If you cloned this repo, you can pass `--file examples/demo/claim-hub.md` instead of writing a temp body.

---

## Representative receipts (Windows · 0.3.7 local)

### 1. Cold start + gate

```text
PASS vault root …
PASS docs spine ok · 6 files · glossary · product Now · Map Intent · host-first START
PASS boot(attach) ok · pack=attach · files=4
PASS gate: Forbidden path refused
PASS gate: no durable write without accept:true
smoke: OK
```

### 2. Propose only (no permanent write yet)

```text
# propose_write

code: OK
class: Propose
proposal_id: <temporary-id>
path: vault/Demo Claim Hub.md
draft_summary: Demo Claim Hub
durable_before_accept: false

No permanent write yet. You: recollect-os accept <temporary-id>
```

```text
exists_before=false
exists_after_propose=false
```

### 3. You accept

```text
# apply_write

applied: true
path: vault/Demo Claim Hub.md
```

```text
exists_after_accept=true
```

### 4. Tree (after accept)

```text
vault/
  Demo Claim Hub.md    ← present only after accept
  Map.md
  Me.md
  Preferences.md
  …
```

### Permanent note (fictional · after accept)

```markdown
# Demo Claim Hub

**Purpose:** Public demo of draft then accept. Fictional only.

## Now

- Demo claim accepted.
- Next: stop.
```

---

## Agent shape (limited load · synthetic transcript)

Plain language only — same three ideas. No private tissue.

```text
Agent: Load the short index and at most one starter note.
       Task: add vault/Demo Claim Hub.md stating the accept rule in ## Now.

Agent: propose_write path=vault/Demo Claim Hub.md
       → proposal_id=<temporary-id>
       → file still missing on disk

You:   accept <temporary-id>

Agent: confirm file exists; status clean of that draft; stop.
```

| Step | Open | Why |
|------|------|-----|
| Index | vault `Map` / docs Intent | Route the work |
| Note 1 | optional starter shape | Thin pattern only |
| Note 2 | *(none)* | Stay within two notes |

No whole-vault dump. No private notes.

---

## Optional: multi-session continuity (does not block the binary exit)

**Day 1:** run the binary block above.  
**Day 2 (same vault root):**

```bash
recollect-os status --root "$ROOT"
# Expect: Demo Claim Hub still on disk; no need to rebuild the claim from chat.
```

That is the continuity proof: notes on disk are the record across sessions. Keep it boring — one main note, one “what’s true now” section, one draft-then-accept cycle. No scoreboards, no multi-domain theater.

---

## What this kills (failure modes)

| Problem | What you just saw |
|---------|-------------------|
| Chat as memory | Note lives on disk after accept |
| Bulk vault load | Demo only needs short index + ≤2 notes |
| Silent permanent edits | File missing until accept |
| Embeddings/RAG required | Not used |
| Scores as proof | Not shown; lived check only |

**Known limit:** the draft-then-accept behaviour applies to **tool-mediated** writes. Hosts can still edit files outside the tools. Permanent path = the agent drafts the change; you accept it before it is written (`recollect-os accept` or the host’s apply step).

---

## Stop

| Check | Expected |
|-------|----------|
| Claim file on disk | yes — only after accept |
| Agent next action | stop (done) |
| Extra notes loaded | none beyond short index + at most two |
| Private scores / life data | absent |

**Done when:** the binary exit table is green on a throwaway root.  
**Kill when:** expanding into private vault content or inventing private process theatre.

## Links

- Face: [README](../README.md)  
- Example body: [examples/demo/claim-hub.md](../examples/demo/claim-hub.md)  
- How writes work: [WRITE-CLASSES](./WRITE-CLASSES.md) · Tools: [mcp/README](../mcp/README.md)  
- Language reference: [TAXONOMY](./TAXONOMY.md)  
- Product status: [Hub](./Hub.md)
