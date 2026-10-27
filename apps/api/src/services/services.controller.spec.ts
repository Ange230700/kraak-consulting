import {
  BadRequestException,
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

  it('Given un token admin valide, When createService est appelé avec un payload invalide, Then une BadRequestException est renvoyée', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await expect(
      controller.createService(
        {
          title: '',
          description: 'Description',
        },
        'Bearer ' + 'access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
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
      controller.createService({
        title: 'Conseil',
        description: 'Description',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given un token admin valide, When updateService est appelé avec un payload valide, Then le service updateService est invoqué', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await controller.updateService(
      'service-1',
      {
        title: 'Conseil modifié',
      },
      'Bearer ' + 'access-token',
    );

    expect(servicesService.updateService).toHaveBeenCalledWith('service-1', {
      title: 'Conseil modifié',
    });
  });

  it('Given un token admin valide, When updateService est appelé avec un payload invalide, Then une BadRequestException est renvoyée', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await expect(
      controller.updateService(
        'service-1',
        {
          title: '',
        },
        'Bearer ' + 'access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Given un header Authorization absent, When updateService est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(
      controller.updateService('service-1', {
        title: 'Conseil modifié',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given un utilisateur non admin, When updateService est appelé, Then une ForbiddenException est renvoyée', async () => {
    await expect(
      controller.updateService(
        'service-1',
        {
          title: 'Conseil modifié',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un token admin valide, When deleteService est appelé, Then le service deleteService est invoqué', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await controller.deleteService('service-1', 'Bearer ' + 'access-token');

    expect(servicesService.deleteService).toHaveBeenCalledWith('service-1');
  });

  it('Given un utilisateur non admin, When deleteService est appelé, Then une ForbiddenException est renvoyée', async () => {
    await expect(
      controller.deleteService('service-1', 'Bearer access-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un header Authorization absent, When deleteService est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(controller.deleteService('service-1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('Given un token admin valide, When createServiceDetail est appelé avec un payload invalide, Then une BadRequestException est renvoyée', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await expect(
      controller.createServiceDetail(
        'service-1',
        {
          title: '',
        },
        'Bearer ' + 'access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Given un header Authorization absent, When createServiceDetail est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(
      controller.createServiceDetail('service-1', {
        title: 'Audit',
        description: 'Analyse',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given un utilisateur non admin, When createServiceDetail est appelé, Then une ForbiddenException est renvoyée', async () => {
    await expect(
      controller.createServiceDetail(
        'service-1',
        {
          title: 'Audit',
          description: 'Analyse',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un token admin valide, When updateServiceDetail est appelé avec un payload valide, Then le service updateServiceDetail est invoqué', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await controller.updateServiceDetail(
      'service-1',
      'detail-1',
      {
        description: 'Description mise à jour',
      },
      'Bearer ' + 'access-token',
    );

    expect(servicesService.updateServiceDetail).toHaveBeenCalledWith(
      'service-1',
      'detail-1',
      {
        description: 'Description mise à jour',
      },
    );
  });

  it('Given un token admin valide, When updateServiceDetail est appelé avec un payload invalide, Then une BadRequestException est renvoyée', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await expect(
      controller.updateServiceDetail(
        'service-1',
        'detail-1',
        {
          title: '',
        },
        'Bearer ' + 'access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Given un header Authorization absent, When updateServiceDetail est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(
      controller.updateServiceDetail('service-1', 'detail-1', {
        description: 'Description mise à jour',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given un utilisateur non admin, When updateServiceDetail est appelé, Then une ForbiddenException est renvoyée', async () => {
    await expect(
      controller.updateServiceDetail(
        'service-1',
        'detail-1',
        {
          description: 'Description mise à jour',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un token admin valide, When patchServiceDetail est appelé, Then la route PUT de détail est réutilisée', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          id: 'user-1',
          role: 'admin',
        },
      },
    });

    await controller.patchServiceDetail(
      'service-1',
      'detail-1',
      {
        description: 'Description patchée',
      },
      'Bearer ' + 'access-token',
    );

    expect(servicesService.updateServiceDetail).toHaveBeenCalledWith(
      'service-1',
      'detail-1',
      {
        description: 'Description patchée',
      },
    );
  });

  it('Given un header Authorization absent, When patchService est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(
      controller.patchService('service-1', {
        description: 'Description patchée',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given un header Authorization absent, When patchServiceDetail est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(
      controller.patchServiceDetail('service-1', 'detail-1', {
        description: 'Description patchée',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given un utilisateur non admin, When deleteServiceDetail est appelé, Then une ForbiddenException est renvoyée', async () => {
    await expect(
      controller.deleteServiceDetail(
        'service-1',
        'detail-1',
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un header Authorization absent, When deleteServiceDetail est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(
      controller.deleteServiceDetail('service-1', 'detail-1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
