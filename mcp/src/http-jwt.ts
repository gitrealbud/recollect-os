/**
 * Short-lived JWT for solo-operator remote HTTP (step 2.2).
 * HS256 · aud + exp required · no refresh tokens · density first.
 */
import fs from "node:fs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const DEFAULT_AUD = "recollect";
export const DEFAULT_ISS = "recollect-os-mcp";
export const DEFAULT_TTL_SEC = 600;
export const MAX_TTL_SEC = 3600;
export const MIN_SECRET_LEN = 32;

/** Default scopes for remote surface (no apply). */
export const DEFAULT_SCOPES = "recollect.read recollect.capture recollect.propose";

export type MintOptions = {
  secret: string;
  sub?: string;
  ttlSec?: number;
  aud?: string;
  iss?: string;
  /** Space-separated scopes. Default includes read+capture+propose. */
  scope?: string;
};

export type VerifyOk = {
  ok: true;
  sub: string;
  aud: string;
  exp: number;
  scope: string;
};

export type VerifyFail = {
  ok: false;
  status: number;
  message: string;
};

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function resolveJwtSecret(): string | undefined {
  const env = process.env.RECOLLECT_HTTP_JWT_SECRET?.trim();
  if (env && env.length >= MIN_SECRET_LEN) return env;
  const file = process.env.RECOLLECT_HTTP_JWT_SECRET_FILE?.trim();
  if (file) {
    try {
      const raw = fs.readFileSync(file, "utf8").trim();
      if (raw.length >= MIN_SECRET_LEN) return raw;
    } catch {
      /* missing */
    }
  }
  return undefined;
}

export function clampTtl(ttlSec: number | undefined): number {
  const n = Number(ttlSec ?? DEFAULT_TTL_SEC);
  if (!Number.isFinite(n) || n < 60) return DEFAULT_TTL_SEC;
  return Math.min(Math.floor(n), MAX_TTL_SEC);
}

export async function mintHttpJwt(opts: MintOptions): Promise<{
  token: string;
  exp: number;
  iat: number;
  sub: string;
  aud: string;
  iss: string;
  ttlSec: number;
}> {
  if (!opts.secret || opts.secret.length < MIN_SECRET_LEN) {
    throw new Error(
      `JWT secret min ${MIN_SECRET_LEN} chars (RECOLLECT_HTTP_JWT_SECRET)`
    );
  }
  const ttlSec = clampTtl(opts.ttlSec);
  const sub = (opts.sub ?? "operator").trim() || "operator";
  const aud = opts.aud ?? process.env.RECOLLECT_HTTP_JWT_AUD?.trim() ?? DEFAULT_AUD;
  const iss = opts.iss ?? process.env.RECOLLECT_HTTP_JWT_ISS?.trim() ?? DEFAULT_ISS;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSec;
  const scope = (opts.scope ?? DEFAULT_SCOPES).trim() || DEFAULT_SCOPES;
  if (/\brecollect\.apply\b/.test(scope)) {
    throw new Error("recollect.apply is not mintable for HTTP (accept stays local)");
  }
  const token = await new SignJWT({ scope })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(sub)
    .setAudience(aud)
    .setIssuer(iss)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(secretKey(opts.secret));
  return { token, exp, iat, sub, aud, iss, ttlSec };
}

export function looksLikeJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

export async function verifyHttpJwt(
  token: string,
  secret: string | undefined,
  expectedAud?: string
): Promise<VerifyOk | VerifyFail> {
  if (!secret || secret.length < MIN_SECRET_LEN) {
    return {
      ok: false,
      status: 503,
      message: `RECOLLECT_HTTP_JWT_SECRET not configured (min ${MIN_SECRET_LEN} chars).`,
    };
  }
  const aud =
    expectedAud ?? process.env.RECOLLECT_HTTP_JWT_AUD?.trim() ?? DEFAULT_AUD;
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), {
      algorithms: ["HS256"],
      audience: aud,
      issuer: process.env.RECOLLECT_HTTP_JWT_ISS?.trim() || DEFAULT_ISS,
    });
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    const scope =
      typeof payload.scope === "string" ? payload.scope : DEFAULT_SCOPES;
    if (!sub || !exp) {
      return { ok: false, status: 401, message: "Invalid JWT claims" };
    }
    return { ok: true, sub, aud, exp, scope };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "JWT verify failed";
    return { ok: false, status: 401, message: `Invalid or expired JWT: ${msg}` };
  }
}

/** For tests: inspect payload without verify (unsafe). */
export function decodePayloadUnsafe(token: string): JWTPayload | null {
  try {
    const mid = token.split(".")[1];
    if (!mid) return null;
    const json = Buffer.from(mid, "base64url").toString("utf8");
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}
