#!/usr/bin/env node
/**
 * gen_ledger.js — generates BUILD_LEDGER.md from real test-runner results.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * BUILD_LEDGER.md used to be a hand-edited markdown table. An agent that
 * *claimed* a component was WORKING typed the exact same characters as one
 * that had actually earned it, so the ledger carried no information. This
 * script removes the keyboard from the loop: statuses are computed from the
 * structured event stream of `node --test`, and nothing else. No agent —
 * including an overseer — can type WORKING. It can only run tests that
 * produce it.
 *
 * DUAL MODE
 * ---------
 * This file is BOTH the generator (when executed) and the custom test
 * reporter (when imported by `node --test --test-reporter=<this file>`).
 * The default export is the reporter; the generator body only runs when
 * process.argv[1] is this file. One file, no loose regex over human-readable
 * output — we consume node's own test:* events as structured objects.
 *
 * Usage:  npm run ledger      (or: node scripts/gen_ledger.js)
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// REQUIREMENT -> TEST MAPPING (the declarative table)
// ---------------------------------------------------------------------------
// `tests` lists the EXACT test names that prove a requirement. A row can only
// reach WORKING when every listed name was actually observed in the run AND
// every one of them passed.
//
// Matching accepts any of these forms for an entry:
//   "some test name"                     -> matches a test named exactly that
//   "test/foo.test.js::some test name"   -> matches that test in that file
//   "outer > inner"                      -> matches a subtest by its full path
//
// TO ADD PROOF FOR A ROW: write a real test with one of these names, or edit
// this table so it names the test you wrote. Editing this table does NOT let
// you claim a pass — a name here that no test answers to reads MISSING, and a
// name answered by a skipped test never reads WORKING.
const REQUIREMENTS = [
  {
    name: 'Remote production server',
    stage: 'stages/02_remote_web_app_and_server_foundation.md',
    tests: ['server: responds to health check over http', 'server: refuses to bind localhost as production'],
  },
  {
    name: 'Live web dashboard/app',
    stage: 'stages/12_real_web_dashboard_application.md',
    tests: ['dashboard: serves the application shell', 'dashboard: renders live data from the api'],
  },
  {
    name: 'MCP server',
    stage: 'stages/05_mcp_server_and_ai_client_surface.md',
    tests: ['mcp: completes initialize handshake', 'mcp: lists tools', 'mcp: executes a tool call'],
  },
  {
    name: 'LLM runtime',
    stage: 'stages/07_permanent_agent_registry_and_runtime.md',
    tests: ['llm: returns a completion from the configured provider', 'llm: surfaces provider errors without falling back to a mock'],
  },
  {
    name: 'Guardrail/permission engine',
    stage: 'stages/04_auth_permissions_and_guardrail_engine.md',
    tests: ['guardrails: denies an action outside the role boundary', 'guardrails: allows an action inside the role boundary', 'guardrails: records every decision'],
  },
  {
    name: '40 occupational agent contracts',
    stage: 'roles/',
    // Mapped to the test names that actually exist in test/roles.test.js.
    tests: [
      'registry loads exactly 40 role contracts',
      'role ids are 1..40 with no duplicates and no gaps',
      'every role carries all nine contract fields, non-empty',
      'every role title appears verbatim in the source directive',
      'validateRegistry passes on the real registry',
      'no ligature corruption in any role title or contract field',
      'boundary matrix loads and is non-empty',
    ],
  },
  {
    name: 'Skills + qualification',
    stage: 'stages/08_skills_tools_connectors_and_qualification.md',
    tests: ['skills: registers a skill', 'skills: blocks an unqualified agent from a skill', 'skills: qualifies an agent for a skill'],
  },
  {
    name: 'Agent runner + handoffs',
    stage: 'stages/09_workflow_engine_and_handoffs.md',
    tests: ['runner: executes a single agent turn', 'runner: hands off between two agents', 'runner: preserves context across a handoff'],
  },
  {
    name: 'Remote storage containers',
    stage: 'stages/03_persistent_data_and_remote_storage.md',
    tests: ['storage: writes an object to remote storage', 'storage: reads back a written object', 'storage: verifies durable persistence before any source delete'],
  },
  {
    name: 'Photo intake/catalog pipeline',
    stage: 'stages/10_photo_media_cataloging_pipeline.md',
    tests: ['photos: ingests a photo and records provenance', 'photos: catalogs a photo into an item record', 'photos: never deletes a source photo without verified remote persistence'],
  },
  {
    name: 'Document intake pipeline',
    stage: 'stages/11_document_ingestion_and_evidence_pipeline.md',
    tests: ['documents: ingests a document and extracts text', 'documents: links a document to its evidence record'],
  },
  {
    name: 'Living context',
    stage: 'stages/06_living_context_and_correction_propagation.md',
    tests: ['context: persists context across sessions', 'context: continues a document rather than starting a new draft'],
  },
  {
    name: 'Correction propagation',
    stage: 'stages/06_living_context_and_correction_propagation.md',
    tests: ['corrections: applies a correction to its source record', 'corrections: propagates a correction to every dependent artifact'],
  },
  {
    name: 'Approval/review states',
    stage: 'stages/13_full_domain_workflows_and_regression_suite.md',
    tests: ['approvals: moves an item through draft to review to approved', 'approvals: blocks publication of an unapproved item'],
  },
  {
    name: 'Failure/recovery',
    stage: 'stages/16_post_release_hardening.md',
    tests: ['recovery: resumes an interrupted run', 'recovery: leaves no partial write after a failure'],
  },
  {
    name: 'Cross-device/server persistence',
    stage: 'stages/14_remote_deployment_and_operations.md',
    tests: ['persistence: state written by one client is visible to another', 'persistence: survives a server restart'],
  },
  {
    name: 'End-to-end acceptance test',
    stage: 'stages/15_master_end_to_end_acceptance.md',
    tests: ['acceptance: full end to end run passes'],
  },
];

// ---------------------------------------------------------------------------
// REPORTER MODE — default export consumed by `node --test --test-reporter=...`
// ---------------------------------------------------------------------------
// Emits newline-delimited JSON. Only the fields the generator needs, plus
// explicit run-start / run-end sentinels so the generator can tell a real,
// complete run from truncated or absent output.
export default async function* ledgerReporter(source) {
  yield JSON.stringify({ kind: 'run-start' }) + '\n';
  let sawSummary = false;
  for await (const event of source) {
    if (event.type === 'test:complete') {
      const d = event.data;
      const err = d.details && d.details.error;
      yield JSON.stringify({
        kind: 'result',
        name: d.name,
        file: d.file ?? null,
        nesting: d.nesting ?? 0,
        passed: !!(d.details && d.details.passed),
        skip: !!d.skip,
        todo: !!d.todo,
        failureType: err ? (err.failureType ?? null) : null,
        errorMessage: err ? String(err.message ?? err).split('\n')[0].slice(0, 200) : null,
      }) + '\n';
    } else if (event.type === 'test:summary' && !event.data.file) {
      sawSummary = true;
      yield JSON.stringify({ kind: 'summary', counts: event.data.counts ?? null }) + '\n';
    }
  }
  yield JSON.stringify({ kind: 'run-end', sawSummary }) + '\n';
}

// ---------------------------------------------------------------------------
// GENERATOR MODE
// ---------------------------------------------------------------------------

const SELF = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SELF), '..');
const LEDGER_PATH = path.join(REPO_ROOT, 'BUILD_LEDGER.md');

/** Failure types that mean the test could not honestly run, vs. simply failed. */
const ERRORED_FAILURE_TYPES = new Set([
  'uncaughtException',
  'unhandledRejection',
  'hookFailed',
  'cancelledByParent',
  'testTimeoutFailure',
]);

