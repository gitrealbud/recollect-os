import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { initVault } from "../src/init.js";
import { runSmoke } from "../src/smoke.js";

test("smoke --gate asserts write gate", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-gate-"));
  initVault({ target: dir });
  const smoke = runSmoke(dir, { gate: true });
  assert.equal(smoke.ok, true, smoke.lines.join("\n"));
  assert.ok(smoke.lines.some((l) => l.includes("gate: Forbidden")));
  assert.ok(
    smoke.lines.some((l) => l.includes("no durable write without accept"))
  );
});

test("doctor passes on fresh init vault", async () => {
  const { runDoctor } = await import("../src/doctor.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-doctor-"));
  initVault({ target: dir });
  const r = runDoctor({ root: dir, verbose: true });
  assert.equal(r.ok, true, r.lines.join("\n"));
});

test("doctor --sensitivity fails when restricted lacks banner", async () => {
  const { runDoctor } = await import("../src/doctor.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-sens-"));
  initVault({ target: dir });
  const note = path.join(dir, "vault", "Restricted Demo.md");
  fs.writeFileSync(
    note,
    `---
domain: personal
type: note
sensitivity: restricted
created: 2026-07-29
---

# Restricted Demo

No banner here.
`
  );
  const bad = runDoctor({ root: dir, sensitivity: true });
  assert.equal(bad.ok, false, bad.lines.join("\n"));
  assert.ok(bad.lines.some((l) => l.includes("restricted without body banner")));

  fs.writeFileSync(
    note,
    `---
domain: personal
type: note
sensitivity: restricted
created: 2026-07-29
---

# Restricted Demo

> **Restricted.** Do not bulk-export.

Body.
`
  );
  const good = runDoctor({ root: dir, sensitivity: true });
  assert.equal(good.ok, true, good.lines.join("\n"));
});

test("promote --dry-run flags restricted and refuses write mode", async () => {
  const { runPromote } = await import("../src/promote.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-promote-"));
  initVault({ target: dir });
  fs.mkdirSync(path.join(dir, "vault", "Secrets"), { recursive: true });
  fs.writeFileSync(path.join(dir, "vault", "Secrets", "x.md"), "# secret\n");
  fs.writeFileSync(
    path.join(dir, "vault", "Personal.md"),
    `---
sensitivity: personal
---

# Personal
`
  );

  const report = runPromote({ root: dir, dryRun: true });
  assert.equal(report.ok, true, report.lines.join("\n"));
  assert.ok(report.lines.some((l) => l.startsWith("RISK") && l.includes("Secrets")));
  assert.ok(report.lines.some((l) => l.includes("sensitivity: personal")));

  const writeAttempt = runPromote({ root: dir, dryRun: false });
  assert.equal(writeAttempt.ok, false);
});

test("doctor passes on private vault without docs kit spine", async () => {
  const { runDoctor } = await import("../src/doctor.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-private-"));
  fs.mkdirSync(path.join(dir, "vault"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "RECOLLECT.md"),
    `# Law\n\n## Glossary (canonical)\n\n| Formal | Plain |\n|--------|-------|\n| Hub Now | Now section |\n\n## Active context\n\n- test\n`
  );
  fs.writeFileSync(
    path.join(dir, "vault", "Me.md"),
    `---\ndomain: personal\n---\n\n# Me\n`
  );
  const r = runDoctor({ root: dir });
  assert.equal(r.ok, true, r.lines.join("\n"));
  assert.ok(r.lines.some((l) => l.includes("private vault law")));
  assert.ok(!r.lines.some((l) => l.includes("docs/LAW.md missing")));
});

test("live-fence L1-L3 under npm test", async () => {
  const { runProposeWrite } = await import("recollect-os-mcp/propose_write");
  const { runApplyWrite } = await import("recollect-os-mcp/apply_write");
  const { runCaptureInbox } = await import(
    new URL("../../../mcp/dist/src/tools/capture_inbox.js", import.meta.url)
      .href
  );
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-fence-"));
  initVault({ target: dir });

  const hubPath = "vault/Live Fence Demo.md";
  const p1 = runProposeWrite(dir, {
    path: hubPath,
    content: `---
domain: personal
type: note
created: 2026-07-29
---

# Live Fence Demo

## Now

Claim 1 landed
`,
  });
  assert.ok(p1.proposal_id);
  assert.ok(!fs.existsSync(path.join(dir, hubPath)));
  runApplyWrite(dir, { proposal_id: p1.proposal_id!, accept: true });
  assert.ok(fs.existsSync(path.join(dir, hubPath)));

  const forbidden = runProposeWrite(dir, {
    path: "vault/Secrets/x.md",
    content: "nope",
  });
  assert.equal(forbidden.class, "Forbidden");
  assert.equal(forbidden.proposal_id, null);

  const cap = runCaptureInbox(dir, {
    body: "lived fence capture",
    slug: "fence-cap",
    title: "Fence capture",
  });
  assert.match(cap.path, /^vault\/Inbox\//);

  const p3 = runProposeWrite(dir, {
    path: "vault/Should Not Exist.md",
    content: "# ghost\n",
  });
  assert.throws(
    () => runApplyWrite(dir, { proposal_id: p3.proposal_id!, accept: false }),
    /accept: true/
  );
  assert.ok(!fs.existsSync(path.join(dir, "vault", "Should Not Exist.md")));
});
