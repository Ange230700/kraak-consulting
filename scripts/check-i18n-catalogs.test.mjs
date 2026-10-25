import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  findDuplicateJsonKeys,
  main,
  readLocaleContract,
  validateCatalogs,
} from './check-i18n-catalogs.mjs';

const repoRoot = process.cwd();
const contract = {
  sourceLocale: 'fr',
  fallbackLocale: 'fr',
  supportedLocales: ['fr', 'en'],
};
const proof = {
  shared: {
    prototype: {
      icuPluralPath: '{count, plural, one {Un} other {Plusieurs}}',
      icuSelectPath: '{audience, select, student {Étudiant} other {Public}}',
    },
  },
};

function fixture(t, catalogs = { fr: proof, en: proof }) {
  mkdirSync(path.join(repoRoot, '.reports'), { recursive: true });
  const root = mkdtempSync(path.join(repoRoot, '.reports', 'i18n-fixture-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const catalogRoot = path.join(
    root,
    'apps',
    'client',
    'projects',
    'shared',
    'i18n',
    'catalogs',
  );
  mkdirSync(catalogRoot, { recursive: true });
  for (const [locale, catalog] of Object.entries(catalogs)) {
    writeFileSync(
      path.join(catalogRoot, `${locale}.json`),
      JSON.stringify(catalog),
    );
  }
  const localization = path.join(
    root,
    'packages',
    'domain',
    'src',
    'localization.ts',
  );
  mkdirSync(path.dirname(localization), { recursive: true });
  writeFileSync(
    localization,
    "SUPPORTED_LOCALES = Object.freeze(['fr', 'en']);\nSOURCE_LOCALE: SupportedLocale = 'fr';\nFALLBACK_LOCALE: SupportedLocale = SOURCE_LOCALE;",
  );
  return { root, catalogRoot, localization };
}

test('Given des catalogues conformes, When ils sont validés, Then les clés partagées et le contrat sont conservés', (t) => {
  const { root } = fixture(t);
  assert.deepEqual(readLocaleContract(root), contract);
  assert.deepEqual(validateCatalogs(contract, root), {
    errors: [],
    keyCount: 2,
  });
  const messages = [];
  t.mock.method(console, 'log', (message) => messages.push(message));
  main(root);
  assert.deepEqual(messages, ['i18n catalogs ok: fr, en with 2 shared keys.']);
});

test('Given le véritable contrat, When la CLI est appelée, Then le contrôle public réussit', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'scripts', 'check-i18n-catalogs.mjs')],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /i18n catalogs ok:/);
});

test('Given des contrats incomplets, When ils sont lus, Then chaque erreur de contrat est explicite', (t) => {
  const { root, localization } = fixture(t);
  for (const source of [
    '',
    "SUPPORTED_LOCALES = Object.freeze(['fr']);",
    "SOURCE_LOCALE: SupportedLocale = 'fr';",
  ]) {
    writeFileSync(localization, source);
    assert.throws(
      () => readLocaleContract(root),
      /Unable to read domain localization contract/,
    );
  }
  writeFileSync(
    localization,
    "SUPPORTED_LOCALES = Object.freeze(['fr']);\nSOURCE_LOCALE: SupportedLocale = 'fr';",
  );
  assert.throws(
    () => readLocaleContract(root),
    /Unable to read fallback locale/,
  );
  writeFileSync(
    localization,
    "SUPPORTED_LOCALES = Object.freeze(['fr']);\nSOURCE_LOCALE: SupportedLocale = 'fr';\nFALLBACK_LOCALE: SupportedLocale = 'en';",
  );
  assert.equal(readLocaleContract(root).fallbackLocale, 'en');
});

test('Given des langues absentes ou non prises en charge, When la validation échoue, Then toutes les erreurs sont affichées', (t) => {
  const { root, catalogRoot } = fixture(t, { de: {}, fr: proof });
  mkdirSync(path.join(catalogRoot, 'en.json'));
  writeFileSync(path.join(catalogRoot, 'notes.txt'), 'non catalogue');
  const result = validateCatalogs(
    { ...contract, sourceLocale: 'es', fallbackLocale: 'it' },
    root,
  );
  assert.ok(result.errors.includes('Unsupported i18n catalog found: de.json'));
  assert.ok(result.errors.includes('Missing i18n catalog for en'));
  assert.ok(result.errors.includes('Source locale is not supported: es'));
  assert.ok(result.errors.includes('Fallback locale is not supported: it'));
  assert.equal(result.keyCount, 0);
  const messages = [];
  const previousExitCode = process.exitCode;
  t.mock.method(console, 'error', (message) => messages.push(message));
  try {
    main(root);
    assert.equal(process.exitCode, 1);
    assert.ok(messages.includes('Missing i18n catalog for en'));
  } finally {
    process.exitCode = previousExitCode;
  }
});

