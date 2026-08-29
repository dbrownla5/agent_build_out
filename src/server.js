/**
 * Phase 1 — server foundation.
 *
 * Host-agnostic by construction:
 *   - `handler(req, res)` is exported so a serverless entrypoint (Cloud Run
 *     functions framework, a Node-compatible FaaS shim, a test harness) can
 *     drive it directly with no listener.
 *   - When this file is executed directly it starts a long-lived node:http
 *     server on HOST/PORT and handles SIGTERM/SIGINT for graceful shutdown.
 *
 * Constraints honoured here:
 *   - ZERO runtime npm dependencies. node: builtins only.
 *   - No localhost anywhere in a production path. HOST defaults to 0.0.0.0 so
 *     the process is reachable from outside its container; nothing in this file
 *     dials a hostname.
 *   - No invented product requirements. Unknowns are marked TODO, not guessed.
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

export const PORT = Number.parseInt(process.env.PORT ?? '', 10) || 8080;
export const HOST = process.env.HOST || '0.0.0.0';

/**
 * Commit SHA is supplied by whatever host ends up running this. K_REVISION is
 * Cloud Run's revision name (not a SHA, but it is the only build identity Cloud
 * Run injects for free), so it is the last resort before "unknown".
 * TODO(deploy): once the host is chosen, make the build pipeline set COMMIT_SHA
 * explicitly so this never falls back to a revision name or to "unknown".
 */
export const COMMIT =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.COMMIT_SHA ||
  process.env.K_REVISION ||
  'unknown';

const NODE_VERSION = process.version;
const STARTED_AT = Date.now();

/**
 * Test-only seam. Production always resolves './roles.js' (owned by another
 * agent). Tests may point ROLES_MODULE at a stub path or specifier.
 */
const ROLES_MODULE = process.env.ROLES_MODULE || './roles.js';

// ---------------------------------------------------------------------------
// version
// ---------------------------------------------------------------------------

let versionCache = null;

async function readVersion() {
  if (versionCache !== null) return versionCache;
  if (process.env.APP_VERSION) {
    versionCache = process.env.APP_VERSION;
    return versionCache;
  }
  try {
    const raw = await fs.readFile(path.join(REPO_ROOT, 'package.json'), 'utf8');
    versionCache = JSON.parse(raw).version || '0.0.0';
  } catch {
    versionCache = '0.0.0';
  }
  return versionCache;
}

// ---------------------------------------------------------------------------
// roles registry access
//
// src/roles.js is written by another agent. This module codes against the
// documented interface only: it exports `loadRoles` and `validateRegistry`.
// Both are awaited so a sync or async implementation works. The return shapes
// are normalised defensively because the exact shapes are not yet frozen.
// TODO(roles): once src/roles.js lands, tighten these normalisers to the real
// contract and delete the tolerant branches.
// ---------------------------------------------------------------------------

let registryCache = null; // only successful loads are cached

function normaliseRoles(loaded) {
  if (Array.isArray(loaded)) return loaded;
  if (loaded && Array.isArray(loaded.roles)) return loaded.roles;
  if (loaded && typeof loaded === 'object') return Object.values(loaded);
  throw new Error(`loadRoles() returned an unusable value: ${typeof loaded}`);
}

function normaliseValidation(result) {
  // A validator that throws on invalid input never reaches here; that path is
  // handled by the caller's try/catch and surfaces as 503.
  if (result === undefined || result === null) return { valid: true, errors: [] };
  if (typeof result === 'boolean') return { valid: result, errors: [] };
  if (Array.isArray(result)) return { valid: result.length === 0, errors: result };
  if (typeof result === 'object') {
    const errors = Array.isArray(result.errors)
      ? result.errors
      : Array.isArray(result.problems)
        ? result.problems
        : [];
    const valid =
      typeof result.valid === 'boolean'
        ? result.valid
        : typeof result.ok === 'boolean'
          ? result.ok
          : errors.length === 0;
    return { valid, errors };
  }
  return { valid: false, errors: [`unrecognised validateRegistry() result: ${typeof result}`] };
}

