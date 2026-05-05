import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthService } from './auth.service';

function createSingleRowQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

describe('AuthService', () => {
  let service: AuthService;

  const authClient = {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getUser: jest.fn(),
    },
  };

  const adminClient = {
    from: jest.fn(),
  };

  const supabaseService = {
    createAuthClient: jest.fn(() => authClient),
    getClient: jest.fn(() => adminClient),
  };

  function mockProfile(params?: {
    appUser?: Record<string, unknown> | null;
    participant?: Record<string, unknown> | null;
  }) {
    const appUserQuery = createSingleRowQuery({
      data:
        params?.appUser ??
        ({
          id: 'user-1',
          email: 'alice@example.com',
          role: 'participant',
          first_name: 'Alice',
          last_name: 'Dupont',
          phone: null,
          preferred_contact_channel: null,
          is_active: true,
          created_at: '2026-04-14T12:00:00.000Z',
          updated_at: '2026-04-14T12:00:00.000Z',
        } satisfies Record<string, unknown>),
      error: null,
    });

    const participantQuery = createSingleRowQuery({
      data: params?.participant ?? null,
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return appUserQuery;
      }

      if (tableName === 'participant') {
        return participantQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProfile();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: supabaseService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  // Given un sign-in Supabase réussi
  // When signIn est appelé
  // Then la session et le profil normalisés sont renvoyés
  it('Given un sign-in Supabase réussi, When signIn est appelé, Then la session et le profil normalisés sont renvoyés', async () => {
    authClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          expires_at: 1_776_172_800,
          token_type: 'bearer',
        },
      },
      error: null,
    });

    await expect(
      service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      }),
    ).resolves.toEqual({
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        expiresAt: '2026-04-14T13:20:00.000Z',
        tokenType: 'bearer',
      },
      profile: {
        appUser: {
          id: 'user-1',
          email: 'alice@example.com',
          role: 'participant',
          firstName: 'Alice',
          lastName: 'Dupont',
          phone: null,
          preferredContactChannel: null,
          isActive: true,
          createdAt: '2026-04-14T12:00:00.000Z',
          updatedAt: '2026-04-14T12:00:00.000Z',
        },
        participant: null,
      },
    });
  });

  // Given un sign-in Supabase rejeté
  // When signIn est appelé
  // Then une erreur d'authentification explicite est renvoyée
  it('Given un sign-in rejeté, When signIn est appelé, Then une UnauthorizedException explicite est renvoyée', async () => {
    authClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  // Given un signup avec confirmation email
  // When signUp est appelé
  // Then la réponse indique qu'une confirmation reste attendue
  it("Given un signup avec confirmation email, When signUp est appelé, Then la réponse indique qu'une confirmation reste attendue", async () => {
    authClient.auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: null,
      },
      error: null,
    });

    await expect(
      service.signUp({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
        firstName: 'Alice',
        lastName: 'Dupont',
        phone: null,
        preferredContactChannel: null,
        redirectTo: 'kraak://auth/callback',
      }),
    ).resolves.toEqual({
      message:
        'Votre compte a été créé. Vérifiez votre email pour confirmer votre accès.',
      requiresEmailConfirmation: true,
      session: null,
      profile: {
        appUser: {
          id: 'user-1',
          email: 'alice@example.com',
          role: 'participant',
          firstName: 'Alice',
          lastName: 'Dupont',
          phone: null,
          preferredContactChannel: null,
          isActive: true,
          createdAt: '2026-04-14T12:00:00.000Z',
          updatedAt: '2026-04-14T12:00:00.000Z',
        },
        participant: null,
      },
    });
  });

  // Given une session expirée avec refresh token
  // When refreshSession est appelé
  // Then un nouveau bundle de session est renvoyé
  it('Given un refresh token valide, When refreshSession est appelé, Then un nouveau bundle de session est renvoyé', async () => {
    authClient.auth.refreshSession.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          expires_at: 1_776_176_400,
          token_type: 'bearer',
        },
      },
      error: null,
    });

    await expect(
      service.refreshSession({
        refreshToken: 'refresh-token',
      }),
    ).resolves.toEqual({
      session: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        expiresAt: '2026-04-14T14:20:00.000Z',
        tokenType: 'bearer',
      },
      profile: {
        appUser: {
          id: 'user-1',
          email: 'alice@example.com',
          role: 'participant',
          firstName: 'Alice',
          lastName: 'Dupont',
          phone: null,
          preferredContactChannel: null,
          isActive: true,
          createdAt: '2026-04-14T12:00:00.000Z',
          updatedAt: '2026-04-14T12:00:00.000Z',
        },
        participant: null,
      },
    });
  });

  // Given une demande de réinitialisation
  // When requestPasswordReset est appelé
  // Then le service confirme l'envoi du mail sans exposer l'existence du compte
  it("Given une demande de réinitialisation, When requestPasswordReset est appelé, Then le service confirme l'envoi du mail", async () => {
    authClient.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    });

    await expect(
      service.requestPasswordReset({
        email: 'alice@example.com',
        redirectTo: 'kraak://auth/reset',
      }),
    ).resolves.toEqual({
      success: true,
      message:
        'Si cette adresse existe, un email de réinitialisation vient d’être envoyé.',
    });
  });

  // Given un access token valide
  // When getSession est appelé
  // Then le profil courant est résolu depuis Supabase et la base MVP
  it('Given un access token valide, When getSession est appelé, Then le profil courant est résolu', async () => {
    authClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    await expect(service.getSession('access-token')).resolves.toEqual({
      profile: {
        appUser: {
          id: 'user-1',
          email: 'alice@example.com',
          role: 'participant',
          firstName: 'Alice',
          lastName: 'Dupont',
          phone: null,
          preferredContactChannel: null,
          isActive: true,
          createdAt: '2026-04-14T12:00:00.000Z',
          updatedAt: '2026-04-14T12:00:00.000Z',
        },
        participant: null,
      },
    });
  });

  // Given un app_user introuvable
  // When getSession est appelé
  // Then une NotFoundException est renvoyée (profil requis absent)
  it('Given un app_user introuvable, When getSession est appelé, Then une NotFoundException est renvoyée', async () => {
    authClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return createSingleRowQuery({ data: null, error: null });
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.getSession('access-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    });

  it('Given un signup avec erreur générique, When signUp est appelé, Then une BadRequestException avec message générique est renvoyée', async () => {
    authClient.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Unknown error occurred' },
    });

    await expect(
      service.signUp({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
        firstName: 'Alice',
        lastName: 'Dupont',
        phone: null,
        preferredContactChannel: null,
        redirectTo: null,
      }),
    ).rejects.toMatchObject({
      response: {
        message: 'Impossible de créer le compte avec ces informations.',
      },
    });
  });

  // Given un signup sans confirmation email requise (session présente)
  // When signUp est appelé
  // Then la session et le profil sont inclus dans la réponse
  it('Given un signup sans confirmation email, When signUp est appelé, Then la session et le profil sont inclus dans la réponse', async () => {
    authClient.auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          expires_at: 1_776_172_800,
          token_type: 'bearer',
        },
      },
      error: null,
    });

    const result = await service.signUp({
      email: 'alice@example.com',
      password: 'motdepasse-securise',
      firstName: 'Alice',
      lastName: 'Dupont',
      phone: null,
      preferredContactChannel: null,
      redirectTo: null,
    });

    expect(result.requiresEmailConfirmation).toBe(false);
    expect(result.session).not.toBeNull();
    expect(result.session?.accessToken).toBe('access-token');
    expect(result.profile).not.toBeNull();
  });

  // Given un profil avec participant présent
  // When signIn est appelé
  // Then le bundle inclut les données participant
  it('Given un profil avec participant présent, When signIn est appelé, Then le bundle inclut les données participant', async () => {
    authClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          expires_at: 1_776_172_800,
          token_type: 'bearer',
        },
      },
      error: null,
    });

    mockProfile({
      participant: {
        id: 'participant-1',
        user_id: 'user-1',
        lifecycle_status: 'active',
        reference_code: 'REF-001',
        country: 'France',
        city: 'Paris',
        notes: null,
        created_at: '2026-04-14T12:00:00.000Z',
        updated_at: '2026-04-14T12:00:00.000Z',
      },
    });

    const result = await service.signIn({
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    });

    expect(result.profile.participant).toEqual({
      id: 'participant-1',
      userId: 'user-1',
      lifecycleStatus: 'active',
      referenceCode: 'REF-001',
      country: 'France',
      city: 'Paris',
      notes: null,
      createdAt: '2026-04-14T12:00:00.000Z',
      updatedAt: '2026-04-14T12:00:00.000Z',
    });
  });

  // Given une session sans expires_at
  // When signIn est appelé
  // Then expiresAt est calculé depuis expires_in
  it('Given une session sans expires_at, When signIn est appelé, Then expiresAt est calculé depuis expires_in', async () => {
    const now = Date.now();
    authClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          expires_at: null,
          token_type: 'bearer',
        },
      },
      error: null,
    });

    const result = await service.signIn({
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    });

    const expiresAt = new Date(result.session.expiresAt).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(now + 3600 * 1000 - 2000);
    expect(expiresAt).toBeLessThanOrEqual(now + 3600 * 1000 + 2000);
  });

  // Given un refresh token invalide
  // When refreshSession est appelé
  // Then une UnauthorizedException explicite est renvoyée
  it('Given un refresh token invalide, When refreshSession est appelé, Then une UnauthorizedException explicite est renvoyée', async () => {
    authClient.auth.refreshSession.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Token expired' },
    });

    await expect(
      service.refreshSession({ refreshToken: 'invalid-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  // Given une erreur Supabase lors du reset
  // When requestPasswordReset est appelé
  // Then une BadRequestException explicite est renvoyée
  it('Given une erreur Supabase lors du reset, When requestPasswordReset est appelé, Then une BadRequestException est renvoyée', async () => {
    authClient.auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: { message: 'Email rate limit exceeded' },
    });

    await expect(
      service.requestPasswordReset({
        email: 'alice@example.com',
        redirectTo: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Given un access token expiré
  // When getSession est appelé
  // Then une UnauthorizedException explicite est renvoyée
  it('Given un access token expiré, When getSession est appelé, Then une UnauthorizedException explicite est renvoyée', async () => {
    authClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' },
    });

    await expect(service.getSession('expired-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  // Given une erreur DB lors du chargement de app_user
  // When signIn est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given une erreur DB sur app_user, When signIn est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    authClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          expires_at: 1_776_172_800,
          token_type: 'bearer',
        },
      },
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return createSingleRowQuery({
          data: null,
          error: { message: 'DB error' },
        });
      }
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  // Given une erreur DB lors du chargement de participant
  // When signIn est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given une erreur DB sur participant, When signIn est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    authClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          expires_at: 1_776_172_800,
          token_type: 'bearer',
        },
      },
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return createSingleRowQuery({
          data: {
            id: 'user-1',
            email: 'alice@example.com',
            role: 'participant',
            first_name: 'Alice',
            last_name: 'Dupont',
            phone: null,
            preferred_contact_channel: null,
            is_active: true,
            created_at: '2026-04-14T12:00:00.000Z',
            updated_at: '2026-04-14T12:00:00.000Z',
          },
          error: null,
        });
      }
      if (tableName === 'participant') {
        return createSingleRowQuery({
          data: null,
          error: { message: 'DB error' },
        });
      }
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  // Given un app_user introuvable mais un utilisateur auth valide
  // When getSession est appelé
  // Then le profil est auto-provisionné puis renvoyé
  it('Given un app_user introuvable, When getSession est appelé, Then le profil est auto-provisionné', async () => {
    authClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'alice@example.com',
          user_metadata: {
            first_name: 'Alice',
            last_name: 'Dupont',
            role: 'participant',
          },
        },
      },
      error: null,
    });

    const missingThenFoundAppUserQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      maybeSingle: jest
        .fn()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'user-1',
            email: 'alice@example.com',
            role: 'participant',
            first_name: 'Alice',
            last_name: 'Dupont',
            phone: null,
            preferred_contact_channel: null,
            is_active: true,
            created_at: '2026-04-14T12:00:00.000Z',
            updated_at: '2026-04-14T12:00:00.000Z',
          },
          error: null,
        }),
    };

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return missingThenFoundAppUserQuery;
      }

      if (tableName === 'participant') {
        return createSingleRowQuery({ data: null, error: null });
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.getSession('access-token')).resolves.toMatchObject({
      profile: {
        appUser: {
          id: 'user-1',
          email: 'alice@example.com',
        },
        participant: null,
      },
    });

    expect(missingThenFoundAppUserQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        email: 'alice@example.com',
        first_name: 'Alice',
        last_name: 'Dupont',
        role: 'participant',
      }),
      { onConflict: 'id' },
    );
  });

  // Given un app_user introuvable et un provisionnement impossible
  // When getSession est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given un app_user introuvable et un upsert en échec, When getSession est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    authClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'alice@example.com',
          user_metadata: {},
        },
      },
      error: null,
    });

    const failingProvisionQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ error: { message: 'forbidden' } }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return failingProvisionQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.getSession('access-token')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  // Given un signIn Supabase qui renvoie un user null sans erreur
  // When signIn est appelé
  // Then une UnauthorizedException est renvoyée (branche !data.user couverte)
  it('Given un signIn avec user null et error null, When signIn est appelé, Then une UnauthorizedException est renvoyée', async () => {
    authClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    await expect(
      service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  // Given un signUp où Supabase ne renvoie pas d'erreur mais user est null
  // When signUp est appelé
  // Then une BadRequestException avec message générique est renvoyée
  it('Given un signup avec user null et error null, When signUp est appelé, Then une BadRequestException avec message générique est renvoyée', async () => {
    authClient.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    await expect(
      service.signUp({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
        firstName: 'Alice',
        lastName: 'Dupont',
        phone: null,
        preferredContactChannel: null,
        redirectTo: null,
      }),
    ).rejects.toMatchObject({
      response: {
        message: 'Impossible de créer le compte avec ces informations.',
      },
    });
  });
  // Given un signIn Supabase qui renvoie un user présent mais session null sans erreur
  // When signIn est appelé
  // Then une UnauthorizedException est renvoyée (branche !data.session couverte)
  it('Given un signIn avec user présent et session null, When signIn est appelé, Then une UnauthorizedException est renvoyée', async () => {
    authClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });

    await expect(
      service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