test('Given des clés, valeurs et interpolations divergentes, When les catalogues sont comparés, Then les diagnostics nomment chaque divergence', (t) => {
  const fr = {
    ...proof,
    blank: ' ',
    missing: 'absent',
    nested: { value: 'Texte' },
    object: {},
    array: [1, null, true, false],
    arrayMismatch: [],
    type: 5,
    simple: '{{name}}',
    equalSize: '{{name}}',
    same: '{{name}} {{other}}',
    numeric: 3,
    textToNumber: 'Texte',
  };
  const en = {
    ...proof,
    blank: '',
    extra: 'extra',
    nested: [],
    object: 2,
    array: [2],
    arrayMismatch: {},
    type: 'cinq',
    simple: '{{name}} {{other}}',
    equalSize: '{{different}}',
    same: '{{other}} {{name}}',
    numeric: 4,
    textToNumber: 2,
  };
  const { root } = fixture(t, { fr, en });
  const { errors } = validateCatalogs(contract, root);
  for (const expected of [
    'Empty translation value: fr:blank',
    'Empty translation value: en:blank',
    'Missing key in en.json: missing',
    'Extra key in en.json: extra',
    'Shape mismatch at nested',
    'Shape mismatch at object',
    'Shape mismatch at arrayMismatch',
    'Shape mismatch at type: fr is number, en is string',
  ]) {
    assert.ok(errors.includes(expected), expected);
  }
  assert.ok(
    errors.some((error) =>
      error.startsWith('Interpolation variable mismatch for simple:'),
    ),
  );
  assert.ok(
    errors.some((error) =>
      error.startsWith('Interpolation variable mismatch for equalSize:'),
    ),
  );
  assert.ok(
    !errors.some((error) =>
      error.startsWith('Interpolation variable mismatch for same:'),
    ),
  );
});

test('Given des catalogues racines incompatibles, When leurs structures sont comparées, Then la racine et les preuves ICU sont contrôlées', (t) => {
  const { root, catalogRoot } = fixture(t);
  for (const [fr, en, expected] of [
    [[], {}, 'Shape mismatch at <root>'],
    [{}, 'texte', 'Shape mismatch at <root>'],
    [null, {}, 'No keys found in source catalog fr.json'],
    [{}, {}, 'No keys found in source catalog fr.json'],
    [
      {
        shared: {
          prototype: { icuPluralPath: 'invalide', icuSelectPath: 'invalide' },
        },
      },
      proof,
      'Missing ICU plural proof',
    ],
  ]) {
    writeFileSync(path.join(catalogRoot, 'fr.json'), JSON.stringify(fr));
    writeFileSync(path.join(catalogRoot, 'en.json'), JSON.stringify(en));
    const { errors } = validateCatalogs(contract, root);
    assert.ok(
      errors.some((error) => error.startsWith(expected)),
      JSON.stringify(errors),
    );
    assert.ok(
      errors.some((error) => error.startsWith('Missing ICU select proof')),
    );
  }
});

test('Given un JSON invalide ou dupliqué, When il est inspecté, Then les erreurs et doublons sont signalés', (t) => {
  const { root, catalogRoot } = fixture(t);
  writeFileSync(path.join(catalogRoot, 'en.json'), '{"value":undefined}');
  assert.ok(
    validateCatalogs(contract, root).errors.some((error) =>
      error.startsWith('Invalid JSON in en.json:'),
    ),
  );
  writeFileSync(path.join(catalogRoot, 'en.json'), '{"value":1,"value":2}');
  assert.ok(
    validateCatalogs(contract, root).errors.includes(
      'Duplicate key in en.json: value',
    ),
  );
});

test('Given des objets imbriqués et des échappements JSON, When les doublons sont recherchés, Then leur chemin est exact', () => {
  assert.deepEqual(
    findDuplicateJsonKeys(
      ' \n{"a":[{},[],{"x":1,"x":2}],"a":true,"b":null,"c":false,"d":"a\\\\b\\u0041"} \n',
    ),
    ['a.2.x', 'a'],
  );
  assert.deepEqual(findDuplicateJsonKeys('{"\\u0061":1,"a":2}'), ['a']);
});

test('Given des JSON tronqués, When le parseur les lit, Then chaque erreur syntaxique est explicite', () => {
  for (const [source, expected] of [
    ['{}x', /Unexpected JSON token/],
    ['{"a":1,', /Unterminated JSON object/],
    ['[1,', /Unterminated JSON array/],
    ['"texte', /Unterminated JSON string/],
    ['{"a" 1}', /Expected :/],
    ['{a:1}', /Expected "/],
  ]) {
    assert.throws(() => findDuplicateJsonKeys(source), expected);
  }
});
