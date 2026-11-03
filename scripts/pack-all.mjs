import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
mkdirSync(dist, { recursive: true });
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

for (const name of ['dsh-taskbar-flash', 'dsh-balance-chip', 'dsh-reply-progress']) {
  const cwd = path.join(root, 'packages', name);
  console.log(`\n==> packing ${name}`);
  execFileSync(pnpm, ['pack', '--pack-destination', dist], { cwd, stdio: 'inherit', shell: true });
}
console.log(`\nTarballs written to ${dist}`);
