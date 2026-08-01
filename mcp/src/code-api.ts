/**
 * Code-side tool calls — thin API over vault tools.
 *
 * Frame: notes on disk are the record; load little; draft then human accepts.
 *
 * Two modes:
 *   fromRoot(root)  — in-process (same machine as vault; densest)
 *   fromHttp(opts)  — remote HTTP MCP + Bearer JWT/static token
 *
 * Never exposes apply_write over HTTP. Local accept stays CLI/stdio.
 *
 * Agent pattern: write short code that calls these methods, keep model context
 * on compressed results — not full short-index dumps.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { resolveRoot } from "./root.js";
import { runBoot, formatBootResult } from "./tools/boot.js";
import { runStatus, formatStatus } from "./tools/status.js";
import { runResolveIntent, formatResolveIntent } from "./tools/resolve_intent.js";
import { runReadNote } from "./tools/read_note.js";
import { runCaptureInbox } from "./tools/capture_inbox.js";
import {
  formatProposeWrite,
  runProposeWrite,
} from "./tools/propose_write.js";
import {
  envelopeOk,
  formatEnvelope,
  type ToolEnvelope,
} from "./errors.js";

export type CodeApiMode = "local" | "http";

export type HttpCodeApiOptions = {
  /** Base URL including path, e.g. http://127.0.0.1:3927/mcp */
  url: string;
  /** Bearer token (JWT or legacy static). Prefer mint CLI. */
  token: string;
};

function parseEnvelopeText(text: string): ToolEnvelope {
  try {
    return JSON.parse(text) as ToolEnvelope;
  } catch {
    return { ok: false, code: "POLICY", message: "Non-JSON tool response", text };
  }
}

function contentToEnvelope(result: {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
}): ToolEnvelope {
  const text = result.content?.find((c) => c.type === "text")?.text ?? "";
  const env = parseEnvelopeText(text);
  if (result.isError && env.ok) {
    return { ...env, ok: false };
  }
  return env;
}

export class RecollectCodeApi {
  readonly mode: CodeApiMode;
  private root?: string;
  private http?: { url: string; token: string; client?: Client };

  private constructor(mode: CodeApiMode) {
    this.mode = mode;
  }

  /** In-process: requires RECOLLECT_ROOT or explicit root. */
  static fromRoot(root?: string): RecollectCodeApi {
    const api = new RecollectCodeApi("local");
    if (root) {
      process.env.RECOLLECT_ROOT = root;
    }
    api.root = resolveRoot();
    return api;
  }

  /** Remote HTTP MCP (read + capture + propose). */
  static fromHttp(opts: HttpCodeApiOptions): RecollectCodeApi {
    const api = new RecollectCodeApi("http");
    api.http = { url: opts.url, token: opts.token };
    return api;
  }

  private async ensureHttpClient(): Promise<Client> {
    if (!this.http) throw new Error("not in http mode");
    if (this.http.client) return this.http.client;
    const transport = new StreamableHTTPClientTransport(new URL(this.http.url), {
      requestInit: {
        headers: { Authorization: `Bearer ${this.http.token}` },
      },
    });
    const client = new Client({
      name: "recollect-code-api",
      version: "0.4.3",
    });
    await client.connect(transport);
    this.http.client = client;
    return client;
  }

