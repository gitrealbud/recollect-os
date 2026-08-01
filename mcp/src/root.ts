import fs from "node:fs";
import path from "node:path";

export class RootError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RootError";
  }
}

/**
 * Build candidate absolute paths for RECOLLECT_ROOT.
 *
 * Git Bash / MSYS automatically converts Windows paths to Unix form and back in
 * some launch contexts. This produces common corruptions we can recover from:
 *   - `/c/Users/...`       → `C:\Users\...`
 *   - `/cygdrive/c/...`    → `C:\...`
 *   - `C:\c\Users\...`     → `C:\Users\...`
 *   - `C:/c/Users/...`     → `C:\Users\...`
 *
 * We only return a corrected candidate if it actually exists on disk, so Linux
 * absolute paths such as `/c/...` are never misinterpreted when they are real.
 */
export function rootCandidates(raw: string): string[] {
  const candidates = new Set<string>();
  candidates.add(path.resolve(raw));

  // Unix-style Windows drive: /c/Users/...  → C:\Users\...
  const msysDrive = raw.match(/^\/([a-zA-Z])\/(.*)$/);
  if (msysDrive) {
    const [, drive, rest] = msysDrive;
    candidates.add(path.resolve(`${drive.toUpperCase()}:/${rest}`));
  }

  // Cygwin prefix: /cygdrive/c/Users/...  → C:\Users\...
  const cygDrive = raw.match(/^\/cygdrive\/([a-zA-Z])\/(.*)$/);
  if (cygDrive) {
    const [, drive, rest] = cygDrive;
    candidates.add(path.resolve(`${drive.toUpperCase()}:/${rest}`));
  }

  // Double-converted Windows paths where the MSYS /c prefix became a directory.
  const doubleBack = raw.match(/^([a-zA-Z]):\\c\\(.*)$/);
  if (doubleBack) {
    const [, drive, rest] = doubleBack;
    candidates.add(path.resolve(`${drive.toUpperCase()}:\\${rest}`));
  }
  const doubleFwd = raw.match(/^([a-zA-Z]):\/c\/(.*)$/);
  if (doubleFwd) {
    const [, drive, rest] = doubleFwd;
    candidates.add(path.resolve(`${drive.toUpperCase()}:/${rest}`));
  }

  return Array.from(candidates);
}

function pickExistingRoot(raw: string): string {
  for (const candidate of rootCandidates(raw)) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }
  // Fall back to the literal resolution so the error message matches input.
  return path.resolve(raw);
}

/**
 * Resolve and validate RECOLLECT_ROOT.
 * Requires RECOLLECT.md + vault/ directory (real vault, not law-kit-only repo).
 */
export function resolveRoot(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.RECOLLECT_ROOT?.trim();
  if (!raw) {
    throw new RootError(
      "RECOLLECT_ROOT is not set. Point it at your private Recollect clone (absolute path)."
    );
  }

  const root = pickExistingRoot(raw);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new RootError(
      `RECOLLECT_ROOT is not a directory: ${root} (raw: ${raw})`
    );
  }

  const boot = path.join(root, "RECOLLECT.md");
  const vault = path.join(root, "vault");
  if (!fs.existsSync(boot) || !fs.statSync(boot).isFile()) {
    throw new RootError(
      `Not a Recollect vault root (missing RECOLLECT.md): ${root}`
    );
  }
  if (!fs.existsSync(vault) || !fs.statSync(vault).isDirectory()) {
    throw new RootError(
      `Not a Recollect vault root (missing vault/): ${root}`
    );
  }

  return root;
}
