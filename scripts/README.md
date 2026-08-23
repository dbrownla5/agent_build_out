# scripts/

## `gen_ledger.js` — generates `BUILD_LEDGER.md`

Run it with:

```bash
npm run ledger          # === node scripts/gen_ledger.js
```

It spawns the test suite as a child process
(`node --test --test-reporter=scripts/gen_ledger.js --test-reporter-destination=stdout`),
consumes node's structured `test:*` event stream, maps the results onto the
requirement rows, and writes `BUILD_LEDGER.md`.

The file is dual-mode: executed, it is the generator; imported by `node --test`,
its default export is the custom reporter that emits the event stream as
newline-delimited JSON. That is why there is no separate reporter file, and why
nothing here regex-scrapes human-readable test output.

### Why the ledger is generated instead of written

`BUILD_LEDGER.md` used to be a hand-edited markdown table. That made it
worthless as a record: an agent that *claimed* a component was `WORKING` typed
the exact same characters as one that had actually earned it. Across fifteen
failed builds, work was repeatedly reported complete when it was not.

Generating the ledger removes the keyboard from the loop. A status is not a
sentence anyone can write — it is the computed result of a test run. No agent,
including an overseer, can produce `WORKING`. It can only write a test that
proves the requirement and make that test pass.

Corollary: **do not edit `BUILD_LEDGER.md`.** Hand edits are erased on the next
run, and in the interim they are a false record.

### Status rules (applied mechanically)

| Status | Rule |
|---|---|
| `WORKING` | Every mapped test exists **and** passed. |
| `PARTIAL` | Some mapped tests passed, some did not — failed, skipped, todo, or not yet written. |
| `BLOCKED` | Mapped tests exist but errored: uncaught exception, unhandled rejection, hook failure, timeout, cancellation, or their file failed to load. |
| `MISSING` | No mapped test exists yet. The default, and the honest answer for unbuilt work. |

**A skipped or `todo` test never counts as passing.** This is deliberate and is
the single most important rule in the file. Node's own stream reports a skipped
test as `details.passed === true`; the generator overrides that. Skipping a test
into a green ledger would be exactly the falsification the generated ledger
exists to prevent.

`SHELL` is not derivable from test results, so it is never emitted. Scaffolding
with no passing test reads `MISSING`.

### The mapping table

The requirement → test-name mapping is the `REQUIREMENTS` array at the top of
`gen_ledger.js`. To turn a row green: write a real test named as the table lists
(or point the table at the test you wrote) and make it pass.

Editing the table cannot manufacture a pass. A name that no test answers to
reads `MISSING`; a name answered by a skipped test never reads `WORKING`.

### Failure behaviour

If the generator cannot obtain real test output — the runner will not start, is
killed by a signal, emits a line that is not valid JSON, or ends without a
top-level summary — it prints a loud failure to stderr, **does not write the
ledger**, and exits non-zero (code 2). A stale ledger is never silently left
looking current. Note that *tests failing* is not this case: a red suite is real
output and produces a real (red) ledger with exit code 0.

## `extract_roles.py`

Pre-existing helper that extracts the 40 occupational role definitions from the
source directive into `roles/*.yaml`. Not part of the ledger pipeline.

## `gcp/`

Pre-existing shell helpers for cloud access setup. Not part of the ledger
pipeline.
