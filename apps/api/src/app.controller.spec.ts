import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  const healthPayload = {
    status: 'ok',
    service: 'kraak-api',
    environment: 'test',
    timestamp: '2026-04-30T09:45:00.000Z',
    version: '0.0.0-test',
    uptimeSeconds: 12,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHealth: () => healthPayload,
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
});
