// Runtime role registry for the 40 Permanent Occupational Workforce roles.
//
// roles/*.yaml is GENERATED contract data (scripts/extract_roles.py). This
// module only reads it. It never repairs, normalizes, or infers contract text:
// if the extract is wrong, validateRegistry() must say so loudly rather than
// let a silently-corrupt contract reach the runtime.
//
// Zero runtime dependencies — node: builtins only.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Repository root (src/ lives one level below it). */
export const REPO_ROOT = join(HERE, '..');

/** Directory holding the generated role contracts. */
export const ROLES_DIR = join(REPO_ROOT, 'roles');

/** The boundary matrix is §B data, not a role contract — never parsed as one. */
export const BOUNDARY_MATRIX_FILE = 'boundary_matrix.yaml';

/**
 * The nine contract fields the Master Build Directive defines for every role.
 * Order matches the directive.
 */
export const CONTRACT_FIELDS = Object.freeze([
  'permanent_job',
  'in_scope',
  'out_of_scope',
  'authority',
  'inputs_outputs',
  'required_skills',
  'tools_access',
  'living_model',
  'evaluation',
]);

/** The directive defines exactly 40 roles. Never collapsed, merged, or replaced. */
export const EXPECTED_ROLE_COUNT = 40;

// ---------------------------------------------------------------------------
// Ligature corruption detection
// ---------------------------------------------------------------------------
//
// The directive PDF uses subset fonts whose fi/fl/ffi ligature glyphs decode to
// nothing. A bad decode yields "qualied" for "qualified", "workow" for
// "workflow", "denition" for "definition". A *naive repair* of that damage
// (substring replacement such as "nal" -> "final") yields the opposite
// artifact: "original" becomes "origifinal".
//
// Both classes are silent at runtime: string comparisons, routing lookups and
// boundary checks simply never match, and the system quietly does nothing.
// So the registry treats either as a hard validation failure.

export const LIGATURE_CORRUPTION_PATTERNS = Object.freeze([
  {
    name: 'dropped-ligature',
    // Words that lost an fi/fl/ffi glyph entirely.
    pattern:
      /\b(?:quali(?:ed|es|cation|cations)|unquali(?:ed|es)|workow|workows|deni(?:tion|tions|tive)|dene[ds]?|redene[ds]?|identi(?:ed|es|cation)|unidenti(?:ed)|specic(?:ally)?|specics|conrm(?:ed|s|ation|ations)?|conict(?:s|ed|ing)?|veri(?:ed|es|cation|able)|noti(?:ed|es|cation|cations)|classi(?:ed|es|cation|cations)|clari(?:ed|es|cation|cations)|simpli(?:ed|es|cation)|justi(?:ed|es|cation)|modi(?:ed|es|cation|cations)|uni(?:ed|es)|reect(?:s|ed|ing|ion|ions)?|fulll(?:ed|s|ment)?|prole(?:s|d)?|benet(?:s|ed)?|condence|condential(?:ity)?|ecient(?:ly)?|eciency|sucient(?:ly)?|dicult(?:y|ies)?|congur(?:e|ed|es|ation|ations)|inuenc(?:e|ed|es)|signicant(?:ly)?|signicance|nalize[ds]?|nalization|rened|renement|conrmation|ltering|lter(?:ed|s|ing)?|owchart|overow|reow|inow|outow|ags?|agged)\b/i,
  },
  {
    name: 'double-repaired-ligature',
    // A repair applied on top of intact text: "fi"/"fl" doubled up.
    pattern: /(?:fifi|flfl|ffiffi|fifl|flfi)/i,
  },
  {
    name: 'substring-repair-artifact',
    // Known products of repairing by substring replacement rather than by
    // fixing the glyph decoder. "nal" -> "final" turns original into this.
    pattern:
      /\b(?:origifinal\w*|marginfinal\w*|sigfinal\w*|fifinal\w*|defifin\w*|confifirm\w*|workflflow\w*|idefintif\w*)/i,
  },
]);

/**
 * Scan a string for ligature corruption.
 * @param {string} text
 * @returns {{name: string, match: string}[]} every distinct hit, possibly empty
 */
