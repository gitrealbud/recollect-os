import {
  formatApplyWrite,
  runApplyWrite,
  type ApplyWriteResult,
} from "recollect-os-mcp/apply_write";
import { listProposals } from "recollect-os-mcp/proposals";
import {
  RecollectError,
  classifyPolicyMessage,
} from "recollect-os-mcp/errors";
import path from "node:path";
import { isVaultRoot } from "./fsutil.js";

export type CliAcceptResult = {
  ok: boolean;
  body: string;
  applied?: ApplyWriteResult;
};

const ACTIONABLE: Record<string, string> = {
  PROPOSAL_EXPIRED:
    "Proposal expired — re-run propose, then accept the new id.",
  PROPOSAL_NOT_FOUND:
    "Proposal not found or already applied — check recollect-os status for pending ids.",
  INVALID_ID: "Invalid proposal id — use the id from propose / status.",
  FORBIDDEN_PATH:
    "Path not allowed by tools — cannot apply. Adjust path or content and re-propose.",
  FORBIDDEN_CONTENT:
    "Content not allowed (restricted / dual-domain) — cannot apply.",
  ACCEPT_REQUIRED: "Accept requires explicit apply (accept: true).",
  ROOT_INVALID: "Vault root invalid — pass --root or set RECOLLECT_ROOT.",
};

function plainClass(c: string | undefined): string {
  switch (c) {
    case "Auto":
      return "safe (auto)";
    case "Propose":
      return "draft (needs accept)";
    case "Human-gate":
      return "ask first (irreversible / high-stakes)";
    case "Forbidden":
      return "not allowed by tools";
    default:
      return c ?? "unknown";
  }
}

/**
 * Apply a pending proposal (same path as MCP apply_write accept:true).
 * --latest only when exactly one pending proposal.
 */
export function runCliAccept(
  root: string,
  opts: { id?: string; latest?: boolean }
): CliAcceptResult {
  const abs = path.resolve(root);
  if (!isVaultRoot(abs)) {
    return {
      ok: false,
      body: `RECOLLECT_ROOT invalid (need RECOLLECT.md + vault/): ${abs}\ncode: ROOT_INVALID\n`,
    };
  }

  let proposalId = opts.id?.trim();
  if (opts.latest) {
    const pending = listProposals(abs);
    if (pending.length === 0) {
      return {
        ok: false,
        body: "No pending proposals.\ncode: PROPOSAL_NOT_FOUND\n",
      };
    }
    if (pending.length > 1) {
      return {
        ok: false,
        body:
          `Multiple pending proposals (${pending.length}) — pass an id, not --latest.\n` +
          `code: AMBIGUOUS\n` +
          formatPendingList(pending) +
          "\n",
      };
    }
    proposalId = pending[0].id;
  }

  if (!proposalId) {
    return {
      ok: false,
      body: "Usage: recollect-os accept <proposal_id> | accept --latest\n",
    };
  }

  try {
    const pending = listProposals(abs);
    const rec = pending.find((p) => p.id === proposalId);
    const warn =
      rec?.class === "Human-gate"
        ? `Note: this change is marked ask-first (irreversible / high-stakes) — applying ${proposalId}.\n\n`
        : "";

    const applied = runApplyWrite(abs, {
      proposal_id: proposalId,
      accept: true,
    });
    return {
      ok: true,
      applied,
      body: warn + formatApplyWrite(applied),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const code =
      e instanceof RecollectError
        ? e.code
        : classifyPolicyMessage(message);
    const tip = ACTIONABLE[code] ?? "See recollect-os status / doctor for pending and wire health.";
    return {
      ok: false,
      body: `${message}\ncode: ${code}\nnext: ${tip}\n`,
    };
  }
}

export function formatPendingList(
  pending: ReturnType<typeof listProposals>
): string {
  if (pending.length === 0) return "";
  let out = `Pending (${pending.length})\n`;
  for (const p of pending) {
    out +=
      `  id: ${p.id}  path: ${p.path}  class: ${plainClass(p.class)}\n` +
      `  draft: ${p.draft_summary}\n`;
  }
  out +=
    `\nAccept: recollect-os accept <id>   or   recollect-os accept --latest\n` +
    `(Windows: recollect-os.cmd … if bare npx misses the bin)\n`;
  return out;
}