function die(message) {
  process.stderr.write(
    '\n=== LEDGER GENERATION FAILED ===\n' +
      message +
      '\n\nBUILD_LEDGER.md was NOT written. Any ledger currently on disk is STALE\n' +
      'and must not be trusted or reported as current.\n',
  );
  process.exit(2);
}

function gitSha() {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' });
  if (r.status !== 0 || !r.stdout) return null;
  return r.stdout.trim();
}

function gitDirty() {
  const r = spawnSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout.trim().length > 0;
}

/** Run the suite in a child process and return the parsed event records. */
function runTests() {
  const args = [
    '--test',
    `--test-reporter=${SELF}`,
    '--test-reporter-destination=stdout',
  ];
  const command = `node ${args.join(' ')}`;
  const child = spawnSync(process.execPath, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, NODE_OPTIONS: '' },
  });

  if (child.error) die(`Could not start the test runner: ${child.error.message}`);
  if (child.signal) die(`Test runner was killed by signal ${child.signal}.`);

  const lines = (child.stdout || '').split('\n').filter((l) => l.trim() !== '');
  const records = [];
  for (const line of lines) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      die(
        'Test reporter produced a line that is not valid JSON. The run cannot be\n' +
          `trusted. Offending line:\n  ${line.slice(0, 300)}\n\n` +
          `Runner stderr:\n${(child.stderr || '(empty)').slice(0, 2000)}`,
      );
    }
    records.push(parsed);
  }

  const started = records.some((r) => r.kind === 'run-start');
  const ended = records.find((r) => r.kind === 'run-end');
  if (!started || !ended) {
    die(
      'Did not receive a complete reporter stream from the test runner ' +
        `(run-start=${started}, run-end=${!!ended}, exit code=${child.status}).\n\n` +
        `Runner stderr:\n${(child.stderr || '(empty)').slice(0, 2000)}`,
    );
  }
  if (!ended.sawSummary) {
    die(
      'Test runner stream ended without a top-level summary — the run did not\n' +
        `finish. Exit code=${child.status}.\n\nRunner stderr:\n${(child.stderr || '(empty)').slice(0, 2000)}`,
    );
  }

  return {
    command,
    exitCode: child.status,
    stderr: child.stderr || '',
    results: records.filter((r) => r.kind === 'result'),
    summary: records.find((r) => r.kind === 'summary') || null,
  };
}

