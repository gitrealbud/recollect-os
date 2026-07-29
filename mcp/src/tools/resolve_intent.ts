/**
 * resolve_intent — match Map Intent table rows; resolve Open wiki-links to paths.
 * Not full-text search. Cap ≤2 paths per match; ≤3 matches. Never People/restricted.
 */
import fs from "node:fs";
import path from "node:path";
import {
  assertReadable,
  DENY_PREFIXES,
  PolicyError,
  resolveUnderRoot,
} from "../allowlist.js";
import {
  RESOLVE_INTENT_MAX_MATCHES,
  RESOLVE_INTENT_MAX_PATHS,
} from "../budgets.js";
import { isRestricted } from "../frontmatter.js";
import { splitMapViews } from "./boot.js";

export type IntentMatch = {
  intent: string;
  openRaw: string;
  doNot: string;
  score: number;
  paths: string[];
  unresolved: string[];
};

export type ResolveIntentResult = {
  query: string;
  matches: IntentMatch[];
  hint?: string;
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9/_\s-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function scoreIntent(query: string, intentCell: string): number {
  const q = tokenize(query);
  const i = tokenize(intentCell);
  if (q.length === 0) return 0;
  let hits = 0;
  for (const t of q) {
    if (i.some((w) => w.includes(t) || t.includes(w))) hits += 1;
  }
  // substring bonus
  const ql = query.toLowerCase().trim();
  const il = intentCell.toLowerCase();
  if (ql.length >= 3 && il.includes(ql)) hits += 2;
  return hits;
}

/** Parse markdown table rows under Intent section. */
export function parseIntentRows(mapMd: string): {
  intent: string;
  open: string;
  doNot: string;
}[] {
  const { intent } = splitMapViews(mapMd);
  const rows: { intent: string; open: string; doNot: string }[] = [];
  for (const line of intent.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) continue;
    if (/^\|\s*Intent\s*\|/i.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim());
    // | Intent | Open | Do not |  → ['', intent, open, doNot, '']
    if (cells.length < 4) continue;
    const intentCell = cells[1];
    const open = cells[2];
    const doNot = cells[3] ?? "";
    if (!intentCell || intentCell.toLowerCase() === "intent") continue;
    rows.push({ intent: intentCell, open, doNot });
  }
  return rows;
}

