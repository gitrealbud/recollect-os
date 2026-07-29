import fs from "node:fs";
import path from "node:path";
import { runBoot } from "recollect-os-mcp/boot";
import { formatStatus, runStatus } from "recollect-os-mcp/status";
import { listProposals } from "recollect-os-mcp/proposals";
import { formatPendingList } from "./accept.js";
import { isVaultRoot } from "./fsutil.js";

export type HealthFlags = {
  mcp: boolean;
  root: boolean;
  law: boolean;
};

export type CliStatusResult = {
  ok: boolean;
  root: string;
  health: HealthFlags;
  body: string;
};

/**
 * CLI glance: personal focus / project Now + pending proposals + health.
 * MCP reachable = in-process boot(attach) handler (no host daemon).
 */
export function runCliStatus(
  root: string,
  intent?: string | null
): CliStatusResult {
  const abs = path.resolve(root);
  const health: HealthFlags = {
    mcp: false,
    root: isVaultRoot(abs),
    law:
      fs.existsSync(path.join(abs, "docs", "LAW.md")) ||
      fs.existsSync(path.join(abs, "RECOLLECT.md")),
  };

  if (!health.root) {
    return {
      ok: false,
      root: abs,
      health,
      body:
        `RECOLLECT_ROOT invalid (need RECOLLECT.md + vault/): ${abs}\n` +
        healthLine(health),
    };
  }

  try {
    const boot = runBoot(abs, "attach");
    health.mcp = boot.files.some((f) => f.ok);
  } catch {
    health.mcp = false;
  }

  const status = runStatus(abs, intent);
  const pending = listProposals(abs);
  const pendingBlock =
    pending.length > 0 ? "\n" + formatPendingList(pending) + "\n" : "";

  const body =
    formatStatus(status).trimEnd() +
    pendingBlock +
    "\n\n" +
    healthLine(health) +
    "\n";

  const ok = health.mcp && health.root && health.law;
  return { ok, root: abs, health, body };
}

function healthLine(h: HealthFlags): string {
  const flag = (ok: boolean) => (ok ? "pass" : "fail");
  return `health: MCP ${flag(h.mcp)} · RECOLLECT_ROOT ${flag(h.root)} · law docs ${flag(h.law)}`;
}
