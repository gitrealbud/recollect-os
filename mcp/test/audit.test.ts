import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { readAuditTail } from "../src/audit.js";
import { runApplyWrite } from "../src/tools/apply_write.js";
import { runProposeWrite } from "../src/tools/propose_write.js";
import { makeFixtureRoot, noteBody } from "./helpers.js";

describe("audit privacy", () => {
  let root: string;
  let tmp: string;

  before(() => {
    ({ root, tmp } = makeFixtureRoot());
  });
  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("propose/refuse/accept leave audit lines without content", () => {
    runProposeWrite(root, {
      path: "vault/Secrets/x.md",
      content: "SECRET_BODY_SHOULD_NOT_LOG",
    });
    const r = runProposeWrite(root, {
      path: "vault/Audit Hub.md",
      content: noteBody("Audit", "SECRET_NOW_LINE"),
    });
    runApplyWrite(root, { proposal_id: r.proposal_id!, accept: true });

    const lines = readAuditTail(root, 20);
    assert.ok(lines.some((l) => l.event === "refuse"));
    assert.ok(lines.some((l) => l.event === "propose"));
    assert.ok(lines.some((l) => l.event === "accept"));
    const raw = fs.readFileSync(
      path.join(root, ".recollect", "audit.jsonl"),
      "utf8"
    );
    assert.ok(!raw.includes("SECRET_BODY_SHOULD_NOT_LOG"));
    assert.ok(!raw.includes("SECRET_NOW_LINE"));
    assert.ok(!/"content"\s*:/.test(raw));

    const hist = path.join(
      root,
      ".recollect",
      "history",
      `${r.proposal_id}.json`
    );
    assert.ok(fs.existsSync(hist));
    const meta = JSON.parse(fs.readFileSync(hist, "utf8"));
    assert.equal(meta.outcome, "accepted");
    assert.equal(meta.content, undefined);
  });
});