function extractOpenTargets(openCell: string): string[] {
  const out: string[] = [];
  const wiki = /\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = wiki.exec(openCell))) {
    out.push(m[1].trim());
  }
  const ticks = /`([^`]+)`/g;
  while ((m = ticks.exec(openCell))) {
    const t = m[1].trim();
    // skip bare repo-root filenames unless under vault/
    if (t.endsWith(".md") || t.includes("/") || t.includes("_hub")) {
      out.push(t);
    }
  }
  return out;
}

function candidatePaths(target: string): string[] {
  const t = target.replace(/\\/g, "/").replace(/^\/+/, "");
  if (t === "_hub" || t === "_hub.md") return [];

  const cands: string[] = [];
  const push = (p: string) => {
    if (p && !cands.includes(p)) cands.push(p);
  };

  if (t.startsWith("vault/")) {
    push(t.endsWith(".md") ? t : `${t}.md`);
    return cands;
  }

  if (
    t.startsWith("Business/") ||
    t.startsWith("Grok/") ||
    t.startsWith("References/")
  ) {
    const base = `vault/${t}`;
    if (t.endsWith(".md")) push(base);
    else {
      push(`${base}.md`);
      if (!t.includes("_hub")) push(`${base}/_hub.md`);
    }
    return cands;
  }

  if (t.includes("/")) {
    push(`vault/${t}.md`);
    push(`vault/Business/${t}.md`);
    return cands;
  }

  push(`vault/${t}.md`);
  push(`vault/Business/${t}.md`);
  push(`vault/Business/${t}/_hub.md`);
  const hy = t.replace(/\s+/g, "-");
  if (hy !== t) {
    push(`vault/${hy}.md`);
    push(`vault/Business/${hy}.md`);
  }
  const sp = t.replace(/-/g, " ");
  if (sp !== t) push(`vault/${sp}.md`);
  return cands;
}

function isDeniedRel(rel: string): boolean {
  try {
    assertReadable(rel);
  } catch {
    return true;
  }
  for (const prefix of DENY_PREFIXES) {
    if (rel.startsWith(prefix) || rel === prefix.slice(0, -1)) return true;
  }
  // Restricted notes may live outside deny prefixes; FM check is in resolveTarget.
  return false;
}

function resolveTarget(root: string, target: string): string | null {
  for (const cand of candidatePaths(target)) {
    if (isDeniedRel(cand)) continue;
    try {
      const { abs, rel } = resolveUnderRoot(root, cand);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
      const raw = fs.readFileSync(abs, "utf8");
      if (isRestricted(raw)) continue;
      return rel.replace(/\\/g, "/");
    } catch {
      continue;
    }
  }
  return null;
}

export function runResolveIntent(
  root: string,
  query: string
): ResolveIntentResult {
  const q = query?.trim();
  if (!q) {
    throw new PolicyError("query is required");
  }

  const mapPath = path.join(root, "vault", "Map.md");
  if (!fs.existsSync(mapPath)) {
    throw new PolicyError("vault/Map.md missing");
  }
  const mapMd = fs.readFileSync(mapPath, "utf8");
  const rows = parseIntentRows(mapMd);
  if (rows.length === 0) {
    return {
      query: q,
      matches: [],
      hint: "No Intent table rows found — use boot(pack=map_intent).",
    };
  }

  const scored = rows
    .map((r) => ({
      ...r,
      score: scoreIntent(q, r.intent),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, RESOLVE_INTENT_MAX_MATCHES);

  if (scored.length === 0) {
    return {
      query: q,
      matches: [],
      hint: "No Intent match — try boot(pack=map_intent) or boot(pack=map_index).",
    };
  }

  const matches: IntentMatch[] = scored.map((r) => {
    const targets = extractOpenTargets(r.open);
    const paths: string[] = [];
    const unresolved: string[] = [];
    for (const t of targets) {
      if (paths.length >= RESOLVE_INTENT_MAX_PATHS) break; // Map ≤2
      const resolved = resolveTarget(root, t);
      if (resolved) {
        if (!paths.includes(resolved)) paths.push(resolved);
      } else {
        unresolved.push(t);
      }
    }
    return {
      intent: r.intent,
      openRaw: r.open,
      doNot: r.doNot,
      score: r.score,
      paths,
      unresolved,
    };
  });

  return { query: q, matches };
}

export function formatResolveIntent(result: ResolveIntentResult): string {
  const parts: string[] = [
    `# resolve_intent`,
    "",
    `query: ${result.query}`,
    "",
    "Intent-table matches only. Not vault search. ≤2 paths per row.",
    "",
  ];
  if (result.hint && result.matches.length === 0) {
    parts.push(`_${result.hint}_`);
    return parts.join("\n");
  }
  for (const m of result.matches) {
    parts.push(`## ${m.intent} (score ${m.score})`);
    parts.push("");
    parts.push(`Open: ${m.openRaw}`);
    parts.push(`Do not: ${m.doNot}`);
    parts.push("");
    if (m.paths.length) {
      parts.push("Resolved paths (≤2):");
      for (const p of m.paths) parts.push(`- \`${p}\``);
    } else {
      parts.push("_No resolvable paths (wiki targets missing or restricted)._");
    }
    if (m.unresolved.length) {
      parts.push("");
      parts.push(
        "Unresolved: " + m.unresolved.map((u) => `\`${u}\``).join(", ")
      );
    }
    parts.push("");
  }
  parts.push("Next: `read_note` on one path.");
  return parts.join("\n");
}
