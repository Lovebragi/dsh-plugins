/**
 * dsh-jump-to-question — host companion.
 *
 * The visible feature lives in `lib/client.js` (web bundle). This half exists so
 * the Loader has a mountable entry and the client-modules scanner can discover
 * `dsh.client` in this package.
 */

/** Stable Loader identity. */
export const name = 'jump-to-question';

/** The host half needs no services. */
export const inject = [];

/** Mount the host companion. */
export function apply() {}
