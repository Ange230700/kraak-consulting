import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseService', () => {
  const mockClient = { from: jest.fn() };

  afterEach(() => {
    jest.clearAllMocks();
  });

  async function buildService(
    configOverrides: Record<string, string | undefined>,
  ): Promise<SupabaseService> {
    const mockConfigService = {
      get: jest.fn((key: string) => configOverrides[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    return module.get<SupabaseService>(SupabaseService);
  }

  it('devrait être défini', async () => {
    const service = await buildService({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'service-role-key',
    });
    expect(service).toBeDefined();
  });

  // Given les variables Supabase sont disponibles
  // When le module initialise le service
  // Then un client partagé est créé avec ces valeurs
  it('Given la configuration Supabase, When onModuleInit est appelé, Then le client partagé est créé', async () => {
    jest.mocked(createClient).mockReturnValue(mockClient as never);

    const service = await buildService({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'service-role-key',
    });

    service.onModuleInit();

    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key',
    );
    expect(service.enabled).toBe(true);
    expect(service.getClient()).toBe(mockClient);
  });

  // Given les variables Supabase sont absentes
  // When le module initialise le service
  // Then le service démarre sans erreur et reste désactivé
  it('Given la configuration Supabase manquante, When onModuleInit est appelé, Then le service démarre en mode dégradé', async () => {
    const service = await buildService({
      SUPABASE_URL: undefined,
      SUPABASE_SECRET_KEY: undefined,
    });

    expect(() => service.onModuleInit()).not.toThrow();
    expect(service.enabled).toBe(false);
  });

  // Given le client Supabase n'est pas initialisé
  // When getClient est appelé
  // Then une erreur explicite est levée
  it('Given Supabase désactivé, When getClient est appelé, Then une erreur explicite est levée', async () => {
    const service = await buildService({
      SUPABASE_URL: undefined,
      SUPABASE_SECRET_KEY: undefined,
    });
    service.onModuleInit();

    expect(() => service.getClient()).toThrow(/client Supabase/);
  });

  // Given une clé publishable Supabase est disponible
  // When createAuthClient est appelé
  // Then un client auth éphémère sans persistance locale est créé
  it('Given une clé publishable disponible, When createAuthClient est appelé, Then un client auth éphémère est créé', async () => {
    jest.mocked(createClient).mockReturnValue(mockClient as never);

    const service = await buildService({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'service-role-key',
      SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(service.createAuthClient()).toBe(mockClient);
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'publishable-key',
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  });

  // Given la clé publishable est absente mais la clé secret existe
  // When createAuthClient est appelé
  // Then le fallback sur SUPABASE_SECRET_KEY est utilisé
  it('Given la clé publishable absente, When createAuthClient est appelé, Then la clé secret est utilisée en fallback', async () => {
    jest.mocked(createClient).mockReturnValue(mockClient as never);

    const service = await buildService({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'service-role-key',
      SUPABASE_PUBLISHABLE_KEY: undefined,
    });

    expect(service.createAuthClient()).toBe(mockClient);
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key',
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  });

  // Given SUPABASE_ANON_KEY est fourni à la place de SUPABASE_PUBLISHABLE_KEY
  // When createAuthClient est appelé
  // Then la clé anon legacy est acceptée
  it('Given la clé anon legacy, When createAuthClient est appelé, Then SUPABASE_ANON_KEY est utilisé', async () => {
    jest.mocked(createClient).mockReturnValue(mockClient as never);

    const service = await buildService({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'service-role-key',
      SUPABASE_PUBLISHABLE_KEY: undefined,
      SUPABASE_ANON_KEY: 'legacy-anon-key',
    });

    expect(service.createAuthClient()).toBe(mockClient);
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'legacy-anon-key',
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  });

  // Given SUPABASE_SERVICE_ROLE_KEY est fourni à la place de SUPABASE_SECRET_KEY
  // When createAuthClient est appelé sans clé publishable
  // Then la clé service-role legacy est utilisée en fallback
  it('Given la clé service-role legacy, When createAuthClient est appelé, Then SUPABASE_SERVICE_ROLE_KEY est utilisé', async () => {
    jest.mocked(createClient).mockReturnValue(mockClient as never);

    const service = await buildService({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: undefined,
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role-key',
      SUPABASE_PUBLISHABLE_KEY: undefined,
    });

    expect(service.createAuthClient()).toBe(mockClient);
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'legacy-service-role-key',
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  });

  // Given aucune clé auth Supabase n'est disponible
  // When createAuthClient est appelé
  // Then une erreur explicite est levée
  it('Given aucune clé auth n’est disponible, When createAuthClient est appelé, Then une erreur explicite est levée', async () => {
    const service = await buildService({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: undefined,
      SUPABASE_PUBLISHABLE_KEY: undefined,
    });

    expect(() => service.createAuthClient()).toThrow(/client Auth Supabase/);
  });
});
