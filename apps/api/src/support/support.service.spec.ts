import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupportService } from './support.service';

const sendMock = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: sendMock,
    },
  })),
}));

function createQueryChain<T>(
  result: { data: T; error: unknown },
  operations: {
    onEq?: (column: string, value: unknown) => void;
  } = {},
): {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  maybeSingle: jest.Mock;
} {
  const chain = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn(),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockImplementation((column: string, value: unknown) => {
    operations.onEq?.(column, value);
    return chain;
  });
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(result);

  Object.assign(chain, {
    then: (resolve: (value: { data: T; error: unknown }) => unknown) =>
      Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(reject),
    finally: (handler: () => void) => Promise.resolve(result).finally(handler),
  });

  return chain;
}

describe('SupportService', () => {
  let service: SupportService;
  const configService = {
    get: jest.fn(),
  };

  const authGetUserMock = jest.fn();
  const fromMock = jest.fn();

  const supabaseService = {
    createAuthClient: jest.fn(() => ({
      auth: {
        getUser: authGetUserMock,
      },
    })),
    getClient: jest.fn(() => ({
      from: fromMock,
    })),
  };

  beforeEach(async () => {
    sendMock.mockReset();
    configService.get.mockReset();
    authGetUserMock.mockReset();
    fromMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: SupabaseService,
          useValue: supabaseService,
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('Given une demande valide et une configuration email active, When submitContact est appelé sans session, Then un email transactionnel est envoyé et la réponse reste positive', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 're_test_key';
      if (key === 'CONTACT_TO_EMAIL') return 'contact@kraak.org';
      if (key === 'CONTACT_FROM_EMAIL') return 'noreply@kraak.org';
      return undefined;
    });

    sendMock.mockResolvedValue({ data: { id: 'email_123' }, error: null });

    await expect(
      service.submitContact({
        name: 'Alice Dupont',
        email: 'alice@exemple.com',
        subject: 'Renseignements',
        message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
        category: 'other',
      }),
    ).resolves.toEqual({
      success: true,
      message:
        'Votre message a bien été reçu. Nous vous répondrons dans les plus brefs délais.',
      requestId: undefined,
      requestStatus: undefined,
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: 'noreply@kraak.org',
      to: 'contact@kraak.org',
      replyTo: 'alice@exemple.com',
      subject: '[KRAAK][Autre] Renseignements',
      text: expect.stringContaining('Nouvelle demande de contact KRAAK'),
    });
  });

  it("Given Resend renvoie un succès sans id d'email, When submitContact est appelé, Then la réponse reste positive et le log utilise l'identifiant inconnu", async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 're_test_key';
      if (key === 'CONTACT_TO_EMAIL') return 'contact@kraak.org';
      if (key === 'CONTACT_FROM_EMAIL') return 'noreply@kraak.org';
      return undefined;
    });

    sendMock.mockResolvedValue({ data: {}, error: null });
    const loggerLogSpy = jest.spyOn(
      (service as unknown as { logger: Logger }).logger,
      'log',
    );

    await expect(
      service.submitContact({
        name: 'Alice Dupont',
        email: 'alice@exemple.com',
        subject: 'Renseignements',
        message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
        category: 'other',
      }),
    ).resolves.toMatchObject({ success: true });

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('id=inconnu'),
    );
  });

  it("Given Resend renvoie data null sans erreur, When submitContact est appelé, Then la réponse reste positive et le log utilise l'identifiant inconnu", async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 're_test_key';
      if (key === 'CONTACT_TO_EMAIL') return 'contact@kraak.org';
      if (key === 'CONTACT_FROM_EMAIL') return 'noreply@kraak.org';
      return undefined;
    });

    sendMock.mockResolvedValue({ data: null, error: null });
    const loggerLogSpy = jest.spyOn(
      (service as unknown as { logger: Logger }).logger,
      'log',
    );

    await expect(
      service.submitContact({
        name: 'Alice Dupont',
        email: 'alice@exemple.com',
        subject: 'Renseignements',
        message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
        category: 'other',
      }),
    ).resolves.toMatchObject({ success: true });

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('id=inconnu'),
    );
  });

  it("Given Resend retourne un objet d'erreur, When submitContact est appelé, Then une exception est levée plutôt que de renvoyer un faux succès", async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 're_test_key';
      if (key === 'CONTACT_TO_EMAIL') return 'contact@kraak.org';
      if (key === 'CONTACT_FROM_EMAIL') return 'noreply@kraak.org';
      return undefined;
    });

    sendMock.mockResolvedValue({
      data: null,
      error: {
        statusCode: 403,
        name: 'validation_error',
        message: 'You can only send testing emails to your own email address.',
      },
    });

    await expect(
      service.submitContact({
        name: 'Alice Dupont',
        email: 'alice@exemple.com',
        subject: 'Renseignements',
        message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
        category: 'other',
      }),
    ).rejects.toMatchObject({
      response: {
        success: false,
      },
    });
  });

  it('Given une session authentifiée, When submitContact est appelé, Then une demande support avec statut open est stockée et renvoyée', async () => {
    configService.get.mockReturnValue(undefined);

    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'user-1', role: 'participant' },
          error: null,
        });
      }

      if (table === 'participant') {
        return createQueryChain({ data: { id: 'participant-1' }, error: null });
      }

      if (table === 'support_request') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'req-1',
                  user_id: 'user-1',
                  participant_id: 'participant-1',
                  subject: 'Sujet test',
                  message: 'Message test détaillé',
                  status: 'open',
                  category: 'technical',
                  assigned_to_user_id: null,
                  created_at: '2026-04-29T10:00:00.000Z',
                  updated_at: '2026-04-29T10:00:00.000Z',
                },
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.submitContact(
        {
          name: 'Alice Dupont',
          email: 'alice@exemple.com',
          subject: 'Sujet test',
          message: 'Message test détaillé',
          category: 'technical',
        },
        'access-token',
      ),
    ).resolves.toEqual({
      success: true,
      message:
        'Votre message a bien été reçu. Nous vous répondrons dans les plus brefs délais.',
      requestId: 'req-1',
      requestStatus: 'open',
    });
  });

  it('Given un participant authentifié, When listSupportRequests est appelé, Then seules ses demandes sont renvoyées', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    let eqFilter: { column: string; value: unknown } | null = null;

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'user-1', role: 'participant' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return createQueryChain(
          {
            data: [
              {
                id: 'req-1',
                user_id: 'user-1',
                participant_id: 'participant-1',
                subject: 'Sujet test',
                message: 'Message test détaillé',
                status: 'open',
                category: 'technical',
                assigned_to_user_id: null,
                created_at: '2026-04-29T10:00:00.000Z',
                updated_at: '2026-04-29T10:00:00.000Z',
              },
            ],
            error: null,
          },
          {
            onEq: (column, value) => {
              eqFilter = { column, value };
            },
          },
        );
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const results = await service.listSupportRequests('access-token');

    expect(eqFilter).toEqual({ column: 'user_id', value: 'user-1' });
    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe('open');
  });

  it('Given un participant, When updateSupportRequestStatus est appelé, Then une erreur de droits est renvoyée', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'user-1', role: 'participant' },
          error: null,
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.updateSupportRequestStatus(
        'req-1',
        { status: 'in_progress' },
        'access-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un admin authentifié, When listSupportRequests est appelé, Then toutes les demandes sont renvoyées sans filtre user_id', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    let eqCalled = false;

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'admin-1', role: 'admin' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return createQueryChain(
          { data: [], error: null },
          {
            onEq: () => {
              eqCalled = true;
            },
          },
        );
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const results = await service.listSupportRequests('access-token');
    expect(eqCalled).toBe(false);
    expect(results).toEqual([]);
  });

  it('Given la requête support_request renvoie data null sans erreur, When listSupportRequests est appelé, Then la liste renvoyée est vide', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'admin-1', role: 'admin' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return createQueryChain({ data: null, error: null });
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(service.listSupportRequests('access-token')).resolves.toEqual(
      [],
    );
  });

  it('Given une erreur DB sur support_request, When listSupportRequests est appelé, Then une InternalServerErrorException est levée', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'admin-1', role: 'admin' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return createQueryChain({ data: null, error: { message: 'DB error' } });
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.listSupportRequests('access-token'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('Given une erreur de lecture DB, When updateSupportRequestStatus est appelé, Then une InternalServerErrorException est levée', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'admin-1', role: 'admin' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'read error' },
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.updateSupportRequestStatus(
        'req-1',
        { status: 'in_progress' },
        'access-token',
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('Given une demande introuvable, When updateSupportRequestStatus est appelé, Then une NotFoundException est levée', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'admin-1', role: 'admin' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.updateSupportRequestStatus(
        'req-1',
        { status: 'in_progress' },
        'access-token',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given une transition de statut invalide (closed → open), When updateSupportRequestStatus est appelé, Then une ForbiddenException est levée', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'admin-1', role: 'admin' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'req-1',
                  user_id: 'u',
                  participant_id: null,
                  subject: 's',
                  message: 'm',
                  status: 'closed',
                  category: 'other',
                  assigned_to_user_id: null,
                  created_at: '2026-01-01T00:00:00.000Z',
                  updated_at: '2026-01-01T00:00:00.000Z',
                },
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.updateSupportRequestStatus(
        'req-1',
        { status: 'open' },
        'access-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given la même transition de statut (open → open), When updateSupportRequestStatus est appelé, Then la mise à jour est effectuée sans erreur', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    const updatedRow = {
      id: 'req-1',
      user_id: 'admin-1',
      participant_id: null,
      subject: 's',
      message: 'm',
      status: 'open',
      category: 'other',
      assigned_to_user_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'admin-1', role: 'admin' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest
                .fn()
                .mockResolvedValue({ data: updatedRow, error: null }),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                maybeSingle: jest
                  .fn()
                  .mockResolvedValue({ data: updatedRow, error: null }),
              })),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await service.updateSupportRequestStatus(
      'req-1',
      { status: 'open' },
      'access-token',
    );
    expect(result.status).toBe('open');
  });

  it('Given RESEND_API_KEY absent, When submitContact est appelé, Then un avertissement est loggué et la fonction retourne sans envoyer', async () => {
    configService.get.mockReturnValue(undefined);

    const result = await service.submitContact({
      name: 'Bob',
      email: 'bob@example.com',
      subject: 'Test',
      message: 'Message test',
      category: 'other',
    });

    expect(sendMock).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('Given Resend lève une exception réseau, When submitContact est appelé, Then une InternalServerErrorException est levée', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 're_test_key';
      if (key === 'CONTACT_TO_EMAIL') return 'contact@kraak.org';
      return undefined;
    });

    sendMock.mockRejectedValue(new Error('Network error'));

    await expect(
      service.submitContact({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Test',
        message: 'Message',
        category: 'other',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('Given Resend rejette avec une valeur non-Error, When submitContact est appelé, Then une InternalServerErrorException est levée et le stack loggué est undefined', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 're_test_key';
      if (key === 'CONTACT_TO_EMAIL') return 'contact@kraak.org';
      if (key === 'CONTACT_FROM_EMAIL') return 'noreply@kraak.org';
      return undefined;
    });

    sendMock.mockRejectedValue('network-down');
    const loggerErrorSpy = jest.spyOn(
      (service as unknown as { logger: Logger }).logger,
      'error',
    );

    await expect(
      service.submitContact({
        name: 'Alice Dupont',
        email: 'alice@exemple.com',
        subject: 'Renseignements',
        message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
        category: 'other',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "Échec de l'envoi d'email transactionnel",
      undefined,
    );
  });

  it("Given une erreur d'authentification, When resolveSessionUser est appelé, Then une UnauthorizedException est levée", async () => {
    authGetUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    fromMock.mockReturnValue(createQueryChain({ data: null, error: null }));

    await expect(
      service.listSupportRequests('bad-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given un app_user introuvable après auth, When resolveSessionUser est appelé, Then une UnauthorizedException est levée', async () => {
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-x' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({ data: null, error: null });
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.listSupportRequests('access-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given une mise à jour retourne data null sans erreur, When updateSupportRequestStatus est appelé, Then une InternalServerErrorException est levée', async () => {
    configService.get.mockReturnValue(undefined);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'admin-1', role: 'admin' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'req-1',
                  user_id: 'admin-1',
                  participant_id: null,
                  subject: 's',
                  message: 'm',
                  status: 'open',
                  category: 'other',
                  assigned_to_user_id: null,
                  created_at: '2026-01-01T00:00:00.000Z',
                  updated_at: '2026-01-01T00:00:00.000Z',
                },
                error: null,
              }),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                maybeSingle: jest
                  .fn()
                  .mockResolvedValue({ data: null, error: null }),
              })),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.updateSupportRequestStatus(
        'req-1',
        { status: 'in_progress' },
        'access-token',
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('Given un participant introuvable lors de la création, When submitContact avec session est appelé, Then la demande est créée avec participant_id null', async () => {
    configService.get.mockReturnValue(undefined);

    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-2' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'user-2', role: 'participant' },
          error: null,
        });
      }

      if (table === 'participant') {
        return createQueryChain({ data: null, error: null });
      }

      if (table === 'support_request') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'req-2',
                  user_id: 'user-2',
                  participant_id: null,
                  subject: 'Sujet',
                  message: 'Message test',
                  status: 'open',
                  category: 'other',
                  assigned_to_user_id: null,
                  created_at: '2026-04-29T10:00:00.000Z',
                  updated_at: '2026-04-29T10:00:00.000Z',
                },
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.submitContact(
        {
          name: 'Bob',
          email: 'bob@example.com',
          subject: 'Sujet',
          message: 'Message test',
          category: 'other',
        },
        'access-token',
      ),
    ).resolves.toMatchObject({ success: true, requestId: 'req-2' });
  });

  it('Given un enregistrement participant malformé sans id, When submitContact avec session est appelé, Then la demande est créée avec participant_id null', async () => {
    configService.get.mockReturnValue(undefined);

    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-2' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'user-2', role: 'participant' },
          error: null,
        });
      }

      if (table === 'participant') {
        return createQueryChain({
          data: {},
          error: null,
        });
      }

      if (table === 'support_request') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'req-2b',
                  user_id: 'user-2',
                  participant_id: null,
                  subject: 'Sujet',
                  message: 'Message test',
                  status: 'open',
                  category: 'other',
                  assigned_to_user_id: null,
                  created_at: '2026-04-29T10:00:00.000Z',
                  updated_at: '2026-04-29T10:00:00.000Z',
                },
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.submitContact(
        {
          name: 'Bob',
          email: 'bob@example.com',
          subject: 'Sujet',
          message: 'Message test',
          category: 'other',
        },
        'access-token',
      ),
    ).resolves.toMatchObject({ success: true, requestId: 'req-2b' });
  });

  it('Given une erreur DB lors de la résolution du participant, When submitContact avec session est appelé, Then une InternalServerErrorException est levée', async () => {
    configService.get.mockReturnValue(undefined);

    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-4' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'user-4', role: 'participant' },
          error: null,
        });
      }

      if (table === 'participant') {
        return createQueryChain({
          data: null,
          error: { message: 'participant lookup failed' },
        });
      }

      if (table === 'support_request') {
        return {
          insert: jest.fn(),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.submitContact(
        {
          name: 'Dora',
          email: 'dora@example.com',
          subject: 'Sujet',
          message: 'Message test',
          category: 'other',
        },
        'access-token',
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('Given insert support_request retourne data null sans erreur, When submitContact avec session est appelé, Then une InternalServerErrorException est levée', async () => {
    configService.get.mockReturnValue(undefined);

    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-3' } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_user') {
        return createQueryChain({
          data: { id: 'user-3', role: 'participant' },
          error: null,
        });
      }

      if (table === 'participant') {
        return createQueryChain({
          data: { id: 'participant-3' },
          error: null,
        });
      }

      if (table === 'support_request') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              maybeSingle: jest
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      service.submitContact(
        {
          name: 'Carol',
          email: 'carol@example.com',
          subject: 'Sujet',
          message: 'Message test',
          category: 'other',
        },
        'access-token',
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
