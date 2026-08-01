import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HTTP_READ_TOOLS,
  isHttpReadTool,
  requireBearer,
  resolveHttpToken,
} from "../src/http-auth.js";

describe("http-auth", () => {
  it("resolveHttpToken reads env when long enough", () => {
    const prev = process.env.RECOLLECT_HTTP_TOKEN;
    process.env.RECOLLECT_HTTP_TOKEN = "x".repeat(16);
    delete process.env.RECOLLECT_HTTP_TOKEN_FILE;
    assert.equal(resolveHttpToken()?.length, 16);
    if (prev === undefined) delete process.env.RECOLLECT_HTTP_TOKEN;
    else process.env.RECOLLECT_HTTP_TOKEN = prev;
  });

  it("refuses when nothing configured", async () => {
    const prevJ = process.env.RECOLLECT_HTTP_JWT_SECRET;
    const prevT = process.env.RECOLLECT_HTTP_TOKEN;
    delete process.env.RECOLLECT_HTTP_JWT_SECRET;
    delete process.env.RECOLLECT_HTTP_TOKEN;
    delete process.env.RECOLLECT_HTTP_TOKEN_FILE;
    delete process.env.RECOLLECT_HTTP_JWT_SECRET_FILE;
    const r = await requireBearer("Bearer abc");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.status, 503);
    if (prevJ !== undefined) process.env.RECOLLECT_HTTP_JWT_SECRET = prevJ;
    if (prevT !== undefined) process.env.RECOLLECT_HTTP_TOKEN = prevT;
  });

  it("refuses missing Authorization", async () => {
    process.env.RECOLLECT_HTTP_TOKEN = "x".repeat(16);
    const r = await requireBearer(undefined);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.status, 401);
  });

  it("refuses wrong static bearer", async () => {
    process.env.RECOLLECT_HTTP_TOKEN = "x".repeat(16);
    delete process.env.RECOLLECT_HTTP_JWT_SECRET;
    const r = await requireBearer("Bearer wrong-token-here!!");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.status, 401);
  });

  it("accepts matching static bearer", async () => {
    const tok = "dogfood-secret-token";
    process.env.RECOLLECT_HTTP_TOKEN = tok;
    delete process.env.RECOLLECT_HTTP_JWT_SECRET;
    const r = await requireBearer(`Bearer ${tok}`);
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.mode, "static");
  });

  it("read tool allowlist is frozen", () => {
    assert.ok(isHttpReadTool("boot"));
    assert.ok(isHttpReadTool("status"));
    assert.ok(isHttpReadTool("resolve_intent"));
    assert.ok(isHttpReadTool("read_note"));
    assert.equal(isHttpReadTool("propose_write"), true);
    assert.equal(isHttpReadTool("capture_inbox"), true);
    assert.equal(isHttpReadTool("apply_write"), false);
    assert.equal(HTTP_READ_TOOLS.size, 6);
  });
});
