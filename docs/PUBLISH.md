# Publish (npm)

**Package names (current — don’t collide with taken npm names):**

| Package | npm | Why |
|---------|-----|-----|
| CLI + kit | `recollect-os` | `recollect` taken (browser DB) |
| MCP | `recollect-os-mcp` | `recollect-mcp` taken (unrelated SQLite memory) |

Cold path after publish:

**Unix:**

```bash
npx -y recollect-os init ~/recollect
```

**Windows (recommended default):**

```bash
npm i -g recollect-os
recollect-os.cmd init %USERPROFILE%\recollect
recollect-os.cmd smoke --root %USERPROFILE%\recollect --gate
```

## Preconditions

1. Logged in: `npm whoami` (or `npm login`).
2. Both packages at matching semver (currently `0.3.7`).
3. Tests green: `cd mcp && npm test` · `cd cli && npm test`.
4. CI green on `main` (`.github/workflows/ci.yml` — ubuntu + windows).

## Sequence

```bash
# 1) MCP first
cd mcp
npm run build
npm publish --access public

# 2) Point CLI at registry (not file:)
cd ../cli
npm pkg set dependencies.recollect-os-mcp=^0.3.7
npm install
npm run build   # syncs kit/ + tsc
npm publish --access public

# 3) Restore monorepo link for local work
npm pkg set dependencies.recollect-os-mcp=file:../mcp
npm install
```

## GitHub Release (same turn as publish)

```bash
git tag v0.3.7
git push origin v0.3.7
gh release create v0.3.7 --title "v0.3.7" --notes-file - <<'EOF'
## Summary
- CLI propose (file/stdin) + binary DEMO prove-path
- README first screen: DEMO + three ideas + failure modes
- Hold L5 / search

## Cold path
Windows: npm i -g recollect-os → recollect-os.cmd init … → docs/DEMO.md
Unix: npx -y recollect-os init ~/recollect
EOF
```

## Verify cold path

```bash
# after publish
npx -y recollect-os@0.3.7 init /tmp/recollect-cold
npx -y recollect-os@0.3.7 smoke --root /tmp/recollect-cold --gate
npx -y recollect-os@0.3.7 doctor --root /tmp/recollect-cold
npx -y recollect-os@0.3.7 promote --dry-run --root /tmp/recollect-cold
```

Expect: vault skeleton · smoke+gate OK · doctor PASS · promote dry-run report.

**Exit check before placement:** stranger-facing README one-liner works on a cold Windows box (global install path). Do not share a clean story with a broken install.

## Do not

- Publish under stolen names `recollect` / `recollect-mcp`.
- Ship without `cli/kit/` (build runs `sync-kit`).
- Open L5 tools until published path is dogfooded on real claims.
