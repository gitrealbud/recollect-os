import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { findKitRoot, packageRoot } from "../src/fsutil.js";

/** Controlled rel set — must match docs/RELATIONSHIP-SCHEMA.md v1 */
const ALLOWED_REL = new Set([
  "owns",
  "active_on",
  "constrained_by",
  "prefers",
  "supersedes",
]);

const FORBIDDEN_REL = ["related_to", "likes", "knows", "mentions", "about"];

test("starter pack uses only controlled rel vocabulary", () => {
  const kit = findKitRoot();
  // Starter lives in repo examples/ — not in the published kit bundle
  const repoRoot = path.resolve(packageRoot(), "..");
  const starter = path.join(repoRoot, "examples", "starter");
  assert.ok(fs.existsSync(starter), "examples/starter missing");

  const bodies = fs
    .readdirSync(starter)
    .filter((n) => n.endsWith(".md"))
    .map((n) => fs.readFileSync(path.join(starter, n), "utf8"))
    .join("\n");

  for (const bad of FORBIDDEN_REL) {
    const re = new RegExp(`\\|\\s*${bad}\\s*\\|`, "i");
    assert.equal(
      re.test(bodies),
      false,
      `forbidden rel "${bad}" found in starter`
    );
  }

  // Explicit positive: required demo edges present
  assert.match(bodies, /\|\s*active_on\s*\|/);
  assert.match(bodies, /\|\s*supersedes\s*\|/);
  assert.match(bodies, /\|\s*owns\s*\|/);
  assert.match(bodies, /\|\s*prefers\s*\|/);
  assert.match(bodies, /\|\s*constrained_by\s*\|/);
});

test("templates declare controlled rel hint", () => {
  const kit = findKitRoot();
  for (const name of ["me.md", "preferences.md", "episode.md"]) {
    const body = fs.readFileSync(path.join(kit, "templates", name), "utf8");
    assert.match(body, /RELATIONSHIP-SCHEMA|Controlled rel/);
    assert.match(body, /home:/);
    assert.match(body, /\bid:/);
  }
});

test("RELATIONSHIP-SCHEMA lists exact v1 set", () => {
  const kit = findKitRoot();
  const body = fs.readFileSync(
    path.join(kit, "docs", "RELATIONSHIP-SCHEMA.md"),
    "utf8"
  );
  for (const rel of ALLOWED_REL) {
    assert.match(body, new RegExp(`\\b${rel}\\b`));
  }
  assert.doesNotMatch(body, /\| `related_to` \|/);
});
