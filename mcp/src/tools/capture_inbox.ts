import fs from "node:fs";
import path from "node:path";
import { PolicyError, resolveUnderRoot } from "../allowlist.js";
import {
  buildCaptureMarkdown,
  slugify,
  stampLocal,
} from "../frontmatter.js";

export type CaptureInput = {
  body: string;
  slug?: string;
  title?: string;
};

export function runCaptureInbox(
  root: string,
  input: CaptureInput
): { path: string; abs: string } {
  if (!input.body?.trim()) {
    throw new PolicyError("body is required");
  }

  const inboxDir = path.join(root, "vault", "Inbox");
  if (!fs.existsSync(inboxDir)) {
    fs.mkdirSync(inboxDir, { recursive: true });
  }

  const stamp = stampLocal();
  const baseSlug = slugify(input.slug ?? input.title ?? "capture");
  let filename = `${stamp}-${baseSlug}.md`;
  let rel = `vault/Inbox/${filename}`;
  let { abs } = resolveUnderRoot(root, rel);

  // Collision -2, -3, …
  let n = 2;
  while (fs.existsSync(abs)) {
    filename = `${stamp}-${baseSlug}-${n}.md`;
    rel = `vault/Inbox/${filename}`;
    abs = resolveUnderRoot(root, rel).abs;
    n += 1;
    if (n > 100) {
      throw new PolicyError("too many filename collisions");
    }
  }

  // Final path must stay under vault/Inbox/
  if (!rel.startsWith("vault/Inbox/") || rel.includes("..")) {
    throw new PolicyError("capture target must be vault/Inbox/");
  }

  const md = buildCaptureMarkdown({
    body: input.body,
    title: input.title,
    domain: "personal",
  });

  fs.writeFileSync(abs, md, "utf8");
  return { path: rel, abs };
}
