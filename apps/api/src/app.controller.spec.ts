import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  const getHealth = jest.fn();

  const healthPayload = {
    status: 'ok',
    service: 'kraak-api',
    environment: 'test',
    timestamp: '2026-04-30T09:45:00.000Z',
    version: '0.0.0-test',
    uptimeSeconds: 12,
  };

  beforeEach(async () => {
    getHealth.mockReset();
    getHealth.mockReturnValue(healthPayload);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHealth,
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Given le serveur API est démarré
  // When un client envoie GET /health
  // Then la réponse contient les métadonnées minimales d observabilité
  it('GET /health — should return an observable health payload', () => {
    expect(controller.getHealth()).toEqual(healthPayload);
  });

  it('Given un payload santé dégradé, When getHealth est appelé, Then des valeurs de secours sont appliquées', () => {
    getHealth.mockReturnValueOnce({
      status: 'ok',
      service: '   ',
      environment: '',
      timestamp: 'invalid-date',
      version: ' ',
      uptimeSeconds: -10,
    });

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'kraak-api',
      environment: 'development',
      timestamp: '1970-01-01T00:00:00.000Z',
      version: '0.0.0',
      uptimeSeconds: 0,
    });
  });

  it('Given un payload santé valide, When getHealth est appelé, Then les valeurs initiales sont conservées', () => {
    const customPayload = {
      status: 'ok',
      service: 'custom-api',
      environment: 'staging',
      timestamp: '2026-05-29T12:00:00.000Z',
      version: '1.2.3',
      uptimeSeconds: 42,
    };
    getHealth.mockReturnValueOnce(customPayload);

    expect(controller.getHealth()).toEqual(customPayload);
  });
});
