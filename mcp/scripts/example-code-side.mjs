#!/usr/bin/env node
/**
 * Density example: code-side multi-step without dumping the vault into chat.
 *
 *   RECOLLECT_ROOT=... node scripts/example-code-side.mjs
 *
 * Or remote:
 *   RECOLLECT_HTTP_URL=http://127.0.0.1:3927/mcp
 *   RECOLLECT_HTTP_TOKEN=$(npm run -s mint)
 *   node scripts/example-code-side.mjs --http
 */
import { RecollectCodeApi } from "../dist/src/code-api.js";

async function main() {
  const http = process.argv.includes("--http");
  let api;
  if (http) {
    const url = process.env.RECOLLECT_HTTP_URL ?? "http://127.0.0.1:3927/mcp";
    const token = process.env.RECOLLECT_HTTP_TOKEN ?? "";
    if (!token) {
      console.error("Set RECOLLECT_HTTP_TOKEN (mint JWT) for --http");
      process.exit(1);
    }
    api = RecollectCodeApi.fromHttp({ url, token });
  } else {
    api = RecollectCodeApi.fromRoot(process.env.RECOLLECT_ROOT);
  }

  try {
    const st = await api.status();
    console.log("status ok=", st.ok);
    if (st.session_now) {
      const lines = String(st.session_now).trim().split("\n").slice(0, 5);
      console.log("personal focus (≤5 lines):\n", lines.join("\n"));
    }
    // Compact multi-note: resolve + one read — not a vault walk
    const q = process.argv.find((a) => a.startsWith("--q="))?.slice(4) ?? "who";
    const compact = await api.resolveAndReadFirst(q);
    console.log(
      "resolveAndReadFirst:",
      compact.ok ? compact.path : compact.message
    );
  } finally {
    await api.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
