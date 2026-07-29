import fs from "node:fs";
import path from "node:path";
import { runBoot } from "recollect-os-mcp/boot";
import { runProposeWrite } from "recollect-os-mcp/propose_write";
import { runApplyWrite } from "recollect-os-mcp/apply_write";
import { isVaultRoot } from "./fsutil.js";

export type SmokeResult = {
  ok: boolean;
  lines: string[];
};

export type SmokeOptions = {
  /** Also assert write-gate elite: Forbidden + no durable write without accept */
  gate?: boolean;
};

/**
 * Post-init smoke (in-process). No Cursor daemon required.
 * Asserts: vault shape · docs spine (Map/Hub/DOC-SYSTEM/…) · boot(attach).
 * With gate: Forbidden refuse + propose without accept does not write.
 */
export function runSmoke(root: string, opts: SmokeOptions = {}): SmokeResult {
  const lines: string[] = [];
  let ok = true;

  const fail = (msg: string) => {
    ok = false;
    lines.push(`FAIL ${msg}`);
  };
  const pass = (msg: string) => lines.push(`PASS ${msg}`);

  const abs = path.resolve(root);
  if (!isVaultRoot(abs)) {
    fail(`not a vault root (need RECOLLECT.md + vault/): ${abs}`);
    return { ok, lines };
  }
  pass(`vault root ${abs}`);

  const spine = ["LAW.md", "Map.md", "Hub.md", "DOC-SYSTEM.md", "ATTACH-GRID.md", "START-GUIDE.md"];
  for (const name of spine) {
    const p = path.join(abs, "docs", name);
    if (!fs.existsSync(p)) fail(`docs/${name} missing (docs spine)`);
  }
  if (ok) {
    const law = fs.readFileSync(path.join(abs, "docs", "LAW.md"), "utf8");
    if (!law.includes("## Glossary (canonical)") || !law.includes("| Formal | Plain |")) {
      fail("docs/LAW.md missing Formal·Plain glossary");
    }
    const hub = fs.readFileSync(path.join(abs, "docs", "Hub.md"), "utf8");
    if (!/^## Now\b/m.test(hub)) fail("docs/Hub.md missing ## Now");
    const map = fs.readFileSync(path.join(abs, "docs", "Map.md"), "utf8");
    if (!map.includes("Intent")) fail("docs/Map.md missing Intent router signal");
    const start = fs.readFileSync(path.join(abs, "docs", "START-GUIDE.md"), "utf8");
    if (!start.includes("ATTACH-GRID")) fail("docs/START-GUIDE.md missing ATTACH-GRID pointer");
    const anyIdx = start.indexOf("**Any MCP host**");
    const cursorIdx = start.indexOf("**Cursor**");
    if (anyIdx < 0) fail("docs/START-GUIDE.md missing Any MCP host row");
    else if (cursorIdx >= 0 && cursorIdx < anyIdx) fail("START host table lists Cursor before Any MCP host");
    pass(`docs spine ok · ${spine.length} files · glossary · product Now · Map Intent · host-first START`);
  }

  process.env.RECOLLECT_ROOT = abs;
  try {
    const result = runBoot(abs, "attach");
    const anyOk = result.files.some((f) => f.ok);
    if (!anyOk) fail("boot(attach) returned no readable files");
    else pass(`boot(attach) ok · pack=${result.pack} · files=${result.files.length}`);
  } catch (e) {
    fail(`boot(attach) threw: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (opts.gate && ok) {
    const forbidden = runProposeWrite(abs, {
      path: "vault/Secrets/smoke-gate.md",
      content: "nope",
    });
    if (forbidden.class !== "Forbidden" || forbidden.proposal_id) {
      fail("gate: Forbidden Secrets must refuse without proposal_id");
    } else pass("gate: Forbidden path refused");

    const ghost = "vault/Smoke Gate Ghost.md";
    const ghostAbs = path.join(abs, ghost);
    if (fs.existsSync(ghostAbs)) fs.unlinkSync(ghostAbs);
    const p = runProposeWrite(abs, {
      path: ghost,
      content:
        "---\ndomain: personal\ntype: note\ncreated: 2026-07-29\n---\n\n# Smoke Gate Ghost\n\n## Now\nprobe\n",
    });
    if (!p.proposal_id) {
      fail("gate: propose should stage id");
    } else if (fs.existsSync(ghostAbs)) {
      fail("gate: durable write before accept");
    } else {
      let blocked = false;
      try {
        runApplyWrite(abs, { proposal_id: p.proposal_id, accept: false });
      } catch {
        blocked = true;
      }
      if (!blocked) fail("gate: apply without accept must refuse");
      else if (fs.existsSync(ghostAbs)) fail("gate: leaked write after refuse");
      else pass("gate: no durable write without accept:true");
    }
  }

  return { ok, lines };
}
