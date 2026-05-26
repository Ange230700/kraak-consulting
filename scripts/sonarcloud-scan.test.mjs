import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  createSonarScanCommand,
  readLocalSonarEnvironment,
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
