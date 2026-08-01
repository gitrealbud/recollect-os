/**
 * Stable machine-readable error codes for MCP tools + CLI.
 * Envelope: { ok, code?, message, ...payload }
 */

export type ErrorCode =
  | "POLICY"
  | "FORBIDDEN_PATH"
  | "FORBIDDEN_CONTENT"
  | "ACCEPT_REQUIRED"
  | "PROPOSAL_EXPIRED"
  | "PROPOSAL_NOT_FOUND"
  | "INVALID_ID"
  | "BUDGET"
  | "ROOT_INVALID"
  | "PATH_TRAVERSAL"
  | "PATH_ABSOLUTE"
  | "PATH_EMPTY"
  | "PATH_INVALID"
  | "READ_DENIED"
  | "WRITE_DENIED"
  | "UNKNOWN_PACK"
  | "AMBIGUOUS"
  | "OK";

export class RecollectError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "RecollectError";
    this.code = code;
    this.details = details;
  }
}

export type ToolEnvelope = {
  ok: boolean;
  code?: ErrorCode;
  message: string;
  tool?: string;
  [key: string]: unknown;
};

export function envelopeOk(
  tool: string,
  message: string,
  extra: Record<string, unknown> = {}
): ToolEnvelope {
  return { ok: true, code: "OK", message, tool, ...extra };
}

export function envelopeErr(
  tool: string,
  code: ErrorCode,
  message: string,
  extra: Record<string, unknown> = {}
): ToolEnvelope {
  return { ok: false, code, message, tool, ...extra };
}

export function formatEnvelope(env: ToolEnvelope): string {
  return JSON.stringify(env, null, 2) + "\n";
}

export function codeFromUnknown(e: unknown): ErrorCode {
  if (e instanceof RecollectError) return e.code;
  if (e && typeof e === "object" && "code" in e) {
    return (e as { code: ErrorCode }).code;
  }
  return "POLICY";
}

export function messageFromUnknown(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Map common policy message fragments to stable codes (legacy throw sites). */
export function classifyPolicyMessage(msg: string): ErrorCode {
  const m = msg.toLowerCase();
  if (m.includes("accept: true")) return "ACCEPT_REQUIRED";
  if (m.includes("proposal expired")) return "PROPOSAL_EXPIRED";
  if (m.includes("not found") || m.includes("already applied"))
    return "PROPOSAL_NOT_FOUND";
  if (m.includes("invalid proposal")) return "INVALID_ID";
  if (m.includes("traversal")) return "PATH_TRAVERSAL";
  if (m.includes("absolute")) return "PATH_ABSOLUTE";
  if (m.includes("path is empty")) return "PATH_EMPTY";
  if (m.includes("invalid path")) return "PATH_INVALID";
  if (m.includes("denied by policy") || m.includes("allowlist"))
    return m.includes("read") ? "READ_DENIED" : "FORBIDDEN_PATH";
  if (m.includes("forbidden")) return "FORBIDDEN_PATH";
  if (m.includes("restricted")) return "FORBIDDEN_CONTENT";
  if (m.includes("unknown boot pack")) return "UNKNOWN_PACK";
  if (m.includes("recollect_root") || m.includes("vault root"))
    return "ROOT_INVALID";
  return "POLICY";
}
