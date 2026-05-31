import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  acquireScanLock,
  createSonarScanCommand,
  normalizeLcovContent,
  readLocalSonarEnvironment,
  releaseScanLock,
  resolveTaskkillExecutablePath,
  resolveStrictDiagnosticOptions,
  resetScannerReportDirectory,
  resolveSonarEnvironment,
} from './sonarcloud-scan.mjs';

test('Given Windows, When the scan command is built, Then pnpm.cmd runs sonar-scanner explicitly', () => {
  const command = createSonarScanCommand('win32');

  assert.equal(command.command, 'pnpm.cmd');
  assert.deepEqual(command.args, ['--package=@sonar/scan', 'dlx', 'sonar-scanner']);
});

test('Given a local env file, When Sonar variables are read, Then token and host url are loaded', () => {
  const tempDirectory = mkdtempSync(path.join(os.tmpdir(), 'kraak-sonar-'));
  const tempEnvPath = path.join(tempDirectory, '.env.local');

  writeFileSync(
    tempEnvPath,
    ['# comment', 'SONAR_TOKEN="abc123"', 'SONAR_HOST_URL=https://sonarcloud.io'].join('\n'),
  );

  const environment = readLocalSonarEnvironment(tempEnvPath);

  assert.deepEqual(environment, {
    SONAR_TOKEN: 'abc123',
    SONAR_HOST_URL: 'https://sonarcloud.io',
  });
});

test('Given process env values, When the Sonar environment is resolved, Then local defaults stay as fallback only', () => {
  const environment = resolveSonarEnvironment(
    {
      SONAR_TOKEN: 'token-from-shell',
      CUSTOM_FLAG: 'enabled',
    },
    path.join(os.tmpdir(), 'missing-sonar-env-file'),
  );

  assert.equal(environment.SONAR_TOKEN, 'token-from-shell');
  assert.equal(environment.SONAR_HOST_URL, 'https://sonarcloud.io');
  assert.equal(environment.CUSTOM_FLAG, 'enabled');
});

test('Given strict diagnostic env flag, When options are resolved, Then strict mode is enabled and custom log path is used', () => {
  const options = resolveStrictDiagnosticOptions({
    SONAR_STRICT_DIAGNOSTIC: 'true',
    SONAR_STRICT_DIAGNOSTIC_LOG: 'logs/sonar-strict.log',
  });

  assert.equal(options.enabled, true);
  assert.equal(options.logPath, 'logs/sonar-strict.log');
});

test('Given no strict diagnostic env flag, When options are resolved, Then strict mode is disabled', () => {
  const options = resolveStrictDiagnosticOptions({});

  assert.equal(options.enabled, false);
  assert.match(options.logPath, /\.scannerwork[\\/]sonar-strict-diagnostic\.log$/);
});

test('Given a trusted SystemRoot, When resolving taskkill path, Then an explicit System32 executable path is returned', () => {
  const tempDirectory = mkdtempSync(path.join(os.tmpdir(), 'kraak-systemroot-'));
  const fakeSystemRoot = path.join(tempDirectory, 'Windows');
  const fakeSystem32 = path.join(fakeSystemRoot, 'System32');
  const fakeTaskkill = path.join(fakeSystem32, 'taskkill.exe');

  try {
    mkdirSync(fakeSystem32, { recursive: true });
    writeFileSync(fakeTaskkill, 'fake-taskkill');

    const taskkillPath = resolveTaskkillExecutablePath({
      SystemRoot: fakeSystemRoot,
    });

    assert.equal(taskkillPath, path.win32.join(fakeSystemRoot, 'System32', 'taskkill.exe'));
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test('Given missing SystemRoot and WINDIR, When resolving taskkill path, Then an explicit error is thrown', () => {
  assert.throws(
    () => resolveTaskkillExecutablePath({}),
    /SystemRoot\/WINDIR manquant/,
  );
});

test('Given a Windows-style LCOV report, When content is normalized, Then SF paths become repo-relative POSIX paths', () => {
  const rawContent = [
    'TN:',
    String.raw`SF:src\auth\auth.service.ts`,
    'DA:1,1',
    'end_of_record',
  ].join('\n');

  const normalizedContent = normalizeLcovContent(rawContent, 'apps/api');

  assert.match(normalizedContent, /SF:apps\/api\/src\/auth\/auth\.service\.ts/);
});

test('Given an already prefixed SF path, When content is normalized, Then source path is not duplicated', () => {
  const rawContent = ['TN:', 'SF:apps/client/projects/web/src/ssr-path.ts', 'DA:1,1', 'end_of_record'].join('\n');

  const normalizedContent = normalizeLcovContent(rawContent, 'apps/client');

  assert.match(normalizedContent, /SF:apps\/client\/projects\/web\/src\/ssr-path\.ts/);
  assert.doesNotMatch(
    normalizedContent,
    /SF:apps\/client\/apps\/client\/projects\/web\/src\/ssr-path\.ts/,
  );
});

test('Given stale scanner-report artifacts, When report directory is reset, Then scanner-report is recreated cleanly', () => {
  const scannerReportPath = path.join(process.cwd(), '.scannerwork', 'scanner-report');
  const staleFilePath = path.join(scannerReportPath, 'stale.pb');

  mkdirSync(scannerReportPath, { recursive: true });
  writeFileSync(staleFilePath, 'stale-data');
  resetScannerReportDirectory();

  assert.equal(existsSync(scannerReportPath), true);
  assert.equal(existsSync(staleFilePath), false);
});

test('Given an active lock, When another scan starts, Then the second lock acquisition is rejected', () => {
  const tempDirectory = mkdtempSync(path.join(os.tmpdir(), 'kraak-sonar-lock-'));
  const lockPath = path.join(tempDirectory, '.scannerwork', 'sonarcloud-scan.lock');

  try {
    const firstLock = acquireScanLock(lockPath, process.pid);
    const secondLock = acquireScanLock(lockPath, process.pid);

    assert.equal(firstLock.acquired, true);
    assert.equal(secondLock.acquired, false);
    assert.equal(secondLock.lockPid, process.pid);
  } finally {
    releaseScanLock(lockPath);
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test('Given a stale lock file, When a new scan starts, Then lock is reclaimed', () => {
  const tempDirectory = mkdtempSync(path.join(os.tmpdir(), 'kraak-sonar-stale-lock-'));
  const lockPath = path.join(tempDirectory, '.scannerwork', 'sonarcloud-scan.lock');

  try {
    mkdirSync(path.dirname(lockPath), { recursive: true });
    writeFileSync(lockPath, '-1\n');

    const lock = acquireScanLock(lockPath, process.pid);

    assert.equal(lock.acquired, true);
  } finally {
    releaseScanLock(lockPath);
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});
