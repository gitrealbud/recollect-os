import path from "node:path";
import { MAX_FILE_CHARS } from "./budgets.js";
import { RecollectError, type ErrorCode } from "./errors.js";

/** @deprecated Prefer RecollectError with a stable code */
export class PolicyError extends RecollectError {
  constructor(message: string, code: ErrorCode = "POLICY") {
    super(code, message);
    this.name = "PolicyError";
  }
}

/** Paths that may never be read via read_note (prefix under vault/). */
export const DENY_PREFIXES = [
  "vault/Secrets/",
  "vault/Archive/",
  "vault/People/",
] as const;

/** Fixed boot pack (relative to RECOLLECT_ROOT). */
export const BOOT_PATHS = [
  "RECOLLECT.md",
  "vault/Map.md",
  "vault/Me.md",
  "vault/Preferences.md",
] as const;

/** Max characters returned per file (boot + read). Re-export for callers. */
export { MAX_FILE_CHARS };

/**
 * Normalize a vault-relative path: POSIX slashes, no leading slash.
 * Rejects absolute paths and empty input.
 */
export function normalizeRel(rel: string): string {
  const trimmed = rel.trim().replace(/\\/g, "/");
  if (!trimmed) {
    throw new PolicyError("path is empty", "PATH_EMPTY");
  }
  if (path.isAbsolute(trimmed) || /^[A-Za-z]:\//.test(trimmed)) {
    throw new PolicyError(
      "absolute paths are not allowed; use vault-relative paths",
      "PATH_ABSOLUTE"
    );
  }
  // Collapse . and .. segments carefully
  const parts = trimmed.split("/").filter((p) => p.length > 0 && p !== ".");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") {
      if (out.length === 0) {
        throw new PolicyError("path traversal denied", "PATH_TRAVERSAL");
      }
      out.pop();
      continue;
    }
    if (p.includes("\0")) {
      throw new PolicyError("invalid path", "PATH_INVALID");
    }
    out.push(p);
  }
  return out.join("/");
}

/**
 * Resolve rel under root; ensure result stays inside root.
 */
export function resolveUnderRoot(root: string, rel: string): {
  rel: string;
  abs: string;
} {
  const n = normalizeRel(rel);
  const abs = path.resolve(root, n);
  const rootResolved = path.resolve(root);
  const relToRoot = path.relative(rootResolved, abs);
  if (
    relToRoot.startsWith("..") ||
    path.isAbsolute(relToRoot) ||
    relToRoot.includes(`..${path.sep}`)
  ) {
    throw new PolicyError("path escapes RECOLLECT_ROOT");
  }
  return { rel: n.replace(/\\/g, "/"), abs };
}

/** Allow read of vault/** and RECOLLECT.md only (plus boot roots). */
export function assertReadable(rel: string): void {
  const n = normalizeRel(rel);
  if (n === "RECOLLECT.md") return;
  if (!n.startsWith("vault/")) {
    throw new PolicyError(
      "read_note allowlist: only RECOLLECT.md or vault/**",
      "READ_DENIED"
    );
  }
  for (const prefix of DENY_PREFIXES) {
    if (n === prefix.slice(0, -1) || n.startsWith(prefix)) {
      throw new PolicyError(
        `path denied by policy: ${prefix.slice(0, -1)}`,
        "FORBIDDEN_PATH"
      );
    }
  }
}

export function truncate(text: string, max = MAX_FILE_CHARS): {
  text: string;
  truncated: boolean;
} {
  if (text.length <= max) return { text, truncated: false };
  return {
    text:
      text.slice(0, max) +
      `\n\n…[truncated by recollect-os-mcp at ${max} chars]`,
    truncated: true,
  };
}
