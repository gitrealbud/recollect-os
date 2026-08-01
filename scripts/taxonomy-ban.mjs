#!/usr/bin/env node
/**
 * taxonomy-ban — fail if ban phrases appear on public faces.
 *   node scripts/taxonomy-ban.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BAN_PHRASES = [
  "Session Now",
  "Hub Now",
  "Soft-Gate",
  "code-exec",
  "Outside the gate",
  "bypass the gate",
  "trust ladder",
  "write ladder",
  "Plane L",
  "Phase L",
  "propose → accept",
  "propose -> accept",
];

const BAN_REGEX = [/\bthe gate\b/i, /\bfight the gate\b/i];

const BAN_PREFIXES = [
  "mcp/src/",
  "README.md",
  "docs/ENTRY.md",
  "docs/START-GUIDE.md",
  "docs/DEMO.md",
  "docs/ATTACH.md",
  "examples/attach/",
  "examples/starter/README.md",
  "examples/starter/Map.md",
];

const ALLOW_PREFIXES = [
  "docs/LAW.md",
  "docs/WRITE-CLASSES.md",
  "mcp/test/",
  "scripts/taxonomy-ban.mjs",
  "cli/kit/docs/LAW.md",
  "cli/kit/docs/WRITE-CLASSES.md",
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist" || ent.name === ".git")
        continue;
      walk(p, out);
    } else if (/\.(md|ts|mjs|js|json)$/i.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

function isAllowed(r) {
  return ALLOW_PREFIXES.some((a) => r === a || r.startsWith(a));
}

function inBanScope(r) {
  if (isAllowed(r)) return false;
  return BAN_PREFIXES.some((b) => {
    if (b.endsWith("/")) return r.startsWith(b);
    return r === b || r.startsWith(b + "/");
  });
}

function main() {
  const files = walk(ROOT).filter((p) => inBanScope(rel(p)));
  const hits = [];

  for (const file of files) {
    const r = rel(file);
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (/\bsession_now\b|\bhub_now\b/.test(line) && !/Session Now|Hub Now/.test(line))
        return;
      for (const phrase of BAN_PHRASES) {
        if (line.includes(phrase)) {
          hits.push({ r, line: i + 1, phrase, text: line.trim().slice(0, 140) });
        }
      }
      for (const re of BAN_REGEX) {
        if (re.test(line) && !line.includes("Outside the gate")) {
          if (BAN_PHRASES.some((p) => line.includes(p))) continue;
          hits.push({
            r,
            line: i + 1,
            phrase: re.source,
            text: line.trim().slice(0, 140),
          });
        }
      }
    });
  }

  if (hits.length) {
    console.error(`taxonomy-ban: ${hits.length} hit(s) in ban zone\n`);
    for (const h of hits) {
      console.error(`  ${h.r}:${h.line}  [${h.phrase}]  ${h.text}`);
    }
    process.exit(1);
  }

  console.log(
    `taxonomy-ban: OK (${files.length} files, ${BAN_PHRASES.length} phrases)`
  );
}

main();
