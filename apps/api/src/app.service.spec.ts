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

describe('AppService — default constructor', () => {
  it('Given le service instancié avec ses valeurs par défaut, When getHealth est appelé, Then environment et version ont des valeurs de secours', () => {
    const service = new AppService();
    const result = service.getHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('kraak-api');
    expect(result.environment).toBeDefined();
    expect(result.version).toBeDefined();
    expect(typeof result.uptimeSeconds).toBe('number');
  });
});

describe('AppService — version env var fallback', () => {
  const original = {
    APP_VERSION: process.env['APP_VERSION'],
    npm_package_version: process.env['npm_package_version'],
  };

  afterEach(() => {
    if (original.APP_VERSION === undefined) {
      delete process.env['APP_VERSION'];
    } else {
      process.env['APP_VERSION'] = original.APP_VERSION;
    }
    if (original.npm_package_version === undefined) {
      delete process.env['npm_package_version'];
    } else {
      process.env['npm_package_version'] = original.npm_package_version;
    }
  });

  it('Given APP_VERSION défini, When getHealth est appelé, Then version utilise APP_VERSION', () => {
    process.env['APP_VERSION'] = '1.2.3';
    delete process.env['npm_package_version'];
    const service = new AppService();
    expect(service.getHealth().version).toBe('1.2.3');
  });

  it('Given APP_VERSION absent et npm_package_version défini, When getHealth est appelé, Then version utilise npm_package_version', () => {
    delete process.env['APP_VERSION'];
    process.env['npm_package_version'] = '2.0.0';
    const service = new AppService();
    expect(service.getHealth().version).toBe('2.0.0');
  });

  it('Given les deux variables absentes, When getHealth est appelé, Then version vaut 0.0.0', () => {
    delete process.env['APP_VERSION'];
    delete process.env['npm_package_version'];
    const service = new AppService();
    expect(service.getHealth().version).toBe('0.0.0');
  });
});
