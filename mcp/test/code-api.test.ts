import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before, after } from "node:test";
import { RecollectCodeApi, CODE_SIDE_ANTI_PATTERNS } from "../src/code-api.js";

describe("code-api local", () => {
  let root: string;
  let prev: string | undefined;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-code-api-"));
    fs.writeFileSync(
      path.join(root, "RECOLLECT.md"),
      "# law\n\n## Active context\n\n- test focus strip\n",
      "utf8"
    );
    fs.mkdirSync(path.join(root, "vault"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "vault", "Map.md"),
      `# Map\n\n## Intent\n\n| Intent | Open | Do not |\n|--------|------|--------|\n| test intent | [[Me]] | nothing |\n\n## Identity\n\n`,
      "utf8"
    );
    fs.writeFileSync(
      path.join(root, "vault", "Me.md"),
      "---\ndomain: personal\ntype: note\ncreated: 2026-07-29\n---\n\n# Me\n\n## Now\n\nhere\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(root, "vault", "Preferences.md"),
      "---\ndomain: personal\ntype: note\ncreated: 2026-07-29\n---\n\n# Prefs\n",
      "utf8"
    );
    prev = process.env.RECOLLECT_ROOT;
    process.env.RECOLLECT_ROOT = root;
  });

  after(() => {
    if (prev === undefined) delete process.env.RECOLLECT_ROOT;
    else process.env.RECOLLECT_ROOT = prev;
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("status returns personal focus", async () => {
    const api = RecollectCodeApi.fromRoot(root);
    const r = await api.status();
    assert.equal(r.ok, true);
    assert.ok(String(r.session_now).includes("test focus"));
  });

  it("boot pulse works", async () => {
    const api = RecollectCodeApi.fromRoot(root);
    const r = await api.boot("pulse");
    assert.equal(r.ok, true);
    assert.equal(r.pack, "pulse");
  });

  it("capture_inbox writes under Inbox", async () => {
    const api = RecollectCodeApi.fromRoot(root);
    const r = await api.captureInbox({
      body: "code-side capture",
      slug: "code-side",
    });
    assert.equal(r.ok, true);
    assert.ok(String(r.path).startsWith("vault/Inbox/"));
    assert.ok(fs.existsSync(path.join(root, String(r.path))));
  });

  it("propose_write stages without durable write for Me", async () => {
    const api = RecollectCodeApi.fromRoot(root);
    const mePath = path.join(root, "vault", "Me.md");
    const before = fs.readFileSync(mePath, "utf8");
    const r = await api.proposeWrite({
      path: "vault/Me.md",
      content:
        "---\ndomain: personal\ntype: note\ncreated: 2026-07-29\n---\n\n# Me\n\n## Now\n\nproposed\n",
    });
    assert.equal(r.ok, true);
    assert.ok(r.proposal_id);
    assert.equal(fs.readFileSync(mePath, "utf8"), before);
  });

  it("documents anti-patterns", () => {
    assert.ok(CODE_SIDE_ANTI_PATTERNS.length >= 4);
  });
});
