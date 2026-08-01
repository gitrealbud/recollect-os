import fs from "node:fs";
import path from "node:path";
import { PolicyError, resolveUnderRoot, truncate } from "../allowlist.js";
import { HUB_NOW_MAX } from "../budgets.js";
import { extractH2Section } from "./boot.js";
import { runResolveIntent } from "./resolve_intent.js";
import { runReadNote } from "./read_note.js";

export { HUB_NOW_MAX };

export type StatusResult = {
  session_now: string | null;
  hub_now: string | null;
  hub_path: string | null;
  choices?: { intent: string; paths: string[] }[];
  note?: string;
};

function readSessionNow(root: string): string | null {
  const abs = path.join(root, "RECOLLECT.md");
  if (!fs.existsSync(abs)) return null;
  const md = fs.readFileSync(abs, "utf8");
  return extractH2Section(md, "Active context");
}

function hubNowFromNote(text: string): string | null {
  const section = extractH2Section(text, "Now");
  if (!section) return null;
  const { text: capped, truncated } = truncate(section, HUB_NOW_MAX);
  return truncated ? capped + "\n\n…(truncated)" : capped;
}

export function runStatus(root: string, intent?: string | null): StatusResult {
  const session_now = readSessionNow(root);
  const q = intent?.trim() ?? "";

  if (!q) {
    return {
      session_now,
      hub_now: null,
      hub_path: null,
      note: "No intent — personal focus only. Pass intent to load one “what’s true now” section.",
    };
  }

  const resolved = runResolveIntent(root, q);
  if (resolved.matches.length === 0) {
    return {
      session_now,
      hub_now: null,
      hub_path: null,
      note: `No short-index intent match for: ${q}`,
    };
  }

  if (resolved.matches.length > 1) {
    return {
      session_now,
      hub_now: null,
      hub_path: null,
      choices: resolved.matches.map((m) => ({
        intent: m.intent,
        paths: m.paths,
      })),
      note: "Ambiguous intent — pick one path and call status again, or narrow the query.",
    };
  }

  const match = resolved.matches[0];
  if (match.paths.length === 0) {
    return {
      session_now,
      hub_now: null,
      hub_path: null,
      note: `Matched “${match.intent}” but no readable paths`,
    };
  }

  if (match.paths.length > 1) {
    // Prefer first path only for live status — contract: at most one hub body
    // If multiple opens, treat as choices when >1 distinct hubs
    return {
      session_now,
      hub_now: null,
      hub_path: null,
      choices: [{ intent: match.intent, paths: match.paths }],
      note: "Multiple hub paths for one intent — choose one.",
    };
  }

  const hubPath = match.paths[0];
  try {
    resolveUnderRoot(root, hubPath);
    const note = runReadNote(root, hubPath);
    const hub_now = hubNowFromNote(note.text);
    return {
      session_now,
      hub_now:
        hub_now ??
        `(no ## Now section in ${hubPath} — open the note for body)`,
      hub_path: hubPath,
    };
  } catch (e) {
    throw e instanceof PolicyError
      ? e
      : new PolicyError(e instanceof Error ? e.message : String(e));
  }
}

export function formatStatus(r: StatusResult): string {
  // Layer 1 headings for tool-facing human text (JSON keys stay stable for clients).
  const parts: string[] = [
    "# status",
    "",
    "_Frame: notes on disk are the record; load little; draft then human accepts._",
    "",
  ];
  parts.push("## Personal focus");
  parts.push(r.session_now?.trim() || "(empty)");
  parts.push("");
  if (r.choices?.length) {
    parts.push("## Choices (ambiguous)");
    for (const c of r.choices) {
      parts.push(`- ${c.intent}: ${c.paths.join(" · ") || "(unresolved)"}`);
    }
    parts.push("");
  }
  parts.push('## What’s true now');
  if (r.hub_path) parts.push(`path: ${r.hub_path}`);
  parts.push(r.hub_now?.trim() || "(none)");
  if (r.note) {
    parts.push("");
    parts.push(`note: ${r.note}`);
  }
  return parts.join("\n") + "\n";
}
