/**
 * Agent Frame Seed — connection-time Layer 1 frame (immutable projection).
 * Single source for Server Instructions, boot(attach) strip, tool description echoes.
 * Vault law stays RECOLLECT; this is not a second constitution.
 * See private vault Grok/Agent-Frame-Seed-Plan.md.
 */

/** Full seed (≤20 lines, plain face only). */
export const AGENT_FRAME_SEED = `Recollect is a notes practice for continuity across sessions and reviewable durable writes.
Notes on disk are the record — not the chat. Shared docs are public practice; this vault is private.

Why it exists: chat forgets; this keeps continuity on disk with reviewable permanent writes.
How humans use it: capture to Inbox when unsure; update short “what’s true now” on a main note; accept durable drafts.
When asked what/why/how/hygiene: answer in plain human language first. Do not open with paths or boot tables.

Load little: this turn’s small set only — short index of active main notes first, then at most two notes.
The agent drafts durable change; you accept it before it is written. Some paths tools refuse.
Do not invent facts or evidence.
Never write the same live fact in two places (personal focus · project “what’s true now” · short index is not live).
Public and tool-facing language stays plain. Formal names stay in law only.

Pointers (open only when the task needs them): ENTRY · START · write classes · law · ATTACH.
Stop when the named done condition is met. Closed trails: surface and stop.`;

/** One-line reinforcement for status / boot headers. */
export const AGENT_FRAME_ONE_LINE =
  "Frame: notes on disk are the record; why = continuity + reviewable writes; human how/why → plain answer first (PRACTICAL); load little (≤2 notes); draft then accept; no dual live facts.";

/** Prepend to boot(attach) human output. */
export function withAgentFrameSeed(body: string): string {
  return (
    "# Agent frame (connection seed)\n\n" +
    AGENT_FRAME_SEED +
    "\n\n---\n\n" +
    body
  );
}
