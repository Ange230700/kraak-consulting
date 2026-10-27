import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Configuration mobile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('Given une configuration déployée, When chaque environnement est chargé, Then les services runtime sont conservés', async () => {
    const { environment: production } =
      await import('./environment.production');
    expect(production.production).toBe(true);
    expect(production.environmentName).toBe('production');
    expect((await import('./environment')).environment.production).toBe(false);
  });

  it('Given des variables locales explicites sans origine navigateur, When la configuration est chargée, Then les valeurs normalisées sont utilisées', async () => {
    vi.stubGlobal('location', undefined);
    vi.stubEnv('CLIENT_MOBILE_SITE_URL', ' https://mobile.example.test ');
    vi.stubEnv('CLIENT_API_BASE_URL', ' https://api.example.test ');
    vi.stubEnv('SUPABASE_URL', ' https://data.example.test ');
    vi.stubEnv('CLIENT_SUPABASE_PUBLISHABLE_KEY', ' public-key ');
    vi.resetModules();
    const { environment } = await import('./environment.local');
    expect(environment.siteUrl).toBe('https://mobile.example.test');
    expect(environment.apiBaseUrl).toBe('https://api.example.test');
    expect(environment.supabaseUrl).toBe('https://data.example.test');
    expect(environment.supabasePublishableKey).toBe('public-key');
  });
});
