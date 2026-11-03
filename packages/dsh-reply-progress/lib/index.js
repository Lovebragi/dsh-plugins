/**
 * dsh-reply-progress — host companion.
 *
 * The visible feature lives in `lib/client.js` (web bundle). This half exists so
 * the Loader has a mountable entry and the client-modules scanner can discover
 * `dsh.client` in this package. Optional `logFile` diagnostics record the
 * composed client row.
 */
import { appendFileSync } from 'node:fs';

/** Stable Loader identity. */
export const name = 'reply-progress';

/** The host half needs no services. */
export const inject = [];

const PACKAGE = 'dsh-reply-progress';

/**
 * Mount the host companion.
 * @param ctx - Loader context.
 * @param config - optional `logFile` diagnostics path.
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

  const report = () => {
    try {
      const rows = modules.graph()?.entries?.map((entry) => entry.id) ?? [];
      const found = rows.includes(PACKAGE);
      log(`${PACKAGE} ${found ? 'present' : 'missing'} in client graph (${rows.length} rows)`);
      return found;
    } catch (error) {
      log(`graph read failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };

  if (report()) return;
  const timer = setTimeout(report, 1500);
  if (typeof timer.unref === 'function') timer.unref();
  ctx.effect(() => () => clearTimeout(timer), 'reply-progress: graph check');
}
