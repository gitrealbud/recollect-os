import assert from "node:assert/strict";
import fs from "node:fs";
import { after, before, describe, it } from "node:test";
import { normalizeRel, PolicyError } from "../src/allowlist.js";
import { RecollectError } from "../src/errors.js";
import { runProposeWrite } from "../src/tools/propose_write.js";
import { makeFixtureRoot } from "./helpers.js";

describe("path-refusal elite", () => {
  let root: string;
  let tmp: string;

  before(() => {
    ({ root, tmp } = makeFixtureRoot());
  });
  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("traversal and absolute paths refuse", () => {
    assert.throws(() => normalizeRel("../etc/passwd"), PolicyError);
    assert.throws(() => normalizeRel("vault/../../x"), PolicyError);
    assert.throws(() => normalizeRel("C:/Windows"), PolicyError);
    try {
      normalizeRel("../x");
      assert.fail("expected throw");
    } catch (e) {
      assert.ok(e instanceof RecollectError);
      assert.equal((e as RecollectError).code, "PATH_TRAVERSAL");
    }
  });

  it("fuzz: deny-prefix and traversal always Forbidden on propose", () => {
    const bad = [
      "vault/Secrets/a.md",
      "vault/Archive/b.md",
      "vault/People/c.md",
      "../vault/Me.md",
      "vault/../../escape.md",
      "docs/LAW.md",
      "package.json",
    ];
    for (const p of bad) {
      const r = runProposeWrite(root, { path: p, content: "# x\n" });
      assert.equal(r.class, "Forbidden", p);
      assert.equal(r.proposal_id, null, p);
    }
  });

  it("restricted frontmatter and domain:both Forbidden", () => {
    const cases = [
      "---\nsensitivity: restricted\n---\n\n# X\n",
      "---\ndomain: both\n---\n\n# X\n",
    ];
    for (const content of cases) {
      const r = runProposeWrite(root, {
        path: "vault/Bad Content.md",
        content,
      });
      assert.equal(r.class, "Forbidden");
      assert.equal(r.proposal_id, null);
    }
  });

  it("null byte in path refused", () => {
    assert.throws(() => normalizeRel("vault/foo\0bar.md"), /invalid path/);
  });
});
