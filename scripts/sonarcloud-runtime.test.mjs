import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs, {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  abortScannerProcess,
  acquireScanLock,
  assertLcovReports,
  createDiagnosticLogger,
  createScannerReportMonitor,
  createSonarScanCommand,
  isProcessAlive,
  main,
  normalizeLcovContent,
  normalizeLcovReports,
  readLocalSonarEnvironment,
  releaseScanLock,
  resolveSonarEnvironment,
  resolveStrictDiagnosticOptions,
  resolveTaskkillExecutablePath,
  runSonarScan,
  spawnSonarCommand,
} from './sonarcloud-scan.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-sonar-runtime-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('Given un fichier local incomplet, When les options sont résolues, Then commentaires et entrées invalides ne changent pas les valeurs', (t) => {
  const root = fixture(t);
  const envPath = path.join(root, '.env');
  writeFileSync(
    envPath,
    "\n# commentaire\ninvalide\n=invalide\n SONAR_TOKEN = 'local' \nHOST='exemple'\nSONAR_HOST_URL=\"https://exemple.test/\"\n",
  );
  assert.equal(readLocalSonarEnvironment(envPath).HOST, 'exemple');
  assert.equal(readLocalSonarEnvironment(envPath).SONAR_TOKEN, " 'local'");
  assert.equal(
    resolveSonarEnvironment({}, envPath).SONAR_HOST_URL,
    'https://exemple.test/',
  );
  writeFileSync(envPath, 'SONAR_TOKEN=local\nSONAR_HOST_URL=\n');
  assert.equal(
    resolveSonarEnvironment(
      { SONAR_TOKEN: 'shell', SONAR_HOST_URL: 'https://shell.test' },
      envPath,
    ).SONAR_TOKEN,
    'local',
  );
  assert.equal(
    resolveSonarEnvironment({ SONAR_HOST_URL: 'https://shell.test' }, envPath)
      .SONAR_HOST_URL,
    'https://shell.test',
  );
  assert.deepEqual(readLocalSonarEnvironment(path.join(root, 'absent')), {});
  assert.equal(
    resolveSonarEnvironment({}, path.join(root, 'absent')).SONAR_TOKEN,
    '',
  );
  assert.ok(resolveSonarEnvironment().SONAR_HOST_URL);
  assert.deepEqual(readLocalSonarEnvironment(), readLocalSonarEnvironment());
  assert.equal(createSonarScanCommand('linux').command, 'pnpm');
  for (const value of ['1', 'true', 'yes', 'on']) {
    assert.equal(
      resolveStrictDiagnosticOptions({
        SONAR_STRICT_DIAGNOSTIC: ` ${value.toUpperCase()} `,
      }).enabled,
      true,
    );
  }
  assert.equal(
    resolveStrictDiagnosticOptions({ SONAR_STRICT_DIAGNOSTIC: 'false' })
      .enabled,
    false,
  );
  assert.equal(typeof resolveStrictDiagnosticOptions().enabled, 'boolean');
});

test('Given un rapport LCOV invalide, When les références sont normalisées, Then seuls les numéros hors source sont retirés', (t) => {
  const root = fixture(t);
  mkdirSync(path.join(root, 'coverage'));
  writeFileSync(path.join(root, 'source.ts'), 'ligne 1\nligne 2\n');
  writeFileSync(path.join(root, 'other.ts'), 'ligne sans retour');
  writeFileSync(path.join(root, 'empty.ts'), '');
  const report = path.join(root, 'coverage', 'lcov.info');
  writeFileSync(
    report,
    [
      'DA:100,0',
      'SF:./source.ts',
      'DA:1,1',
      'DA:2,1',
      'DA:0,0',
      'DA:3,0',
      'BRDA:4,0,0,0',
      'DA:invalide,0',
      'SF:other.ts',
      'DA:1,1',
      'DA:2,0',
      'SF:empty.ts',
      'DA:1,0',
      'SF:absent.ts',
      'DA:500,0',
      'DA:501,0',
      'end_of_record',
    ].join('\n'),
  );
  writeFileSync(path.join(root, 'ignored.info'), 'inconnu');
  normalizeLcovReports(
    ['absent.info', 'ignored.info', 'coverage/lcov.info'],
    root,
  );
  const normalized = readFileSync(report, 'utf8');
  assert.match(
    normalized,
    /^DA:100,0\nSF:source.ts\nDA:1,1\nDA:2,1\nDA:invalide,0/m,
  );
  assert.doesNotMatch(
    normalized,
    /BRDA:4|DA:0,|DA:3,|SF:other.ts\nDA:1,1\nDA:2,/,
  );
  assert.match(normalized, /DA:500,0\nDA:501,0/);
  normalizeLcovReports(['coverage/lcov.info'], root);
  assert.equal(readFileSync(report, 'utf8'), normalized);
  normalizeLcovReports([], root);
  normalizeLcovReports(undefined, root);
  assert.match(
    normalizeLcovContent('SF:./x//y.ts', 'apps/api///'),
    /SF:apps\/api\/x\/y.ts/,
  );
  assert.match(
    normalizeLcovContent(`SF:${path.resolve('source.ts')}`, ''),
    /SF:source.ts/,
  );
  assert.ok(
    normalizeLcovContent(`SF:${os.tmpdir()}`, 'prefix').includes('prefix/'),
  );
});