/**
 * Loads and validates the role registry.
 * Throws on any failure — callers must translate that into a non-200 response.
 * A health endpoint that lies is worse than no health endpoint.
 */
async function getRegistry() {
  if (registryCache) return registryCache;

  const mod = await import(ROLES_MODULE);

  if (typeof mod.loadRoles !== 'function') {
    throw new Error(`${ROLES_MODULE} does not export loadRoles()`);
  }
  if (typeof mod.validateRegistry !== 'function') {
    throw new Error(`${ROLES_MODULE} does not export validateRegistry()`);
  }

  const roles = normaliseRoles(await mod.loadRoles());
  const validation = normaliseValidation(await mod.validateRegistry(roles));

  const registry = { roles, valid: validation.valid, errors: validation.errors };
  if (validation.valid) registryCache = registry; // never cache a bad registry
  return registry;
}

function roleSummary(role) {
  return { id: role?.id, title: role?.title };
}

function matchesRoleId(role, wanted) {
  if (role == null) return false;
  const id = role.id;
  if (id === undefined || id === null) return false;
  if (String(id) === wanted) return true;
  // Files are named 01_..., 07_...; tolerate a zero-padded request for a
  // numeric id so /api/roles/07 and /api/roles/7 both resolve.
  if (typeof id === 'number' && Number.isFinite(Number(wanted))) {
    return Number(wanted) === id;
  }
  return false;
}

// ---------------------------------------------------------------------------
// responses
// ---------------------------------------------------------------------------

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  });
  res.end(res.req && res.req.method === 'HEAD' ? undefined : payload);
  return status;
}

let indexHtmlCache = null;

async function sendIndex(res, isHead) {
  if (indexHtmlCache === null) {
    indexHtmlCache = await fs.readFile(path.join(PUBLIC_DIR, 'index.html'));
  }
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': indexHtmlCache.length,
    'cache-control': 'no-cache',
  });
  res.end(isHead ? undefined : indexHtmlCache);
  return 200;
}

// ---------------------------------------------------------------------------
// logging — one structured JSON line per request, stdout only
// ---------------------------------------------------------------------------

function log(fields) {
  try {
    process.stdout.write(`${JSON.stringify({ ts: new Date().toISOString(), ...fields })}\n`);
  } catch {
    // Logging must never take the process down.
  }
}

// ---------------------------------------------------------------------------
// route handling
// ---------------------------------------------------------------------------

async function route(req, res, url) {
  const method = req.method || 'GET';
  const isHead = method === 'HEAD';
  const readOnly = method === 'GET' || isHead;
  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;

  // GET /health
  if (pathname === '/health') {
    if (!readOnly) return sendJson(res, 405, { error: 'method_not_allowed', allow: 'GET' });
    const base = {
      uptime_s: Math.round(process.uptime()),
      version: await readVersion(),
      node: NODE_VERSION,
      commit: COMMIT,
    };
    try {
      const registry = await getRegistry();
      if (!registry.valid) {
        return sendJson(res, 503, {
          status: 'error',
          ...base,
          roles_loaded: registry.roles.length,
          roles_valid: false,
          error: 'role registry failed validation',
          errors: registry.errors.map(String).slice(0, 20),
        });
      }
      return sendJson(res, 200, {
        status: 'ok',
        ...base,
        roles_loaded: registry.roles.length,
        roles_valid: true,
      });
    } catch (err) {
      return sendJson(res, 503, {
        status: 'error',
        ...base,
        roles_loaded: 0,
        roles_valid: false,
        error: err && err.message ? err.message : String(err),
      });
    }
  }

  // GET /api/roles
  if (pathname === '/api/roles') {
    if (!readOnly) return sendJson(res, 405, { error: 'method_not_allowed', allow: 'GET' });
    try {
      const registry = await getRegistry();
      return sendJson(res, 200, {
        count: registry.roles.length,
        roles_valid: registry.valid,
        roles: registry.roles.map(roleSummary),
      });
    } catch (err) {
      return sendJson(res, 503, {
        error: 'role_registry_unavailable',
        detail: err && err.message ? err.message : String(err),
      });
    }
  }

  // GET /api/roles/:id
  if (pathname.startsWith('/api/roles/')) {
    if (!readOnly) return sendJson(res, 405, { error: 'method_not_allowed', allow: 'GET' });
    const id = decodeURIComponent(pathname.slice('/api/roles/'.length));
    if (!id || id.includes('/')) return sendJson(res, 404, { error: 'not_found', path: url.pathname });
    try {
      const registry = await getRegistry();
      const role = registry.roles.find((r) => matchesRoleId(r, id));
      if (!role) return sendJson(res, 404, { error: 'role_not_found', id });
      return sendJson(res, 200, role);
    } catch (err) {
      return sendJson(res, 503, {
        error: 'role_registry_unavailable',
        detail: err && err.message ? err.message : String(err),
      });
    }
  }

  // GET /
  if (pathname === '/' || pathname === '/index.html') {
    if (!readOnly) return sendJson(res, 405, { error: 'method_not_allowed', allow: 'GET' });
    try {
      return await sendIndex(res, isHead);
    } catch (err) {
      return sendJson(res, 500, {
        error: 'dashboard_unavailable',
        detail: err && err.message ? err.message : String(err),
      });
    }
  }

  // TODO(phase-2+): static assets beyond index.html, intake, uploads, workflow,
  // approval and living-context routes. Deliberately absent, not stubbed.
  return sendJson(res, 404, { error: 'not_found', path: url.pathname });
}

