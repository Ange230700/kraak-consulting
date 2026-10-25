import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import eslint from '../eslint.config.mjs';

const require = createRequire(import.meta.url);
const scopes = require('../commit-scopes.cjs');
const commitlint = require('../commitlint.config.js');
const commitizen = require('../.czrc.cjs');
const staged = require('../lint-staged.config.cjs');

test('Given une API sans packages précompilés, When TypeScript résout les contrats, Then les sources du workspace sont utilisées', () => {
  const apiRequire = createRequire(
    new URL('../apps/api/package.json', import.meta.url),
  );
  const ts = apiRequire('typescript');
  const configPath = fileURLToPath(
    new URL('../apps/api/tsconfig.json', import.meta.url),
  );
  const apiDirectory = path.dirname(configPath);
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    apiDirectory,
  );
  const resolved = ts.resolveModuleName(
    '@kraak/contracts',
    path.join(apiDirectory, 'src', 'app.module.ts'),
    parsed.options,
    ts.sys,
  ).resolvedModule;
  assert.equal(
    path.normalize(resolved?.resolvedFileName ?? ''),
    fileURLToPath(
      new URL('../packages/contracts/src/index.ts', import.meta.url),
    ),
  );
});

test('Given les outils de commit, When leurs contrats sont chargés, Then les scopes et règles restent alignés', () => {
  assert.ok(scopes.includes('workspace'));
  assert.equal(commitizen.scopes, scopes);
  assert.equal(commitizen.allowCustomScopes, false);
  assert.equal(commitizen.disableEmoji, true);
  assert.deepEqual(commitlint.rules['scope-enum'], [2, 'always', scopes]);
  assert.deepEqual(commitlint.rules['scope-empty'], [2, 'never']);
  assert.ok(commitlint.rules['type-enum'][2].includes('test'));
});

test('Given le lint racine et les fichiers indexés, When les configurations sont évaluées, Then les scripts et le Markdown sont contrôlés', () => {
  assert.ok(eslint.some((config) => config.files?.includes('**/*.mjs')));
  assert.ok(
    staged['**/*.md'].some((command) =>
      command.startsWith('markdownlint-cli2'),
    ),
  );
  assert.ok(
    staged['apps/client/{projects,tests}/**/*.{ts,html}'].every((command) =>
      command.includes('--max-warnings=0'),
    ),
  );
});