/**
 * A `test:complete` whose name resolves to its own file path is the synthetic
 * per-file result node/emits, not a user-authored test. Keep those separately:
 * they tell us when a file failed to load (-> BLOCKED), but they must never be
 * matched as if they were a test.
 */
function isFileLevel(r) {
  if (!r.file || typeof r.name !== 'string') return false;
  return path.resolve(REPO_ROOT, r.name) === path.resolve(r.file);
}

function buildIndex(results) {
  const tests = [];
  const fileLevel = new Map(); // absolute file path -> record
  const stack = []; // nesting -> name, for fully-qualified names

  for (const r of results) {
    if (isFileLevel(r)) {
      fileLevel.set(path.resolve(r.file), r);
      continue;
    }
    stack[r.nesting] = r.name;
    stack.length = r.nesting + 1;
    const fq = stack.join(' > ');
    const rel = r.file ? path.relative(REPO_ROOT, r.file) : null;
    const keys = new Set([r.name, fq]);
    if (rel) {
      keys.add(`${rel}::${r.name}`);
      keys.add(`${rel}::${fq}`);
    }
    tests.push({ ...r, rel, keys });
  }

  const byKey = new Map();
  for (const t of tests) {
    for (const k of t.keys) {
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(t);
    }
  }
  return { byKey, fileLevel };
}

/**
 * Status rules, applied mechanically. The only route to WORKING is:
 * every mapped test was observed, and every one of them actually passed.
 * A skipped or todo test NEVER counts as passing.
 */
