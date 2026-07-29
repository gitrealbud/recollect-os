import fs from "node:fs";
import path from "node:path";
import { resolveUnderRoot } from "../allowlist.js";
import { appendAudit, writeHistory } from "../audit.js";
import { RecollectError } from "../errors.js";
import { deleteProposal, loadProposal } from "../proposals.js";
import { assertWritablePath, classifyWrite } from "../write_class.js";

export type ApplyWriteInput = {
  proposal_id: string;
  accept: boolean;
};

export type ApplyWriteResult = {
  path: string;
  class: string;
  applied: boolean;
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
 * Sole durable path for Propose / Human-gate via MCP.
 */
export function runApplyWrite(
  root: string,
  input: ApplyWriteInput
): ApplyWriteResult {
  if (!input.accept) {
    appendAudit(root, {
      event: "refuse",
      tool: "apply_write",
      code: "ACCEPT_REQUIRED",
      proposal_id: input.proposal_id,
    });
    throw new RecollectError(
      "ACCEPT_REQUIRED",
      "apply_write requires accept: true — operator must explicitly accept"
    );
  }
  if (!input.proposal_id?.trim()) {
    throw new RecollectError("INVALID_ID", "proposal_id is required");
  }

  const rec = loadProposal(root, input.proposal_id.trim());
  if (rec.class === "Forbidden") {
    deleteProposal(root, rec.id);
    appendAudit(root, {
      event: "refuse",
      tool: "apply_write",
      code: "FORBIDDEN_PATH",
      path: rec.path,
      proposal_id: rec.id,
      class: rec.class,
    });
    throw new RecollectError(
      "FORBIDDEN_PATH",
      "Not allowed proposals cannot be applied"
    );
  }

  // Re-classify at apply time — path may have become Forbidden
  try {
    assertWritablePath(rec.path);
  } catch (e) {
    deleteProposal(root, rec.id);
    const msg = e instanceof Error ? e.message : String(e);
    appendAudit(root, {
      event: "refuse",
      tool: "apply_write",
      code: "FORBIDDEN_PATH",
      path: rec.path,
      proposal_id: rec.id,
    });
    throw new RecollectError(
      "FORBIDDEN_PATH",
      `path now not allowed by tools — ${msg}`
    );
  }
  const liveClass = classifyWrite(rec.path, rec.content);
  if (liveClass === "Forbidden") {
    deleteProposal(root, rec.id);
    appendAudit(root, {
      event: "refuse",
      tool: "apply_write",
      code: "FORBIDDEN_CONTENT",
      path: rec.path,
      proposal_id: rec.id,
    });
    throw new RecollectError(
      "FORBIDDEN_CONTENT",
      "path now not allowed by tools — content classification refused"
    );
  }

  const pathRel = assertWritablePath(rec.path);
  const { abs } = resolveUnderRoot(root, pathRel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, rec.content, "utf8");
  deleteProposal(root, rec.id);
  writeHistory(root, {
    id: rec.id,
    path: pathRel,
    class: rec.class,
    outcome: "accepted",
    ts: new Date().toISOString(),
  });
  appendAudit(root, {
    event: "accept",
    tool: "apply_write",
    code: "OK",
    path: pathRel,
    proposal_id: rec.id,
    class: rec.class,
  });

  return { path: pathRel, class: rec.class, applied: true };
}

export function formatApplyWrite(r: ApplyWriteResult): string {
  return (
    `# apply_write\n\n` +
    `applied: true\n` +
    `class: ${plainClass(r.class)}\n` +
    `path: ${r.path}\n\n` +
    `Git commit is operator/host duty (MCP writes working tree only).\n`
  );
}
