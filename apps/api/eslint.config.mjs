import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import jest from 'eslint-plugin-jest';
import nodePlugin from 'eslint-plugin-n';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.ts'],
    extends: [nodePlugin.configs['flat/recommended']],
    plugins: {
      sonarjs,
    },
    settings: {
      node: { version: '>=22.12.0' },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      'n/no-unsupported-features/node-builtins': [
        'error',
        { version: '>=22.0.0' },
      ],
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-identical-expressions': 'error',
    },
  },
  {
    files: ['src/**/*.spec.ts'],
    extends: [jest.configs['flat/recommended']],
    rules: {
      'n/no-extraneous-import': 'off',
      'n/no-extraneous-require': 'off',
    },
  },
  prettier,
);
