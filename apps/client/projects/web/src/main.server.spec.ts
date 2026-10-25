import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bootstrapApplication,
  type BootstrapContext,
} from '@angular/platform-browser';

vi.mock('@angular/platform-browser', async (original) => ({
  ...(await original<typeof import('@angular/platform-browser')>()),
  bootstrapApplication: vi.fn().mockResolvedValue({}),
}));

describe('Démarrage SSR', { timeout: 60_000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('Given un runtime navigateur déjà configuré, When le serveur démarre, Then sa configuration n’est pas écrasée et le contexte est transmis', async () => {
    const runtime = { apiBaseUrl: 'https://api.example.test' };
    vi.stubGlobal('__KRAAK_RUNTIME_CONFIG__', runtime);
    const { default: bootstrap } = await import('./main.server');
    const context = {} as BootstrapContext;
    await bootstrap(context);
    expect(globalThis.__KRAAK_RUNTIME_CONFIG__).toBe(runtime);
    expect(bootstrapApplication).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ providers: expect.any(Array) }),
      context,
    );
  });

  it('Given des variables serveur complètes, When le runtime est hydraté, Then les valeurs sont normalisées et le drapeau désactivé est respecté', async () => {
    vi.stubGlobal('__KRAAK_RUNTIME_CONFIG__', undefined);
    vi.stubEnv('CLIENT_FEATURE_PARTICIPANT_AREA', ' false ');
    vi.stubEnv('CLIENT_API_BASE_URL', ' https://api.example.test ');
    vi.stubEnv('CLIENT_SITE_URL', ' https://web.example.test ');
    vi.stubEnv('CLIENT_SUPABASE_URL', ' ');
    vi.stubEnv('SUPABASE_URL', ' https://data.example.test ');
    vi.stubEnv('CLIENT_SUPABASE_PUBLISHABLE_KEY', ' public-key ');
    vi.resetModules();
    await import('./main.server');
    expect(globalThis.__KRAAK_RUNTIME_CONFIG__).toEqual({
      enableParticipantArea: false,
      apiBaseUrl: 'https://api.example.test',
      siteUrl: 'https://web.example.test',
      supabaseUrl: 'https://data.example.test',
      supabasePublishableKey: 'public-key',
    });
    expect(Object.isFrozen(globalThis.__KRAAK_RUNTIME_CONFIG__)).toBe(true);
  });

  it('Given aucune variable serveur, When le runtime est hydraté, Then le drapeau actif par défaut et les valeurs absentes sont conservés', async () => {
    vi.stubGlobal('__KRAAK_RUNTIME_CONFIG__', undefined);
    for (const key of [
      'CLIENT_FEATURE_PARTICIPANT_AREA',
      'CLIENT_API_BASE_URL',
      'CLIENT_SITE_URL',
      'CLIENT_SUPABASE_URL',
      'SUPABASE_URL',
      'CLIENT_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
    ]) {
      vi.stubEnv(key, undefined);
    }
    vi.resetModules();
    await import('./main.server');
    expect(globalThis.__KRAAK_RUNTIME_CONFIG__).toEqual({
      enableParticipantArea: true,
      apiBaseUrl: undefined,
      siteUrl: undefined,
      supabaseUrl: undefined,
      supabasePublishableKey: undefined,
    });
  });
});
