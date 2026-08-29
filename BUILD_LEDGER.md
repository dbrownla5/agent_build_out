<!-- GENERATED FILE — DO NOT EDIT BY HAND -->

# Build Ledger — GENERATED, DO NOT HAND-EDIT

> **This file is generated output. Do not edit it.**
> Every status below is computed from the actual result stream of the test
> runner — no one, including an overseer agent, can type `WORKING` here.
> A status changes only when a test that proves it is written and passes.
> Edits made by hand are erased on the next run.
>
> Regenerate with: `npm run ledger`

| Generation fact | Value |
|---|---|
| Generated at | 2026-08-23T13:31:34.310Z |
| Commit SHA | `ef80187efc435f0711c91f3fa21ef6a04d3393e4` **(working tree dirty — ledger may not match this commit)** |
| Command used | `node --test --test-reporter=/home/user/agent_build_out/scripts/gen_ledger.js --test-reporter-destination=stdout` |
| Test runner exit code | 0 |
| Suite totals | 14 tests, 14 passed, 0 failed, 0 skipped, 0 todo, 0 cancelled |

## Status meanings

| Status | Rule applied by `scripts/gen_ledger.js` |
|---|---|
| `WORKING` | Every mapped test exists **and** passed. |
| `PARTIAL` | Some mapped tests passed, some did not (failed, skipped, todo, or not yet written). |
| `BLOCKED` | Mapped tests exist but errored (uncaught exception, hook failure, timeout, cancelled, or their file failed to load). |
| `MISSING` | No mapped test exists yet. This is the default and is the honest answer for unbuilt work. |

**A skipped or `todo` test never counts as passing.** Node reports skipped
tests with `details.passed === true`; the generator overrides that, because
skipping into a green ledger is exactly the falsification this file exists to
prevent.

`SHELL` is not machine-derivable from test results and is therefore never
emitted. Scaffolding with no passing test reads `MISSING`.

`Integrated?` is `Yes` only for rows that reached `WORKING`; it is derived,
not asserted. `Executed?` means at least one mapped test actually ran.

## Requirements

| Requirement | Status | Integrated? | Executed? | Tests passed? | Evidence (test names + counts) |
|---|---|---:|---:|---:|---|
| Remote production server | MISSING | No | No | No | no test found for: `server: responds to health check over http`, `server: refuses to bind localhost as production` |
| Live web dashboard/app | MISSING | No | No | No | no test found for: `dashboard: serves the application shell`, `dashboard: renders live data from the api` |
| MCP server | MISSING | No | No | No | no test found for: `mcp: completes initialize handshake`, `mcp: lists tools`, `mcp: executes a tool call` |
| LLM runtime | MISSING | No | No | No | no test found for: `llm: returns a completion from the configured provider`, `llm: surfaces provider errors without falling back to a mock` |
| Guardrail/permission engine | MISSING | No | No | No | no test found for: `guardrails: denies an action outside the role boundary`, `guardrails: allows an action inside the role boundary`, `guardrails: records every decision` |
| 40 occupational agent contracts | WORKING | Yes | Yes | Yes | 7/7 passed — `registry loads exactly 40 role contracts` → PASS; `role ids are 1..40 with no duplicates and no gaps` → PASS; `every role carries all nine contract fields, non-empty` → PASS; `every role title appears verbatim in the source directive` → PASS; `validateRegistry passes on the real registry` → PASS; `no ligature corruption in any role title or contract field` → PASS; `boundary matrix loads and is non-empty` → PASS |
| Skills + qualification | MISSING | No | No | No | no test found for: `skills: registers a skill`, `skills: blocks an unqualified agent from a skill`, `skills: qualifies an agent for a skill` |
| Agent runner + handoffs | MISSING | No | No | No | no test found for: `runner: executes a single agent turn`, `runner: hands off between two agents`, `runner: preserves context across a handoff` |
| Remote storage containers | MISSING | No | No | No | no test found for: `storage: writes an object to remote storage`, `storage: reads back a written object`, `storage: verifies durable persistence before any source delete` |
| Photo intake/catalog pipeline | MISSING | No | No | No | no test found for: `photos: ingests a photo and records provenance`, `photos: catalogs a photo into an item record`, `photos: never deletes a source photo without verified remote persistence` |
| Document intake pipeline | MISSING | No | No | No | no test found for: `documents: ingests a document and extracts text`, `documents: links a document to its evidence record` |
| Living context | MISSING | No | No | No | no test found for: `context: persists context across sessions`, `context: continues a document rather than starting a new draft` |
| Correction propagation | MISSING | No | No | No | no test found for: `corrections: applies a correction to its source record`, `corrections: propagates a correction to every dependent artifact` |
| Approval/review states | MISSING | No | No | No | no test found for: `approvals: moves an item through draft to review to approved`, `approvals: blocks publication of an unapproved item` |
| Failure/recovery | MISSING | No | No | No | no test found for: `recovery: resumes an interrupted run`, `recovery: leaves no partial write after a failure` |
| Cross-device/server persistence | MISSING | No | No | No | no test found for: `persistence: state written by one client is visible to another`, `persistence: survives a server restart` |
| End-to-end acceptance test | MISSING | No | No | No | no test found for: `acceptance: full end to end run passes` |

## Roll-up

| Status | Rows |
|---|---:|
| WORKING | 1 |
| PARTIAL | 0 |
| BLOCKED | 0 |
| MISSING | 16 |
| **Total** | **17** |

## Where the mapping lives

The requirement → test-name mapping is the `REQUIREMENTS` table at the top of
`scripts/gen_ledger.js`. To turn a row green, write a test with the name listed
there (or point the table at the test you wrote) and make it pass. Editing the
table alone cannot produce a pass: a name no test answers to reads `MISSING`.
