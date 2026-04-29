import { BadRequestException, RequestMethod } from '@nestjs/common';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

describe('SupportController', () => {
  let controller: SupportController;
  const supportService = {
    submitContact: jest.fn(),
  };

  beforeEach(async () => {
    supportService.submitContact.mockReset();
    supportService.submitContact.mockResolvedValue({
      success: true,
      message:
        'Votre message a bien été reçu. Nous vous répondrons dans les plus brefs délais.',
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        {
          provide: SupportService,
          useValue: supportService,
        },
      ],
    }).compile();

    controller = module.get<SupportController>(SupportController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  // Given le module support MVP
  // When on lit ses métadonnées NestJS
  // Then le endpoint canonique et l'alias historique sont tous les deux exposés
  it('Given le support MVP, When on lit la route, Then POST /support/contact et POST /contact sont exposés', () => {
    expect(Reflect.getMetadata(PATH_METADATA, SupportController)).toEqual([
      'support/contact',
      'contact',
    ]);
    expect(Reflect.getMetadata(METHOD_METADATA, controller.submit)).toBe(
      RequestMethod.POST,
    );
  });

  // Given une demande de contact valide sans catégorie explicite
  // When le client soumet le formulaire
  // Then le service reçoit des champs trims avec la catégorie par défaut other
  it('Given une demande valide, When POST est appelé, Then le service reçoit un payload normalisé', async () => {
    await controller.submit({
      name: '  Alice Dupont  ',
      email: 'alice@exemple.com',
      subject: '  Demande de renseignements  ',
      message: '  Bonjour, je souhaite en savoir plus sur vos services.  ',
    });

    expect(supportService.submitContact).toHaveBeenCalledWith({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Demande de renseignements',
      message: 'Bonjour, je souhaite en savoir plus sur vos services.',
      category: 'other',
    });
  });

  // Given un payload invalide
  // When le client soumet le formulaire
  // Then l'API renvoie des erreurs utilisateur explicites
  it('Given un payload invalide, When POST est appelé, Then une BadRequestException explicite est renvoyée', async () => {
    await expect(
      controller.submit({
        name: 'A',
        email: 'not-an-email',
        subject: ' ',
        message: 'Court',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.submit({
        name: 'A',
        email: 'not-an-email',
        subject: ' ',
        message: 'Court',
      }),
    ).rejects.toMatchObject({
      response: {
        success: false,
        errors: [
          'Le nom doit contenir au moins 2 caractères.',
          "L'adresse e-mail est invalide.",
          "L'objet est requis.",
          'Le message doit contenir au moins 10 caractères.',
        ],
      },
    });
  });
});