/**
 * The whole application as a single (req, res) function.
 * Exported so a serverless entrypoint can import it without starting a listener.
 */
export async function handler(req, res) {
  const started = process.hrtime.bigint();
  // Dummy base: this parses the request target only. It is never dialled, so no
  // hostname assumption leaks into a production path.
  let url;
  try {
    url = new URL(req.url || '/', 'http://request.invalid');
  } catch {
    url = new URL('/', 'http://request.invalid');
  }

  let status = 500;
  let failure;
  try {
    status = await route(req, res, url);
  } catch (err) {
    failure = err && err.message ? err.message : String(err);
    if (!res.headersSent) {
      status = sendJson(res, 500, { error: 'internal_error' });
    } else {
      try { res.end(); } catch { /* already destroyed */ }
    }
  } finally {
    log({
      level: failure ? 'error' : 'info',
      msg: 'request',
      method: req.method,
      path: url.pathname,
      status,
      duration_ms: Number(process.hrtime.bigint() - started) / 1e6,
      commit: COMMIT,
      ...(failure ? { error: failure } : {}),
    });
  }
}

// ---------------------------------------------------------------------------
// long-lived container mode
// ---------------------------------------------------------------------------

export function createServer() {
  return http.createServer(handler);
}

export function start({ port = PORT, host = HOST } = {}) {
  const server = createServer();
  // Cloud Run and most proxies want a keep-alive slightly longer than the LB's.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 70_000;

  server.listen(port, host, () => {
    log({ level: 'info', msg: 'listening', host, port, commit: COMMIT, node: NODE_VERSION });
  });

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log({ level: 'info', msg: 'shutdown_started', signal });
    // Force exit if connections refuse to drain — containers and Cloud Run both
    // kill the process shortly after SIGTERM anyway.
    const force = setTimeout(() => {
      log({ level: 'warn', msg: 'shutdown_forced', signal });
      process.exit(1);
    }, 10_000);
    force.unref();
    server.close(() => {
      clearTimeout(force);
      log({ level: 'info', msg: 'shutdown_complete', signal });
      process.exit(0);
    });
    if (typeof server.closeIdleConnections === 'function') server.closeIdleConnections();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    log({ level: 'error', msg: 'unhandled_rejection', error: String(reason) });
  });
  process.on('uncaughtException', (err) => {
    log({ level: 'error', msg: 'uncaught_exception', error: err && err.stack ? err.stack : String(err) });
    process.exit(1);
  });

  return server;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) start();

export default handler;
