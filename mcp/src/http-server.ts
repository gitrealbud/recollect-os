#!/usr/bin/env node
/**
 * recollect-os-mcp HTTP — remote connect tools (read-first).
 *
 * Auth: short-lived JWT (RECOLLECT_HTTP_JWT_SECRET) preferred;
 *       legacy static RECOLLECT_HTTP_TOKEN still accepted.
 * Tools: boot · status · resolve_intent · read_note · capture_inbox · propose_write.
 * apply_write is NOT registered (accept stays local stdio / CLI).
 *
 * Mint: recollect-os-mcp-mint  (or npm run mint)
 */
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { resolveRoot, RootError } from "./root.js";
import { requireBearer } from "./http-auth.js";
import { resolveJwtSecret } from "./http-jwt.js";
import { resolveHttpToken } from "./http-auth.js";
import { registerHttpTools } from "./register-read-tools.js";
import { registerVaultApi } from "./vault-api.js";
import { appendAudit } from "./audit.js";
import { AGENT_FRAME_SEED } from "./agent-frame-seed.js";

function errMsg(e: unknown): string {
  if (e instanceof RootError) return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}

function createReadServer(root: string): McpServer {
  const server = new McpServer(
    {
      name: "recollect-os-mcp-http",
      version: "0.4.4-frame",
    },
    { instructions: AGENT_FRAME_SEED }
  );
  registerHttpTools(server, root);
  return server;
}

async function main() {
  let root: string;
  try {
    root = resolveRoot();
  } catch (e) {
    console.error(errMsg(e));
    process.exit(1);
  }

  const jwtConfigured = Boolean(resolveJwtSecret());
  const staticConfigured = Boolean(resolveHttpToken());
  const host = process.env.RECOLLECT_HTTP_HOST ?? "127.0.0.1";
  const port = Number(process.env.RECOLLECT_HTTP_PORT ?? "3927");
  // Tunnel / reverse-proxy sends public Host (e.g. recollect.densityforge.com).
  // SDK defaults to localhost-only Host validation → 403 Invalid Host without this.
  const allowedHosts = [
    "127.0.0.1",
    "localhost",
    "::1",
    ...(process.env.RECOLLECT_HTTP_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ];
  const publicHost = process.env.RECOLLECT_HTTP_PUBLIC_HOST?.trim();
  if (publicHost && !allowedHosts.includes(publicHost)) {
    allowedHosts.push(publicHost);
  }

  const app = createMcpExpressApp({ host, allowedHosts });
  // vault-api PUT body (MCP transport has its own parser on /mcp)
  app.use(express.json({ limit: "4mb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      service: "recollect-os-mcp-http",
      phase: "3-draft",
      tools: [
        "boot",
        "status",
        "resolve_intent",
        "read_note",
        "capture_inbox",
        "propose_write",
      ],
      apply_write: false,
      vault_api: true,
      vault_api_write: process.env.RECOLLECT_VAULT_API_WRITE === "1",
      auth: {
        jwt: jwtConfigured,
        static_legacy: staticConfigured,
      },
    });
  });

  // Phone / vault-ui REST (list+read; write opt-in) — same Bearer as MCP
  registerVaultApi(app, root);

  app.use("/mcp", async (req: Request, res: Response, next: NextFunction) => {
    const auth = await requireBearer(req.header("authorization") ?? undefined);
    if (!auth.ok) {
      appendAudit(root, {
        event: "http_auth",
        tool: "http",
        code: auth.status === 503 ? "ROOT_INVALID" : "READ_DENIED",
        method: req.method,
        status: auth.status,
      });
      res.status(auth.status).json({
        jsonrpc: "2.0",
        error: { code: -32001, message: auth.message },
        id: null,
      });
      return;
    }
    (req as Request & { recollectAuth?: typeof auth }).recollectAuth = auth;
    next();
  });

  app.post("/mcp", async (req: Request, res: Response) => {
    const server = createReadServer(root);
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      const mode =
        (req as Request & { recollectAuth?: { mode?: string } }).recollectAuth
          ?.mode ?? "unknown";
      appendAudit(root, {
        event: "http_request",
        tool: "http",
        code: "OK",
        method: "POST",
        status: res.statusCode || 200,
        class: mode,
      });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      console.error("HTTP MCP error:", error);
      appendAudit(root, {
        event: "http_request",
        tool: "http",
        code: "UNKNOWN_PACK",
        method: "POST",
        status: 500,
      });
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Use POST." },
      id: null,
    });
  });

  app.delete("/mcp", (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Stateless mode — no session DELETE.",
      },
      id: null,
    });
  });

  app.listen(port, host, () => {
    console.error(
      `recollect-os-mcp-http listening http://${host}:${port}/mcp + /vault-api (read tools; jwt=${jwtConfigured} static=${staticConfigured}; vault_write=${process.env.RECOLLECT_VAULT_API_WRITE === "1"})`
    );
    if (!jwtConfigured && !staticConfigured) {
      console.error(
        "WARN: set RECOLLECT_HTTP_JWT_SECRET (min 32) or legacy RECOLLECT_HTTP_TOKEN (min 16)"
      );
    }
  });
}

main().catch((e) => {
  console.error(errMsg(e));
  process.exit(1);
});
