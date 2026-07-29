import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURE_SRC = path.resolve(__dirname, "../../test/fixtures");

export function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

export function makeFixtureRoot(): { root: string; tmp: string } {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-mcp-"));
  const root = path.join(tmp, "vault-root");
  copyDir(FIXTURE_SRC, root);
  return { root, tmp };
}

export function noteBody(title: string, now = "ok"): string {
  return `---
domain: personal
type: note
created: 2026-07-29
sensitivity: normal
---

# ${title}

## Now

${now}
`;
}
