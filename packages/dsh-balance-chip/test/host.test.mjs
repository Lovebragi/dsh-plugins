// Host-half smoke test: no Loader, no Electron, just the guarded apply().
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../lib/index.js';

const dir = mkdtempSync(join(tmpdir(), 'dsh-balance-chip-'));
const logFile = join(dir, 'host.log');

const ctx = {
  get(name) {
    assert.equal(name, 'clientModules');
    return {
      clientPath(id) {
        return id === 'dsh-balance-chip' ? 'G:\\dsh-workspace\\dsh-balance-chip\\lib\\client.js' : undefined;
      },
      graph() {
        return { entries: [{ id: 'dsh-balance-chip' }, { id: 'other' }], rev: 'test-rev' };
      },
      onGraphChanged() {
        throw new Error('must not subscribe when the row is already present');
      },
    };
  },
  effect(fn) {
    fn();
  },
};

apply(ctx, { logFile });
const text = readFileSync(logFile, 'utf8');
assert.match(text, /host half loaded/);
assert.match(text, /client bundle path: .*lib\\client\.js/);
assert.match(text, /dsh-balance-chip present in client graph \(2 rows, rev test-rev\)/);

// Missing service must be a quiet no-op.
apply({ get() { return undefined; }, effect() {} }, { logFile });
assert.match(readFileSync(logFile, 'utf8'), /clientModules service unavailable/);

rmSync(dir, { recursive: true, force: true });
console.log('host bundle checks passed');
