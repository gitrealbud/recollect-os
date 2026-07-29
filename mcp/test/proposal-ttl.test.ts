import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { PROPOSAL_TTL_MS } from "../src/budgets.js";
import { RecollectError } from "../src/errors.js";
import {
  createProposal,
  listProposals,
  loadProposal,
  setProposalNow,
} from "../src/proposals.js";
import { runApplyWrite } from "../src/tools/apply_write.js";
import { runProposeWrite } from "../src/tools/propose_write.js";
import { makeFixtureRoot, noteBody } from "./helpers.js";

describe("proposal-ttl elite", () => {
  let root: string;
  let tmp: string;
  let t0: number;

  before(() => {
    ({ root, tmp } = makeFixtureRoot());
    t0 = Date.UTC(2026, 6, 29, 12, 0, 0);
    setProposalNow(() => t0);
  });
  after(() => {
    setProposalNow(null);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("expired proposal refuses and cleans", () => {
    const r = runProposeWrite(root, {
      path: "vault/TTL.md",
      content: noteBody("TTL"),
    });
    assert.ok(r.proposal_id);
    // Advance past TTL
    setProposalNow(() => t0 + PROPOSAL_TTL_MS + 1);
    assert.throws(
      () => loadProposal(root, r.proposal_id!),
      (e: unknown) =>
        e instanceof RecollectError && e.code === "PROPOSAL_EXPIRED"
    );
    assert.ok(
      !fs.existsSync(
        path.join(root, ".recollect", "proposals", `${r.proposal_id}.json`)
      )
    );
  });

  it("listProposals skips expired", () => {
    setProposalNow(() => t0);
    const a = createProposal(root, {
      path: "vault/A.md",
      content: "# A\n",
      class: "Propose",
    });
    setProposalNow(() => t0 + PROPOSAL_TTL_MS + 5_000);
    const pending = listProposals(root);
    assert.ok(!pending.some((p) => p.id === a.id));
  });

  it("boundary: still valid at expiresAt - 1ms", () => {
    setProposalNow(() => t0);
    const r = runProposeWrite(root, {
      path: "vault/Boundary.md",
      content: noteBody("Boundary"),
    });
    setProposalNow(() => t0 + PROPOSAL_TTL_MS - 1);
    const rec = loadProposal(root, r.proposal_id!);
    assert.equal(rec.id, r.proposal_id);
    const applied = runApplyWrite(root, {
      proposal_id: r.proposal_id!,
      accept: true,
    });
    assert.equal(applied.applied, true);
  });
});
