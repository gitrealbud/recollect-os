import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AGENT_FRAME_SEED,
  AGENT_FRAME_ONE_LINE,
  withAgentFrameSeed,
} from "../src/agent-frame-seed.js";
import { formatBootResultWithSeed } from "../src/tools/boot.js";
import { formatStatus } from "../src/tools/status.js";

describe("agent-frame-seed", () => {
  it("seed is Layer 1 and short", () => {
    const lines = AGENT_FRAME_SEED.trim().split(/\n/).length;
    assert.ok(lines <= 20, `seed lines=${lines}`);
    assert.ok(AGENT_FRAME_SEED.includes("Notes on disk are the record"));
    assert.ok(AGENT_FRAME_SEED.includes("accept"));
    assert.ok(!/Soft-Gate|Elite Plan|Session Now|Hub Now|Plane L/i.test(AGENT_FRAME_SEED));
  });

  it("withAgentFrameSeed prepends", () => {
    const out = withAgentFrameSeed("body");
    assert.ok(out.startsWith("# Agent frame"));
    assert.ok(out.includes("body"));
    assert.ok(out.includes(AGENT_FRAME_ONE_LINE.split(":")[0]!) || out.includes("notes on disk") || out.includes("Notes on disk"));
  });

  it("formatStatus uses Layer 1 headings", () => {
    const h = formatStatus({
      session_now: "focus",
      hub_now: "now",
      hub_path: "vault/Me.md",
    });
    assert.ok(h.includes("## Personal focus"));
    assert.ok(h.includes("## What’s true now") || h.includes("## What's true now"));
    assert.ok(!h.includes("## Session Now"));
    assert.ok(!h.includes("## Hub Now"));
  });

  it("formatBootResultWithSeed wraps attach and overlay only", () => {
    const base = {
      pack: "pulse" as const,
      files: [{ path: "x", ok: true, text: "t" }],
    };
    const pulse = formatBootResultWithSeed(base, withAgentFrameSeed);
    assert.ok(!pulse.startsWith("# Agent frame"));
    const attach = formatBootResultWithSeed(
      { ...base, pack: "attach" },
      withAgentFrameSeed
    );
    assert.ok(attach.startsWith("# Agent frame"));
    const overlay = formatBootResultWithSeed(
      { ...base, pack: "overlay" as const },
      withAgentFrameSeed
    );
    assert.ok(overlay.startsWith("# Agent frame"));
  });
});

