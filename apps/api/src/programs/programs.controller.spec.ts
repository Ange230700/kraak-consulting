import {
  BadRequestException,
  NotFoundException,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';

describe('ProgramsController', () => {
  let controller: ProgramsController;
  const programsService = {
    listPrograms: jest.fn(),
    getProgramDetail: jest.fn(),
    markSessionProgress: jest.fn(),
  };

  beforeEach(async () => {
    programsService.listPrograms.mockReset();
    programsService.getProgramDetail.mockReset();
    programsService.markSessionProgress.mockReset();

    programsService.listPrograms.mockResolvedValue([]);
    programsService.getProgramDetail.mockResolvedValue({
      enrollmentId: 'enrollment-1',
      enrollmentStatus: 'active',
      program: {
        id: 'program-1',
        slug: 'leadership-essentials',
        title: 'Leadership Essentials',
        summary: 'Bases du leadership de service.',
        description: 'Parcours complet de leadership.',
        status: 'published',
        visibility: 'participants',
        createdAt: '2026-04-10T10:00:00.000Z',
        updatedAt: '2026-04-10T10:00:00.000Z',
      },
      cohort: null,
      progress: {
        totalSessions: 0,
        completedSessions: 0,
        completionRate: 0,
        status: 'not_started',
        completedSessionIds: [],
        updatedAt: null,
      },
      sessions: [],
      resources: [],
      announcements: [],
    });
    programsService.markSessionProgress.mockResolvedValue({
      enrollmentId: 'enrollment-1',
      enrollmentStatus: 'active',
      progress: {
        totalSessions: 2,
        completedSessions: 1,
        completionRate: 50,
        status: 'in_progress',
        completedSessionIds: ['session-1'],
        updatedAt: '2026-04-29T10:00:00.000Z',
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramsController],
      providers: [
        {
          provide: ProgramsService,
          useValue: programsService,
        },
      ],
    }).compile();

    controller = module.get<ProgramsController>(ProgramsController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  // Given le module programmes MVP
  // When on lit ses métadonnées NestJS
  // Then GET /programs est exposé
  it('Given le module programmes MVP, When on lit la route liste, Then GET /programs est exposé', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ProgramsController)).toBe(
      'programs',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, controller.listPrograms)).toBe(
      RequestMethod.GET,
    );
  });

  // Given le module programmes MVP
  // When on lit ses métadonnées NestJS
  // Then GET /programs/:programId est exposé
  it('Given le module programmes MVP, When on lit la route détail, Then GET /programs/:programId est exposé', () => {
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.getProgramDetail),
    ).toBe(RequestMethod.GET);
    expect(
      Reflect.getMetadata(PATH_METADATA, controller.getProgramDetail),
    ).toBe(':programId');
  });

  // Given un header Authorization Bearer valide
  // When GET /programs est appelé
  // Then le token est transmis au service programmes
  it('Given un header Authorization valide, When listPrograms est appelé, Then le token est transmis au service', async () => {
    await controller.listPrograms('Bearer access-token');

    expect(programsService.listPrograms).toHaveBeenCalledWith('access-token');
  });

  // Given un header Authorization Bearer valide
  // When GET /programs/:programId est appelé
  // Then le token et le programId sont transmis au service
  it('Given un header Authorization valide, When getProgramDetail est appelé, Then le token et le programId sont transmis au service', async () => {
    await controller.getProgramDetail('program-1', 'Bearer access-token');

    expect(programsService.getProgramDetail).toHaveBeenCalledWith(
      'access-token',
      'program-1',
    );
  });

  // Given un header Authorization absent
  // When GET /programs est appelé
  // Then une erreur d'authentification explicite est renvoyée
  it('Given un header Authorization absent, When listPrograms est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(controller.listPrograms()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  // Given un header Authorization absent
  // When GET /programs/:programId est appelé
  // Then une erreur d'authentification explicite est renvoyée
  it('Given un header Authorization absent, When getProgramDetail est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(
      controller.getProgramDetail('program-1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  // Given un programId inaccessible
  // When GET /programs/:programId est appelé
  // Then la NotFoundException du service est propagée
  it('Given un programme inaccessible, When getProgramDetail est appelé, Then une NotFoundException est propagée', async () => {
    programsService.getProgramDetail.mockRejectedValueOnce(
      new NotFoundException({
        success: false,
        message: 'Programme introuvable pour ce participant.',
      }),
    );

    await expect(
      controller.getProgramDetail('program-missing', 'Bearer access-token'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Given un header Authorization valide et un payload progression valide
  // When POST /programs/:programId/progress est appelé
  // Then le service reçoit token, programId et payload normalisé
  it('Given un payload progression valide, When markSessionProgress est appelé, Then le service est appelé avec les bons arguments', async () => {
    await controller.markSessionProgress(
      'program-1',
      {
        sessionId: 'session-1',
        completed: true,
      },
      'Bearer access-token',
    );

    expect(programsService.markSessionProgress).toHaveBeenCalledWith(
      'access-token',
      'program-1',
      {
        sessionId: 'session-1',
        completed: true,
      },
    );
  });

  // Given un payload progression invalide
  // When POST /programs/:programId/progress est appelé
  // Then une BadRequestException explicite est renvoyée
  it('Given un payload progression invalide, When markSessionProgress est appelé, Then une BadRequestException est renvoyée', async () => {
    await expect(
      controller.markSessionProgress(
        'program-1',
        {
          sessionId: '',
          completed: 'yes',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Given un header Authorization absent
  // When POST /programs/:programId/progress est appelé
  // Then une erreur d'authentification explicite est renvoyée
  it('Given un header Authorization absent, When markSessionProgress est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(
      controller.markSessionProgress('program-1', {
        sessionId: 'session-1',
        completed: true,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
