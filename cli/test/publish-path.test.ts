import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { findKitRoot, packageRoot, resolveMcpDist } from "../src/fsutil.js";
import { initVault } from "../src/init.js";
import { runSmoke } from "../src/smoke.js";

test("bundled kit is preferred over clone walk when present", () => {
  const kit = findKitRoot();
  assert.ok(fs.existsSync(path.join(kit, "docs", "LAW.md")));
  assert.ok(fs.existsSync(path.join(kit, "templates", "me.md")));
  // After sync-kit, packageRoot/kit should win
  const bundled = path.join(packageRoot(), "kit");
  if (fs.existsSync(path.join(bundled, "docs", "LAW.md"))) {
    assert.equal(path.resolve(kit), path.resolve(bundled));
  }
});

test("resolveMcpDist points at an existing entry", () => {
  const dist = resolveMcpDist();
  assert.ok(fs.existsSync(dist), `missing MCP entry: ${dist}`);
  assert.match(dist.replace(/\\/g, "/"), /index\.js$/);
});

test("init from bundled kit produces law + mcp wire without RECOLLECT_KIT", () => {
  const prev = process.env.RECOLLECT_KIT;
  delete process.env.RECOLLECT_KIT;
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-cold-"));
    const result = initVault({ target: dir });
    assert.equal(result.created, true);
    assert.ok(fs.existsSync(path.join(dir, "docs", "LAW.md")));
    assert.ok(fs.existsSync(path.join(dir, "docs", "ATTACH.md")));
    const mcpJson = JSON.parse(
      fs.readFileSync(path.join(dir, ".cursor", "mcp.json"), "utf8")
    );
    const server = mcpJson.mcpServers["recollect-os"];
    assert.ok(server, "mcp server key recollect-os");
    assert.equal(server.command, "node");
    assert.ok(fs.existsSync(server.args[0]), `mcp path missing: ${server.args[0]}`);
    const smoke = runSmoke(dir);
    assert.equal(smoke.ok, true, smoke.lines.join("\n"));
  } finally {
    if (prev !== undefined) process.env.RECOLLECT_KIT = prev;
  }
});
