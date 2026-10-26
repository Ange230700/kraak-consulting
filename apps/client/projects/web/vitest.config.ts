import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    maxWorkers: 4,
    setupFiles: [resolve(__dirname, 'vitest.setup.ts')],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      include: [
        resolve(__dirname, 'src/**/*.ts').replaceAll('\\', '/'),
        resolve(__dirname, '../shared/**/*.ts').replaceAll('\\', '/'),
      ],
      exclude: ['**/*.spec.ts', '**/*.d.ts'],
      reporter: ['text-summary', 'lcov', 'json-summary'],
      reportsDirectory: resolve(__dirname, '../../coverage/web'),
      thresholds: {
        perFile: true,
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
