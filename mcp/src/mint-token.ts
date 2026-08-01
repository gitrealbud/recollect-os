#!/usr/bin/env node
/**
 * Mint a short-lived JWT for recollect-os-mcp-http (solo operator).
 *
 *   export RECOLLECT_HTTP_JWT_SECRET='at-least-32-chars-of-secret-here'
 *   npx recollect-os-mcp-mint
 *   npx recollect-os-mcp-mint --ttl 300 --sub density
 *
 * Token on stdout (pipeable). Metadata on stderr.
 */
import {
  clampTtl,
  mintHttpJwt,
  resolveJwtSecret,
  DEFAULT_AUD,
  DEFAULT_ISS,
  DEFAULT_TTL_SEC,
  DEFAULT_SCOPES,
  MIN_SECRET_LEN,
} from "./http-jwt.js";

function usage(): never {
  console.error(`Usage: recollect-os-mcp-mint [--ttl SEC] [--sub NAME] [--aud AUD] [--iss ISS] [--read-only]

Env:
  RECOLLECT_HTTP_JWT_SECRET or RECOLLECT_HTTP_JWT_SECRET_FILE  (min ${MIN_SECRET_LEN} chars)
  RECOLLECT_HTTP_JWT_AUD  (default ${DEFAULT_AUD})
  RECOLLECT_HTTP_JWT_ISS  (default ${DEFAULT_ISS})

Defaults: ttl=${DEFAULT_TTL_SEC}s (max 3600), sub=operator
Default scope: recollect.read recollect.capture recollect.propose
  --read-only → recollect.read only (no capture/propose)
Never mints recollect.apply (accept stays local).
Token prints to stdout; meta to stderr.
`);
  process.exit(2);
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

async function main() {
  if (process.argv.includes("-h") || process.argv.includes("--help")) usage();
  const secret = resolveJwtSecret();
  if (!secret) {
    console.error(
      `FAIL: set RECOLLECT_HTTP_JWT_SECRET (min ${MIN_SECRET_LEN} chars) or RECOLLECT_HTTP_JWT_SECRET_FILE`
    );
    process.exit(1);
  }
  const ttlRaw = arg("--ttl");
  const ttlSec = clampTtl(ttlRaw ? Number(ttlRaw) : undefined);
  const sub = arg("--sub") ?? "operator";
  const aud = arg("--aud");
  const iss = arg("--iss");
  const readOnly = process.argv.includes("--read-only");
  const scope = readOnly ? "recollect.read" : DEFAULT_SCOPES;
  try {
    const minted = await mintHttpJwt({
      secret,
      sub,
      ttlSec,
      aud,
      iss,
      scope,
    });
    console.error(
      `minted sub=${minted.sub} aud=${minted.aud} iss=${minted.iss} scope="${scope}" ttl=${minted.ttlSec}s exp=${new Date(minted.exp * 1000).toISOString()}`
    );
    process.stdout.write(minted.token + "\n");
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

main();
