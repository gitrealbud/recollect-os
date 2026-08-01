/**
 * recollect-os promote — membrane report + optional stage into a public thoughts vault.
 *
 * Never auto-syncs the tree. --stage only proposes one path on --public-root (accept still required).
 */
import fs from "node:fs";
import path from "node:path";
import { isVaultRoot } from "./fsutil.js";
import { runCliPropose } from "./propose.js";

export type PromoteOptions = {
  root: string;
  /** Default true for report-only. Stage mode sets dryRun false after checks. */
  dryRun?: boolean;
  publicRoot?: string;
  /** Vault-relative path to stage into public root (e.g. vault/Essays/foo.md) */
  path?: string;
  /** When true with path + publicRoot: propose on public vault */
  stage?: boolean;
};

export type PromoteResult = {
  ok: boolean;
  lines: string[];
};

const FORBIDDEN_PREFIXES = [
  "vault/Secrets/",
  "vault/Archive/",
  "vault/People/",
];

const NEVER_PROMOTE_EXACT = new Set([
  "RECOLLECT.md",
  "vault/Me.md",
  "vault/Preferences.md",
  "vault/Map.md",
]);

const CREDENTIAL_NAME =
  /(^|\/)(\.env|credentials|secrets?|api[-_]?keys?)(\.|\/|$)/i;

function walkMarkdown(dir: string, base: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === ".recollect") {
      continue;
    }
    const full = path.join(dir, name);
    const rel = path.relative(base, full).replace(/\\/g, "/");
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walkMarkdown(full, base, out);
      continue;
    }
    if (name.endsWith(".md")) out.push(rel);
  }
}

function frontmatterField(text: string, key: string): string | null {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return null;
  const fm = text.slice(3, end);
  const re = new RegExp(`^${key}:\\s*(\\S+)`, "m");
  const m = fm.match(re);
  return m ? m[1].trim() : null;
}

function riskReasons(rel: string, text: string): string[] {
  const reasons: string[] = [];
  for (const pref of FORBIDDEN_PREFIXES) {
    if (rel.startsWith(pref) || rel === pref.slice(0, -1)) {
      reasons.push(`path prefix ${pref}`);
    }
  }
  if (CREDENTIAL_NAME.test(rel)) reasons.push("credential-like name");
  if (NEVER_PROMOTE_EXACT.has(rel)) reasons.push("live/identity law path");
  const sens = frontmatterField(text, "sensitivity");
  if (sens === "restricted" || sens === "personal") {
    reasons.push(`sensitivity: ${sens}`);
  }
  return reasons;
}

function withPublishedBanner(body: string): string {
  const marker = "> **Published.** Snapshot for a public thoughts repo — not live private status.";
  if (body.includes("**Published.** Snapshot")) return body;
  if (body.startsWith("---")) {
    const end = body.indexOf("\n---", 3);
    if (end >= 0) {
      const head = body.slice(0, end + 4);
      const rest = body.slice(end + 4).replace(/^\r?\n/, "");
      return `${head}\n\n${marker}\n\n${rest}`;
    }
  }
  return `${marker}\n\n${body}`;
}

