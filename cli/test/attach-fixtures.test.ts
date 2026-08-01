import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ATTACH = path.resolve(__dirname, "../../../examples/attach");

test("Claude Desktop fixture has mcpServers + RECOLLECT_ROOT", () => {
  const j = JSON.parse(
    fs.readFileSync(path.join(ATTACH, "claude-desktop.mcpServers.json"), "utf8")
  );
  const s = j.mcpServers["recollect-os"];
  assert.equal(s.command, "node");
  assert.ok(Array.isArray(s.args) && s.args.length >= 1);
  assert.equal(s.env.RECOLLECT_ROOT, "<vault>");
});

test("VS Code fixture has servers.type stdio + RECOLLECT_ROOT", () => {
  const j = JSON.parse(
    fs.readFileSync(path.join(ATTACH, "vscode.mcp.json"), "utf8")
  );
  const s = j.servers["recollect-os"];
  assert.equal(s.type, "stdio");
  assert.equal(s.command, "node");
  assert.ok(s.args?.[0]);
  assert.equal(s.env.RECOLLECT_ROOT, "<vault>");
});

test("Grok Build fixture TOML has command and RECOLLECT_ROOT", () => {
  const text = fs.readFileSync(path.join(ATTACH, "grok-build.toml"), "utf8");
  assert.match(text, /name\s*=\s*"recollect-os"/);
  assert.match(text, /command\s*=\s*"node"/);
  assert.match(text, /RECOLLECT_ROOT\s*=\s*"<vault>"/);
  assert.match(text, /<mcp-entry>/);
});

test("Antigravity fixture has mcpServers + RECOLLECT_ROOT", () => {
  const j = JSON.parse(
    fs.readFileSync(path.join(ATTACH, "antigravity.mcpServers.json"), "utf8")
  );
  const s = j.mcpServers["recollect-os"];
  assert.equal(s.command, "node");
  assert.ok(Array.isArray(s.args) && s.args.length >= 1);
  assert.equal(s.env.RECOLLECT_ROOT, "<vault>");
  assert.ok(String(s.args[0]).includes("<mcp-entry>"));
});
