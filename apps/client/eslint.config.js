// @ts-check
/** @type {any} */
const playwright = require('eslint-plugin-playwright');
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const prettier = require('eslint-config-prettier/flat');
const sonarjs = require('eslint-plugin-sonarjs');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig(
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: [
      'projects/web/src/**/*.ts',
      'projects/mobile/src/**/*.ts',
      'projects/shared/**/*.ts',
    ],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    plugins: {
      sonarjs,
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'kraak',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'kraak',
          style: 'kebab-case',
        },
      ],
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-identical-expressions': 'error',
    },
  },
  {
    files: [
      'projects/web/src/**/*.html',
      'projects/mobile/src/**/*.html',
      'projects/shared/**/*.html',
    ],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    files: ['tests/e2e/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      playwright.configs['flat/recommended'],
    ],
    plugins: {
      sonarjs,
    },
    rules: {
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-identical-expressions': 'error',
    },
  },
  prettier,
);
