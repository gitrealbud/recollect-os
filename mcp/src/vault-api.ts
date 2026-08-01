/**
 * Vault REST for vault-ui / phone clients (Oracle host).
 *
 * Companion to MCP Streamable HTTP — not agent tools.
 * Auth: same Bearer JWT/static as /mcp.
 *
 * Routes (mounted under /vault-api):
 *   GET  /health
 *   GET  /notes              — list NoteMeta-like rows (walk vault/)
 *   GET  /note?path=         — one note body
 *   PUT  /note               — write body { path, content } if RECOLLECT_VAULT_API_WRITE=1
 *   DELETE /note?path=       — delete if write enabled
 *
 * Laws:
 *   - RECOLLECT_ROOT is vault parent (…/recollect); files under vault/
 *   - No apply_write semantics — this is host-mirror FS, not L5 gate
 *   - Write opt-in only (default read-only)
 *   - Refuse path traversal · Secrets/ · absolute paths
 */
import type { Express, NextFunction, Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { requireBearer } from "./http-auth.js";
import { appendAudit } from "./audit.js";

const SKIP_DIRS = new Set([".obsidian", "Attachments", "node_modules", ".git", "Secrets"]);

export type VaultApiNoteMeta = {
  path: string;
  name: string;
  dir: string;
  domain: string | null;
  type: string | null;
  sensitivity: string | null;
  heat: string | null;
  visibility: string | null;
  title: string;
  updated: string | null;
  size: number;
  mtime: number;
  archived: boolean;
  archiveReason: "heat-cold" | "archive-folder" | "flag" | null;
  publicDoc: boolean;
  publicReason: "visibility" | "flag" | "path" | null;
  sha: string | null;
};

function writeEnabled(): boolean {
  return process.env.RECOLLECT_VAULT_API_WRITE === "1";
}

function vaultDir(root: string): string {
  return path.join(root, "vault");
}

function cleanRel(raw: string): string {
  const cleaned = raw.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^vault\//i, "");
  if (!cleaned || cleaned.includes("..") || path.isAbsolute(cleaned)) {
    throw new Error("Invalid path");
  }
  if (cleaned.startsWith("Secrets/") || cleaned === "Secrets") {
    throw new Error("Secrets path refused");
  }
  return cleaned;
}

function parseFrontmatter(raw: string): Record<string, string> {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) return {};
  const end = raw.indexOf("\n---", 4);
  if (end === -1) return {};
  const block = raw.slice(4, end);
  const out: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function titleFromBody(name: string, raw: string): string {
  for (const line of raw.split("\n")) {
    if (line.startsWith("# ")) return line.slice(2).trim();
  }
  return name.replace(/\.md$/i, "");
}

function pathIsArchiveFolder(relPath: string): boolean {
  return /(^|\/)Archive(\/|$)/i.test(relPath);
}

function classifyArchive(
  pathRel: string,
  fm: Record<string, string>,
): { archived: boolean; archiveReason: VaultApiNoteMeta["archiveReason"] } {
  const heat = (fm.heat ?? "").trim().toLowerCase();
  const flag =
    /^(true|yes|1)$/i.test(fm.archived ?? "") ||
    /^(archived|archive|cold)$/i.test(fm.status ?? "");
  if (heat === "cold") return { archived: true, archiveReason: "heat-cold" };
  if (pathIsArchiveFolder(pathRel)) {
    return { archived: true, archiveReason: "archive-folder" };
  }
  if (flag) return { archived: true, archiveReason: "flag" };
  return { archived: false, archiveReason: null };
}

function classifyPublic(
  pathRel: string,
  fm: Record<string, string>,
): { publicDoc: boolean; publicReason: VaultApiNoteMeta["publicReason"] } {
  const visibility = (fm.visibility ?? fm.audience ?? fm.surface ?? "")
    .trim()
    .toLowerCase();
  if (
    visibility === "private" ||
    visibility === "internal" ||
    /^(false|no|0|private)$/i.test((fm.public ?? "").trim())
  ) {
    return { publicDoc: false, publicReason: null };
  }
  if (visibility === "public" || visibility === "face" || visibility === "package") {
    return { publicDoc: true, publicReason: "visibility" };
  }
  if (/^(true|yes|1|public)$/i.test((fm.public ?? "").trim())) {
    return { publicDoc: true, publicReason: "flag" };
  }
  const p = pathRel.replace(/\\/g, "/");
  if (
    /(^|\/)Public-Recollect/i.test(p) ||
    /(^|\/)PUBLIC-/i.test(p) ||
    /face-distribute/i.test(p) ||
    /(^|\/)Public\//i.test(p)
  ) {
    return { publicDoc: true, publicReason: "path" };
  }
  return { publicDoc: false, publicReason: null };
}

function toMeta(
  rel: string,
  name: string,
  dirRel: string,
  raw: string,
  size: number,
  mtime: number,
): VaultApiNoteMeta {
  const fm = parseFrontmatter(raw);
  const pathNorm = rel.replace(/\\/g, "/");
  const { archived, archiveReason } = classifyArchive(pathNorm, fm);
  const { publicDoc, publicReason } = classifyPublic(pathNorm, fm);
  return {
    path: pathNorm,
    name,
    dir: dirRel.replace(/\\/g, "/"),
    domain: fm.domain ?? null,
    type: fm.type ?? null,
    sensitivity: fm.sensitivity ?? null,
    heat: fm.heat ?? null,
    visibility: fm.visibility ?? fm.audience ?? fm.surface ?? null,
    title: titleFromBody(name, raw),
    updated: fm.updated ?? null,
    size,
    mtime,
    archived,
    archiveReason,
    publicDoc,
    publicReason,
    sha: null,
  };
}

async function walkNotes(
  dirAbs: string,
  dirRel: string,
): Promise<VaultApiNoteMeta[]> {
  let entries;
  try {
    entries = await fs.readdir(dirAbs, { withFileTypes: true });
  } catch {
    return [];
  }
  const notes: VaultApiNoteMeta[] = [];
  for (const ent of entries) {
    if (ent.name.startsWith(".")) continue;
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      const childRel = dirRel ? `${dirRel}/${ent.name}` : ent.name;
      notes.push(...(await walkNotes(path.join(dirAbs, ent.name), childRel)));
      continue;
    }
    if (!ent.name.endsWith(".md") || ent.name === ".gitkeep") continue;
    const rel = dirRel ? `${dirRel}/${ent.name}` : ent.name;
    const abs = path.join(dirAbs, ent.name);
    const [raw, stat] = await Promise.all([
      fs.readFile(abs, "utf8"),
      fs.stat(abs),
    ]);
    notes.push(toMeta(rel, ent.name, dirRel, raw, stat.size, stat.mtimeMs));
  }
  return notes;
}

