import { PolicyError } from "../allowlist.js";
import { appendAudit } from "../audit.js";
import { createProposal } from "../proposals.js";
import { assertWritablePath, classifyWrite } from "../write_class.js";

export type ProposeWriteInput = {
  path: string;
  content: string;
};

export type ProposeWriteResult = {
  class: string;
  proposal_id: string | null;
  draft_summary: string | null;
  path: string;
  error?: string;
  code?: string;
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
 * Classify + stage a write. Never durable-writes.
 */
export function runProposeWrite(
  root: string,
  input: ProposeWriteInput
): ProposeWriteResult {
  if (input.content == null) {
    throw new PolicyError("content is required");
  }

  let pathRel: string;
  try {
    pathRel = assertWritablePath(input.path);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    appendAudit(root, {
      event: "refuse",
      tool: "propose_write",
      code: "FORBIDDEN_PATH",
      path: input.path,
    });
    return {
      class: "Forbidden",
      proposal_id: null,
      draft_summary: null,
      path: input.path,
      error: msg,
      code: "FORBIDDEN_PATH",
    };
  }

  const cls = classifyWrite(pathRel, input.content);
  if (cls === "Forbidden") {
    appendAudit(root, {
      event: "refuse",
      tool: "propose_write",
      code: "FORBIDDEN_CONTENT",
      path: pathRel,
      class: "Forbidden",
    });
    return {
      class: "Forbidden",
      proposal_id: null,
      draft_summary: null,
      path: pathRel,
      error: "Not allowed by tools — no proposal id; no accept path",
      code: "FORBIDDEN_CONTENT",
    };
  }

  // Auto is not used here — capture_inbox owns Auto
  const stageClass = cls === "Auto" ? "Propose" : cls;
  const rec = createProposal(root, {
    path: pathRel,
    content: input.content,
    class: stageClass,
  });

  return {
    class: stageClass,
    proposal_id: rec.id,
    draft_summary: rec.draft_summary,
    path: pathRel,
    code: "OK",
  };
}

export function formatProposeWrite(r: ProposeWriteResult): string {
  if (r.class === "Forbidden" || !r.proposal_id) {
    return (
      `# propose_write\n\n` +
      `class: ${plainClass(r.class)}\n` +
      `code: ${r.code ?? "FORBIDDEN_PATH"}\n` +
      `path: ${r.path}\n` +
      `error: ${r.error ?? "refused"}\n` +
      `Accept path: none\n`
    );
  }
  return (
    `# propose_write\n\n` +
    `class: ${plainClass(r.class)}\n` +
    `code: OK\n` +
    `proposal_id: ${r.proposal_id}\n` +
    `path: ${r.path}\n` +
    `draft_summary: ${r.draft_summary}\n\n` +
    `No permanent write yet. Operator: recollect-os accept ${r.proposal_id}  (or apply_write accept:true).\n`
  );
}
