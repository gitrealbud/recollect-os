/**
 * Minimal YAML frontmatter helpers (no full YAML dependency).
 */

export function parseSensitivity(content: string): string | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const block = m[1];
  const sens = block.match(/^sensitivity:\s*(\S+)\s*$/m);
  return sens ? sens[1].trim().replace(/^["']|["']$/g, "") : null;
}

/** Frontmatter `domain` only — never scan body prose. */
export function parseDomain(content: string): string | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const block = m[1];
  const d = block.match(/^domain:\s*(\S+)\s*$/m);
  return d ? d[1].trim().replace(/^["']|["']$/g, "") : null;
}

export function isRestricted(content: string): boolean {
  const s = parseSensitivity(content);
  return s !== null && s.toLowerCase() === "restricted";
}

export function slugify(input: string, maxLen = 40): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
  return s.length > 0 ? s : "capture";
}

/** Local time stamp YYYY-MM-DD-HHmm */
export function stampLocal(d = new Date()): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day}-${h}${mi}`;
}

export function buildCaptureMarkdown(opts: {
  body: string;
  domain?: string;
  created?: string; // YYYY-MM-DD
  title?: string;
}): string {
  const domain = opts.domain ?? "personal";
  if (domain !== "personal") {
    throw new Error("v0 capture_inbox is personal-only");
  }
  const created =
    opts.created ??
    (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();
  const title = opts.title?.trim() || "Capture";
  const body = opts.body.replace(/\r\n/g, "\n").trimEnd() + "\n";
  return (
    `---\n` +
    `domain: personal\n` +
    `type: note\n` +
    `created: ${created}\n` +
    `sensitivity: normal\n` +
    `---\n\n` +
    `# ${title}\n\n` +
    body
  );
}
