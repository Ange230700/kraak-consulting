import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  const fixedTime = new Date('2026-04-30T09:45:00.000Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AppService,
          useFactory: () =>
            new AppService(
              () => fixedTime,
              () => 12,
              'test',
              '0.0.0-test',
            ),
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Given le service AppService est instancié
  // When on appelle getHealth()
  // Then on reçoit un payload exploitable pour la supervision
  it('getHealth — should return an observable health payload', () => {
    expect(service.getHealth()).toEqual({
      status: 'ok',
      service: 'kraak-api',
      environment: 'test',
      timestamp: fixedTime.toISOString(),
      version: '0.0.0-test',
      uptimeSeconds: 12,
    });
  });
});
