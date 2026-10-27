import { afterEach, describe, expect, it } from 'vitest';

import { resolveRuntimeClientConfig } from '../../../../../shared/runtime-client-config';

const runtimeGlobals = globalThis as typeof globalThis & {
  process: {
    env: Record<string, string | undefined>;
  };
};

const RUNTIME_ENV_KEYS = [
  'CLIENT_API_BASE_URL',
  'PUBLIC_SITE_URL',
  'CLIENT_SITE_URL',
] as const;

const originalRuntimeConfig = globalThis.__KRAAK_RUNTIME_CONFIG__;
const originalRuntimeEnv = new Map(
  RUNTIME_ENV_KEYS.map((key) => [key, runtimeGlobals.process.env[key]]),
);

function setRuntimeEnv(
  values: Partial<Record<(typeof RUNTIME_ENV_KEYS)[number], string>>,
): void {
  for (const key of RUNTIME_ENV_KEYS) {
    delete runtimeGlobals.process.env[key];
  }

  Object.assign(runtimeGlobals.process.env, values);
}

function restoreRuntimeEnv(): void {
  for (const key of RUNTIME_ENV_KEYS) {
    const value = originalRuntimeEnv.get(key);

    if (value === undefined) {
      delete runtimeGlobals.process.env[key];
      continue;
    }

    runtimeGlobals.process.env[key] = value;
  }
}

describe('resolveRuntimeClientConfig', () => {
  afterEach(() => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = originalRuntimeConfig;
    restoreRuntimeEnv();
  });

  it('Given runtime config and environment values, when config is resolved, then runtime values keep priority', () => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = {
      apiBaseUrl: ' https://runtime-api.kraak.example ',
    };
    setRuntimeEnv({
      CLIENT_API_BASE_URL: 'https://env-api.kraak.example',
    });

    const config = resolveRuntimeClientConfig();

    expect(config.apiBaseUrl).toBe('https://runtime-api.kraak.example');
  });

  it('Given environment values and blank runtime values, when config is resolved, then trimmed environment fallbacks are used', () => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = {
      apiBaseUrl: ' ',
      siteUrl: ' ',
    };
    setRuntimeEnv({
      CLIENT_API_BASE_URL: ' https://env-api.kraak.example ',
      PUBLIC_SITE_URL: ' ',
      CLIENT_SITE_URL: ' https://env-site.kraak.example ',
    });

    const config = resolveRuntimeClientConfig();

    expect(config.apiBaseUrl).toBe('https://env-api.kraak.example');
    expect(config.siteUrl).toBe('https://env-site.kraak.example');
  });
});
