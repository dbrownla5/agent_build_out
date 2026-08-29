// Phase 1 registry gate.
//
// WHY THIS TEST IS SHAPED THIS WAY
// --------------------------------
// An earlier version of this gate counted files and checked that fields were
// non-empty. An adversarial audit showed it would pass on 40 completely
// FABRICATED roles. That is the exact failure that killed fifteen prior
// builds: agents invented a workforce because the real definitions were
// missing, and nothing detected it.
//
// So structure is necessary but not sufficient. Every assertion below that
// matters checks FIDELITY TO SOURCE: the role text must actually be present in
// the Master Build Directive. If the source directive cannot be read, this
// file FAILS. It never skips. A skipped fidelity test is the same lie as a
// fabricated role.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  loadRoles,
  loadBoundaryMatrix,
  validateRegistry,
  findLigatureCorruption,
  CONTRACT_FIELDS,
  EXPECTED_ROLE_COUNT,
  REPO_ROOT,
} from '../src/roles.js';

// ---------------------------------------------------------------------------
// Source directive
// ---------------------------------------------------------------------------

// TODO(source-path): the extracted directive text currently lives outside the
// repo, in the session scratchpad. Set MBD_SOURCE, or land a copy at
// requirements/mbd.txt, to make this gate portable across machines and CI.
const SOURCE_CANDIDATES = [
  '/tmp/claude-0/-home-user/163a7917-49b9-5eb8-b153-1508715e1790/scratchpad/mbd.txt',
  join(REPO_ROOT, 'requirements', 'mbd.txt'),
  join(REPO_ROOT, 'mbd.txt'),
];

const BLUEPRINT_START = 'A) Permanent Occupational Workforce Blueprint';
const BLUEPRINT_END = '7. Required role separation';

let sourceCache;

/**
 * Read the Master Build Directive text. Throws — loudly and specifically — if
 * it cannot be found. Never returns a placeholder, never skips.
 */
function directiveSource() {
  if (sourceCache !== undefined) return sourceCache;
  // An explicit MBD_SOURCE is authoritative: if it is set and missing, that is
  // a failure, never a quiet fall-through to some other file.
  const candidates = process.env.MBD_SOURCE ? [process.env.MBD_SOURCE] : SOURCE_CANDIDATES;
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      'FIDELITY GATE CANNOT RUN: the Master Build Directive source text was not ' +
        'found. Without it the registry cannot be proven real, and 40 fabricated ' +
        'roles would pass every structural check. Set MBD_SOURCE to the extracted ' +
        'directive text, or place it at requirements/mbd.txt.\nLooked in:\n  ' +
        candidates.join('\n  '),
    );
  }
  const text = readFileSync(found, 'utf8');
  assert.ok(
    text.length > 10000,
    `Directive source at ${found} is only ${text.length} bytes — that is a stub, not the directive.`,
  );
  sourceCache = { path: found, text };
  return sourceCache;
}

/** Collapse all whitespace runs so line-wrapped PDF text compares cleanly. */
function normalize(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

/** The §A blueprint body, sliced by the same anchors the extractor uses. */
function blueprintBody() {
  const { text, path } = directiveSource();
  const start = text.indexOf(BLUEPRINT_START);
  const end = text.indexOf(BLUEPRINT_END);
  assert.ok(start !== -1, `Directive source ${path} has no "${BLUEPRINT_START}" section header.`);
  assert.ok(end !== -1, `Directive source ${path} has no "${BLUEPRINT_END}" section header.`);
  assert.ok(end > start, `Directive source ${path}: "${BLUEPRINT_END}" precedes the blueprint.`);
  return text.slice(start, end);
}

/**
 * Numbered role headings found in the SOURCE itself: "12. Some Title".
 * This validates the directive, not only the extract.
 * @returns {Map<number, string>}
 */
function sourceRoleHeadings() {
  const body = blueprintBody();
  const headings = new Map();
  const duplicates = [];
  const re = /\n(\d{1,2})\.\s+([^\n]+)\n/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const id = Number(m[1]);
    if (id < 1 || id > EXPECTED_ROLE_COUNT) continue;
    if (headings.has(id)) duplicates.push(id);
    else headings.set(id, normalize(m[2]));
  }
  assert.deepEqual(
    duplicates,
    [],
    `Source directive repeats role heading number(s): ${duplicates.join(', ')}`,
  );
  return headings;
}

