# Stage 00 — Inventory the Real Repo and Establish Truth

## Mission
Inspect the actual application repository and determine what is WORKING, PARTIAL, SHELL, MISSING, or BLOCKED. Do not redesign the product and do not write a new architecture plan.

## Required work
- Read the current build contract and workflow requirements.
- Inspect every existing source file, test, config, deployment file, database schema, UI file, agent definition, runner, MCP component, storage component, workflow component, and memory component.
- Search specifically for mocks, hardcoded success outputs, browser-only state, local filesystem assumptions, localhost URLs, provider-specific remnants, and unreferenced modules.
- Execute existing tests.
- Attempt to start/test components only as diagnostics; do not treat a local dev server as production completion.
- Trace whether each claimed module is actually imported/called by the real application path.
- Update `BUILD_LEDGER.md` using only executable evidence.

## Required outputs
- Updated `BUILD_LEDGER.md`.
- Updated `LAST_HANDOFF.md`.
- `evidence/stage00_inventory.md` containing file paths, commands/tests, failures, and integration traces.

## Acceptance gate
Stage passes only when every row in the ledger has a justified status and no component is marked WORKING merely because a file exists.

## Stop rule
Do not start rebuilding components in this stage. The next stage uses the verified inventory.
