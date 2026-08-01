# Start Guide

Install + first notes. Entry map: [ENTRY.md](./ENTRY.md). Rules: [LAW.md](./LAW.md).

## Three ideas

1. **Notes on disk are the record** — not the chat  
2. **Load little** — short index, at most two notes  
3. **Nothing permanent until you accept**

## Install

**Unix:**

```bash
npx -y recollect-os init ~/recollect
npx -y recollect-os smoke --root ~/recollect --gate
```

**Windows (recommended):**

```bash
npm i -g recollect-os
recollect-os.cmd init %USERPROFILE%\recollect
recollect-os.cmd smoke --root %USERPROFILE%\recollect --gate
```

Connect a host: [ATTACH.md](./ATTACH.md) · fixtures [`../examples/attach/`](../examples/attach/).

| Path | Do |
|------|----|
| **Any MCP host** | Use ATTACH + examples |
| **Cursor** | `init` already wrote the wire — open the vault folder |
| **No tools yet** | Draft in chat; you write the file yourself |

**Known limit:** tools cannot block free-form host edits. Permanent path = draft then accept.

## First notes

1. Name **one** thing to track.  
2. Draft a short note (title · what’s true now · next).  
3. Write only after you accept.  
4. Stop when you say you’re done with onboarding.

After that: short index → **what’s true now** only. More depth only when the task needs it → [LAW.md](./LAW.md) · [WRITE-CLASSES.md](./WRITE-CLASSES.md).