// ---------------------------------------------------------------------------
// Gate 0 — the source must exist
// ---------------------------------------------------------------------------

test('source directive text is available (never skipped)', () => {
  const { path, text } = directiveSource();
  assert.ok(path, 'no directive source path resolved');
  assert.ok(text.includes(BLUEPRINT_START), `${path} does not contain the §A blueprint.`);
});

// ---------------------------------------------------------------------------
// Gate 1 — fidelity to source
// ---------------------------------------------------------------------------

test('source directive itself declares exactly 40 numbered roles', () => {
  const headings = sourceRoleHeadings();
  const ids = [...headings.keys()].sort((a, b) => a - b);
  const missing = [];
  for (let id = 1; id <= EXPECTED_ROLE_COUNT; id += 1) {
    if (!headings.has(id)) missing.push(id);
  }
  assert.deepEqual(
    missing,
    [],
    `Source directive is missing role heading(s): ${missing.join(', ')}. ` +
      'The source is incomplete — do not extract from it and do not invent the gaps.',
  );
  assert.equal(
    ids.length,
    EXPECTED_ROLE_COUNT,
    `Source directive declares ${ids.length} numbered roles, expected ${EXPECTED_ROLE_COUNT}. ` +
      `Found ids: ${ids.join(', ')}`,
  );
});

test('every role title appears verbatim in the source directive', () => {
  const roles = loadRoles();
  const haystack = normalize(directiveSource().text);
  const failures = [];
  for (const role of roles) {
    const title = normalize(role.title);
    assert.ok(
      title.length >= 5,
      `role ${role.id} (${role._file}): title "${role.title}" is too short to be a real role title.`,
    );
    if (!haystack.includes(title)) {
      failures.push(`role ${role.id} (${role._file}): title "${title}" is NOT in the directive.`);
    }
  }
  assert.deepEqual(
    failures,
    [],
    'FABRICATED ROLE(S) DETECTED — titles absent from the Master Build Directive:\n' +
      failures.join('\n'),
  );
});

test('every role title matches the source heading with the same number', () => {
  const roles = loadRoles();
  const headings = sourceRoleHeadings();
  const failures = [];
  for (const role of roles) {
    const expected = headings.get(role.id);
    if (expected === undefined) {
      failures.push(`role ${role.id} (${role._file}): no heading numbered ${role.id} in the source.`);
      continue;
    }
    const actual = normalize(role.title);
    if (actual !== expected) {
      failures.push(
        `role ${role.id} (${role._file}): title mismatch.\n` +
          `    registry: "${actual}"\n` +
          `    directive: "${expected}"`,
      );
    }
  }
  assert.deepEqual(
    failures,
    [],
    'Role titles do not line up with the directive headings (renumbered, renamed, or invented):\n' +
      failures.join('\n'),
  );
});

test('every role permanent_job text appears in the source directive', () => {
  const roles = loadRoles();
  const haystack = normalize(directiveSource().text);
  const failures = [];
  for (const role of roles) {
    const job = normalize(role.permanent_job);
    // Guard against a trivially-short value that would "appear" in any text.
    if (job.length < 40) {
      failures.push(
        `role ${role.id} (${role._file}): permanent_job is only ${job.length} chars — ` +
          `too short to be the directive's contract text: "${job}"`,
      );
      continue;
    }
    if (!haystack.includes(job)) {
      failures.push(
        `role ${role.id} (${role._file}): permanent_job is NOT in the directive.\n` +
          `    registry text: "${job.slice(0, 160)}${job.length > 160 ? '…' : ''}"`,
      );
    }
  }
  assert.deepEqual(
    failures,
    [],
    'FABRICATED CONTRACT TEXT DETECTED — permanent_job absent from the Master Build Directive:\n' +
      failures.join('\n'),
  );
});

// ---------------------------------------------------------------------------
// Gate 2 — structure
// ---------------------------------------------------------------------------

test('registry loads exactly 40 role contracts', () => {
  const roles = loadRoles();
  assert.equal(
    roles.length,
    EXPECTED_ROLE_COUNT,
    `Loaded ${roles.length} role contracts, expected ${EXPECTED_ROLE_COUNT}. ` +
      `Files: ${roles.map((r) => r._file).join(', ')}`,
  );
});

