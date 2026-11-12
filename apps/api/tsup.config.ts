import { defineConfig } from 'tsup';

// Bundles the API with the shared workspace package inlined; node_modules stay external.
export default defineConfig({
  entry: ['src/server.ts', 'src/db/migrate.ts', 'src/db/seed.ts'],
  format: 'esm',
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@admissions-hub/shared'],
});