export function findLigatureCorruption(text) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const hits = [];
  const seen = new Set();
  for (const { name, pattern } of LIGATURE_CORRUPTION_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      const key = `${name}:${m[0].toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        hits.push({ name, match: m[0] });
      }
      if (m.index === re.lastIndex) re.lastIndex += 1; // guard zero-length
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Unescape a double-quoted scalar as emitted by scripts/extract_roles.py,
 * which escapes backslash first and then the double quote.
 * @param {string} body contents between the surrounding quotes
 * @returns {string}
 */
function unescapeQuoted(body) {
  let out = '';
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    const next = body[i + 1];
    i += 1;
    switch (next) {
      case '\\': out += '\\'; break;
      case '"': out += '"'; break;
      case 'n': out += '\n'; break;
      case 't': out += '\t'; break;
      case 'r': out += '\r'; break;
      case undefined: out += '\\'; break; // trailing lone backslash
      default: out += '\\' + next; break; // unknown escape: keep verbatim
    }
  }
  return out;
}

/**
 * Parse the flat `key: value` format the extractor emits.
 * Supports: quoted strings (with \" and \\ escapes), bare integers, and null.
 * Comment lines (#) and blank lines are ignored.
 * @param {string} text
 * @returns {Record<string, string|number|null>}
 */
export function parseRoleYaml(text) {
  const record = {};
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*):[ \t]*(.*)$/.exec(trimmed);
    if (!m) continue;
    const key = m[1];
    const raw = m[2].trim();
    if (raw === '' || raw === 'null' || raw === '~') {
      record[key] = null;
    } else if (raw.startsWith('"')) {
      const end = raw.lastIndexOf('"');
      record[key] = end > 0 ? unescapeQuoted(raw.slice(1, end)) : raw;
    } else if (/^-?\d+$/.test(raw)) {
      record[key] = Number(raw);
    } else {
      record[key] = raw;
    }
  }
  return record;
}

/**
 * Read every generated role contract from roles/ (boundary_matrix.yaml
 * excluded — it is §B matrix data, not a role, and uses block scalars).
 * @param {string} [dir] override the roles directory
 * @returns {Array<Record<string, any>>} roles sorted by id
 */
export function loadRoles(dir = ROLES_DIR) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') && f !== BOUNDARY_MATRIX_FILE)
    .sort();
  const roles = files.map((file) => {
    const record = parseRoleYaml(readFileSync(join(dir, file), 'utf8'));
    record._file = file;
    return record;
  });
  roles.sort((a, b) => {
    const ai = typeof a.id === 'number' ? a.id : Number.POSITIVE_INFINITY;
    const bi = typeof b.id === 'number' ? b.id : Number.POSITIVE_INFINITY;
    if (ai !== bi) return ai - bi;
    return String(a._file).localeCompare(String(b._file));
  });
  return roles;
}

/** Read the §B boundary matrix verbatim. */
export function loadBoundaryMatrix(dir = ROLES_DIR) {
  return readFileSync(join(dir, BOUNDARY_MATRIX_FILE), 'utf8');
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Structural gate over the registry. Never throws — a validator that throws
 * cannot report the second problem it finds.
 * @param {Array<Record<string, any>>} roles
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateRegistry(roles) {
  const errors = [];

  if (!Array.isArray(roles)) {
    return { ok: false, errors: [`registry: expected an array of roles, got ${typeof roles}`] };
  }

  if (roles.length !== EXPECTED_ROLE_COUNT) {
    errors.push(
      `registry: expected exactly ${EXPECTED_ROLE_COUNT} roles, found ${roles.length}. ` +
        'The 40 roles are never collapsed, merged, or replaced.',
    );
  }

  const byId = new Map();
  for (const role of roles) {
    const where = role && role._file ? role._file : '<unknown file>';

    if (!role || typeof role !== 'object') {
      errors.push(`${where}: role entry is not an object`);
      continue;
    }

    if (typeof role.id !== 'number' || !Number.isInteger(role.id)) {
      errors.push(`${where}: missing or non-integer id (got ${JSON.stringify(role.id)})`);
    } else {
      if (role.id < 1 || role.id > EXPECTED_ROLE_COUNT) {
        errors.push(`${where}: id ${role.id} is outside 1..${EXPECTED_ROLE_COUNT}`);
      }
      if (byId.has(role.id)) {
        errors.push(
          `role ${role.id}: duplicate id — defined in both ${byId.get(role.id)} and ${where}`,
        );
      } else {
        byId.set(role.id, where);
      }
    }

    const label = typeof role.id === 'number' ? `role ${role.id} (${where})` : where;

    if (typeof role.title !== 'string' || role.title.trim() === '') {
      errors.push(`${label}: missing title`);
    }

    for (const field of CONTRACT_FIELDS) {
      const value = role[field];
      if (value === undefined) {
        errors.push(`${label}: contract field "${field}" is absent`);
      } else if (value === null) {
        errors.push(`${label}: contract field "${field}" is null (extraction found no text)`);
      } else if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${label}: contract field "${field}" is empty`);
      }
    }

    // Ligature corruption: check the title and every contract field.
    for (const field of ['title', ...CONTRACT_FIELDS]) {
      const value = role[field];
      if (typeof value !== 'string') continue;
      for (const hit of findLigatureCorruption(value)) {
        errors.push(
          `${label}: LIGATURE CORRUPTION in "${field}" — ${hit.name} "${hit.match}". ` +
            'The fi/fl/ffi glyphs were mis-decoded. Fix scripts/extract_pdf.py and ' +
            're-run the extractor; never patch the output by substring replacement.',
        );
      }
    }
  }

  for (let id = 1; id <= EXPECTED_ROLE_COUNT; id += 1) {
    if (!byId.has(id)) errors.push(`registry: role id ${id} is missing`);
  }

  return { ok: errors.length === 0, errors };
}
