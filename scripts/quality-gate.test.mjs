import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { getQualityCommands, runQualityGate } from './quality-gate.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const metrics = ['statements', 'branches', 'functions', 'lines'];

test('Given les hooks locaux, When un commit ou un push est demandé, Then le contrôle complet est obligatoire même sans diff détecté', () => {
  for (const hook of ['pre-commit', 'pre-push', 'commit-msg']) {
    assert.doesNotMatch(read(`.husky/${hook}`), /exit 0/);
  }
  assert.match(read('.husky/pre-commit'), /pnpm check/);
  assert.match(read('scripts/husky-pre-push.mjs'), /run\('pnpm', \['check'\]/);
  assert.doesNotMatch(
    read('scripts/husky-pre-push.mjs'),
    /isDocsOnly|changedFiles\.length|affected:/,
  );
});

test('Given les configurations Vitest Angular, When lint-staged les transmet à ESLint, Then une configuration TypeScript explicite les prend en charge', () => {
  assert.match(
    read('apps/client/eslint.config.js'),
    /files: \['projects\/\*\/vitest\.config\.ts'\]/,
  );
});

test('Given les scripts et configurations racine, When c8 mesure la couverture, Then chaque fichier doit atteindre les quatre seuils de 100 %', () => {
  const config = JSON.parse(read('.c8rc.json'));
  assert.equal(config.all, true);
  assert.equal(config['check-coverage'], true);
  assert.equal(config['per-file'], true);
  for (const metric of metrics) {
    assert.equal(config[metric], 100);
  }
  assert.ok(config.include.includes('scripts/**/*.mjs'));
  assert.ok(config.include.includes('*.{js,cjs,mjs}'));
  assert.match(packageJson.scripts['test:workspace:coverage'], /^c8 /);
  assert.match(packageJson.scripts['test:coverage'], /--coverage/);
  assert.ok(
    getQualityCommands('--coverage').includes('test:workspace:coverage'),
  );
});

test('Given les applications et packages, When la couverture est calculée, Then les sources non importées et chaque fichier sont contrôlés à 100 %', () => {
  for (const file of [
    'apps/client/projects/web/vitest.config.ts',
    'apps/client/projects/mobile/vitest.config.ts',
    ...['contracts', 'domain', 'api-client', 'tokens'].map(
      (name) => `packages/${name}/vitest.config.ts`,
    ),
  ]) {
    const config = read(file);
    assert.match(config, /include:\s*\[\s*[^\n]*src.*\*\*\/\*\.ts/);
    assert.match(config, /perFile: true/);
    for (const metric of metrics) {
      assert.match(config, new RegExp(`${metric}: 100`));
    }
    assert.match(config, /json-summary/);
  }
  const jest = read('apps/api/jest.config.ts');
  assert.match(jest, /coverageThreshold/);
  assert.match(jest, /'\.\/\*\*\/\*\.ts'/);
  for (const metric of metrics) {
    assert.match(jest, new RegExp(`${metric}: 100`));
  }
});

test('Given le contrôle partagé, When il est lancé localement ou en CI, Then format lint types et couverture font partie du même contrat', () => {
  assert.equal(packageJson.scripts.check, 'node ./scripts/quality-gate.mjs');
  assert.equal(
    packageJson.scripts['check:full'],
    'node ./scripts/quality-gate.mjs --full',
  );
  const gate = read('scripts/quality-gate.mjs');
  for (const command of [
    'format:check',
    'lint:code',
    'typecheck',
    'test:coverage',
  ]) {
    assert.ok(gate.includes(`'${command}'`));
  }
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /name: Quality gate/);
  assert.match(ci, /run: pnpm check/);
  const sonar = read('.github/workflows/sonarcloud.yml');
  assert.match(sonar, /run: pnpm check/);
  assert.match(sonar, /actions\/upload-artifact@/);
  assert.match(sonar, /-Dsonar\.qualitygate\.wait=true/);
});

test('Given Sonar, When la couverture est publiée, Then aucun fichier métier ni script applicatif ne masque une lacune', () => {
  const config = read('sonar-project.properties');
  assert.match(config, /coverage\/lcov.info/);
  const exclusions = config
    .split('sonar.coverage.exclusions=')[1]
    .split('\n\n')[0];
  const nonPowerShellExclusions = exclusions.replace('scripts/**/*.ps1', '');
  assert.doesNotMatch(
    nonPowerShellExclusions,
    /apps\/api\/src\/|apps\/client\/projects\/|scripts\/\*\*/,
  );
  assert.ok(exclusions.includes('scripts/**/*.ps1'));
  assert.match(
    read('scripts/sonarcloud-scan.mjs'),
    /-Dsonar\.qualitygate\.wait=true/,
  );
});

test('Given le contrôle standard, When une étape échoue, Then le code de sortie bloque les étapes suivantes', () => {
  const calls = [];
  assert.equal(
    runQualityGate(undefined, (script) => {
      calls.push(script);
      return script === 'lint:code' ? 1 : 0;
    }),
    1,
  );
  assert.deepEqual(calls, ['format:check', 'lint:code']);
});

test('Given les quatre surfaces de couverture, When plusieurs seuils échouent, Then toutes les surfaces sont mesurées et le résultat reste en échec', () => {
  const calls = [];
  assert.equal(
    runQualityGate('--coverage', (script) => {
      calls.push(script);
      return 1;
    }),
    1,
  );
  assert.deepEqual(calls, [
    'test:workspace:coverage',
    'test:api:coverage',
    'test:client:coverage',
    'test:libs:coverage',
  ]);
});

test('Given des contrôles valides, When le mode complet est choisi, Then les builds E2E et Sonar suivent les contrôles hors ligne', () => {
  const calls = [];
  assert.equal(
    runQualityGate('--full', (script) => {
      calls.push(script);
      return 0;
    }),
    0,
  );
  assert.deepEqual(calls.slice(-3), ['build', 'test:e2e:all', 'sonar']);
  assert.deepEqual(calls.slice(0, -3), getQualityCommands());
});

test('Given une option inconnue, When le contrôle est préparé, Then une erreur explicite est remontée', () => {
  assert.throws(() => getQualityCommands('--skip'), /Option.*inconnue/);
});

test('Given la CLI et un exécuteur pnpm contrôlé, When une commande échoue, Then le processus renvoie un échec sans exécuter la suite', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'kraak-quality-'));
  const pnpmStub = path.join(directory, 'pnpm.cjs');
  const logPath = path.join(directory, 'commands.log');

  try {
    writeFileSync(
      pnpmStub,
      "require('node:fs').appendFileSync(process.env.QUALITY_TEST_LOG, process.argv[3] + '\\n'); process.exit(process.argv[3] === 'lint:code' ? 1 : 0);",
    );
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('scripts/quality-gate.mjs', root))],
      {
        env: {
          ...process.env,
          npm_execpath: pnpmStub,
          QUALITY_TEST_LOG: logPath,
        },
        encoding: 'utf8',
      },
    );

    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Contrôles en échec : lint:code/);
    assert.equal(readFileSync(logPath, 'utf8'), 'format:check\nlint:code\n');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Given plusieurs options CLI, When le contrôle démarre, Then il refuse la commande avant tout contrôle', () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('scripts/quality-gate.mjs', root)),
      '--full',
      '--coverage',
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Une seule option/);
});

test('Given les sources partagées du client, When la couverture web est configurée, Then Angular et Vitest incluent ces sources', () => {
  const angular = JSON.parse(read('apps/client/angular.json'));
  assert.ok(
    angular.projects.web.architect.test.options.coverageInclude.includes(
      'projects/shared/**/*.ts',
    ),
  );
  assert.match(
    read('apps/client/projects/web/vitest.config.ts'),
    /shared\/\*\*\/\*\.ts/,
  );
});
