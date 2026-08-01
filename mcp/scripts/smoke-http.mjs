#!/usr/bin/env node
/**
 * Smoke trial HTTP surface (step 2.1).
 * Starts no server — hits an already-running recollect-os-mcp-http.
 *
 *   RECOLLECT_HTTP_URL=http://127.0.0.1:3927
 *   RECOLLECT_HTTP_TOKEN=...
 *   node scripts/smoke-http.mjs
 */
const base = (process.env.RECOLLECT_HTTP_URL ?? "http://127.0.0.1:3927").replace(
  /\/$/,
  ""
);
const token = process.env.RECOLLECT_HTTP_TOKEN ?? "";

let failed = 0;
function ok(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS  ${name}${detail ? " — " + detail : ""}`);
  } else {
    failed++;
    console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

async function main() {
  const health = await fetch(`${base}/health`);
  const hj = await health.json();
  ok("GET /health", health.status === 200 && hj.ok === true, `phase=${hj.phase}`);

  const noAuth = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  ok("POST /mcp without bearer → 401 or 503", [401, 503].includes(noAuth.status), `status=${noAuth.status}`);

  if (token.length >= 16) {
    const bad = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong-token-not-valid",
      },
      body: "{}",
    });
    ok("POST /mcp wrong bearer → 401", bad.status === 401, `status=${bad.status}`);
  } else {
    console.log("SKIP  wrong-bearer (set RECOLLECT_HTTP_TOKEN ≥16 to enable)");
  }

  if (failed) {
    console.error(`\nsmoke-http: ${failed} failed`);
    process.exit(1);
  }
  console.log("\nsmoke-http: all checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
