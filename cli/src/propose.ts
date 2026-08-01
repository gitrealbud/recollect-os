import fs from "node:fs";
import path from "node:path";
import {
  runProposeWrite,
  type ProposeWriteResult,
} from "recollect-os-mcp/propose_write";
import { isVaultRoot } from "./fsutil.js";

export type CliProposeResult = {
  ok: boolean;
  body: string;
  result?: ProposeWriteResult;
};

function plainClass(c: string | undefined): string {
  switch (c) {
    case "Auto":
      return "safe (auto)";
    case "Propose":
      return "draft (needs accept)";
    case "Human-gate":
      return "ask first (irreversible / high-stakes)";
    case "Forbidden":
      return "not allowed by tools";
    default:
      return c ?? "unknown";
  }
}

/**
 * Stage a durable write (same path as MCP propose_write). Never writes the vault file.
 */
export function runCliPropose(
  root: string,
  opts: { path: string; content: string }
): CliProposeResult {
  const abs = path.resolve(root);
  if (!isVaultRoot(abs)) {
    return {
      ok: false,
      body: `RECOLLECT_ROOT invalid (need RECOLLECT.md + vault/): ${abs}\ncode: ROOT_INVALID\n`,
    };
  }

  const rel = opts.path?.trim();
  if (!rel) {
    return {
      ok: false,
      body:
        "Usage: recollect-os propose <vault-rel-path> --file <body.md> [--root dir]\n" +
        "       recollect-os propose <vault-rel-path> --stdin [--root dir]\n",
    };
  }

  try {
    const result = runProposeWrite(abs, {
      path: rel,
      content: opts.content,
    });

    if (result.class === "Forbidden" || !result.proposal_id) {
      return {
        ok: false,
        result,
        body:
          `# propose\n\n` +
          `code: ${result.code ?? "FORBIDDEN"}\n` +
          `class: ${plainClass(result.class)}\n` +
          `path: ${result.path}\n` +
          (result.error ? `error: ${result.error}\n` : "") +
          `\nNo proposal id — nothing to accept.\n`,
      };
    }

    const targetAbs = path.join(abs, result.path);
    const durable = fs.existsSync(targetAbs);

    return {
      ok: true,
      result,
      body:
        `# propose\n\n` +
        `code: OK\n` +
        `class: ${plainClass(result.class)}\n` +
        `proposal_id: ${result.proposal_id}\n` +
        `path: ${result.path}\n` +
        `draft_summary: ${result.draft_summary ?? ""}\n` +
        `durable_before_accept: ${durable}\n` +
        `\nNo permanent write yet. You: recollect-os accept ${result.proposal_id}\n` +
        `  (or: recollect-os accept --latest when only one draft is pending)\n` +
        `  Windows: recollect-os.cmd accept …\n`,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      body: `${message}\ncode: PROPOSE_FAILED\n`,
    };
  }
}

export function readProposeContent(opts: {
  file?: string;
  stdin?: boolean;
}): { ok: true; content: string } | { ok: false; body: string } {
  if (opts.file) {
    const p = path.resolve(opts.file);
    if (!fs.existsSync(p)) {
      return { ok: false, body: `Body file not found: ${p}\ncode: BODY_MISSING\n` };
    }
    return { ok: true, content: fs.readFileSync(p, "utf8") };
  }
  if (opts.stdin) {
    try {
      const content = fs.readFileSync(0, "utf8");
      if (!content.trim()) {
        return {
          ok: false,
          body: "stdin was empty — pass --file or pipe a markdown body.\ncode: BODY_EMPTY\n",
        };
      }
      return { ok: true, content };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, body: `stdin read failed: ${message}\ncode: BODY_STDIN\n` };
    }
  }
  return {
    ok: false,
    body:
      "Usage: recollect-os propose <vault-rel-path> --file <body.md> [--root dir]\n" +
      "       recollect-os propose <vault-rel-path> --stdin [--root dir]\n",
  };
}