test('role ids are 1..40 with no duplicates and no gaps', () => {
  const roles = loadRoles();
  const ids = roles.map((r) => r.id);
  const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
  assert.deepEqual(dupes, [], `Duplicate role id(s): ${dupes.join(', ')}`);
  const expected = Array.from({ length: EXPECTED_ROLE_COUNT }, (_, i) => i + 1);
  assert.deepEqual(
    [...ids].sort((a, b) => a - b),
    expected,
    `Role ids are not exactly 1..${EXPECTED_ROLE_COUNT}.`,
  );
});

test('every role carries all nine contract fields, non-empty', () => {
  const roles = loadRoles();
  assert.equal(CONTRACT_FIELDS.length, 9, 'CONTRACT_FIELDS must list all nine directive fields.');
  const failures = [];
  for (const role of roles) {
    for (const field of CONTRACT_FIELDS) {
      const value = role[field];
      if (typeof value !== 'string' || value.trim() === '') {
        failures.push(
          `role ${role.id} (${role._file}): contract field "${field}" is ` +
            `${value === undefined ? 'absent' : value === null ? 'null' : 'empty'}.`,
        );
      }
    }
  }
  assert.deepEqual(failures, [], 'Incomplete role contracts:\n' + failures.join('\n'));
});

test('validateRegistry passes on the real registry', () => {
  const result = validateRegistry(loadRoles());
  assert.deepEqual(result.errors, [], 'validateRegistry reported errors:\n' + result.errors.join('\n'));
  assert.equal(result.ok, true);
});

test('boundary matrix loads and is non-empty', () => {
  const text = loadBoundaryMatrix();
  assert.equal(typeof text, 'string');
  assert.ok(text.length > 200, `boundary_matrix.yaml is only ${text.length} bytes.`);
  assert.ok(
    text.includes('B) Boundary and Overlap Matrix'),
    'boundary_matrix.yaml does not contain the §B matrix text.',
  );
});

// ---------------------------------------------------------------------------
// Gate 3 — ligature corruption
// ---------------------------------------------------------------------------

test('no ligature corruption in any role title or contract field', () => {
  const roles = loadRoles();
  const failures = [];
  for (const role of roles) {
    for (const field of ['title', ...CONTRACT_FIELDS]) {
      for (const hit of findLigatureCorruption(role[field])) {
        failures.push(
          `role ${role.id} (${role._file}) field "${field}": ${hit.name} → "${hit.match}"`,
        );
      }
    }
  }
  assert.deepEqual(
    failures,
    [],
    'LIGATURE CORRUPTION — fi/fl/ffi glyphs were mis-decoded. Runtime string ' +
      'comparisons against this text would silently never match. Fix the PDF ' +
      'decoder and re-run scripts/extract_roles.py:\n' + failures.join('\n'),
  );
});

test('corruption detector actually detects the known corruption forms', () => {
  // Guards the guard: if these stop matching, the corruption gate is decorative.
  for (const bad of ['origifinal', 'qualied', 'workow', 'denition']) {
    const hits = findLigatureCorruption(`the ${bad} record`);
    assert.ok(hits.length > 0, `findLigatureCorruption failed to flag "${bad}"`);
  }
  for (const good of ['original', 'qualified', 'workflow', 'definition', 'final', 'files']) {
    assert.deepEqual(
      findLigatureCorruption(`the ${good} record`),
      [],
      `findLigatureCorruption false-positived on "${good}"`,
    );
  }
});

// ---------------------------------------------------------------------------
// Gate 4 — the validator itself
// ---------------------------------------------------------------------------

test('validateRegistry reports errors instead of throwing', () => {
  const cases = [
    { input: [], why: 'empty registry' },
    { input: null, why: 'null registry' },
    { input: [{ id: 1, title: 'x', _file: 'a.yaml' }], why: 'role missing contract fields' },
  ];
  for (const { input, why } of cases) {
    const result = validateRegistry(input);
    assert.equal(result.ok, false, `expected failure for ${why}`);
    assert.ok(result.errors.length > 0, `expected error messages for ${why}`);
  }
});

test('validateRegistry rejects a duplicated id and a corrupted field', () => {
  const roles = loadRoles();
  const clone = roles.map((r) => ({ ...r }));
  clone[1].id = 1;
  clone[2].permanent_job = 'Understand the origifinal request and route it.';
  const result = validateRegistry(clone);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => e.includes('duplicate id')),
    'duplicate id not reported:\n' + result.errors.join('\n'),
  );
  assert.ok(
    result.errors.some((e) => e.includes('LIGATURE CORRUPTION')),
    'ligature corruption not reported:\n' + result.errors.join('\n'),
  );
});
