import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupportService } from './support.service';

const sendMock = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: sendMock,
    },
  })),
}));

describe('SupportService', () => {
  let service: SupportService;
  const configService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    sendMock.mockReset();
    configService.get.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  // Given un DTO de contact/support valide
  // When on soumet la demande
  // Then le service envoie un email transactionnel et renvoie un accusé de réception
  it('Given une demande valide et une configuration email active, When submitContact est appelé, Then un email transactionnel est envoyé', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 're_test_key';
      if (key === 'CONTACT_TO_EMAIL') return 'contact@kraak.org';
      if (key === 'CONTACT_FROM_EMAIL') return 'noreply@kraak.org';
      return undefined;
    });

    sendMock.mockResolvedValue({ id: 'email_123' });

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
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: 'noreply@kraak.org',
      to: 'contact@kraak.org',
      replyTo: 'alice@exemple.com',
      subject: '[KRAAK][Autre] Renseignements',
      text: expect.stringContaining('Nouvelle demande de contact KRAAK'),
    });
  });

  // Given une configuration email absente
  // When on soumet la demande
  // Then le service conserve un accusé de réception sans appel externe
  it('Given une configuration email absente, When submitContact est appelé, Then la réponse reste positive sans envoi externe', async () => {
    configService.get.mockReturnValue(undefined);

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
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  // Given une configuration email active
  // When Resend échoue
  // Then le service remonte une erreur serveur explicite
  it('Given une configuration email active, When Resend échoue, Then une erreur serveur est renvoyée', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RESEND_API_KEY') return 're_test_key';
      if (key === 'CONTACT_TO_EMAIL') return 'contact@kraak.org';
      return undefined;
    });

    sendMock.mockRejectedValue(new Error('network failure'));

    await expect(
      service.submitContact({
        name: 'Alice Dupont',
        email: 'alice@exemple.com',
        subject: 'Renseignements',
        message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
        category: 'technical',
      }),
    ).rejects.toMatchObject({
      response: {
        success: false,
        message:
          "Votre demande a été reçue, mais l'envoi de notification a échoué. Veuillez réessayer.",
      },
    });
  });
});
