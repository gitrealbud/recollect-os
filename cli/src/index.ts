#!/usr/bin/env node
import { defaultInitTarget, initVault } from "./init.js";
import { runSmoke } from "./smoke.js";
import { runCliStatus } from "./status.js";
import { runCliAccept } from "./accept.js";
import { readProposeContent, runCliPropose } from "./propose.js";
import { runDoctor } from "./doctor.js";
import { runPromote } from "./promote.js";

function usage(): never {
  console.log(`recollect-os — local tools for markdown continuity + reviewable writes

Usage:
  recollect-os init [dir]              Create a markdown vault + Cursor wire (default: ~/recollect)
  recollect-os init [dir] --rewire     Refresh Cursor/MCP wire only (does not wipe notes)
  recollect-os smoke [--root dir] [--gate]
                                    Check vault shape, key docs, boot; --gate asserts write gate
  recollect-os status [--root dir] [--intent phrase]
                                    Show current status + pending proposals + health
  recollect-os propose <path> --file <body.md> [--root dir]
                                    Stage a draft only (no vault write until accept)
  recollect-os propose <path> --stdin [--root dir]
                                    Stage a draft from stdin
  recollect-os accept <proposal_id> [--root dir]
                                    Apply a pending draft
  recollect-os accept --latest [--root dir]
                                    Apply when exactly one proposal is pending
  recollect-os doctor [--root dir] [--verbose] [--git] [--sensitivity] [--install-hook]
                                    Vault health, wire, proposals; optional git / sensitivity audits
  recollect-os promote --dry-run [--root dir]
                                    Membrane risk report only (no write; never auto-sync)
  recollect-os help

Known limit: tools cannot block free-form host file edits. Permanent path = propose → accept.
Other hosts: see README / docs/ATTACH-GRID.md.
Windows (recommended): npm i -g recollect-os → recollect-os.cmd …

Env:
  RECOLLECT_KIT        Optional kit override (docs/ + templates/)
  RECOLLECT_ROOT       Used by smoke/status/propose/accept/doctor/promote when --root omitted
  RECOLLECT_MCP_DIST   Optional absolute path to MCP entry
  RECOLLECT_AUDIT=0    Disable .recollect/audit.jsonl
  RECOLLECT_DEBUG=1    Mirror audit one-liners to stderr
`);
  process.exit(0);
}

function flagValue(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  return argv[i + 1];
}

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const cmd = args[0] ?? "help";
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const positionals = args.filter((a) => !a.startsWith("--"));
  return { cmd, flags, positionals, argv };
}

function resolveRoot(argv: string[], positionals: string[]): string {
  return (
    flagValue(argv, "--root") ??
    process.env.RECOLLECT_ROOT ??
    positionals[1] ??
    defaultInitTarget()
  );
}

async function main() {
  const { cmd, flags, positionals, argv } = parseArgs(process.argv);

  if (cmd === "help" || cmd === "-h" || cmd === "--help") usage();

  if (cmd === "init") {
    const target = positionals[1] ?? defaultInitTarget();
    const rewire = flags.has("--rewire");
    try {
      const result = initVault({ target, rewire });
      console.log(result.message);
      if (result.created || result.rewired) {
        const smoke = runSmoke(result.root, { gate: true });
        for (const line of smoke.lines) console.log(line);
        if (!smoke.ok) process.exit(1);
        console.log("smoke: OK");
      }
      process.exit(0);
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    }
  }

  if (cmd === "smoke") {
    const root = resolveRoot(argv, positionals);
    const smoke = runSmoke(root, { gate: flags.has("--gate") });
    for (const line of smoke.lines) console.log(line);
    process.exit(smoke.ok ? 0 : 1);
  }

  if (cmd === "status") {
    const root = resolveRoot(argv, positionals);
    const intent = flagValue(argv, "--intent");
    const result = runCliStatus(root, intent);
    console.log(result.body);
    process.exit(result.ok ? 0 : 1);
  }

  if (cmd === "propose") {
    const root =
      flagValue(argv, "--root") ??
      process.env.RECOLLECT_ROOT ??
      defaultInitTarget();
    const relPath = positionals[1];
    const file = flagValue(argv, "--file");
    const body = readProposeContent({
      file,
      stdin: flags.has("--stdin"),
    });
    if (!body.ok) {
      process.stdout.write(body.body);
      process.exit(1);
    }
    const result = runCliPropose(root, { path: relPath ?? "", content: body.content });
    process.stdout.write(result.body);
    process.exit(result.ok ? 0 : 1);
  }

  if (cmd === "accept") {
    const root =
      flagValue(argv, "--root") ??
      process.env.RECOLLECT_ROOT ??
      defaultInitTarget();
    const latest = flags.has("--latest");
    const id = latest ? undefined : positionals[1];
    const result = runCliAccept(root, { id, latest });
    process.stdout.write(result.body);
    process.exit(result.ok ? 0 : 1);
  }

  if (cmd === "doctor") {
    const root =
      flagValue(argv, "--root") ??
      process.env.RECOLLECT_ROOT ??
      defaultInitTarget();
    const result = runDoctor({
      root,
      verbose: flags.has("--verbose"),
      git: flags.has("--git"),
      sensitivity: flags.has("--sensitivity"),
      installHook: flags.has("--install-hook"),
    });
    for (const line of result.lines) console.log(line);
    process.exit(result.ok ? 0 : 1);
  }

  if (cmd === "promote") {
    const root =
      flagValue(argv, "--root") ??
      process.env.RECOLLECT_ROOT ??
      defaultInitTarget();
    if (!flags.has("--dry-run")) {
      console.error("promote requires --dry-run (no write / no auto-sync)");
      process.exit(1);
    }
    const result = runPromote({ root, dryRun: true });
    for (const line of result.lines) console.log(line);
    process.exit(result.ok ? 0 : 1);
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
}

main();
