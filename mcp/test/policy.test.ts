import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, before, after, type TestContext } from "node:test";
import { resolveRoot, rootCandidates } from "../src/root.js";
import {
  assertReadable,
  normalizeRel,
  PolicyError,
} from "../src/allowlist.js";
import { runBoot, ATTACH_CHAR_BUDGET } from "../src/tools/boot.js";
import { runReadNote } from "../src/tools/read_note.js";
import { runCaptureInbox } from "../src/tools/capture_inbox.js";
import { isRestricted, buildCaptureMarkdown } from "../src/frontmatter.js";
import { runResolveIntent } from "../src/tools/resolve_intent.js";
import { runStatus } from "../src/tools/status.js";
import { runProposeWrite } from "../src/tools/propose_write.js";
import { runApplyWrite } from "../src/tools/apply_write.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// fixtures live next to test sources; after compile, dist/test → need fixtures copied or path to source
const FIXTURE_SRC = path.resolve(__dirname, "../../test/fixtures");

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

describe("recollect-mcp policy", () => {
  let root: string;
  let tmp: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-mcp-"));
    root = path.join(tmp, "vault-root");
    copyDir(FIXTURE_SRC, root);
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("resolveRoot requires RECOLLECT.md + vault/", () => {
    process.env.RECOLLECT_ROOT = root;
    assert.equal(resolveRoot(), path.resolve(root));
  });

  it("resolveRoot refuses missing env", () => {
    delete process.env.RECOLLECT_ROOT;
    assert.throws(() => resolveRoot(), /RECOLLECT_ROOT/);
  });

  it("rootCandidates normalizes Git Bash /c/... paths on Windows", (t: TestContext) => {
    if (process.platform !== "win32") t.skip();
    const candidates = rootCandidates("/c/Users/maple/projects-recollect");
    assert.ok(
      candidates.includes("C:\\Users\\maple\\projects-recollect"),
      `candidates=${JSON.stringify(candidates)}`
    );
  });

  it("rootCandidates normalizes double-converted C:\\c\\ paths on Windows", (t: TestContext) => {
    if (process.platform !== "win32") t.skip();
    const candidates = rootCandidates("C:\\c\\Users\\maple\\projects-recollect");
    assert.ok(
      candidates.includes("C:\\Users\\maple\\projects-recollect"),
      `candidates=${JSON.stringify(candidates)}`
    );
  });

  it("resolveRoot accepts Git Bash /c/... path on Windows", (t: TestContext) => {
    if (process.platform !== "win32") t.skip();
    const unixStyle = "/" + root.replace(/\\/g, "/").replace(/^([a-zA-Z]):/, "$1");
    process.env.RECOLLECT_ROOT = unixStyle;
    assert.equal(resolveRoot(), path.resolve(root));
  });

  it("resolveRoot accepts double-converted C:\\c\\ path on Windows", (t: TestContext) => {
    if (process.platform !== "win32") t.skip();
    const double = root.replace(/^([a-zA-Z]):\\/, "$1:\\c\\");
    process.env.RECOLLECT_ROOT = double;
    assert.equal(resolveRoot(), path.resolve(root));
  });

  it("normalizeRel denies traversal", () => {
    assert.throws(() => normalizeRel("../etc/passwd"), PolicyError);
    assert.throws(() => normalizeRel("vault/../../x"), PolicyError);
  });

  it("assertReadable denies Secrets Archive People", () => {
    assert.throws(() => assertReadable("vault/Secrets/token.md"), PolicyError);
    assert.throws(() => assertReadable("vault/Archive/old.md"), PolicyError);
    assert.throws(() => assertReadable("vault/People/someone.md"), PolicyError);
    assert.doesNotThrow(() => assertReadable("vault/Career.md"));
    assert.doesNotThrow(() => assertReadable("RECOLLECT.md"));
  });

  it("boot default pack is overlay (default active set)", () => {
    const r = runBoot(root);
    assert.equal(r.pack, "overlay");
    assert.ok(r.files.length >= 3);
    const paths = r.files.map((f) => f.path).join(" ");
    assert.match(paths, /overlay#recipe/);
    assert.match(paths, /Active context/);
    assert.match(paths, /intent/);
    assert.ok(!paths.includes("Me.md"));
    const active = r.files.find((f) => /Active context/.test(f.path));
    assert.ok(active?.ok);
    assert.match(active?.text ?? "", /Fixture active line A/);
  });

  it("boot pack=pulse is Active only", () => {
    const r = runBoot(root, "pulse");
    assert.equal(r.pack, "pulse");
    assert.equal(r.files.length, 1);
    assert.ok(r.files[0].ok);
    assert.match(r.files[0].path, /Active context/);
    assert.match(r.files[0].text ?? "", /Fixture active line A/);
    assert.ok(!(r.files[0].text ?? "").includes("Domain rules"));
    assert.match(r.files[0].text ?? "", /Next:.*overlay/);
  });

  it("boot pack=full returns exactly four paths", () => {
    const r = runBoot(root, "full");
    assert.equal(r.pack, "full");
    assert.equal(r.files.length, 4);
    assert.deepEqual(
      r.files.map((f) => f.path),
      [
        "RECOLLECT.md",
        "vault/Map.md",
        "vault/Me.md",
        "vault/Preferences.md",
      ]
    );
    assert.ok(r.files.every((f) => f.ok && f.text));
  });

  it("boot pack=law omits Active", () => {
    const r = runBoot(root, "law");
    assert.equal(r.pack, "law");
    assert.equal(r.files.length, 1);
    assert.match(r.files[0].text ?? "", /Domain rules/);
    assert.ok(!(r.files[0].text ?? "").includes("Fixture active line A"));
  });

  it("boot pack=map_intent excludes Identity indexes", () => {
    const r = runBoot(root, "map_intent");
    assert.equal(r.pack, "map_intent");
    assert.match(r.files[0].text ?? "", /Intent/);
    assert.match(r.files[0].text ?? "", /Research packs/);
    assert.ok(!(r.files[0].text ?? "").includes("Anti-dupe"));
  });

  it("boot pack=map_index starts at Identity", () => {
    const r = runBoot(root, "map_index");
    assert.equal(r.pack, "map_index");
    assert.match(r.files[0].text ?? "", /Identity/);
    assert.match(r.files[0].text ?? "", /Sensitivity classes/);
    assert.ok(!(r.files[0].text ?? "").includes("Intent → open"));
  });

  it("boot pack=who returns Me + Preferences", () => {
    const r = runBoot(root, "who");
    assert.deepEqual(
      r.files.map((f) => f.path),
      ["vault/Me.md", "vault/Preferences.md"]
    );
    assert.ok(r.files.every((f) => f.ok));
  });

  it("boot rejects unknown pack", () => {
    assert.throws(() => runBoot(root, "dump"), /unknown boot pack/);
  });

  it("boot pack=attach is pulse+who+map_intent under budget", () => {
    const r = runBoot(root, "attach");
    assert.equal(r.pack, "attach");
    assert.ok(r.files.length >= 4);
    const paths = r.files.map((f) => f.path).join(" ");
    assert.match(paths, /Active context/);
    assert.match(paths, /Me\.md/);
    assert.match(paths, /Preferences\.md/);
    assert.match(paths, /intent/);
    const total = r.files.reduce((n, f) => n + (f.text?.length ?? 0), 0);
    assert.ok(total <= ATTACH_CHAR_BUDGET + 200); // small header slack
  });

  it("boot pack=overlay is recipe+personal focus+map_intent without who", () => {
    const r = runBoot(root, "overlay");
    assert.equal(r.pack, "overlay");
    assert.ok(r.files.length >= 3);
    const paths = r.files.map((f) => f.path).join(" ");
    assert.match(paths, /overlay#recipe/);
    assert.match(paths, /Active context/);
    assert.match(paths, /intent/);
    assert.ok(!paths.includes("Me.md"));
    assert.ok(!paths.includes("Preferences.md"));
    const recipe = r.files.find((f) => f.path === "overlay#recipe");
    assert.ok(recipe?.ok);
    assert.match(recipe?.text ?? "", /Writes \(plain\)|Write permissions/);
    assert.match(recipe?.text ?? "", /status\(intent/);
    assert.match(recipe?.text ?? "", /Personal focus/);
    assert.match(recipe?.text ?? "", /routine working-set load/);
    const total = r.files.reduce((n, f) => n + (f.text?.length ?? 0), 0);
    assert.ok(total <= ATTACH_CHAR_BUDGET + 200);
  });

  it("resolve_intent matches career search and resolves paths", () => {
    const r = runResolveIntent(root, "career search");
    assert.ok(r.matches.length >= 1);
    assert.match(r.matches[0].intent, /Career/i);
    assert.ok(
      r.matches[0].paths.includes("vault/Career.md") ||
        r.matches[0].paths.includes("vault/Job hunt.md")
    );
    assert.ok(r.matches[0].paths.length <= 2);
  });

  it("resolve_intent resolves Demo Product under Business/", () => {
    const r = runResolveIntent(root, "portfolio product");
    assert.ok(
      r.matches.some((m) => m.paths.includes("vault/Business/Demo Product.md"))
    );
  });

  it("resolve_intent skips restricted person note", () => {
    const r = runResolveIntent(root, "restricted person note");
    const row = r.matches.find((m) => /Restricted person/i.test(m.intent));
    assert.ok(row);
    assert.equal(row!.paths.length, 0);
  });

  it("resolve_intent unknown query returns hint", () => {
    const r = runResolveIntent(root, "xyzzy-no-such-intent-phrase");
    assert.equal(r.matches.length, 0);
    assert.match(r.hint ?? "", /No Intent match/);
  });

  it("read_note allows normal note", () => {
    const r = runReadNote(root, "vault/Career.md");
    assert.match(r.text, /Career/);
  });

  it("read_note refuses restricted frontmatter", () => {
    assert.throws(
      () => runReadNote(root, "vault/restricted-note.md"),
      /restricted/
    );
  });

  it("read_note refuses Secrets", () => {
    assert.throws(() => runReadNote(root, "vault/Secrets/token.md"), PolicyError);
  });

  it("capture_inbox writes Inbox with type note", () => {
    const r = runCaptureInbox(root, {
      body: "hello fixture capture",
      slug: "hello-fixture",
      title: "Hello",
    });
    assert.match(r.path, /^vault\/Inbox\/\d{4}-\d{2}-\d{2}-\d{4}-hello-fixture\.md$/);
    const text = fs.readFileSync(r.abs, "utf8");
    assert.match(text, /type: note/);
    assert.match(text, /domain: personal/);
    assert.match(text, /hello fixture capture/);
    assert.ok(!isRestricted(text));
  });

  it("capture builds personal-only markdown", () => {
    assert.throws(
      () =>
        buildCaptureMarkdown({
          body: "x",
          domain: "business",
        }),
      /personal-only/
    );
  });

  it("capture collision uses -2", () => {
    const a = runCaptureInbox(root, {
      body: "one",
      slug: "collide",
      title: "C",
    });
    // force same stamp+slug by writing second with same slug quickly
    const b = runCaptureInbox(root, {
      body: "two",
      slug: "collide",
      title: "C",
    });
    assert.notEqual(a.path, b.path);
    assert.ok(b.path.includes("collide"));
  });
});

describe("recollect-mcp v0.3 gate", () => {
  let root: string;
  let tmp: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "recollect-mcp-v03-"));
    root = path.join(tmp, "vault-root");
    copyDir(FIXTURE_SRC, root);
  });

  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("status without intent is Session Now only", () => {
    const r = runStatus(root);
    assert.ok(r.session_now);
    assert.match(r.session_now!, /Fixture active/);
    assert.equal(r.hub_now, null);
  });

  it("status with unique intent returns Hub Now", () => {
    const r = runStatus(root, "Job hunt status");
    assert.ok(r.hub_path?.includes("Job hunt"));
    assert.match(r.hub_now ?? "", /Fixture hub now/);
  });

  it("status ambiguous intent returns choices not merge", () => {
    const r = runStatus(root, "Career search");
    assert.ok(r.choices && r.choices.length >= 1);
    assert.equal(r.hub_now, null);
  });

  it("propose_write Forbidden for Secrets — no id", () => {
    const r = runProposeWrite(root, {
      path: "vault/Secrets/x.md",
      content: "secret",
    });
    assert.equal(r.class, "Forbidden");
    assert.equal(r.proposal_id, null);
  });

  it("propose_write Forbidden for restricted content", () => {
    const r = runProposeWrite(root, {
      path: "vault/Someone.md",
      content: "---\nsensitivity: restricted\n---\n\n# X\n",
    });
    assert.equal(r.class, "Forbidden");
    assert.equal(r.proposal_id, null);
  });

  it("propose_write Forbidden for frontmatter domain:both only", () => {
    const r = runProposeWrite(root, {
      path: "vault/Bad.md",
      content: "---\ndomain: both\n---\n\n# X\n",
    });
    assert.equal(r.class, "Forbidden");
    assert.equal(r.proposal_id, null);
  });

  it("propose_write allows RECOLLECT.md when body mentions domain both as prose", () => {
    const r = runProposeWrite(root, {
      path: "RECOLLECT.md",
      content:
        "# Law\n\nNo dual-domain notes. (Never write domain: both in frontmatter.)\n\n## Active context\n\n- focus\n",
    });
    assert.equal(r.class, "Propose");
    assert.ok(r.proposal_id);
  });

  it("propose without accept does not write", () => {
    const target = "vault/New Hub.md";
    const abs = path.join(root, target);
    const r = runProposeWrite(root, {
      path: target,
      content:
        "---\ndomain: personal\ntype: note\ncreated: 2026-07-29\n---\n\n# New Hub\n\n## Now\nok\n",
    });
    assert.equal(r.class, "Propose");
    assert.ok(r.proposal_id);
    assert.ok(!fs.existsSync(abs));
  });

  it("apply_write without accept refuses", () => {
    const r = runProposeWrite(root, {
      path: "vault/Gate.md",
      content: "# Gate\n",
    });
    assert.throws(
      () => runApplyWrite(root, { proposal_id: r.proposal_id!, accept: false }),
      /accept: true/
    );
    assert.ok(!fs.existsSync(path.join(root, "vault", "Gate.md")));
  });

  it("apply_write accept applies once then expires id", () => {
    const r = runProposeWrite(root, {
      path: "vault/Once.md",
      content: "# Once\n\nbody\n",
    });
    const applied = runApplyWrite(root, {
      proposal_id: r.proposal_id!,
      accept: true,
    });
    assert.equal(applied.applied, true);
    assert.ok(fs.existsSync(path.join(root, "vault", "Once.md")));
    assert.throws(
      () =>
        runApplyWrite(root, {
          proposal_id: r.proposal_id!,
          accept: true,
        }),
      /not found|expired/
    );
  });
});
