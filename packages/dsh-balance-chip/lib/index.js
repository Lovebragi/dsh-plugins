/**
 * dsh-balance-chip — host companion.
 *
 * The visible feature lives in `lib/client.js` (web bundle). This half runs in
 * the DSH host so the Loader has a real entry to mount: its only job is to let
 * the client-modules scanner discover `dsh.client` in this package. Optional
 * `logFile` diagnostics record that discovery and the composed client row.
 */
import { appendFileSync } from 'node:fs';

/** Stable Loader identity. */
export const name = 'balance-chip';

/** The host half needs no services. */
export const inject = [];

const PACKAGE = 'dsh-balance-chip';

/**
 * Mount the host companion.
 * @param ctx - Loader context.
 * @param config - optional `logFile` for discovery diagnostics.
 */
export function apply(ctx, config = {}) {
  const logFile = typeof config.logFile === 'string' && config.logFile !== '' ? config.logFile : null;
  const log = (message) => {
    if (logFile === null) return;
    try {
      appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`);
    } catch {
      /* diagnostics must never break the host */
    }
  };

  log('host half loaded');

  let modules;
  try {
    modules = ctx.get('clientModules');
  } catch {
    modules = undefined;
  }
  if (modules === undefined || typeof modules.graph !== 'function') {
    log('clientModules service unavailable; browser row not verified');
    return;
  }

  let entryId;
  try {
    entryId = typeof modules.clientPath === 'function' ? modules.clientPath(PACKAGE) : undefined;
  } catch {
    entryId = undefined;
  }
  log(`client bundle path: ${entryId ?? '(not found)'}`);

  let done = false;
  const report = (source) => {
    try {
      const graph = modules.graph();
      const rows = Array.isArray(graph?.entries) ? graph.entries.map((entry) => entry.id) : [];
      const found = rows.includes(PACKAGE);
      log(`${source}: ${PACKAGE} ${found ? 'present' : 'missing'} in client graph (${rows.length} rows, rev ${graph?.rev ?? '?'})`);
      if (found) done = true;
      return found;
    } catch (error) {
      log(`${source}: graph read failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };

  if (report('initial')) return;

  let off;
  if (typeof modules.onGraphChanged === 'function') {
    off = modules.onGraphChanged(() => {
      if (!done) report('graph-change');
      if (done && typeof off === 'function') off();
    });
  }

  // Fallback for a composition flush that happened before this entry existed.
  const timer = setTimeout(() => {
    if (!done) report('delayed');
  }, 3000);
  if (typeof timer.unref === 'function') timer.unref();

  ctx.effect(() => () => {
    if (typeof off === 'function') off();
    clearTimeout(timer);
  }, 'balance-chip: graph diagnostics');
}
