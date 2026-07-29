import fs from "node:fs";
import {
  assertReadable,
  PolicyError,
  resolveUnderRoot,
  truncate,
} from "../allowlist.js";
import { isRestricted } from "../frontmatter.js";

export function runReadNote(
  root: string,
  pathArg: string
): { path: string; text: string; truncated: boolean } {
  assertReadable(pathArg);
  const { abs, rel } = resolveUnderRoot(root, pathArg);

  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    throw new PolicyError(`file not found: ${rel}`);
  }

  const raw = fs.readFileSync(abs, "utf8");
  if (isRestricted(raw)) {
    throw new PolicyError(
      `refused: sensitivity restricted (${rel})`
    );
  }

  const { text, truncated } = truncate(raw);
  return { path: rel, text, truncated };
}
