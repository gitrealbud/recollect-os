/**
 * recollect-os doctor — vault health, wire, proposals, optional git mediation check.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { listProposals } from "recollect-os-mcp/proposals";
import { readAuditTail, recentAcceptPaths } from "recollect-os-mcp/audit";
import { isVaultRoot, resolveMcpDist } from "./fsutil.js";

export type DoctorOptions = {
  root: string;
  verbose?: boolean;
  git?: boolean;
  installHook?: boolean;
  sensitivity?: boolean;
};

export type DoctorResult = {
  ok: boolean;
  lines: string[];
};

const SPINE = [
  "ENTRY.md",
  "LAW.md",
  "WRITE-CLASSES.md",
  "START-GUIDE.md",
  "ATTACH.md",
] as const;

function pass(lines: string[], msg: string) {
  lines.push(`PASS ${msg}`);
}
function fail(lines: string[], msg: string) {
  lines.push(`FAIL ${msg}`);
}
function info(lines: string[], msg: string) {
  lines.push(`INFO ${msg}`);
}

export function runDoctor(opts: DoctorOptions): DoctorResult {
  const lines: string[] = [];
  let ok = true;
  const abs = path.resolve(opts.root);

  if (!isVaultRoot(abs)) {
    fail(lines, `not a vault root (need RECOLLECT.md + vault/): ${abs}`);
    return { ok: false, lines };
  }
  pass(lines, `vault root ${abs}`);

  const kitLaw = path.join(abs, "docs", "LAW.md");
  const privateLaw = path.join(abs, "RECOLLECT.md");
  const isKit = fs.existsSync(kitLaw);

  if (isKit) {
    for (const name of SPINE) {
      const p = path.join(abs, "docs", name);
      if (!fs.existsSync(p)) {
        fail(lines, `docs/${name} missing`);
        ok = false;
      }
    }
    const text = fs.readFileSync(kitLaw, "utf8");
    const hasLabels =
      (text.includes("## Labels tools use") && text.includes("| Tool label | Plain meaning |")) ||
      (text.includes("## Glossary") && text.includes("| Formal | Plain |"));
    if (!hasLabels) {
      fail(lines, "docs/LAW.md missing tool-label table (or Formal·Plain glossary)");
      ok = false;
    } else pass(lines, "rules labels present (docs/LAW.md)");
  } else if (fs.existsSync(privateLaw)) {
    const text = fs.readFileSync(privateLaw, "utf8");
    if (!text.includes("## Glossary") && !text.includes("write class") && !text.includes("write gate")) {
      fail(lines, "RECOLLECT.md missing rules glossary");
      ok = false;
    } else {
      pass(lines, "private vault rules present (RECOLLECT.md)");
    }
    info(lines, "kit docs/ spine not required for private vault");
  } else {
    fail(lines, "no docs/LAW.md or RECOLLECT.md law surface");
    ok = false;
  }

  // Wire
  try {
    const mcp = resolveMcpDist();
    if (fs.existsSync(mcp)) pass(lines, `MCP entry exists: ${mcp}`);
    else {
      fail(lines, `MCP entry missing: ${mcp}`);
      ok = false;
    }
  } catch (e) {
    fail(lines, `MCP resolve failed: ${e instanceof Error ? e.message : e}`);
    ok = false;
  }

  const cursorMcp = path.join(abs, ".cursor", "mcp.json");
  if (fs.existsSync(cursorMcp)) {
    try {
      const j = JSON.parse(fs.readFileSync(cursorMcp, "utf8"));
      const servers = j?.mcpServers ?? {};
      const server =
        servers["recollect-os"] ?? servers["recollect"] ?? null;
      if (server?.env?.RECOLLECT_ROOT && server?.args?.[0]) {
        pass(lines, "Cursor mcp.json present with RECOLLECT_ROOT");
        if (opts.verbose) info(lines, `args[0]=${server.args[0]}`);
      } else {
        fail(lines, "Cursor mcp.json incomplete");
        ok = false;
      }
    } catch {
      fail(lines, "Cursor mcp.json unreadable JSON");
      ok = false;
    }
  } else {
    info(lines, "no .cursor/mcp.json (other hosts: see docs/ATTACH.md)");
  }

  // Proposals
  const pending = listProposals(abs);
  if (pending.length === 0) pass(lines, "no pending proposals");
  else {
    info(lines, `pending proposals: ${pending.length}`);
    for (const p of pending) {
      info(
        lines,
        `  id=${p.id} path=${p.path} class=${p.class} expires=${p.expiresAt}`
      );
    }
  }

  // Stale proposal files that list skipped
  const propDir = path.join(abs, ".recollect", "proposals");
  if (fs.existsSync(propDir)) {
    const files = fs.readdirSync(propDir).filter((f) => f.endsWith(".json"));
    if (files.length > pending.length) {
      info(
        lines,
        `stale/expired proposal files on disk: ${files.length - pending.length} (cleaned on next load)`
      );
    }
  }

  // Frontmatter sample (metadata only)
  const me = path.join(abs, "vault", "Me.md");
  if (fs.existsSync(me)) {
    const head = fs.readFileSync(me, "utf8").slice(0, 200);
    if (!head.startsWith("---")) info(lines, "vault/Me.md missing frontmatter fence");
    else pass(lines, "vault/Me.md has frontmatter");
  }

  if (opts.verbose) {
    const audit = readAuditTail(abs, 5);
    info(lines, `audit tail (${audit.length} recent)`);
    for (const a of audit) {
      info(lines, `  ${a.ts} ${a.event} ${a.code} ${a.path ?? ""}`);
    }
  }

  if (opts.git) {
    const gitCheck = runGitMediationCheck(abs, lines);
    if (!gitCheck) ok = false;
  }

  if (opts.sensitivity) {
    const sensOk = runSensitivityAudit(abs, lines);
    if (!sensOk) ok = false;
  }

  if (opts.installHook) {
    const hookOk = installPreCommitHook(abs, lines);
    if (!hookOk) ok = false;
  }

  if (process.platform === "win32") {
    info(
      lines,
      "Windows: prefer npm i -g recollect-os → recollect-os.cmd (npx often misses the bin)"
    );
  }

  return { ok, lines };
}

function runSensitivityAudit(root: string, lines: string[]): boolean {
  const vaultDir = path.join(root, "vault");
  if (!fs.existsSync(vaultDir)) {
    info(lines, "no vault/ — skip sensitivity audit");
    return true;
  }

  const files: string[] = [];
  walkMd(vaultDir, vaultDir, files);

  let restricted = 0;
  let missingBanner = 0;
  for (const rel of files) {
    const full = path.join(vaultDir, rel);
    let text: string;
    try {
      text = fs.readFileSync(full, "utf8");
    } catch {
      continue;
    }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\n---", 3);
    if (end < 0) continue;
    const fm = text.slice(3, end);
    if (!/^sensitivity:\s*restricted\b/m.test(fm)) continue;
    restricted += 1;
    const body = text.slice(end + 4);
    if (!/\*\*Restricted\.\*\*/i.test(body) && !/>\s*\*\*Restricted\.\*\*/i.test(body)) {
      missingBanner += 1;
      fail(lines, `restricted without body banner: vault/${rel.replace(/\\/g, "/")}`);
    }
  }

  if (restricted === 0) {
    pass(lines, "sensitivity audit: no restricted notes found");
    return true;
  }
  if (missingBanner === 0) {
    pass(lines, `sensitivity audit: ${restricted} restricted note(s) have banner`);
    return true;
  }
  return false;
}

