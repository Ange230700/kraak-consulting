import { RequestMethod, UnauthorizedException } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  const dashboardService = {
    getAggregate: jest.fn(),
  };

  beforeEach(async () => {
    dashboardService.getAggregate.mockReset();
    dashboardService.getAggregate.mockResolvedValue({
      generatedAt: '2026-04-28T10:00:00.000Z',
      programs: [],
      upcomingSessions: [],
      recentAnnouncements: [],
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: dashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  // Given le module dashboard MVP
  // When on lit ses métadonnées NestJS
  // Then GET /dashboard est exposé
  it('Given le module dashboard MVP, When on lit la route, Then GET /dashboard est exposé', () => {
    expect(Reflect.getMetadata(PATH_METADATA, DashboardController)).toBe(
      'dashboard',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, controller.getAggregate)).toBe(
      RequestMethod.GET,
    );
  });

  // Given un header Authorization Bearer valide
  // When GET /dashboard est appelé
  // Then le token est transmis au service pour agréger le dashboard
  it('Given un header Authorization valide, When getAggregate est appelé, Then le token est transmis au service', async () => {
    await controller.getAggregate('Bearer access-token');

    expect(dashboardService.getAggregate).toHaveBeenCalledWith('access-token');
  });

  // Given un header Authorization absent
  // When GET /dashboard est appelé
  // Then une erreur d'authentification explicite est renvoyée
  it('Given un header Authorization absent, When getAggregate est appelé, Then une UnauthorizedException explicite est renvoyée', async () => {
    let thrownError: unknown;

    try {
      await controller.getAggregate(undefined);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(UnauthorizedException);
    expect((thrownError as UnauthorizedException).getResponse()).toEqual({
      success: false,
      message: "Le header d'autorisation Bearer est requis.",
    });
  });
});
