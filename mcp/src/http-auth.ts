/**
 * HTTP auth for remote connect tools.
 * Step 2.2: short-lived JWT (preferred).
 * Step 2.1: static shared secret still accepted as fallback (migrate off).
 */
import fs from "node:fs";
import {
  looksLikeJwt,
  resolveJwtSecret,
  verifyHttpJwt,
} from "./http-jwt.js";

export type AuthResult =
  | { ok: true; mode: "jwt" | "static"; sub?: string; scope?: string }
  | { ok: false; status: number; message: string };

/** Resolve static trial token from env or file (legacy 2.1). */
export function resolveHttpToken(): string | undefined {
  const env = process.env.RECOLLECT_HTTP_TOKEN?.trim();
  if (env && env.length >= 16) return env;
  const file = process.env.RECOLLECT_HTTP_TOKEN_FILE?.trim();
  if (file) {
    try {
      const raw = fs.readFileSync(file, "utf8").trim();
      if (raw.length >= 16) return raw;
    } catch {
      /* missing */
    }
  }
  return undefined;
}

export async function requireBearer(
  authHeader: string | undefined
): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      message: "Missing Authorization: Bearer <token>",
    };
  }
  const got = authHeader.slice("Bearer ".length).trim();
  if (!got) {
    return { ok: false, status: 401, message: "Empty bearer token" };
  }

  const jwtSecret = resolveJwtSecret();
  const staticToken = resolveHttpToken();

  if (!jwtSecret && !staticToken) {
    return {
      ok: false,
      status: 503,
      message:
        "HTTP auth not configured. Set RECOLLECT_HTTP_JWT_SECRET (preferred, min 32) or RECOLLECT_HTTP_TOKEN (legacy, min 16).",
    };
  }

  if (looksLikeJwt(got)) {
    if (!jwtSecret) {
      return {
        ok: false,
        status: 503,
        message: "JWT presented but RECOLLECT_HTTP_JWT_SECRET not configured.",
      };
    }
    const v = await verifyHttpJwt(got, jwtSecret);
    if (!v.ok) {
      return { ok: false, status: v.status, message: v.message };
    }
    return { ok: true, mode: "jwt", sub: v.sub, scope: v.scope };
  }

  // Legacy static secret (step 2.1) — full remote scopes except apply
  if (staticToken && got === staticToken) {
    return {
      ok: true,
      mode: "static",
      sub: "static",
      scope: "recollect.read recollect.capture recollect.propose",
    };
  }

  return {
    ok: false,
    status: 401,
    message: jwtSecret
      ? "Invalid bearer (expected valid short-lived JWT)"
      : "Invalid bearer token",
  };
}

/** Tools exposed over HTTP (step 3). apply_write never listed. */
export const HTTP_REMOTE_TOOLS = new Set([
  "boot",
  "status",
  "resolve_intent",
  "read_note",
  "capture_inbox",
  "propose_write",
]);

/** @deprecated use HTTP_REMOTE_TOOLS */
export const HTTP_READ_TOOLS = HTTP_REMOTE_TOOLS;

export function isHttpReadTool(name: string): boolean {
  return HTTP_REMOTE_TOOLS.has(name);
}

export function isHttpRemoteTool(name: string): boolean {
  return HTTP_REMOTE_TOOLS.has(name);
}
