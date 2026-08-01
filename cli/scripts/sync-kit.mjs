#!/usr/bin/env node
/**
 * Sync law kit (docs + templates) into cli/kit for npm publish / cold init.
 * Run from repo root or cli/: node scripts/sync-kit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(here, "..");
const repoRoot = path.resolve(cliRoot, "..");
const kitOut = path.join(cliRoot, "kit");

const DOCS = [
  "ENTRY.md",
  "LAW.md",
  "WRITE-CLASSES.md",
  "START-GUIDE.md",
  "ATTACH.md",
  "DEMO.md",
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

rmrf(kitOut);
fs.mkdirSync(path.join(kitOut, "docs"), { recursive: true });
fs.mkdirSync(path.join(kitOut, "templates"), { recursive: true });

for (const doc of DOCS) {
  const src = path.join(repoRoot, "docs", doc);
  if (!fs.existsSync(src)) throw new Error(`Missing doc: ${src}`);
  copyFile(src, path.join(kitOut, "docs", doc));
}

const templatesDir = path.join(repoRoot, "templates");
for (const name of fs.readdirSync(templatesDir)) {
  if (!name.endsWith(".md")) continue;
  copyFile(
    path.join(templatesDir, name),
    path.join(kitOut, "templates", name)
  );
}

console.log(`sync-kit: wrote ${kitOut}`);
