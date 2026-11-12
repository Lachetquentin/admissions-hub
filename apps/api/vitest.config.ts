import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup-env.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Integration tests share one database: run files one after another.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/db/migrate.ts', 'src/db/seed.ts', 'src/db/migrations/**'],
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
      // CI fails below these floors (current coverage is well above them).
      thresholds: { lines: 85, statements: 85, functions: 85, branches: 80 },
    },
  },
});
