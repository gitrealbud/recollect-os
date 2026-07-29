/**
 * recollect-os promote — membrane risk report (dry-run only).
 * Never writes. Never auto-syncs. Human scrub + propose→accept still required.
 */
import fs from "node:fs";
import path from "node:path";
import { isVaultRoot } from "./fsutil.js";

export type PromoteOptions = {
  root: string;
  dryRun?: boolean;
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

function frontmatterSensitivity(text: string): string | null {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return null;
  const fm = text.slice(3, end);
  const m = fm.match(/^sensitivity:\s*(\S+)/m);
  return m ? m[1].trim() : null;
}

export function runPromote(opts: PromoteOptions): PromoteResult {
  const lines: string[] = [];
  const abs = path.resolve(opts.root);
  const dryRun = opts.dryRun !== false;

  if (!dryRun) {
    lines.push(
      "FAIL promote without --dry-run is not supported (no auto-sync; refuse write)"
    );
    return { ok: false, lines };
  }

  if (!isVaultRoot(abs)) {
    lines.push(`FAIL not a vault root: ${abs}`);
    return { ok: false, lines };
  }

  lines.push(`INFO promote dry-run — report only; no files written`);
  lines.push(`INFO root ${abs}`);

  const vaultDir = path.join(abs, "vault");
  const files: string[] = [];
  walkMarkdown(vaultDir, abs, files);

  let risk = 0;
  for (const rel of files) {
    const reasons: string[] = [];
    for (const pref of FORBIDDEN_PREFIXES) {
      if (rel.startsWith(pref) || rel === pref.slice(0, -1)) {
        reasons.push(`path prefix ${pref}`);
      }
    }
    if (CREDENTIAL_NAME.test(rel)) reasons.push("credential-like name");

    let text = "";
    try {
      text = fs.readFileSync(path.join(abs, rel), "utf8");
    } catch {
      reasons.push("unreadable");
    }
    const sens = text ? frontmatterSensitivity(text) : null;
    if (sens === "restricted" || sens === "personal") {
      reasons.push(`sensitivity: ${sens}`);
    }

    if (reasons.length > 0) {
      risk += 1;
      lines.push(`RISK ${rel} — ${reasons.join("; ")}`);
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
    "INFO next: scrub manually → propose public subset → accept; never auto-sync"
  );
  return { ok: true, lines };
}
