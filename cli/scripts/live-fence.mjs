import fs from "node:fs";
import path from "node:path";
import { runProposeWrite } from "../../mcp/dist/src/tools/propose_write.js";
import { runApplyWrite } from "../../mcp/dist/src/tools/apply_write.js";
import { runStatus, formatStatus } from "../../mcp/dist/src/tools/status.js";
import { runCaptureInbox } from "../../mcp/dist/src/tools/capture_inbox.js";

const root = process.env.RECOLLECT_ROOT;
if (!root) {
  console.error("RECOLLECT_ROOT required");
  process.exit(1);
}

const log = [];

// Claim 1: thin hub via propose → apply
const hubPath = "vault/Live Fence Demo.md";
const hubBody = `---
domain: personal
type: note
created: 2026-07-29
sensitivity: normal
---

# Live Fence Demo

**Purpose:** Prove runtime propose/apply + Hub Now load.

## Now

Claim 1 landed — next: status with intent.
`;
const p1 = runProposeWrite(root, { path: hubPath, content: hubBody });
if (p1.class !== "Propose" || !p1.proposal_id) {
  throw new Error("claim1 propose failed " + JSON.stringify(p1));
}
if (fs.existsSync(path.join(root, hubPath))) {
  throw new Error("claim1 wrote before accept");
}
runApplyWrite(root, { proposal_id: p1.proposal_id, accept: true });
if (!fs.existsSync(path.join(root, hubPath))) {
  throw new Error("claim1 apply missing file");
}
log.push("L1 PASS propose_write→apply_write thin hub (no pre-accept write)");

// Update Map Intent for claim 2
const mapPath = path.join(root, "vault", "Map.md");
let map = fs.readFileSync(mapPath, "utf8");
if (!map.includes("Live fence demo")) {
  map = map.replace(
    "| | | |",
    "| Live fence demo | [[Live Fence Demo]] | Whole vault dump |"
  );
  fs.writeFileSync(mapPath, map);
}

// Claim 2: status intent → Hub Now
const st = runStatus(root, "Live fence demo");
if (!st.hub_now || !String(st.hub_now).includes("Claim 1 landed")) {
  throw new Error("claim2 status hub fail " + JSON.stringify(st));
}
log.push("L2 PASS status(intent) returns single Hub Now");

// Claim 3: Forbidden + capture + reject accept:false
const forbidden = runProposeWrite(root, {
  path: "vault/Secrets/x.md",
  content: "nope",
});
if (forbidden.class !== "Forbidden" || forbidden.proposal_id) {
  throw new Error("claim3 forbidden fail");
}
const cap = runCaptureInbox(root, {
  body: "lived fence capture",
  slug: "fence-cap",
  title: "Fence capture",
});
if (!cap.path.startsWith("vault/Inbox/")) {
  throw new Error("claim3 capture path");
}
const p3 = runProposeWrite(root, {
  path: "vault/Should Not Exist.md",
  content: "# ghost\n",
});
let blocked = false;
try {
  runApplyWrite(root, { proposal_id: p3.proposal_id, accept: false });
} catch (e) {
  blocked = String(e.message).includes("accept: true");
  if (!blocked) throw e;
}
if (!blocked) throw new Error("claim3 should refuse accept:false");
if (fs.existsSync(path.join(root, "vault", "Should Not Exist.md"))) {
  throw new Error("claim3 leaked write");
}
log.push(
  "L3 PASS Forbidden refuse + capture_inbox Auto + apply without accept blocked"
);

console.log(log.join("\n"));
console.log("---");
console.log(formatStatus(runStatus(root, "Live fence demo")).trim());
