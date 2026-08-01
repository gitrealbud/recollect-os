#!/usr/bin/env node
/**
 * recollect-os-mcp — local stdio MCP for Recollect vaults.
 * Logs only on stderr. Requires RECOLLECT_ROOT.
 * Tool text payloads are JSON envelopes: { ok, code, message, ... }.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { resolveRoot, RootError } from "./root.js";
import { PolicyError } from "./allowlist.js";
import {
  RecollectError,
  classifyPolicyMessage,
  envelopeErr,
  envelopeOk,
  formatEnvelope,
  messageFromUnknown,
} from "./errors.js";
import {
  formatBootResultWithSeed,
  runBoot,
} from "./tools/boot.js";
import { runReadNote } from "./tools/read_note.js";
import { runCaptureInbox } from "./tools/capture_inbox.js";
import {
  formatResolveIntent,
  runResolveIntent,
} from "./tools/resolve_intent.js";
import { formatStatus, runStatus } from "./tools/status.js";
import {
  formatProposeWrite,
  runProposeWrite,
} from "./tools/propose_write.js";
import { formatApplyWrite, runApplyWrite } from "./tools/apply_write.js";
import {
  AGENT_FRAME_SEED,
  withAgentFrameSeed,
} from "./agent-frame-seed.js";

function textResult(text: string, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    isError,
  };
}

function errEnvelope(tool: string, e: unknown) {
  const message = messageFromUnknown(e);
  const code =
    e instanceof RecollectError
      ? e.code
      : e instanceof PolicyError
        ? e.code
        : classifyPolicyMessage(message);
  return textResult(
    formatEnvelope(envelopeErr(tool, code, message)),
    true
  );
}

function errMsg(e: unknown): string {
  if (e instanceof RootError || e instanceof PolicyError || e instanceof RecollectError)
    return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}

async function main() {
  let root: string;
  try {
    root = resolveRoot();
  } catch (e) {
    console.error(errMsg(e));
    process.exit(1);
  }

  const server = new McpServer(
    {
      name: "recollect-os-mcp",
      version: "0.4.3",
    },
    { instructions: AGENT_FRAME_SEED }
  );

  server.registerTool(
    "boot",
    {
      description:
        "Load a small fixed boot view (not a vault dump). Prefer overlay (default active set) or pulse; attach when partner who is needed; avoid full. Notes on disk are the record; load little; draft then human accepts. pack: overlay (default) | pulse | attach | law | map_intent | map_index | who | full.",
      inputSchema: {
        pack: z
          .enum([
            "pulse",
            "overlay",
            "attach",
            "law",
            "map_intent",
            "map_index",
            "who",
            "full",
          ])
          .optional()
          .describe(
            "Boot view. Default overlay = default active set in one call (+ frame seed). pulse = personal focus only. attach = pulse+who+map_intent. full = sterile four-file pack."
          ),
      },
    },
    async ({ pack }) => {
      try {
        const result = runBoot(root, pack);
        const human = formatBootResultWithSeed(result, withAgentFrameSeed);
        return textResult(
          formatEnvelope(
            envelopeOk("boot", `boot pack=${result.pack}`, {
              pack: result.pack,
              files: result.files.length,
              human,
            })
          )
        );
      } catch (e) {
        return errEnvelope("boot", e);
      }
    }
  );

  server.registerTool(
    "resolve_intent",
    {
      description:
        "Match short-index Intent table rows for a query; return ≤3 rows with ≤2 resolved vault paths each. Not full-text search. Never returns People/ or restricted notes.",
      inputSchema: {
        query: z
          .string()
          .describe("Natural intent phrase, e.g. career search or portfolio product"),
      },
    },
    async ({ query }) => {
      try {
        const r = runResolveIntent(root, query);
        return textResult(
          formatEnvelope(
            envelopeOk("resolve_intent", r.hint ?? `matches=${r.matches.length}`, {
              matches: r.matches,
              hint: r.hint,
              human: formatResolveIntent(r),
            })
          )
        );
      } catch (e) {
        return errEnvelope("resolve_intent", e);
      }
    }
  );

  server.registerTool(
    "read_note",
    {
      description:
        "Read one vault-relative note. Allowlisted paths only. Refuses Secrets/, Archive/, People/, path traversal, and sensitivity: restricted.",
      inputSchema: {
        path: z
          .string()
          .describe("Vault-relative path, e.g. vault/Map.md or vault/Career.md"),
      },
    },
    async ({ path: notePath }) => {
      try {
        const r = runReadNote(root, notePath);
        return textResult(
          formatEnvelope(
            envelopeOk("read_note", `read ${r.path}`, {
              path: r.path,
              truncated: r.truncated,
              text: r.text,
            })
          )
        );
      } catch (e) {
        return errEnvelope("read_note", e);
      }
    }
  );

  server.registerTool(
    "capture_inbox",
    {
      description:
        "Write one personal capture to vault/Inbox/YYYY-MM-DD-HHmm-slug.md with type: note (safe auto). Does not git-commit. No evergreen/Business/Daily writes.",
      inputSchema: {
        body: z.string().describe("Note body (markdown)"),
        slug: z
          .string()
          .optional()
          .describe("Optional kebab slug fragment (~40 chars)"),
        title: z.string().optional().describe("Optional title heading"),
      },
    },
    async ({ body, slug, title }) => {
      try {
        const r = runCaptureInbox(root, { body, slug, title });
        return textResult(
          formatEnvelope(
            envelopeOk("capture_inbox", `Captured: ${r.path}`, {
              path: r.path,
            })
          )
        );
      } catch (e) {
        return errEnvelope("capture_inbox", e);
      }
    }
  );

  server.registerTool(
    "status",
    {
      description:
        "Live glance: personal focus plus optional one “what’s true now” for a short-index intent. Ambiguous intents return choices — never merges. No vault dump. Notes on disk are the record; draft then human accepts.",
      inputSchema: {
        intent: z
          .string()
          .optional()
          .describe(
            "Optional short-index intent. Omit for personal focus only. If ambiguous, returns choices."
          ),
      },
    },
    async ({ intent }) => {
      try {
        const r = runStatus(root, intent);
        return textResult(
          formatEnvelope(
            envelopeOk("status", r.note ?? "status ok", {
              session_now: r.session_now,
              hub_now: r.hub_now,
              hub_path: r.hub_path,
              choices: r.choices,
              human: formatStatus(r),
            })
          )
        );
      } catch (e) {
        return errEnvelope("status", e);
      }
    }
  );

  server.registerTool(
    "propose_write",
    {
      description:
        "Stage a durable write as a draft only — never writes the vault. Returns class + proposal_id. The human must accept via apply_write before anything permanent. Forbidden paths get no id.",
      inputSchema: {
        path: z
          .string()
          .describe("Vault-relative path, e.g. vault/My Hub.md or RECOLLECT.md"),
        content: z.string().describe("Full file contents to stage"),
      },
    },
    async ({ path: notePath, content }) => {
      try {
        const r = runProposeWrite(root, { path: notePath, content });
        const forbidden = r.class === "Forbidden";
        const env = forbidden
          ? envelopeErr(
              "propose_write",
              (r.code as "FORBIDDEN_PATH" | "FORBIDDEN_CONTENT") ??
                "FORBIDDEN_PATH",
              r.error ?? "Not allowed by tools",
              {
                class: r.class,
                path: r.path,
                proposal_id: null,
                human: formatProposeWrite(r),
              }
            )
          : envelopeOk("propose_write", `staged ${r.proposal_id}`, {
              class: r.class,
              path: r.path,
              proposal_id: r.proposal_id,
              draft_summary: r.draft_summary,
              human: formatProposeWrite(r),
            });
        return textResult(formatEnvelope(env), forbidden);
      } catch (e) {
        return errEnvelope("propose_write", e);
      }
    }
  );

  server.registerTool(
    "apply_write",
    {
      description:
        "Apply a staged draft after the human accepts. Requires proposal_id and accept: true. Sole MCP path for permanent writes that needed accept. Do not invent accept.",
      inputSchema: {
        proposal_id: z.string().describe("Id from propose_write"),
        accept: z
          .boolean()
          .describe("Must be true — operator explicit accept"),
      },
    },
    async ({ proposal_id, accept }) => {
      try {
        const r = runApplyWrite(root, { proposal_id, accept });
        return textResult(
          formatEnvelope(
            envelopeOk("apply_write", `applied ${r.path}`, {
              ...r,
              human: formatApplyWrite(r),
            })
          )
        );
      } catch (e) {
        return errEnvelope("apply_write", e);
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`recollect-os-mcp: ready root=${root} v0.3.6`);
}

main().catch((e) => {
  console.error(errMsg(e));
  process.exit(1);
});
