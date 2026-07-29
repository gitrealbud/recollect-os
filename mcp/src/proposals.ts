import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PROPOSAL_TTL_MS } from "./budgets.js";
import { RecollectError } from "./errors.js";
import type { WriteClass } from "./write_class.js";
import { appendAudit, writeHistory } from "./audit.js";

export { PROPOSAL_TTL_MS };

export type ProposalRecord = {
  id: string;
  path: string;
  content: string;
  class: WriteClass;
  createdAt: string;
  expiresAt: string;
  draft_summary: string;
};

/** Injectable clock for TTL tests. */
let nowFn: () => number = () => Date.now();

export function setProposalNow(fn: (() => number) | null): void {
  nowFn = fn ?? (() => Date.now());
}

export function proposalNow(): number {
  return nowFn();
}

function proposalsDir(root: string): string {
  return path.join(root, ".recollect", "proposals");
}

export function ensureProposalsDir(root: string): string {
  const dir = proposalsDir(root);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function summaryOf(content: string, max = 160): string {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      const h = line.replace(/^#{1,3}\s+/, "").trim();
      if (h) return h.length <= max ? h : h.slice(0, max - 1) + "…";
    }
    if (/^(next action|next:|##?\s*now)\b/i.test(line)) {
      return line.length <= max ? line : line.slice(0, max - 1) + "…";
    }
  }
  const one = content.replace(/\s+/g, " ").trim();
  return one.length <= max ? one : one.slice(0, max - 1) + "…";
}

export function createProposal(
  root: string,
  opts: { path: string; content: string; class: WriteClass }
): ProposalRecord {
  const dir = ensureProposalsDir(root);
  const id = crypto.randomBytes(8).toString("hex");
  const now = proposalNow();
  const rec: ProposalRecord = {
    id,
    path: opts.path,
    content: opts.content,
    class: opts.class,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + PROPOSAL_TTL_MS).toISOString(),
    draft_summary: summaryOf(opts.content),
  };
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(rec, null, 2), "utf8");
  appendAudit(root, {
    event: "propose",
    tool: "propose_write",
    code: "OK",
    path: rec.path,
    proposal_id: rec.id,
    class: rec.class,
  });
  return rec;
}

export function loadProposal(root: string, id: string): ProposalRecord {
  if (!/^[a-f0-9]{8,32}$/i.test(id)) {
    throw new RecollectError("INVALID_ID", "invalid proposal_id");
  }
  const file = path.join(proposalsDir(root), `${id}.json`);
  if (!fs.existsSync(file)) {
    throw new RecollectError(
      "PROPOSAL_NOT_FOUND",
      "proposal not found or already applied/expired"
    );
  }
  const rec = JSON.parse(fs.readFileSync(file, "utf8")) as ProposalRecord;
  if (Date.parse(rec.expiresAt) < proposalNow()) {
    fs.unlinkSync(file);
    appendAudit(root, {
      event: "expire",
      tool: "proposals",
      code: "PROPOSAL_EXPIRED",
      path: rec.path,
      proposal_id: rec.id,
      class: rec.class,
    });
    throw new RecollectError("PROPOSAL_EXPIRED", "proposal expired");
  }
  return rec;
}

export function deleteProposal(root: string, id: string): void {
  const file = path.join(proposalsDir(root), `${id}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

/**
 * Pending Propose/Human-gate drafts, newest first. Expired files cleaned via loadProposal.
 */
export function listProposals(root: string): ProposalRecord[] {
  const dir = proposalsDir(root);
  if (!fs.existsSync(dir)) return [];
  const out: ProposalRecord[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    const id = name.slice(0, -5);
    try {
      out.push(loadProposal(root, id));
    } catch {
      /* expired / invalid cleaned or skipped */
    }
  }
  return out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export { writeHistory };
