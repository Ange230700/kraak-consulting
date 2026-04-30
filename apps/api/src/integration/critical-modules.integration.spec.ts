import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AnnouncementsController } from '../announcements/announcements.controller';
import { AnnouncementsService } from '../announcements/announcements.service';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { ProgramsController } from '../programs/programs.controller';
import { ProgramsService } from '../programs/programs.service';
import { ResourcesController } from '../resources/resources.controller';
import { ResourcesService } from '../resources/resources.service';
import { SupportController } from '../support/support.controller';
import { SupportRequestsController } from '../support/support-requests.controller';
import { SupportService } from '../support/support.service';

async function buildHttpApp(options: {
  controllers: unknown[];
  providers: Array<{ provide: unknown; useValue: object }>;
}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: options.controllers,
    providers: options.providers,
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('Critical API Modules Integration', () => {
  describe('AUT-02 Auth endpoints', () => {
    let app: INestApplication;

    const authServiceMock = {
      signIn: jest.fn(),
      getSession: jest.fn(),
    } as Pick<AuthService, 'signIn' | 'getSession'>;

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [AuthController],
        providers: [{ provide: AuthService, useValue: authServiceMock }],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 400 on invalid sign-in payload', async () => {
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: 'invalid-email', password: 'short' })
        .expect(400);

      expect(authServiceMock.signIn).not.toHaveBeenCalled();
    });

    it('returns 401 on missing authorization header for session', async () => {
      await request(app.getHttpServer()).get('/auth/session').expect(401);

      expect(authServiceMock.getSession).not.toHaveBeenCalled();
    });

    it('returns 200 and session context when token is provided', async () => {
      authServiceMock.getSession.mockResolvedValue({
        profile: {
          appUser: {
            id: 'user-1',
            email: 'participant@example.com',
            role: 'participant',
            firstName: 'Ada',
            lastName: 'Lovelace',
            phone: null,
            preferredContactChannel: null,
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          participant: null,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/auth/session')
        .set('authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.profile.appUser.id).toBe('user-1');
      expect(authServiceMock.getSession).toHaveBeenCalledWith('valid-token');
    });
  });

  describe('PRG-02 Programs endpoints', () => {
    let app: INestApplication;

    const programsServiceMock = {
      listPrograms: jest.fn(),
      markSessionProgress: jest.fn(),
    } as Pick<ProgramsService, 'listPrograms' | 'markSessionProgress'>;

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [ProgramsController],
        providers: [
          { provide: ProgramsService, useValue: programsServiceMock },
        ],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 401 on list without auth header', async () => {
      await request(app.getHttpServer()).get('/programs').expect(401);
      expect(programsServiceMock.listPrograms).not.toHaveBeenCalled();
    });

    it('returns 400 on invalid progress payload', async () => {
      await request(app.getHttpServer())
        .post('/programs/program-1/progress')
        .set('authorization', 'Bearer token')
        .send({ completed: true })
        .expect(400);

      expect(programsServiceMock.markSessionProgress).not.toHaveBeenCalled();
    });

    it('returns 200 and updated progress on valid payload', async () => {
      programsServiceMock.markSessionProgress.mockResolvedValue({
        enrollmentId: 'enr-1',
        enrollmentStatus: 'active',
        progress: {
          totalSessions: 10,
          completedSessions: 4,
          completionRate: 40,
          status: 'in_progress',
          completedSessionIds: [
            'session-1',
            'session-2',
            'session-3',
            'session-4',
          ],
          updatedAt: '2026-01-02T10:00:00.000Z',
        },
      });

      const response = await request(app.getHttpServer())
        .post('/programs/program-1/progress')
        .set('authorization', 'Bearer token')
        .send({ sessionId: 'session-4', completed: true })
        .expect(200);

      expect(response.body.enrollmentId).toBe('enr-1');
      expect(programsServiceMock.markSessionProgress).toHaveBeenCalledWith(
        'token',
        'program-1',
        { sessionId: 'session-4', completed: true },
      );
    });
  });

  describe('RES-02 Resources endpoints', () => {
    let app: INestApplication;

    const resourcesServiceMock = {
      listResources: jest.fn(),
      trackResourceConsultation: jest.fn(),
    } as Pick<ResourcesService, 'listResources' | 'trackResourceConsultation'>;

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [ResourcesController],
        providers: [
          { provide: ResourcesService, useValue: resourcesServiceMock },
        ],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      resourcesServiceMock.listResources.mockResolvedValue({
        data: [],
        total: 0,
      });
      resourcesServiceMock.trackResourceConsultation.mockResolvedValue(
        undefined,
      );
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 200 for list endpoint and forwards query options', async () => {
      await request(app.getHttpServer())
        .get('/resources')
        .query({
          resourceTheme: 'training',
          resourceAudience: 'all',
          programId: 'program-1',
        })
        .expect(200);

      expect(resourcesServiceMock.listResources).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceTheme: 'training',
          resourceAudience: 'all',
          programId: 'program-1',
        }),
      );
    });

    it('returns 204 for consultation tracking', async () => {
      await request(app.getHttpServer())
        .post('/resources/resource-1/consultations')
        .expect(204);

      expect(
        resourcesServiceMock.trackResourceConsultation,
      ).toHaveBeenCalledWith('resource-1');
    });
  });

  describe('ANN-02 Announcements endpoints', () => {
    let app: INestApplication;

    const announcementsServiceMock = {
      listAnnouncements: jest.fn(),
      getAnnouncementById: jest.fn(),
    } as Pick<
      AnnouncementsService,
      'listAnnouncements' | 'getAnnouncementById'
    >;

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [AnnouncementsController],
        providers: [
          { provide: AnnouncementsService, useValue: announcementsServiceMock },
        ],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      announcementsServiceMock.listAnnouncements.mockResolvedValue({
        data: [],
        total: 0,
      });
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 401 when authorization header is missing', async () => {
      await request(app.getHttpServer()).get('/announcements').expect(401);
      expect(announcementsServiceMock.listAnnouncements).not.toHaveBeenCalled();
    });

    it('returns 200 on authorized announcements list', async () => {
      await request(app.getHttpServer())
        .get('/announcements')
        .set('authorization', 'Bearer participant-token')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(announcementsServiceMock.listAnnouncements).toHaveBeenCalledWith(
        'participant-token',
        '1',
        '10',
      );
    });
  });

  describe('SUP-01 Support endpoints', () => {
    let app: INestApplication;

    const supportServiceMock = {
      submitContact: jest.fn(),
      listSupportRequests: jest.fn(),
    } as Pick<SupportService, 'submitContact' | 'listSupportRequests'>;

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [SupportController, SupportRequestsController],
        providers: [{ provide: SupportService, useValue: supportServiceMock }],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      supportServiceMock.submitContact.mockResolvedValue({
        success: true,
        message: 'ok',
      });
      supportServiceMock.listSupportRequests.mockResolvedValue([]);
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 400 on invalid contact form payload', async () => {
      await request(app.getHttpServer())
        .post('/support/contact')
        .send({ name: 'A', email: 'bad', subject: 'Hi', message: 'short' })
        .expect(400);

      expect(supportServiceMock.submitContact).not.toHaveBeenCalled();
    });

    it('returns 200 on valid contact submission and forwards token', async () => {
      await request(app.getHttpServer())
        .post('/support/contact')
        .set('authorization', 'Bearer participant-token')
        .send({
          name: 'Grace Hopper',
          email: 'grace@example.com',
          subject: 'Need support',
          message: 'I need help with my cohort enrollment process.',
          category: 'program',
        })
        .expect(200);

      expect(supportServiceMock.submitContact).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'grace@example.com',
          category: 'program',
        }),
        'participant-token',
      );
    });

    it('returns 401 on support requests list without authorization', async () => {
      await request(app.getHttpServer()).get('/support/requests').expect(401);
      expect(supportServiceMock.listSupportRequests).not.toHaveBeenCalled();
    });
  });
});
