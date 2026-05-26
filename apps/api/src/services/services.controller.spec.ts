import {
  ForbiddenException,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

describe('ServicesController', () => {
  let controller: ServicesController;

  const servicesService = {
    listServices: jest.fn(),
    getServiceById: jest.fn(),
    createService: jest.fn(),
    updateService: jest.fn(),
    deleteService: jest.fn(),
    createServiceDetail: jest.fn(),
    updateServiceDetail: jest.fn(),
    deleteServiceDetail: jest.fn(),
  };

  const authService = {
    getSession: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    servicesService.listServices.mockResolvedValue([]);
    servicesService.getServiceById.mockResolvedValue({
      id: 'service-1',
      title: 'Conseil',
      description: 'Description',
      icon: null,
      sortOrder: 0,
      createdAt: '2026-05-26T10:00:00.000Z',
      updatedAt: '2026-05-26T10:00:00.000Z',
      details: [],
    });
    servicesService.createService.mockResolvedValue({
      id: 'service-1',
      title: 'Conseil',
      description: 'Description',
      icon: null,
      sortOrder: 0,
      createdAt: '2026-05-26T10:00:00.000Z',
      updatedAt: '2026-05-26T10:00:00.000Z',
    });
    servicesService.updateService.mockResolvedValue({
      id: 'service-1',
      title: 'Conseil',
      description: 'Description',
      icon: null,
      sortOrder: 1,
      createdAt: '2026-05-26T10:00:00.000Z',
      updatedAt: '2026-05-26T10:00:00.000Z',
    });
    servicesService.createServiceDetail.mockResolvedValue({
      id: 'detail-1',
      serviceId: 'service-1',
      title: 'Audit',
      description: 'Analyse',
      sortOrder: 0,
      createdAt: '2026-05-26T10:00:00.000Z',
      updatedAt: '2026-05-26T10:00:00.000Z',
    });
    servicesService.updateServiceDetail.mockResolvedValue({
      id: 'detail-1',
      serviceId: 'service-1',
      title: 'Audit',
      description: 'Analyse',
      sortOrder: 1,
      createdAt: '2026-05-26T10:00:00.000Z',
      updatedAt: '2026-05-26T10:00:00.000Z',
    });
    authService.getSession.mockResolvedValue({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'participant',
        },
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: servicesService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('Given le module services, When on lit ses métadonnées NestJS, Then GET /services est exposé', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ServicesController)).toBe(
      'services',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, controller.listServices)).toBe(
      RequestMethod.GET,
    );
  });

  it('Given des services existants, When listServices est appelé, Then le service est invoqué', async () => {
    await controller.listServices();

    expect(servicesService.listServices).toHaveBeenCalledTimes(1);
  });

  it('Given un service demandé, When getServiceById est appelé, Then le service applicatif reçoit l’identifiant', async () => {
    await controller.getServiceById('service-1');

    expect(servicesService.getServiceById).toHaveBeenCalledWith('service-1');
  });

  it('Given un token admin valide, When createService est appelé, Then le service createService est invoqué', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await controller.createService(
      {
        title: 'Conseil',
        description: 'Description',
        sortOrder: 2,
      },
      'Bearer ' + 'access-token',
    );

    expect(servicesService.createService).toHaveBeenCalledWith({
      title: 'Conseil',
      description: 'Description',
      sortOrder: 2,
    });
  });

  it('Given un utilisateur non admin, When createService est appelé, Then une ForbiddenException est renvoyée', async () => {
    await expect(
      controller.createService(
        {
          title: 'Conseil',
          description: 'Description',
        },
        'Bearer ' + 'access-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un token admin valide, When patchService est appelé, Then la route PUT est réutilisée', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await controller.patchService(
      'service-1',
      {
        description: 'Description mise à jour',
      },
      'Bearer ' + 'access-token',
    );

    expect(servicesService.updateService).toHaveBeenCalledWith('service-1', {
      description: 'Description mise à jour',
    });
  });

  it('Given un token admin valide, When createServiceDetail est appelé, Then le service de détails est invoqué', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await controller.createServiceDetail(
      'service-1',
      {
        title: 'Audit',
        description: 'Analyse',
      },
      'Bearer ' + 'access-token',
    );

    expect(servicesService.createServiceDetail).toHaveBeenCalledWith(
      'service-1',
      {
        title: 'Audit',
        description: 'Analyse',
      },
    );
  });

  it('Given un token admin valide, When deleteServiceDetail est appelé, Then le service deleteServiceDetail est invoqué', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await controller.deleteServiceDetail(
      'service-1',
      'detail-1',
      'Bearer ' + 'access-token',
    );

    expect(servicesService.deleteServiceDetail).toHaveBeenCalledWith(
      'service-1',
      'detail-1',
    );
  });

  it('Given un header Authorization absent, When createService est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(
      controller.createService({ title: 'Conseil', description: 'Description' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
