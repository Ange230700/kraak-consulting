import { afterEach, describe, expect, it, vi } from 'vitest';

const runtimeGlobals = globalThis as typeof globalThis & {
  process: {
    env: Record<string, string | undefined>;
  };
};

const PROFILE_ENV_KEYS = [
  'KRAAK_DEFAULTS_PROFILE',
  'CLIENT_RUNTIME_ENV',
  'NODE_ENV',
] as const;

const originalProfileEnv = new Map(
  PROFILE_ENV_KEYS.map((key) => [key, runtimeGlobals.process.env[key]]),
);

function setProfileEnv(
  values: Partial<Record<(typeof PROFILE_ENV_KEYS)[number], string>>,
): void {
  for (const key of PROFILE_ENV_KEYS) {
    delete runtimeGlobals.process.env[key];
  }

  Object.assign(runtimeGlobals.process.env, values);
}

function restoreProfileEnv(): void {
  for (const key of PROFILE_ENV_KEYS) {
    const value = originalProfileEnv.get(key);

    if (value === undefined) {
      delete runtimeGlobals.process.env[key];
      continue;
    }

    runtimeGlobals.process.env[key] = value;
  }
}

async function loadClientDefaults() {
  vi.resetModules();
  return await import('./client-defaults');
}

describe('CLIENT_DEFAULTS', () => {
  afterEach(() => {
    restoreProfileEnv();
    vi.resetModules();
  });

  it('Given a dev defaults profile, when the module loads, then local defaults are selected', async () => {
    setProfileEnv({ KRAAK_DEFAULTS_PROFILE: ' dev ' });

    const { CLIENT_DEFAULTS } = await loadClientDefaults();

    expect(CLIENT_DEFAULTS.siteUrl).toBe('http://localhost:4200');
    expect(CLIENT_DEFAULTS.siteName).toBe('KRAAK');
  });

  it('Given a staging runtime profile fallback, when the module loads, then staging defaults are selected', async () => {
    setProfileEnv({
      KRAAK_DEFAULTS_PROFILE: ' ',
      CLIENT_RUNTIME_ENV: 'stage',
    });

    const { CLIENT_DEFAULTS } = await loadClientDefaults();

    expect(CLIENT_DEFAULTS.siteUrl).toBe(
      'https://kraak-web-staging.onrender.com',
    );
  });

  it('Given no defaults profile, when the module loads, then production defaults are selected', async () => {
    setProfileEnv({});

    const { CLIENT_DEFAULTS } = await loadClientDefaults();

    expect(CLIENT_DEFAULTS.siteUrl).toBe('https://kraak-web-prod.onrender.com');
  });
});
