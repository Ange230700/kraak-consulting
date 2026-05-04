import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
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
});
