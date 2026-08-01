/**
 * HTTP tool registration: read + capture + propose.
 * apply_write stays local stdio only (step 3 — accept is local).
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
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
  formatProposeWrite,
  runProposeWrite,
} from "./tools/propose_write.js";
import {
  formatResolveIntent,
  runResolveIntent,
} from "./tools/resolve_intent.js";
import { formatStatus, runStatus } from "./tools/status.js";
import { withAgentFrameSeed } from "./agent-frame-seed.js";

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
  return textResult(formatEnvelope(envelopeErr(tool, code, message)), true);
}

/** @deprecated alias — use registerHttpTools */
export function registerReadTools(server: McpServer, root: string): void {
  registerHttpTools(server, root);
}

export function registerHttpTools(server: McpServer, root: string): void {
  server.registerTool(
    "boot",
    {
      description:
        "Load a small fixed boot view (not a vault dump). Prefer overlay (default active set) or pulse; attach when partner who is needed. Notes on disk are the record; load little; draft then human accepts. pack: overlay (default) | pulse | attach | law | map_intent | map_index | who | full.",
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
            "Boot view. Default overlay = default active set (+ frame seed). pulse = personal focus only. attach includes who + frame seed."
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
        "Match Map Intent table for query; ≤3 rows × ≤2 paths. Not FTS. Never People/restricted.",
      inputSchema: {
        query: z.string().describe("Natural intent phrase"),
      },
    },
    async ({ query }) => {
      try {
        const result = runResolveIntent(root, query);
        return textResult(
          formatEnvelope(
            envelopeOk("resolve_intent", `matches=${result.matches.length}`, {
              ...result,
              human: formatResolveIntent(result),
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
        "Read one vault-relative note. Allowlisted only. Refuses Secrets/Archive/People/restricted.",
      inputSchema: {
        path: z.string().describe("Vault-relative path, e.g. vault/Map.md"),
      },
    },
    async ({ path: notePath }) => {
      try {
        const result = runReadNote(root, notePath);
        return textResult(
          formatEnvelope(
            envelopeOk("read_note", result.path, {
              path: result.path,
              truncated: result.truncated,
              text: result.text,
            })
          )
        );
      } catch (e) {
        return errEnvelope("read_note", e);
      }
    }
  );

  server.registerTool(
    "status",
    {
      description:
        "Personal focus strip (Active context) plus optional one “what’s true now” for a short-index intent. Not a vault dump.",
      inputSchema: {
        intent: z
          .string()
          .optional()
          .describe("Optional short-index intent phrase"),
      },
    },
    async ({ intent }) => {
      try {
        const result = runStatus(root, intent);
        return textResult(
          formatEnvelope(
            envelopeOk("status", result.note ?? "OK", {
              ...result,
              human: formatStatus(result),
            })
          )
        );
      } catch (e) {
        return errEnvelope("status", e);
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
    "propose_write",
    {
      description:
        "Stage a durable write as a draft only — never writes the vault. Returns class + proposal_id. Human accepts locally via apply_write (not on HTTP).",
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
              note: "Accept locally: stdio apply_write or recollect-os accept <id>",
            });
        return textResult(formatEnvelope(env), forbidden);
      } catch (e) {
        return errEnvelope("propose_write", e);
      }
    }
  );
}
