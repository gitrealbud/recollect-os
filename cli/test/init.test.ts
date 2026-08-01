import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { initVault } from "../src/init.js";
import { runSmoke } from "../src/smoke.js";
import { runCliStatus } from "../src/status.js";
import { findKitRoot, isVaultRoot } from "../src/fsutil.js";

test("findKitRoot locates recollect-os", () => {
  const kit = findKitRoot();
  assert.ok(fs.existsSync(path.join(kit, "docs", "LAW.md")));
  for (const name of ["ENTRY.md", "WRITE-CLASSES.md", "START-GUIDE.md", "ATTACH.md"]) {
    assert.ok(
      fs.existsSync(path.join(kit, "docs", name)),
      `kit missing docs/${name}`
    );
  }
});

test("init creates vault and smoke passes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-init-"));
  const result = initVault({ target: dir });
  assert.equal(result.created, true);
  assert.ok(isVaultRoot(dir));
  assert.ok(fs.existsSync(path.join(dir, ".cursor", "rules", "recollect.mdc")));
  assert.ok(fs.existsSync(path.join(dir, ".cursor", "mcp.json")));
  assert.ok(fs.existsSync(path.join(dir, "docs", "LAW.md")));
  assert.ok(fs.existsSync(path.join(dir, "docs", "ATTACH.md")));
  const rule = fs.readFileSync(
    path.join(dir, ".cursor", "rules", "recollect.mdc"),
    "utf8"
  );
  assert.match(rule, /docs\/START-GUIDE\.md/);
  assert.match(rule, /what.s true now/i);
  assert.ok(!/Session Now|Hub Now/.test(rule));
  const me = fs.readFileSync(path.join(dir, "vault", "Me.md"), "utf8");
  assert.match(me, /home:\s*vault\/Me\.md/);
  assert.match(me, /\bid:\s*me\b/);
  assert.ok(fs.existsSync(path.join(dir, "vault", "Templates", "episode.md")));
  const smoke = runSmoke(dir);
  assert.equal(smoke.ok, true, smoke.lines.join("\n"));
  assert.ok(
    smoke.lines.some(
      (l) =>
        l.includes("docs spine ok") &&
        (l.includes("plain rules") || l.includes("rules labels") || l.includes("glossary"))
    )
  );
});

test("init refuses recreate without --rewire", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-init-"));
  initVault({ target: dir });
  const second = initVault({ target: dir });
  assert.equal(second.created, false);
  assert.equal(second.rewired, false);
  assert.match(second.message, /Refuse recreate/);
});

test("init --rewire refreshes wire", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-init-"));
  initVault({ target: dir });
  fs.writeFileSync(path.join(dir, "vault", "keep-me.md"), "x");
  const rewired = initVault({ target: dir, rewire: true });
  assert.equal(rewired.rewired, true);
  assert.ok(fs.existsSync(path.join(dir, "vault", "keep-me.md")));
});

test("status prints Now surfaces and health line", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-status-"));
  initVault({ target: dir });
  const r = runCliStatus(dir);
  assert.equal(r.ok, true);
  assert.match(r.body, /Personal focus/);
  assert.match(r.body, /[Ww]hat.s true now|what.s true now/);
  assert.match(r.body, /health: MCP pass · RECOLLECT_ROOT pass · law docs pass/);
  assert.ok(!r.body.includes("Pending ("));
  assert.ok(!/Session Now|Hub Now/.test(r.body));
});

test("status fails health when root invalid", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-bad-"));
  const r = runCliStatus(dir);
  assert.equal(r.ok, false);
  assert.match(r.body, /RECOLLECT_ROOT fail/);
});

test("accept --latest applies single pending proposal", async () => {
  const { runProposeWrite } = await import("recollect-os-mcp/propose_write");
  const { runCliAccept } = await import("../src/accept.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-accept-"));
  initVault({ target: dir });
  const hubPath = "vault/Business/Demo.md";
  fs.mkdirSync(path.join(dir, "vault", "Business"), { recursive: true });
  const proposed = runProposeWrite(dir, {
    path: hubPath,
    content:
      "---\ndomain: business\ntype: note\ncreated: 2026-07-29\n---\n\n# Demo\n\n## Now\n\nNext action: send follow-up.\n",
  });
  assert.ok(proposed.proposal_id);
  const listed = runCliStatus(dir);
  assert.match(listed.body, /Pending \(1\)/);
  assert.match(listed.body, new RegExp(proposed.proposal_id!));
  const accepted = runCliAccept(dir, { latest: true });
  assert.equal(accepted.ok, true, accepted.body);
  assert.ok(fs.existsSync(path.join(dir, hubPath)));
  const after = runCliStatus(dir);
  assert.ok(!after.body.includes("Pending ("));
  const again = runCliAccept(dir, { latest: true });
  assert.equal(again.ok, false);
});

test("accept --latest refuses when multiple pending", async () => {
  const { runProposeWrite } = await import("recollect-os-mcp/propose_write");
  const { runCliAccept } = await import("../src/accept.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-accept-multi-"));
  initVault({ target: dir });
  fs.mkdirSync(path.join(dir, "vault", "Business"), { recursive: true });
  runProposeWrite(dir, {
    path: "vault/Business/A.md",
    content: "---\ndomain: business\ntype: note\ncreated: 2026-07-29\n---\n\n# A\n",
  });
  runProposeWrite(dir, {
    path: "vault/Business/B.md",
    content: "---\ndomain: business\ntype: note\ncreated: 2026-07-29\n---\n\n# B\n",
  });
  const r = runCliAccept(dir, { latest: true });
  assert.equal(r.ok, false);
  assert.match(r.body, /Multiple pending/);
});