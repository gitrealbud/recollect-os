import fs from "node:fs";
import {
  BOOT_PATHS,
  PolicyError,
  resolveUnderRoot,
  truncate,
} from "../allowlist.js";
import { ATTACH_CHAR_BUDGET } from "../budgets.js";

export const BOOT_PACKS = [
  "pulse",
  "law",
  "map_intent",
  "map_index",
  "who",
  "attach",
  "full",
] as const;

export type BootPack = (typeof BOOT_PACKS)[number];

export const DEFAULT_BOOT_PACK: BootPack = "pulse";

/** Hard total char budget for pack=attach (pulse+who+map_intent). */
export { ATTACH_CHAR_BUDGET };

export type BootFile = {
  path: string;
  ok: boolean;
  truncated?: boolean;
  missing?: boolean;
  text?: string;
  error?: string;
};

export type BootResult = {
  pack: BootPack;
  files: BootFile[];
};

export function parseBootPack(raw?: string | null): BootPack {
  if (raw == null || raw === "") return DEFAULT_BOOT_PACK;
  const p = raw.trim().toLowerCase();
  if ((BOOT_PACKS as readonly string[]).includes(p)) return p as BootPack;
  throw new PolicyError(
    `unknown boot pack "${raw}"; use one of: ${BOOT_PACKS.join(", ")}`
  );
}

