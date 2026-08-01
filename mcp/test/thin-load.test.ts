import assert from "node:assert/strict";
import fs from "node:fs";
import { after, before, describe, it } from "node:test";
import {
  ATTACH_CHAR_BUDGET,
  HUB_NOW_MAX,
  MAX_FILE_CHARS,
  RESOLVE_INTENT_MAX_PATHS,
} from "../src/budgets.js";
import { truncate } from "../src/allowlist.js";
import { runBoot, ATTACH_CHAR_BUDGET as BOOT_BUDGET } from "../src/tools/boot.js";
import { formatStatus, HUB_NOW_MAX as STATUS_HUB_MAX, runStatus } from "../src/tools/status.js";
import { runResolveIntent } from "../src/tools/resolve_intent.js";
import { makeFixtureRoot } from "./helpers.js";

describe("thin-load elite", () => {
  let root: string;
  let tmp: string;

  before(() => {
    ({ root, tmp } = makeFixtureRoot());
  });
  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("budgets SoT shared across modules", () => {
    assert.equal(BOOT_BUDGET, ATTACH_CHAR_BUDGET);
    assert.equal(STATUS_HUB_MAX, HUB_NOW_MAX);
    assert.equal(ATTACH_CHAR_BUDGET, 12_000);
    assert.equal(HUB_NOW_MAX, 2_000);
    assert.equal(MAX_FILE_CHARS, 48_000);
  });

  it("boot(attach) stays within char budget", () => {
    const r = runBoot(root, "attach");
    const total = r.files.reduce((n, f) => n + (f.text?.length ?? 0), 0);
    assert.ok(total <= ATTACH_CHAR_BUDGET + 200);
  });

  it("status never dumps vault file lists", () => {
    const r = runStatus(root);
    const text = formatStatus(r);
    assert.ok(!/vault\/Inbox\//.test(text) || text.includes("Session Now"));
    assert.ok(!text.includes("readdir"));
    // No bulk path dump — Session Now only without intent
    assert.equal(r.hub_now, null);
    assert.ok(!text.match(/vault\/.*\.md[\s\S]*vault\/.*\.md[\s\S]*vault\/.*\.md/));
  });

  it("Hub Now capped at HUB_NOW_MAX", () => {
    const big = "x".repeat(HUB_NOW_MAX + 500);
    const { text, truncated } = truncate(big, HUB_NOW_MAX);
    assert.equal(truncated, true);
    assert.ok(text.length <= HUB_NOW_MAX + 80); // truncation marker slack
  });

  it("resolve_intent ≤2 paths per match", () => {
    const r = runResolveIntent(root, "career search");
    for (const m of r.matches) {
      assert.ok(m.paths.length <= RESOLVE_INTENT_MAX_PATHS);
    }
  });

  it("MAX_FILE_CHARS truncate marker", () => {
    const { truncated } = truncate("y".repeat(MAX_FILE_CHARS + 1));
    assert.equal(truncated, true);
  });
});