function walkMd(dir: string, base: string, out: string[]): void {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walkMd(full, base, out);
      continue;
    }
    if (name.endsWith(".md")) {
      out.push(path.relative(base, full));
    }
  }
}

function runGitMediationCheck(root: string, lines: string[]): boolean {
  const gitDir = path.join(root, ".git");
  if (!fs.existsSync(gitDir)) {
    info(lines, "no .git — skip mediation check");
    return true;
  }
  try {
    const out = execSync("git status --porcelain", {
      cwd: root,
      encoding: "utf8",
    });
    const changed = out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^\?\?\s+/, "").replace(/^[AMDRC ]+\s+/, ""))
      .filter(
        (p) =>
          p.replace(/\\/g, "/").startsWith("vault/") ||
          p.replace(/\\/g, "/") === "RECOLLECT.md"
      );
    if (changed.length === 0) {
      pass(lines, "git: no unmediated durable dirty paths");
      return true;
    }
    const accepted = recentAcceptPaths(root);
    const unmediated = changed.filter((p) => {
      const norm = p.replace(/\\/g, "/");
      return !accepted.has(norm);
    });
    if (unmediated.length === 0) {
      pass(lines, "git dirty paths explained by recent accept audit");
      return true;
    }
    fail(
      lines,
      `outside the gate — durable changes without recent accept: ${unmediated.join(", ")}`
    );
    return false;
  } catch (e) {
    fail(lines, `git check failed: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

function installPreCommitHook(root: string, lines: string[]): boolean {
  const hookDir = path.join(root, ".git", "hooks");
  if (!fs.existsSync(path.join(root, ".git"))) {
    fail(lines, "cannot install hook — no .git");
    return false;
  }
  fs.mkdirSync(hookDir, { recursive: true });
  const hookPath = path.join(hookDir, "pre-commit");
  const body = `#!/bin/sh
# recollect-os opt-in: warn on vault writes without recent accept
recollect-os doctor --root "$(git rev-parse --show-toplevel)" --git
status=$?
if [ $status -ne 0 ]; then
  echo "recollect-os: unmediated durable changes (outside the gate). Use propose→accept or amend with care." >&2
  exit $status
fi
exit 0
`;
  fs.writeFileSync(hookPath, body, "utf8");
  try {
    fs.chmodSync(hookPath, 0o755);
  } catch {
    /* windows */
  }
  pass(lines, `installed pre-commit hook at ${hookPath}`);
  return true;
}
