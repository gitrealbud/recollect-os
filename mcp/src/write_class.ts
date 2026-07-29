import { DENY_PREFIXES, normalizeRel, PolicyError } from "./allowlist.js";
import { isRestricted, parseDomain } from "./frontmatter.js";

export type WriteClass = "Auto" | "Propose" | "Human-gate" | "Forbidden";

/**
 * Classify a proposed durable write. propose_write never Auto-applies —
 * Auto stays on capture_inbox. Inbox paths via propose_write → Propose.
 */
export function classifyWrite(pathRel: string, content: string): WriteClass {
  let n: string;
  try {
    n = normalizeRel(pathRel);
  } catch {
    return "Forbidden";
  }

  for (const prefix of DENY_PREFIXES) {
    if (n === prefix.slice(0, -1) || n.startsWith(prefix)) {
      return "Forbidden";
    }
  }

  if (isRestricted(content)) {
    return "Forbidden";
  }

  // Frontmatter only — do not scan body (law prose may mention the ban)
  const domain = parseDomain(content);
  if (domain !== null && domain.toLowerCase() === "both") {
    return "Forbidden";
  }

  // Deletes / empty wipe of evergreen — treat as Human-gate
  if (content.trim().length === 0 && n !== "RECOLLECT.md") {
    return "Human-gate";
  }

  if (n === "RECOLLECT.md" || n.startsWith("vault/")) {
    // Session Now / hubs / Map / Business — Propose until accept
    return "Propose";
  }

  return "Forbidden";
}

export function assertWritablePath(pathRel: string): string {
  const n = normalizeRel(pathRel);
  if (n === "RECOLLECT.md") return n;
  if (!n.startsWith("vault/")) {
    throw new PolicyError(
      "writes allowlist: only RECOLLECT.md or vault/**",
      "WRITE_DENIED"
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
  return n;
}
