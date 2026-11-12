import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Loads the nearest `.env` (walking up from cwd) into process.env.
 * Variables already set (Docker, CI) win over the file. No-op when no file exists.
 */
export function loadEnv(): void {
  let dir = process.cwd();
  for (;;) {
    const file = join(dir, '.env');
    if (existsSync(file)) {
      process.loadEnvFile(file);
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
}
