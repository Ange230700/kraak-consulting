import {
  BadRequestException,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    refreshSession: jest.fn(),
    requestPasswordReset: jest.fn(),
    getSession: jest.fn(),
  };

  beforeEach(async () => {
    authService.signIn.mockReset();
    authService.signUp.mockReset();
    authService.refreshSession.mockReset();
    authService.requestPasswordReset.mockReset();
    authService.getSession.mockReset();

    authService.signIn.mockResolvedValue({
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        expiresAt: '2026-04-14T12:00:00.000Z',
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

    authService.signUp.mockResolvedValue({
      message:
        'Votre compte a été créé. Vérifiez votre email pour confirmer votre accès.',
      requiresEmailConfirmation: true,
      session: null,
      profile: null,
    });

    authService.refreshSession.mockResolvedValue({
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        expiresAt: '2026-04-14T12:00:00.000Z',
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

    authService.requestPasswordReset.mockResolvedValue({
      success: true,
      message:
        'Si cette adresse existe, un email de réinitialisation vient d’être envoyé.',
    });

    authService.getSession.mockResolvedValue({
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  // Given le module auth du MVP
  // When on lit ses métadonnées NestJS
  // Then les routes canoniques d'authentification et de session sont exposées
  it('Given le module auth MVP, When on lit les routes, Then /auth expose login, signup, refresh, reset et session', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AuthController)).toBe('auth');
    expect(Reflect.getMetadata(METHOD_METADATA, controller.signIn)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(METHOD_METADATA, controller.signUp)).toBe(
      RequestMethod.POST,
    );
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.refreshSession),
    ).toBe(RequestMethod.POST);
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.requestPasswordReset),
    ).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(METHOD_METADATA, controller.getSession)).toBe(
      RequestMethod.GET,
    );
  });

  // Given des identifiants valides
  // When POST /auth/sign-in est appelé
  // Then le service reçoit un payload normalisé
  it('Given des identifiants valides, When signIn est appelé, Then le service reçoit un payload normalisé', async () => {
    await controller.signIn({
      email: '  alice@example.com  ',
      password: 'motdepasse-securise',
    });

    expect(authService.signIn).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    });
  });

  // Given un payload signup invalide
  // When POST /auth/sign-up est appelé
  // Then une BadRequestException explicite est renvoyée
  it('Given un payload signup invalide, When signUp est appelé, Then une BadRequestException explicite est renvoyée', async () => {
    let thrownError: unknown;

    try {
      await controller.signUp({
        email: 'alice',
        password: 'court',
        firstName: ' ',
        lastName: ' ',
        redirectTo: 'pas-un-lien',
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(BadRequestException);
    expect((thrownError as BadRequestException).getResponse()).toEqual({
      success: false,
      errors: [
        "L'adresse e-mail est invalide.",
        'Le mot de passe doit contenir au moins 8 caractères.',
        'Le prénom est requis.',
        'Le nom est requis.',
        'Le lien de redirection est invalide.',
      ],
    });
  });

  // Given un payload signup valide
  // When POST /auth/sign-up est appelé
  // Then le service reçoit le payload normalisé
  it('Given un payload signup valide, When signUp est appelé, Then le service reçoit le payload normalisé', async () => {
    await controller.signUp({
      email: '  alice@example.com  ',
      password: 'motdepasse-securise',
      firstName: '  Alice  ',
      lastName: '  Dupont  ',
      phone: '  +2250700000000  ',
      preferredContactChannel: '  email  ',
      redirectTo: 'https://kraak.example/auth/callback',
    });

    expect(authService.signUp).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'motdepasse-securise',
      firstName: 'Alice',
      lastName: 'Dupont',
      phone: '+2250700000000',
      preferredContactChannel: 'email',
      redirectTo: 'https://kraak.example/auth/callback',
    });
  });

  // Given un header Authorization Bearer valide
  // When GET /auth/session est appelé
  // Then le token d'accès est transmis au service
  it('Given un header Authorization valide, When getSession est appelé, Then le token Bearer est transmis au service', async () => {
    await controller.getSession('Bearer access-token');

    expect(authService.getSession).toHaveBeenCalledWith('access-token');
  });

  // Given un header Authorization absent
  // When GET /auth/session est appelé
  // Then l'API rejette la requête avec une erreur d'authentification explicite
  it('Given un header Authorization absent, When getSession est appelé, Then une UnauthorizedException explicite est renvoyée', async () => {
    let thrownError: unknown;

    try {
      await controller.getSession(undefined);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(UnauthorizedException);
    expect((thrownError as UnauthorizedException).getResponse()).toEqual({
      success: false,
      message: "Le header d'autorisation Bearer est requis.",
    });
  });

  // Given un payload signIn invalide (email malformé)
  // When POST /auth/sign-in est appelé
  // Then une BadRequestException explicite est renvoyée
  it('Given un payload signIn invalide, When signIn est appelé, Then une BadRequestException explicite est renvoyée', async () => {
    let thrownError: unknown;
    try {
      await controller.signIn({ email: 'pas-un-email', password: 'x' });
    } catch (error) {
      thrownError = error;
    }
    expect(thrownError).toBeInstanceOf(BadRequestException);
  });

  // Given un payload refreshSession valide
  // When POST /auth/session/refresh est appelé
  // Then le service reçoit le refresh token normalisé
  it('Given un payload refreshSession valide, When refreshSession est appelé, Then le service reçoit le refresh token normalisé', async () => {
    await controller.refreshSession({ refreshToken: '  refresh-token  ' });
    expect(authService.refreshSession).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
    });
  });

  // Given un payload refreshSession invalide
  // When POST /auth/session/refresh est appelé
  // Then une BadRequestException est renvoyée
  it('Given un payload refreshSession invalide, When refreshSession est appelé, Then une BadRequestException est renvoyée', async () => {
    let thrownError: unknown;
    try {
      await controller.refreshSession({});
    } catch (error) {
      thrownError = error;
    }
    expect(thrownError).toBeInstanceOf(BadRequestException);
  });

  // Given un payload passwordReset valide
  // When POST /auth/password-reset est appelé
  // Then le service reçoit le payload normalisé
  it('Given un payload passwordReset valide, When requestPasswordReset est appelé, Then le service reçoit le payload normalisé', async () => {
    await controller.requestPasswordReset({
      email: '  alice@example.com  ',
      redirectTo: 'kraak://auth/reset',
    });
    expect(authService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'alice@example.com',
      redirectTo: 'kraak://auth/reset',
    });
  });

  // Given un payload passwordReset invalide (email malformé)
  // When POST /auth/password-reset est appelé
  // Then une BadRequestException est renvoyée
  it('Given un payload passwordReset invalide, When requestPasswordReset est appelé, Then une BadRequestException est renvoyée', async () => {
    let thrownError: unknown;
    try {
      await controller.requestPasswordReset({ email: 'pas-un-email' });
    } catch (error) {
      thrownError = error;
    }
    expect(thrownError).toBeInstanceOf(BadRequestException);
  });
});
