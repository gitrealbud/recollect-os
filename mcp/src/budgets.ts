/**
 * Shared size limits for connect tools and tests (one source of numbers).
 * Keep enforced so thin-load contracts stay true
 * (see docs/archive/RUNTIME-PLAN.md + npm test).
 */
export const ATTACH_CHAR_BUDGET = 12_000;
export const HUB_NOW_MAX = 2_000;
export const MAX_FILE_CHARS = 48_000;
export const PROPOSAL_TTL_MS = 24 * 60 * 60 * 1000;
export const RESOLVE_INTENT_MAX_PATHS = 2;
export const RESOLVE_INTENT_MAX_MATCHES = 3;