test('Given les verrous invalides ou obsolètes, When une acquisition échoue, Then la concurrence reste protégée', (t) => {
  const root = fixture(t);
  const lock = path.join(root, 'scan.lock');
  assert.equal(isProcessAlive(0), false);
  assert.equal(isProcessAlive(1.5), false);
  assert.equal(isProcessAlive(process.pid), true);
  assert.equal(isProcessAlive(2_147_483_647), false);
  writeFileSync(lock, '2147483647');
  assert.equal(acquireScanLock(lock).acquired, true);
  releaseScanLock(lock);
  writeFileSync(lock, 'invalide');
  assert.deepEqual(acquireScanLock(lock), { acquired: false, lockPid: null });
  releaseScanLock(lock);
  t.after(() => {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
  const absent = t.mock.method(fs, 'existsSync', () => false);
  syncBuiltinESMExports();
  assert.throws(() => assertLcovReports(), /absent ou vide/);
  absent.mock.restore();
  syncBuiltinESMExports();
  for (const thrown of [null, 'erreur', {}, { code: 'EACCES' }]) {
    const mock = t.mock.method(fs, 'writeFileSync', () => {
      throw thrown;
    });
    syncBuiltinESMExports();
    assert.throws(
      () => acquireScanLock(lock),
      (error) => error === thrown,
    );
    mock.mock.restore();
    syncBuiltinESMExports();
  }
});

test('Given les commandes multiplateformes, When le scanner est lancé, Then les arguments sont transmis sans ambiguïté', () => {
  const calls = [];
  const spawnImpl = (...args) => {
    calls.push(args);
    return 'child';
  };
  const command = {
    command: 'pnpm',
    args: [
      '',
      'simple',
      'avec espace',
      'avec\ttab',
      'guillemet"fin',
      'a\\"b',
      'c:\\fin\\ ',
    ],
  };
  assert.equal(
    spawnSonarCommand(command, {}, { platform: 'linux', spawnImpl }),
    'child',
  );
  assert.deepEqual(calls[0].slice(0, 2), ['pnpm', command.args]);
  spawnSonarCommand(
    command,
    {},
    { platform: 'win32', spawnImpl, baseEnvironment: {} },
  );
  assert.equal(calls[1][0], 'cmd.exe');
  assert.equal(calls[1][2].windowsVerbatimArguments, true);
  assert.match(calls[1][1][3], /"" simple "avec espace"/);
  spawnSonarCommand(
    command,
    {},
    {
      platform: 'win32',
      spawnImpl,
      baseEnvironment: { ComSpec: 'trusted.exe' },
    },
  );
  assert.equal(calls[2][0], 'trusted.exe');
});

test('Given un scanner à interrompre, When le PID ou taskkill varie, Then chaque résultat est diagnostiqué', (t) => {
  const events = [];
  const logger = { log: (...args) => events.push(args) };
  const child = {
    pid: 123,
    kill: (signal) => {
      assert.equal(signal, 'SIGKILL');
      return true;
    },
  };
  abortScannerProcess({}, logger);
  abortScannerProcess(child, logger, { platform: 'linux' });
  for (const status of [0, null]) {
    abortScannerProcess(child, logger, {
      platform: 'win32',
      resolveTaskkill: () => 'trusted.exe',
      spawnSyncImpl: (command, args) => {
        assert.equal(command, 'trusted.exe');
        assert.deepEqual(args, ['/PID', '123', '/T', '/F']);
        return { status };
      },
    });
  }
  for (const error of [new Error('échec'), 'échec']) {
    abortScannerProcess(child, logger, {
      platform: 'win32',
      resolveTaskkill: () => {
        throw error;
      },
    });
  }
  assert.ok(events.some(([name]) => name === 'ABORT_FALLBACK_SIGKILL'));
  const root = fixture(t);
  mkdirSync(path.join(root, 'System32'));
  writeFileSync(path.join(root, 'System32', 'taskkill.exe'), '');
  assert.ok(
    resolveTaskkillExecutablePath({ WINDIR: root }).endsWith('taskkill.exe'),
  );
  assert.throws(
    () => resolveTaskkillExecutablePath({ SystemRoot: root + '-absent' }),
    /introuvable/,
  );
  assert.ok(resolveTaskkillExecutablePath().endsWith('taskkill.exe'));
});

test('Given un diagnostic strict, When le répertoire disparaît durablement, Then le scanner est interrompu une seule fois', (t) => {
  const root = fixture(t);
  const directory = path.join(root, 'report');
  const logger = createDiagnosticLogger({
    enabled: true,
    logPath: path.join(root, 'logs', 'scan.log'),
  });
  const disabled = createDiagnosticLogger({ enabled: false });
  disabled.log('ignored', '');
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  let aborted = 0;
  const monitor = createScannerReportMonitor(
    { enabled: true },
    logger,
    {},
    {
      directory,
      abort: () => {
        aborted += 1;
      },
    },
  );
  t.mock.timers.tick(250);
  assert.equal(monitor.shouldAbort(), false);
  mkdirSync(directory);
  t.mock.timers.tick(500);
  rmSync(directory, { recursive: true });
  t.mock.timers.tick(250);
  t.mock.timers.tick(1000);
  assert.equal(monitor.shouldAbort(), false);
  mkdirSync(directory);
  t.mock.timers.tick(250);
  rmSync(directory, { recursive: true });
  for (let i = 0; i < 10; i += 1) t.mock.timers.tick(250);
  assert.equal(monitor.shouldAbort(), true);
  assert.equal(aborted, 1);
  monitor.stop();
  assert.match(
    readFileSync(path.join(root, 'logs', 'scan.log'), 'utf8'),
    /SCANNER_REPORT_PRESENT/,
  );
  assert.match(
    readFileSync(path.join(root, 'logs', 'scan.log'), 'utf8'),
    /SCANNER_REPORT_MISSING/,
  );
  const noop = createScannerReportMonitor({ enabled: false }, disabled, {});
  assert.equal(noop.shouldAbort(), false);
  noop.stop();
  const defaults = createScannerReportMonitor({ enabled: true }, logger, {});
  t.mock.timers.tick(250);
  defaults.stop();
});

test('Given les événements du processus scanner, When il se ferme ou échoue, Then la promesse se termine exactement une fois', async (t) => {
  const root = fixture(t);
  for (const scenario of ['ok', 'signal', 'error']) {
    const child = new EventEmitter();
    if (scenario === 'ok') child.pid = 123;
    let stopped = 0;
    const promise = runSonarScan(
      {},
      {},
      { enabled: true, logPath: path.join(root, `${scenario}.log`) },
      {
        spawnImpl: () => child,
        monitorFactory: () => ({
          stop: () => {
            stopped += 1;
          },
          shouldAbort: () => scenario === 'signal',
        }),
      },
    );
    if (scenario === 'error') child.emit('error', new Error('refus'));
    child.emit(
      'close',
      scenario === 'ok' ? 0 : null,
      scenario === 'signal' ? 'SIGTERM' : undefined,
    );
    assert.equal(await promise, scenario === 'ok' ? 0 : 1);
    assert.equal(stopped, 1);
  }
  const command = {
    command: process.execPath,
    args: ['-e', 'process.exit(0); '],
  };
  assert.equal(await runSonarScan(command, process.env, { enabled: false }), 0);
});

test('Given la préparation du scan, When des rapports ou un verrou manquent, Then le verrou est conservé jusqu’à la fin et libéré sur erreur', async (t) => {
  const root = fixture(t);
  const lockPath = path.join(root, 'lock');
  const reportDirectory = path.join(root, 'report');
  const options = {
    environment: { SONAR_TOKEN: 'fixture-token' },
    lockPath,
    reportDirectory,
    reportPaths: [],
  };
  assert.equal(await main({ ...options, environment: {} }), 1);
  acquireScanLock(lockPath);
  assert.equal(await main(options), 1);
  releaseScanLock(lockPath);
  writeFileSync(lockPath, 'invalide');
  assert.equal(await main(options), 1);
  releaseScanLock(lockPath);
  await assert.rejects(
    main({ ...options, reportPaths: [path.join(root, 'absent')] }),
    /absent ou vide/,
  );
  assert.equal(existsSync(lockPath), false);
  assert.equal(
    await main({
      ...options,
      scan: async () => {
        assert.ok(existsSync(lockPath));
        await Promise.resolve();
        assert.ok(existsSync(lockPath));
        assert.ok(existsSync(reportDirectory));
        return 0;
      },
    }),
    0,
  );
  assert.equal(existsSync(lockPath), false);
  await assert.rejects(
    main({
      ...options,
      scan: async () => {
        throw new Error('scanner refusé');
      },
    }),
    /scanner refusé/,
  );
  assert.equal(existsSync(lockPath), false);
  const script = fileURLToPath(new URL('sonarcloud-scan.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script], {
    env: { ...process.env, SONAR_TOKEN: '' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /SONAR_TOKEN manquant/);
  const imported = spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    `await import(${JSON.stringify(new URL('sonarcloud-scan.mjs', import.meta.url).href)})`,
  ]);
  assert.equal(imported.status, 0);
});
