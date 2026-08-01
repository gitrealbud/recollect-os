/**
 * Privacy-safe local audit trail under .recollect/
 * Never logs vault body content by default.
 */
import fs from "node:fs";
import path from "node:path";
import type { ErrorCode } from "./errors.js";

export type AuditEvent =
  | "refuse"
  | "propose"
  | "accept"
  | "expire"
  | "doctor"
  | "http_auth"
  | "http_request"
  | "vault_api"
  | "vault_api_auth";

export type AuditRecord = {
  ts: string;
  event: AuditEvent;
  tool: string;
  code: ErrorCode | string;
  path?: string;
  proposal_id?: string;
  class?: string;
  /** HTTP method or transport tag — never request body */
  method?: string;
  /** HTTP status when relevant */
  status?: number;
};

function auditEnabled(): boolean {
  return process.env.RECOLLECT_AUDIT !== "0";
}

function debugEnabled(): boolean {
  return process.env.RECOLLECT_DEBUG === "1";
}

function recollectDir(root: string): string {
  return path.join(root, ".recollect");
}

export function auditPath(root: string): string {
  return path.join(recollectDir(root), "audit.jsonl");
}

export function historyDir(root: string): string {
  return path.join(recollectDir(root), "history");
}

/** Strip any accidental content keys. */
function sanitize(rec: AuditRecord): AuditRecord {
  const out: AuditRecord = {
    ts: rec.ts,
    event: rec.event,
    tool: rec.tool,
    code: rec.code,
  };
  if (rec.path) out.path = rec.path;
  if (rec.proposal_id) out.proposal_id = rec.proposal_id;
  if (rec.class) out.class = rec.class;
  if (rec.method) out.method = rec.method;
  if (typeof rec.status === "number") out.status = rec.status;
  return out;
}

export function appendAudit(
  root: string,
  partial: Omit<AuditRecord, "ts"> & { ts?: string }
): void {
  if (!auditEnabled()) return;
  const rec = sanitize({
    ts: partial.ts ?? new Date().toISOString(),
    event: partial.event,
    tool: partial.tool,
    code: partial.code,
    path: partial.path,
    proposal_id: partial.proposal_id,
    class: partial.class,
    method: partial.method,
    status: partial.status,
  });
  const dir = recollectDir(root);
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(auditPath(root), JSON.stringify(rec) + "\n", "utf8");
  if (debugEnabled()) {
    console.error(
      `recollect-audit ${rec.event} ${rec.code} ${rec.path ?? ""} ${rec.proposal_id ?? ""}`.trim()
    );
  }
}

export type HistoryMeta = {
  id: string;
  path: string;
  class: string;
  outcome: "accepted" | "refused";
  ts: string;
};

export function writeHistory(root: string, meta: HistoryMeta): void {
  const dir = historyDir(root);
  fs.mkdirSync(dir, { recursive: true });
  // No content field — path/class/outcome only
  const safe = {
    id: meta.id,
    path: meta.path,
    class: meta.class,
    outcome: meta.outcome,
    ts: meta.ts,
  };
  fs.writeFileSync(
    path.join(dir, `${meta.id}.json`),
    JSON.stringify(safe, null, 2),
    "utf8"
  );
}

export function readAuditTail(root: string, max = 50): AuditRecord[] {
  const p = auditPath(root);
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean);
  return lines.slice(-max).map((l) => JSON.parse(l) as AuditRecord);
}

export function recentAcceptPaths(root: string, withinMs = 7 * 24 * 60 * 60 * 1000): Set<string> {
  const cutoff = Date.now() - withinMs;
  const paths = new Set<string>();
  for (const rec of readAuditTail(root, 500)) {
    if (rec.event !== "accept" || !rec.path) continue;
    if (Date.parse(rec.ts) >= cutoff) paths.add(rec.path.replace(/\\/g, "/"));
  }
  return paths;
}
