import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import jsonc from 'eslint-plugin-jsonc';
import globals from 'globals';

const [jsoncPluginConfig, jsoncLanguageConfig, jsoncRulesConfig] =
  jsonc.configs['flat/recommended-with-jsonc'];
const jsoncFiles = ['**/*.jsonc'];

export default defineConfig([
  {
    ignores: [
      '**/.angular/**',
      '**/.cache/**',
      '.changeset/',
      '.git/',
      '.reports/',
      '.scannerwork/',
      '**/.venv/**',
      '**/coverage/**',
      '**/dist/**',
      '**/test-results/**',
      'apps/client/android/**/build/**',
      'node_modules/',
      'pr-*-export/**',
    ],
  },
  {
    files: ['**/*.{js,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    files: ['**/*.mjs'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
  jsoncPluginConfig,
  {
    ...jsoncLanguageConfig,
    files: jsoncFiles,
  },
  {
    ...jsoncRulesConfig,
    files: jsoncFiles,
  },
]);
