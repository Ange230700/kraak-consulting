import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Configuration Vitest pour le projet mobile.
 *
 * @ionic/angular importe `@ionic/core/components` (répertoire nu).
 * Node ESM refuse ce type d'import sans extension explicite.
 *
 * Correctif :
 * - `resolve.alias` utilise une regex pour cibler uniquement l'import
 *   de répertoire nu (`@ionic/core/components` exact) sans toucher
 *   les sous-chemins comme `@ionic/core/components/ion-back-button.js`.
 * - `server.deps.inline` force Vitest à traiter les paquets Ionic
 *   via son propre pipeline de résolution (où les alias s'appliquent),
 *   au lieu de déléguer à Node ESM natif.
 * - `preserveSymlinks` empêche Vite de résoudre les symlinks pnpm
 *   vers le store `.pnpm`, gardant les chemins logiques `node_modules`.
 */
export default defineConfig({
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: /^@ionic\/core\/components$/,
        replacement: '@ionic/core/components/index.js',
      },
    ],
  },
  test: {
    maxWorkers: 4,
    environment: 'jsdom',
    server: {
      deps: {
        inline: [/@ionic/, /ionicons/, /@stencil/],
      },
    },
    coverage: {
      provider: 'v8',
      include: [resolve(__dirname, 'src/**/*.ts').replaceAll('\\', '/')],
      exclude: ['**/*.spec.ts', '**/*.d.ts'],
      reporter: ['text-summary', 'lcov', 'json-summary'],
      reportsDirectory: resolve(__dirname, '../../coverage/mobile'),
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