async function authGate(
  req: Request,
  res: Response,
  root: string,
  next: NextFunction,
): Promise<void> {
  const auth = await requireBearer(req.header("authorization") ?? undefined);
  if (!auth.ok) {
    appendAudit(root, {
      event: "vault_api_auth",
      tool: "vault-api",
      code: auth.status === 503 ? "ROOT_INVALID" : "READ_DENIED",
      method: req.method,
      status: auth.status,
    });
    res.status(auth.status).json({ ok: false, error: auth.message });
    return;
  }
  (req as Request & { recollectAuth?: typeof auth }).recollectAuth = auth;
  next();
}

export function registerVaultApi(app: Express, root: string): void {
  const base = "/vault-api";

  app.get(`${base}/health`, (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "recollect-vault-api",
      write: writeEnabled(),
      root_set: Boolean(root),
    });
  });

  // Auth for all other vault-api routes
  app.use(base, (req, res, next) => {
    if (req.path === "/health" || req.path.endsWith("/health")) {
      next();
      return;
    }
    void authGate(req, res, root, next);
  });

  app.get(`${base}/notes`, async (_req, res) => {
    try {
      const vdir = vaultDir(root);
      const notes = await walkNotes(vdir, "");
      notes.sort((a, b) => a.path.localeCompare(b.path));
      appendAudit(root, {
        event: "vault_api",
        tool: "vault-api-list",
        code: "OK",
        method: "GET",
        status: 200,
      });
      res.status(200).json({ ok: true, count: notes.length, notes });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get(`${base}/note`, async (req, res) => {
    try {
      const rel = cleanRel(String(req.query.path ?? ""));
      if (!rel.endsWith(".md")) {
        res.status(400).json({ ok: false, error: "Only .md notes" });
        return;
      }
      const abs = path.join(vaultDir(root), rel);
      const resolved = path.resolve(abs);
      const vroot = path.resolve(vaultDir(root));
      if (!resolved.startsWith(vroot + path.sep) && resolved !== vroot) {
        res.status(400).json({ ok: false, error: "Path escapes vault" });
        return;
      }
      const raw = await fs.readFile(resolved, "utf8");
      const stat = await fs.stat(resolved);
      const name = path.basename(rel);
      const dir = path.posix.dirname(rel.replace(/\\/g, "/"));
      const meta = toMeta(
        rel,
        name,
        dir === "." ? "" : dir,
        raw,
        stat.size,
        stat.mtimeMs,
      );
      res.status(200).json({ ok: true, path: rel, content: raw, meta });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = msg.includes("Invalid") || msg.includes("Secrets") ? 400 : 404;
      res.status(status).json({ ok: false, error: msg });
    }
  });

  app.put(`${base}/note`, async (req, res) => {
    if (!writeEnabled()) {
      res.status(403).json({
        ok: false,
        error: "Vault API write disabled. Set RECOLLECT_VAULT_API_WRITE=1 on host.",
      });
      return;
    }
    try {
      const body = req.body as { path?: string; content?: string };
      const rel = cleanRel(String(body.path ?? ""));
      if (!rel.endsWith(".md")) {
        res.status(400).json({ ok: false, error: "Only .md notes" });
        return;
      }
      const content = typeof body.content === "string" ? body.content : "";
      const bodyOut = content.endsWith("\n") ? content : `${content}\n`;
      const abs = path.join(vaultDir(root), rel);
      const resolved = path.resolve(abs);
      const vroot = path.resolve(vaultDir(root));
      if (!resolved.startsWith(vroot + path.sep) && resolved !== vroot) {
        res.status(400).json({ ok: false, error: "Path escapes vault" });
        return;
      }
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, bodyOut, "utf8");
      appendAudit(root, {
        event: "vault_api",
        tool: "vault-api-write",
        code: "OK",
        method: "PUT",
        status: 200,
      });
      res.status(200).json({
        ok: true,
        path: rel,
        bytes: Buffer.byteLength(bodyOut),
        note: "Host mirror write — PC git remains commit SoT; sync deliberately",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(400).json({ ok: false, error: msg });
    }
  });

  app.delete(`${base}/note`, async (req, res) => {
    if (!writeEnabled()) {
      res.status(403).json({
        ok: false,
        error: "Vault API write disabled. Set RECOLLECT_VAULT_API_WRITE=1 on host.",
      });
      return;
    }
    try {
      const rel = cleanRel(String(req.query.path ?? ""));
      if (!rel.endsWith(".md")) {
        res.status(400).json({ ok: false, error: "Only .md notes" });
        return;
      }
      const abs = path.join(vaultDir(root), rel);
      const resolved = path.resolve(abs);
      const vroot = path.resolve(vaultDir(root));
      if (!resolved.startsWith(vroot + path.sep) && resolved !== vroot) {
        res.status(400).json({ ok: false, error: "Path escapes vault" });
        return;
      }
      await fs.unlink(resolved);
      appendAudit(root, {
        event: "vault_api",
        tool: "vault-api-delete",
        code: "OK",
        method: "DELETE",
        status: 200,
      });
      res.status(200).json({ ok: true, path: rel });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(msg.includes("ENOENT") ? 404 : 400).json({ ok: false, error: msg });
    }
  });
}