  private async callHttp(
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolEnvelope> {
    const client = await this.ensureHttpClient();
    const result = await client.callTool({ name, arguments: args });
    return contentToEnvelope(
      result as { content?: Array<{ type: string; text?: string }>; isError?: boolean }
    );
  }

  async close(): Promise<void> {
    if (this.http?.client) {
      await this.http.client.close();
      this.http.client = undefined;
    }
  }

  async boot(pack?: string): Promise<ToolEnvelope> {
    if (this.mode === "local") {
      const result = runBoot(this.root!, pack as never);
      return envelopeOk("boot", `boot pack=${result.pack}`, {
        pack: result.pack,
        files: result.files.length,
        human: formatBootResult(result),
      });
    }
    return this.callHttp("boot", pack ? { pack } : {});
  }

  async status(intent?: string): Promise<ToolEnvelope> {
    if (this.mode === "local") {
      const r = runStatus(this.root!, intent);
      return envelopeOk("status", r.note ?? "OK", {
        ...r,
        human: formatStatus(r),
      });
    }
    return this.callHttp("status", intent ? { intent } : {});
  }

  async resolveIntent(query: string): Promise<ToolEnvelope> {
    if (this.mode === "local") {
      const r = runResolveIntent(this.root!, query);
      return envelopeOk("resolve_intent", `matches=${r.matches.length}`, {
        ...r,
        human: formatResolveIntent(r),
      });
    }
    return this.callHttp("resolve_intent", { query });
  }

  async readNote(path: string): Promise<ToolEnvelope> {
    if (this.mode === "local") {
      const r = runReadNote(this.root!, path);
      return envelopeOk("read_note", r.path, {
        path: r.path,
        truncated: r.truncated,
        text: r.text,
      });
    }
    return this.callHttp("read_note", { path });
  }

  async captureInbox(input: {
    body: string;
    slug?: string;
    title?: string;
  }): Promise<ToolEnvelope> {
    if (this.mode === "local") {
      const r = runCaptureInbox(this.root!, input);
      return envelopeOk("capture_inbox", `Captured: ${r.path}`, {
        path: r.path,
      });
    }
    return this.callHttp("capture_inbox", input);
  }

  async proposeWrite(input: {
    path: string;
    content: string;
  }): Promise<ToolEnvelope> {
    if (this.mode === "local") {
      const r = runProposeWrite(this.root!, input);
      const forbidden = r.class === "Forbidden";
      if (forbidden) {
        return {
          ok: false,
          code: (r.code as "FORBIDDEN_PATH") ?? "FORBIDDEN_PATH",
          message: r.error ?? "Not allowed by tools",
          tool: "propose_write",
          class: r.class,
          path: r.path,
          proposal_id: null,
          human: formatProposeWrite(r),
        };
      }
      return envelopeOk("propose_write", `staged ${r.proposal_id}`, {
        class: r.class,
        path: r.path,
        proposal_id: r.proposal_id,
        draft_summary: r.draft_summary,
        human: formatProposeWrite(r),
        note: "Accept locally: recollect-os accept <id> or stdio apply_write",
      });
    }
    return this.callHttp("propose_write", input);
  }

  /**
   * Compact multi-note helper: resolve intent → read first path only.
   * Returns small payload for model context (not a vault dump).
   */
  async resolveAndReadFirst(query: string): Promise<{
    ok: boolean;
    intent?: string;
    path?: string;
    text?: string;
    message: string;
    choices?: unknown;
  }> {
    const resolved = await this.resolveIntent(query);
    if (!resolved.ok) {
      return { ok: false, message: resolved.message };
    }
    const matches = (resolved.matches as Array<{
      intent: string;
      paths: string[];
    }>) ?? [];
    if (matches.length === 0) {
      return { ok: false, message: resolved.message || "no matches" };
    }
    if (matches.length > 1) {
      return {
        ok: false,
        message: "ambiguous intent — narrow query",
        choices: matches.map((m) => ({ intent: m.intent, paths: m.paths })),
      };
    }
    const path = matches[0].paths[0];
    if (!path) {
      return {
        ok: false,
        message: `matched ${matches[0].intent} but no readable path`,
      };
    }
    const note = await this.readNote(path);
    if (!note.ok) {
      return { ok: false, message: note.message, path };
    }
    return {
      ok: true,
      intent: matches[0].intent,
      path,
      text: note.text as string | undefined,
      message: "ok",
    };
  }
}

/** Anti-patterns (do not do in agent-generated code). */
export const CODE_SIDE_ANTI_PATTERNS = [
  "Do not fs.readFile the vault root or walk directories",
  "Do not call apply_write over HTTP — accept is local only",
  "Do not loop resolveIntent with dump-all queries",
  "Do not print full boot(full) into the model context",
  "Do not store JWT secrets in generated code or chat",
  "Prefer resolveAndReadFirst or status over bulk reads",
] as const;