function evaluate(req, index) {
  const perTest = req.tests.map((name) => {
    const matches = index.byKey.get(name) || [];
    if (matches.length === 0) return { name, state: 'absent' };

    let state = 'passed';
    for (const m of matches) {
      // A skipped or todo test reports details.passed === true in node's
      // stream. That is the falsification path this guard closes.
      if (m.skip) { state = 'skipped'; break; }
      if (m.todo) { state = 'todo'; break; }
      if (m.failureType && ERRORED_FAILURE_TYPES.has(m.failureType)) { state = 'errored'; break; }
      if (!m.passed) { state = 'failed'; break; }
      // A test living in a file that itself blew up cannot be trusted.
      const fl = m.file ? index.fileLevel.get(path.resolve(m.file)) : null;
      if (fl && !fl.passed && fl.failureType && fl.failureType !== 'subtestsFailed') {
        state = 'errored';
        break;
      }
    }
    return { name, state, count: matches.length };
  });

  const tally = { absent: 0, passed: 0, failed: 0, skipped: 0, todo: 0, errored: 0 };
  for (const t of perTest) tally[t.state]++;

  const expected = perTest.length;
  const observed = expected - tally.absent;

  let status;
  if (observed === 0) status = 'MISSING';
  else if (tally.errored > 0) status = 'BLOCKED';
  else if (observed === expected && tally.passed === expected) status = 'WORKING';
  else status = 'PARTIAL';

  return { status, perTest, tally, expected, observed };
}

function esc(s) {
  return String(s).replace(/\|/g, '\\|');
}

function evidenceCell(req, ev) {
  if (ev.status === 'MISSING') {
    return `no test found for: ${req.tests.map((t) => `\`${esc(t)}\``).join(', ')}`;
  }
  const parts = ev.perTest.map((t) => {
    const mark = {
      passed: 'PASS',
      failed: 'FAIL',
      skipped: 'SKIPPED (does not count as passing)',
      todo: 'TODO (does not count as passing)',
      errored: 'ERRORED',
      absent: 'NOT FOUND',
    }[t.state];
    return `\`${esc(t.name)}\` → ${mark}`;
  });
  const counts =
    `${ev.tally.passed}/${ev.expected} passed` +
    (ev.tally.failed ? `, ${ev.tally.failed} failed` : '') +
    (ev.tally.errored ? `, ${ev.tally.errored} errored` : '') +
    (ev.tally.skipped ? `, ${ev.tally.skipped} skipped` : '') +
    (ev.tally.todo ? `, ${ev.tally.todo} todo` : '') +
    (ev.tally.absent ? `, ${ev.tally.absent} not found` : '');
  return `${counts} — ${parts.join('; ')}`;
}

