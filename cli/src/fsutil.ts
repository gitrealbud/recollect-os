import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/**
 * Locate law kit (docs/LAW.md + templates/).
 * Order: RECOLLECT_KIT → bundled cli/kit → walk up (monorepo clone).
 */
export function findKitRoot(start?: string): string {
  if (process.env.RECOLLECT_KIT?.trim()) {
    const k = path.resolve(process.env.RECOLLECT_KIT.trim());
    if (isKit(k)) return k;
    throw new Error(`RECOLLECT_KIT is set but not a kit root: ${k}`);
  }

  const bundled = path.join(packageRoot(), "kit");
  if (isKit(bundled)) return bundled;

  let dir = start ?? path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    if (isKit(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "Could not find recollect-os kit (docs/LAW.md + templates/). Set RECOLLECT_KIT or reinstall recollect-os (kit must ship in the package)."
  );
}

/** Absolute path to this CLI package root (contains package.json + kit/). */
export function packageRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      try {
        const pkg = JSON.parse(
          fs.readFileSync(path.join(dir, "package.json"), "utf8")
        ) as { name?: string };
        if (pkg.name === "recollect-os") return dir;
      } catch {
        /* continue */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: dist/src → cli root
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function isKit(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, "docs", "LAW.md")) &&
    fs.existsSync(path.join(dir, "templates"))
  );
}

/**
 * Absolute path to recollect-os-mcp entry (works for file: link and registry).
 */
export function resolveMcpDist(override?: string): string {
  if (override) return path.resolve(override);
  if (process.env.RECOLLECT_MCP_DIST?.trim()) {
    return path.resolve(process.env.RECOLLECT_MCP_DIST.trim());
  }
  try {
    // Resolve package main — do not use package.json subpath (blocked by exports)
    const entry = require.resolve("recollect-os-mcp");
    if (fs.existsSync(entry)) return entry;
  } catch {
    /* fall through */
  }
  // Monorepo sibling without install
  const sibling = path.join(packageRoot(), "..", "mcp", "dist", "src", "index.js");
  if (fs.existsSync(sibling)) return path.resolve(sibling);
  throw new Error(
    "Could not resolve recollect-os-mcp. Install the dependency or set RECOLLECT_MCP_DIST."
  );
}

export function isVaultRoot(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, "RECOLLECT.md")) &&
    fs.existsSync(path.join(dir, "vault")) &&
    fs.statSync(path.join(dir, "vault")).isDirectory()
  );
}

export function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}

export function writeIfMissing(file: string, body: string): boolean {
  if (fs.existsSync(file)) return false;
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, body, "utf8");
  return true;
}

export function writeFile(file: string, body: string): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, body, "utf8");
}

export function copyFile(src: string, dest: string): void {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