/** Read one path under root into a BootFile (full body, truncated). */
function readFile(root: string, rel: string): BootFile {
  try {
    const { abs, rel: n } = resolveUnderRoot(root, rel);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      return { path: n, ok: false, missing: true };
    }
    const raw = fs.readFileSync(abs, "utf8");
    const { text, truncated } = truncate(raw);
    return { path: n, ok: true, text, truncated };
  } catch (e) {
    return {
      path: rel,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Split markdown on ## headings. Returns { before, sections: [{title, body}] }.
 * title is the heading text without ##.
 */
export function splitH2(md: string): {
  before: string;
  sections: { title: string; body: string }[];
} {
  const lines = md.split(/\r?\n/);
  const before: string[] = [];
  const sections: { title: string; body: string }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current) {
        sections.push({
          title: current.title,
          body: current.lines.join("\n").replace(/\n+$/, ""),
        });
      } else if (before.length) {
        // keep preamble as-is
      }
      current = { title: m[1], lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
    else before.push(line);
  }
  if (current) {
    sections.push({
      title: current.title,
      body: current.lines.join("\n").replace(/\n+$/, ""),
    });
  }
  return {
    before: before.join("\n").replace(/\n+$/, ""),
    sections,
  };
}

function titleMatches(title: string, want: string): boolean {
  return title.trim().toLowerCase().startsWith(want.trim().toLowerCase());
}

/** Extract one ## section (heading + body). */
export function extractH2Section(md: string, titlePrefix: string): string | null {
  const { sections } = splitH2(md);
  const hit = sections.find((s) => titleMatches(s.title, titlePrefix));
  if (!hit) return null;
  const body = hit.body ? `\n\n${hit.body}` : "";
  return `## ${hit.title}${body}`;
}

/** RECOLLECT without ## Active context (for law pack). */
export function withoutH2Section(md: string, titlePrefix: string): string {
  const { before, sections } = splitH2(md);
  const kept = sections.filter((s) => !titleMatches(s.title, titlePrefix));
  const parts: string[] = [];
  if (before.trim()) parts.push(before.trimEnd());
  for (const s of kept) {
    parts.push(`## ${s.title}${s.body ? `\n\n${s.body}` : ""}`);
  }
  return parts.join("\n\n").trim() + "\n";
}

/**
 * Map split: intent = preamble + sections until Identity & ops;
 * index = Identity & ops onward.
 */
export function splitMapViews(md: string): { intent: string; index: string } {
  const { before, sections } = splitH2(md);
  const idx = sections.findIndex((s) => titleMatches(s.title, "Identity"));
  if (idx < 0) {
    // No Identity heading — treat whole file as intent; empty index
    return { intent: md.trimEnd() + "\n", index: "" };
  }
  const intentSecs = sections.slice(0, idx);
  const indexSecs = sections.slice(idx);
  const intentParts: string[] = [];
  if (before.trim()) intentParts.push(before.trimEnd());
  for (const s of intentSecs) {
    intentParts.push(`## ${s.title}${s.body ? `\n\n${s.body}` : ""}`);
  }
  const indexParts: string[] = [];
  for (const s of indexSecs) {
    indexParts.push(`## ${s.title}${s.body ? `\n\n${s.body}` : ""}`);
  }
  return {
    intent: intentParts.join("\n\n").trim() + "\n",
    index: indexParts.join("\n\n").trim() + "\n",
  };
}

function viewFile(
  pathLabel: string,
  text: string,
  missingHint?: string
): BootFile {
  if (!text.trim()) {
    return {
      path: pathLabel,
      ok: false,
      missing: true,
      error: missingHint ?? "empty view",
    };
  }
  const { text: capped, truncated } = truncate(text);
  return { path: pathLabel, ok: true, text: capped, truncated };
}

export function runBoot(
  root: string,
  packInput?: string | null
): BootResult {
  const pack = parseBootPack(packInput);

  if (pack === "full") {
    return {
      pack,
      files: BOOT_PATHS.map((rel) => readFile(root, rel)),
    };
  }

  if (pack === "who") {
    return {
      pack,
      files: [
        readFile(root, "vault/Me.md"),
        readFile(root, "vault/Preferences.md"),
      ],
    };
  }

  const recollect = readFile(root, "RECOLLECT.md");
  const map = readFile(root, "vault/Map.md");

  if (pack === "pulse") {
    if (!recollect.ok || !recollect.text) {
      return { pack, files: [recollect] };
    }
    const active = extractH2Section(recollect.text, "Active context");
    if (!active) {
      return {
        pack,
        files: [
          viewFile(
            "RECOLLECT.md#Active context",
            "",
            "missing ## Active context — use pack=law or pack=full"
          ),
        ],
      };
    }
    const hint =
      "_pack=pulse — Active only. Next: `attach` · `who` · `map_intent` · `law` · `full`._\n\n";
    return {
      pack,
      files: [viewFile("RECOLLECT.md#Active context", hint + active)],
    };
  }

  if (pack === "attach") {
    return runAttach(root, recollect, map);
  }

  if (pack === "law") {
    if (!recollect.ok || !recollect.text) {
      return { pack, files: [recollect] };
    }
    const law = withoutH2Section(recollect.text, "Active context");
    const header =
      "_pack=law — static vault OS (Active omitted; use `pulse`)._\n\n";
    return {
      pack,
      files: [viewFile("RECOLLECT.md (law)", header + law)],
    };
  }

  if (pack === "map_intent" || pack === "map_index") {
    if (!map.ok || !map.text) {
      return { pack, files: [map] };
    }
    const { intent, index } = splitMapViews(map.text);
    if (pack === "map_intent") {
      const header =
        "_pack=map_intent — Intent + load fence. Indexes via `map_index`._\n\n";
      return {
        pack,
        files: [viewFile("vault/Map.md#intent", header + intent)],
      };
    }
    if (!index.trim()) {
      return {
        pack,
        files: [
          viewFile(
            "vault/Map.md#index",
            "",
            "missing ## Identity & ops — use pack=map_intent or pack=full"
          ),
        ],
      };
    }
    const header =
      "_pack=map_index — entity indexes. Routing via `map_intent`._\n\n";
    return {
      pack,
      files: [viewFile("vault/Map.md#index", header + index)],
    };
  }

  throw new PolicyError(`unhandled boot pack: ${pack}`);
}

/** Compose pulse + who + map_intent under ATTACH_CHAR_BUDGET. */
function runAttach(
  root: string,
  recollect: BootFile,
  map: BootFile
): BootResult {
  const sections: BootFile[] = [];

  // pulse
  if (!recollect.ok || !recollect.text) {
    sections.push(recollect);
  } else {
    const active = extractH2Section(recollect.text, "Active context");
    if (!active) {
      sections.push(
        viewFile(
          "RECOLLECT.md#Active context",
          "",
          "missing ## Active context"
        )
      );
    } else {
      sections.push(
        viewFile(
          "RECOLLECT.md#Active context",
          "_pack=attach · pulse_\n\n" + active
        )
      );
    }
  }

  // who
  const me = readFile(root, "vault/Me.md");
  const prefs = readFile(root, "vault/Preferences.md");
  sections.push(me, prefs);

  // map_intent
  if (!map.ok || !map.text) {
    sections.push(map);
  } else {
    const { intent } = splitMapViews(map.text);
    sections.push(
      viewFile(
        "vault/Map.md#intent",
        "_pack=attach · map_intent_\n\n" + intent
      )
    );
  }

  // Enforce total budget: shrink map_intent last section first
  let total = sections.reduce((n, f) => n + (f.text?.length ?? 0), 0);
  if (total > ATTACH_CHAR_BUDGET) {
    const last = sections[sections.length - 1];
    if (last?.ok && last.text) {
      const overhead = total - last.text.length;
      const allow = Math.max(500, ATTACH_CHAR_BUDGET - overhead);
      if (last.text.length > allow) {
        last.text =
          last.text.slice(0, allow) +
          `\n\n…[attach budget ${ATTACH_CHAR_BUDGET} chars; use map_intent alone for full Intent]`;
        last.truncated = true;
      }
    }
  }

  return { pack: "attach", files: sections };
}

export function formatBootResult(result: BootResult): string {
  const parts: string[] = [
    `# recollect-os-mcp boot (pack=${result.pack})`,
    "",
    "Views over fixed paths only. Not a vault dump.",
    "",
  ];
  for (const f of result.files) {
    parts.push(`## ${f.path}`);
    if (f.missing) {
      parts.push(f.error ? `_missing: ${f.error}_` : "_missing_");
    } else if (f.error) {
      parts.push(`_error: ${f.error}_`);
    } else {
      if (f.truncated) parts.push("_truncated_");
      parts.push("");
      parts.push(f.text ?? "");
    }
    parts.push("");
  }
  return parts.join("\n");
}
