import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { runApplyWrite } from "../src/tools/apply_write.js";
import { runProposeWrite } from "../src/tools/propose_write.js";
import { classifyWrite } from "../src/write_class.js";
import { makeFixtureRoot, noteBody } from "./helpers.js";

describe("write-gate elite", () => {
  let root: string;
  let tmp: string;

  before(() => {
    ({ root, tmp } = makeFixtureRoot());
  });
  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("Propose never durable-writes without accept:true", () => {
    const target = "vault/Gate Propose.md";
    const r = runProposeWrite(root, {
      path: target,
      content: noteBody("Gate Propose"),
    });
    assert.equal(r.class, "Propose");
    assert.ok(r.proposal_id);
    assert.ok(!fs.existsSync(path.join(root, target)));
    assert.throws(
      () => runApplyWrite(root, { proposal_id: r.proposal_id!, accept: false }),
      (e: Error & { code?: string }) =>
        e.message.includes("accept: true") || e.code === "ACCEPT_REQUIRED"
    );
    assert.ok(!fs.existsSync(path.join(root, target)));
  });

  it("Human-gate empty wipe stages then requires accept", () => {
    const target = "vault/Wipe Me.md";
    assert.equal(classifyWrite(target, ""), "Human-gate");
    const r = runProposeWrite(root, { path: target, content: "" });
    assert.equal(r.class, "Human-gate");
    assert.ok(r.proposal_id);
    assert.ok(!fs.existsSync(path.join(root, target)));
    const applied = runApplyWrite(root, {
      proposal_id: r.proposal_id!,
      accept: true,
    });
    assert.equal(applied.applied, true);
    assert.equal(fs.readFileSync(path.join(root, target), "utf8"), "");
  });

  it("Forbidden never gets proposal id", () => {
    const r = runProposeWrite(root, {
      path: "vault/Secrets/x.md",
      content: "nope",
    });
    assert.equal(r.class, "Forbidden");
    assert.equal(r.proposal_id, null);
    assert.equal(r.code, "FORBIDDEN_PATH");
  });

  it("apply once then id gone", () => {
    const r = runProposeWrite(root, {
      path: "vault/Once Gate.md",
      content: noteBody("Once"),
    });
    runApplyWrite(root, { proposal_id: r.proposal_id!, accept: true });
    assert.throws(
      () =>
        runApplyWrite(root, { proposal_id: r.proposal_id!, accept: true }),
      /not found|expired/i
    );
  });
});