function render(run, rows) {
  const sha = gitSha();
  const dirty = gitDirty();
  const now = new Date().toISOString();
  const c = run.summary && run.summary.counts ? run.summary.counts : null;

  const header = [
    '<!-- GENERATED FILE — DO NOT EDIT BY HAND -->',
    '',
    '# Build Ledger — GENERATED, DO NOT HAND-EDIT',
    '',
    '> **This file is generated output. Do not edit it.**',
    '> Every status below is computed from the actual result stream of the test',
    '> runner — no one, including an overseer agent, can type `WORKING` here.',
    '> A status changes only when a test that proves it is written and passes.',
    '> Edits made by hand are erased on the next run.',
    '>',
    '> Regenerate with: `npm run ledger`',
    '',
    '| Generation fact | Value |',
    '|---|---|',
    `| Generated at | ${now} |`,
    `| Commit SHA | ${sha ? `\`${sha}\`` : '_unavailable (git rev-parse failed)_'}${dirty === true ? ' **(working tree dirty — ledger may not match this commit)**' : ''} |`,
    `| Command used | \`${esc(run.command)}\` |`,
    `| Test runner exit code | ${run.exitCode} |`,
    c
      ? `| Suite totals | ${c.tests ?? 0} tests, ${c.passed ?? 0} passed, ${c.failed ?? 0} failed, ${c.skipped ?? 0} skipped, ${c.todo ?? 0} todo, ${c.cancelled ?? 0} cancelled |`
      : '| Suite totals | _not reported_ |',
    '',
    '## Status meanings',
    '',
    '| Status | Rule applied by `scripts/gen_ledger.js` |',
    '|---|---|',
    '| `WORKING` | Every mapped test exists **and** passed. |',
    '| `PARTIAL` | Some mapped tests passed, some did not (failed, skipped, todo, or not yet written). |',
    '| `BLOCKED` | Mapped tests exist but errored (uncaught exception, hook failure, timeout, cancelled, or their file failed to load). |',
    '| `MISSING` | No mapped test exists yet. This is the default and is the honest answer for unbuilt work. |',
    '',
    '**A skipped or `todo` test never counts as passing.** Node reports skipped',
    'tests with `details.passed === true`; the generator overrides that, because',
    'skipping into a green ledger is exactly the falsification this file exists to',
    'prevent.',
    '',
    '`SHELL` is not machine-derivable from test results and is therefore never',
    'emitted. Scaffolding with no passing test reads `MISSING`.',
    '',
    '`Integrated?` is `Yes` only for rows that reached `WORKING`; it is derived,',
    'not asserted. `Executed?` means at least one mapped test actually ran.',
    '',
    '## Requirements',
    '',
    '| Requirement | Status | Integrated? | Executed? | Tests passed? | Evidence (test names + counts) |',
    '|---|---|---:|---:|---:|---|',
  ];

  const body = rows.map(({ req, ev }) => {
    const integrated = ev.status === 'WORKING' ? 'Yes' : 'No';
    const executed = ev.observed > 0 ? 'Yes' : 'No';
    const passedAll = ev.status === 'WORKING' ? 'Yes' : 'No';
    return `| ${esc(req.name)} | ${ev.status} | ${integrated} | ${executed} | ${passedAll} | ${evidenceCell(req, ev)} |`;
  });

  const tallyByStatus = rows.reduce((acc, { ev }) => {
    acc[ev.status] = (acc[ev.status] || 0) + 1;
    return acc;
  }, {});

  const footer = [
    '',
    '## Roll-up',
    '',
    '| Status | Rows |',
    '|---|---:|',
    ...['WORKING', 'PARTIAL', 'BLOCKED', 'MISSING'].map((s) => `| ${s} | ${tallyByStatus[s] || 0} |`),
    `| **Total** | **${rows.length}** |`,
    '',
    '## Where the mapping lives',
    '',
    'The requirement → test-name mapping is the `REQUIREMENTS` table at the top of',
    '`scripts/gen_ledger.js`. To turn a row green, write a test with the name listed',
    'there (or point the table at the test you wrote) and make it pass. Editing the',
    'table alone cannot produce a pass: a name no test answers to reads `MISSING`.',
    '',
  ];

  return [...header, ...body, ...footer].join('\n');
}

function main() {
  const run = runTests();
  const index = buildIndex(run.results);
  const rows = REQUIREMENTS.map((req) => ({ req, ev: evaluate(req, index) }));

  writeFileSync(LEDGER_PATH, render(run, rows), 'utf8');

  const tally = rows.reduce((acc, { ev }) => {
    acc[ev.status] = (acc[ev.status] || 0) + 1;
    return acc;
  }, {});

  process.stdout.write(
    `Ledger generated from a real test run.\n` +
      `  command:        ${run.command}\n` +
      `  runner exit:    ${run.exitCode}\n` +
      `  test results:   ${run.results.length} event(s)\n` +
      `  wrote:          ${path.relative(REPO_ROOT, LEDGER_PATH)}\n` +
      `  rows:           ` +
      ['WORKING', 'PARTIAL', 'BLOCKED', 'MISSING'].map((s) => `${s}=${tally[s] || 0}`).join('  ') +
      '\n',
  );
  for (const { req, ev } of rows) {
    process.stdout.write(`    ${ev.status.padEnd(8)} ${req.name}\n`);
  }
}

// Only run the generator when this file is the entry point. When node imports
// it as a --test-reporter, argv[1] is not this file and nothing below runs.
if (process.argv[1] && path.resolve(process.argv[1]) === SELF) {
  main();
}