export function runPromote(opts: PromoteOptions): PromoteResult {
  const lines: string[] = [];
  const abs = path.resolve(opts.root);
  const stage = opts.stage === true;
  const relPath = opts.path?.replace(/\\/g, "/");
  const publicRootRaw = opts.publicRoot?.trim() || process.env.RECOLLECT_PUBLIC_ROOT;
  const publicRoot = publicRootRaw ? path.resolve(publicRootRaw) : undefined;
  // dry-run default unless staging (stage writes a proposal only)
  const dryRun = stage ? false : opts.dryRun !== false;

  if (!stage && !dryRun) {
    lines.push(
      "FAIL promote without --dry-run is not supported unless --stage (no auto-sync tree write)"
    );
    return { ok: false, lines };
  }

  if (!isVaultRoot(abs)) {
    lines.push(`FAIL not a vault root: ${abs}`);
    return { ok: false, lines };
  }

  if (publicRoot) {
    if (path.resolve(publicRoot) === abs) {
      lines.push("FAIL --public-root must differ from private --root");
      return { ok: false, lines };
    }
    if (!isVaultRoot(publicRoot)) {
      lines.push(
        `FAIL public root is not a vault (need RECOLLECT.md + vault/): ${publicRoot}`
      );
      lines.push("INFO init one: recollect-os init <public-dir>");
      return { ok: false, lines };
    }
  }

  if (stage) {
    if (!publicRoot) {
      lines.push("FAIL --stage requires --public-root or RECOLLECT_PUBLIC_ROOT");
      return { ok: false, lines };
    }
    if (!relPath) {
      lines.push("FAIL --stage requires --path <vault-relative.md>");
      return { ok: false, lines };
    }
    if (!relPath.endsWith(".md") || relPath.includes("..")) {
      lines.push("FAIL --path must be a vault-relative .md without ..");
      return { ok: false, lines };
    }

    const src = path.join(abs, relPath);
    if (!fs.existsSync(src)) {
      lines.push(`FAIL missing private path: ${relPath}`);
      return { ok: false, lines };
    }

    let text = "";
    try {
      text = fs.readFileSync(src, "utf8");
    } catch {
      lines.push(`FAIL unreadable: ${relPath}`);
      return { ok: false, lines };
    }

    const reasons = riskReasons(relPath, text);
    if (reasons.length > 0) {
      lines.push(`FAIL membrane blocks promote: ${relPath} — ${reasons.join("; ")}`);
      return { ok: false, lines };
    }

    const vis = frontmatterField(text, "visibility");
    if (vis !== "public") {
      lines.push(
        `FAIL set frontmatter visibility: public on ${relPath} before --stage (or leave private)`
      );
      return { ok: false, lines };
    }

    const content = withPublishedBanner(text);
    const proposed = runCliPropose(publicRoot, { path: relPath, content });
    for (const line of proposed.body.trimEnd().split(/\r?\n/)) {
      if (line) lines.push(line);
    }
    if (!proposed.ok) {
      lines.push("FAIL stage propose on public root failed");
      return { ok: false, lines };
    }
    lines.push(`INFO staged on public root ${publicRoot}`);
    lines.push(
      `INFO next: recollect-os accept --latest --root ${publicRoot} · then git commit/push`
    );
    lines.push("INFO never dual-home live status strips — public copy is a snapshot");
    return { ok: true, lines };
  }

  // Report mode
  lines.push(`INFO promote dry-run — report only; no files written`);
  lines.push(`INFO private root ${abs}`);
  if (publicRoot) {
    lines.push(`INFO public root ${publicRoot} (vault OK; not written)`);
  } else {
    lines.push(
      `INFO no --public-root / RECOLLECT_PUBLIC_ROOT — candidates listed; stage needs a public vault`
    );
  }

  const vaultDir = path.join(abs, "vault");
  const files: string[] = [];
  walkMarkdown(vaultDir, abs, files);

  let risk = 0;
  let candidates = 0;
  for (const rel of files) {
    let text = "";
    try {
      text = fs.readFileSync(path.join(abs, rel), "utf8");
    } catch {
      risk += 1;
      lines.push(`RISK ${rel} — unreadable`);
      continue;
    }

    const reasons = riskReasons(rel, text);
    if (reasons.length > 0) {
      risk += 1;
      lines.push(`RISK ${rel} — ${reasons.join("; ")}`);
      continue;
    }

    const vis = frontmatterField(text, "visibility");
    if (vis === "public") {
      candidates += 1;
      lines.push(`CANDIDATE ${rel} — visibility: public`);
    }
  }

  if (risk === 0) {
    lines.push(
      `PASS no membrane risks flagged in ${files.length} vault markdown files`
    );
  } else {
    lines.push(
      `INFO ${risk} risk path(s) of ${files.length} — scrub before any public promote`
    );
  }

  lines.push(
    `INFO ${candidates} promote candidate(s) with visibility: public`
  );
  lines.push(
    "INFO stage one: promote --stage --path <rel> --public-root <dir> · then accept on public root"
  );
  lines.push("INFO never auto-sync; never dual-home live status across roots");
  return { ok: true, lines };
}
