import fs from "node:fs";
import path from "node:path";

export class RootError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RootError";
  }
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

  const root = path.resolve(raw);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new RootError(`RECOLLECT_ROOT is not a directory: ${root}`);
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
