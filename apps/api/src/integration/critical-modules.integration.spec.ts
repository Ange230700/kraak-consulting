import {
  BadRequestException,
  ForbiddenException,
  INestApplication,
  NotFoundException,
  Provider,
  Type,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AnnouncementsController } from '../announcements/announcements.controller';
import { AnnouncementsService } from '../announcements/announcements.service';
import { ArticlesController } from '../articles/articles.controller';
import { ArticlesService } from '../articles/articles.service';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { ProgramsController } from '../programs/programs.controller';
import { ProgramsService } from '../programs/programs.service';
import { ResourcesController } from '../resources/resources.controller';
import { ResourcesService } from '../resources/resources.service';
import { ServicesController } from '../services/services.controller';
import { ServicesService } from '../services/services.service';
import { SupportController } from '../support/support.controller';
import { SupportRequestsController } from '../support/support-requests.controller';
import { SupportService } from '../support/support.service';
import { DashboardController } from '../dashboard/dashboard.controller';
import { DashboardService } from '../dashboard/dashboard.service';
import { ArticlesPublicController } from '../articles/articles-public.controller';

async function buildHttpApp(options: {
  controllers: Array<Type<unknown>>;
  providers: Provider[];
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

    const authServiceMock: jest.Mocked<
      Pick<AuthService, 'signIn' | 'getSession'>
    > = {
      signIn: jest.fn(),
      getSession: jest.fn(),
    };

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
      await (request(app.getHttpServer())
        .get('/auth/session')
        .expect(401) as unknown as Promise<void>);

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

    const programsServiceMock: jest.Mocked<
      Pick<ProgramsService, 'listPrograms' | 'markSessionProgress'>
    > = {
      listPrograms: jest.fn(),
      markSessionProgress: jest.fn(),
    };

    const authServiceMock: jest.Mocked<Pick<AuthService, 'getSession'>> = {
      getSession: jest.fn(),
    };

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [ProgramsController],
        providers: [
          { provide: ProgramsService, useValue: programsServiceMock },
          { provide: AuthService, useValue: authServiceMock },
        ],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 200 on public programs list without auth header', async () => {
      await (request(app.getHttpServer())
        .get('/programs')
        .expect(200) as unknown as Promise<void>);
      expect(programsServiceMock.listPrograms).toHaveBeenCalledTimes(1);
      expect(programsServiceMock.listPrograms).toHaveBeenCalledWith();
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

    const resourcesServiceMock: jest.Mocked<
      Pick<
        ResourcesService,
        'listResources' | 'getResourceById' | 'trackResourceConsultation'
      >
    > = {
      listResources: jest.fn(),
      getResourceById: jest.fn(),
      trackResourceConsultation: jest.fn(),
    };

    const authServiceMock: jest.Mocked<Pick<AuthService, 'getSession'>> = {
      getSession: jest.fn(),
    };

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [ResourcesController],
        providers: [
          { provide: ResourcesService, useValue: resourcesServiceMock },
          { provide: AuthService, useValue: authServiceMock },
        ],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      resourcesServiceMock.listResources.mockResolvedValue({
        data: [],
        total: 0,
      });
      resourcesServiceMock.getResourceById.mockResolvedValue({
        id: 'resource-1',
        programId: 'program-1',
        cohortId: null,
        title: 'Fiche pratique',
        description: 'Document utile',
        resourceType: 'document',
        resourceTheme: 'training',
        resourceAudience: 'all',
        url: null,
        filePath: '/files/resource-1.pdf',
        status: 'published',
        publishedAt: '2026-01-06T10:00:00.000Z',
        createdAt: '2026-01-06T10:00:00.000Z',
        updatedAt: '2026-01-06T10:00:00.000Z',
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
      await (request(app.getHttpServer())
        .post('/resources/resource-1/consultations')
        .expect(204) as unknown as Promise<void>);

      expect(
        resourcesServiceMock.trackResourceConsultation,
      ).toHaveBeenCalledWith('resource-1');
    });

    it('Given a published resource exists, When loading it by id, Then it returns 200 and forwards the identifier', async () => {
      const response = await (request(app.getHttpServer())
        .get('/resources/resource-1')
        .expect(200) as unknown as Promise<{ body: { id: string } }>);

      expect(response.body.id).toBe('resource-1');
      expect(resourcesServiceMock.getResourceById).toHaveBeenCalledWith(
        'resource-1',
      );
    });

    it('Given a published resource is missing, When loading it by id, Then it returns 404', async () => {
      resourcesServiceMock.getResourceById.mockRejectedValueOnce(
        new NotFoundException(
          'Resource with ID resource-404 not found or is not published.',
        ),
      );

      await (request(app.getHttpServer())
        .get('/resources/resource-404')
        .expect(404) as unknown as Promise<void>);

      expect(resourcesServiceMock.getResourceById).toHaveBeenCalledWith(
        'resource-404',
      );
    });
  });

  describe('ANN-02 Announcements endpoints', () => {
    let app: INestApplication;

    const announcementsServiceMock: jest.Mocked<
      Pick<AnnouncementsService, 'listAnnouncements' | 'getAnnouncementById'>
    > = {
      listAnnouncements: jest.fn(),
      getAnnouncementById: jest.fn(),
    };

    const authServiceMock: jest.Mocked<Pick<AuthService, 'getSession'>> = {
      getSession: jest.fn(),
    };

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [AnnouncementsController],
        providers: [
          { provide: AnnouncementsService, useValue: announcementsServiceMock },
          { provide: AuthService, useValue: authServiceMock },
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

    it('returns 200 on public announcements list when authorization header is missing', async () => {
      await (request(app.getHttpServer())
        .get('/announcements')
        .expect(200) as unknown as Promise<void>);
      expect(announcementsServiceMock.listAnnouncements).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
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

  describe('SVC-02 Public services endpoints', () => {
    let app: INestApplication;

    const servicesServiceMock: jest.Mocked<
      Pick<ServicesService, 'listServices' | 'getServiceById'>
    > = {
      listServices: jest.fn(),
      getServiceById: jest.fn(),
    };

    const authServiceMock: jest.Mocked<Pick<AuthService, 'getSession'>> = {
      getSession: jest.fn(),
    };

    const serviceFixture = {
      id: 'service-1',
      title: 'Formation',
      description: 'Accompagner les apprenants',
      icon: 'graduation-cap',
      sortOrder: 1,
      createdAt: '2026-01-03T10:00:00.000Z',
      updatedAt: '2026-01-03T10:00:00.000Z',
    };

    const serviceWithDetailsFixture = {
      ...serviceFixture,
      details: [
        {
          id: 'detail-1',
          serviceId: 'service-1',
          title: 'Ateliers',
          description: 'Ateliers pratiques et ciblés',
          sortOrder: 1,
          createdAt: '2026-01-03T10:00:00.000Z',
          updatedAt: '2026-01-03T10:00:00.000Z',
        },
      ],
    };

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [ServicesController],
        providers: [
          { provide: ServicesService, useValue: servicesServiceMock },
          { provide: AuthService, useValue: authServiceMock },
        ],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      servicesServiceMock.listServices.mockResolvedValue([serviceFixture]);
      servicesServiceMock.getServiceById.mockResolvedValue(
        serviceWithDetailsFixture,
      );
    });

    afterAll(async () => {
      await app.close();
    });

    it('Given public services exist, When listing services, Then it returns 200 and forwards the list', async () => {
      const response = await (request(app.getHttpServer())
        .get('/services')
        .expect(200) as unknown as Promise<{ body: unknown[] }>);

      expect(response.body).toHaveLength(1);
      expect(servicesServiceMock.listServices).toHaveBeenCalledTimes(1);
    });

    it('Given a public service exists, When loading the service detail, Then it returns 200 with the details', async () => {
      const response = await (request(app.getHttpServer())
        .get('/services/service-1')
        .expect(200) as unknown as Promise<{ body: { details: unknown[] } }>);

      expect(response.body.details).toHaveLength(1);
      expect(servicesServiceMock.getServiceById).toHaveBeenCalledWith(
        'service-1',
      );
    });
  });

  describe('ART-01 Public articles endpoints', () => {
    let app: INestApplication;

    const articlesServiceMock: jest.Mocked<
      Pick<ArticlesService, 'listPublicArticles' | 'getPublicArticleBySlug'>
    > = {
      listPublicArticles: jest.fn(),
      getPublicArticleBySlug: jest.fn(),
    };

    const articleFixture = {
      id: 'article-public-1',
      slug: 'integration-in-public',
      title: 'Intégration en pratique',
      excerpt: 'Apprendre à intégrer les parcours',
      content: '<p>Contenu public</p>',
      status: 'published' as const,
      coverImageUrl: null,
      seoTitle: 'Intégration en pratique',
      seoDescription: 'Article public de démonstration',
      publishedAt: '2026-01-04T10:00:00.000Z',
      authorId: 'author-1',
      categories: [],
      tags: [],
      createdAt: '2026-01-04T10:00:00.000Z',
      updatedAt: '2026-01-04T10:00:00.000Z',
    };

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [ArticlesPublicController],
        providers: [
          { provide: ArticlesService, useValue: articlesServiceMock },
        ],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      articlesServiceMock.listPublicArticles.mockResolvedValue([
        articleFixture,
      ]);
      articlesServiceMock.getPublicArticleBySlug.mockResolvedValue(
        articleFixture,
      );
    });

    afterAll(async () => {
      await app.close();
    });

    it('Given public articles exist, When listing articles, Then it returns 200 and forwards the list', async () => {
      const response = await (request(app.getHttpServer())
        .get('/articles')
        .expect(200) as unknown as Promise<{ body: unknown[] }>);

      expect(response.body).toHaveLength(1);
      expect(articlesServiceMock.listPublicArticles).toHaveBeenCalledTimes(1);
    });

    it('Given a public article exists, When loading it by slug, Then it returns 200 and forwards the slug', async () => {
      const response = await (request(app.getHttpServer())
        .get('/articles/integration-in-public')
        .expect(200) as unknown as Promise<{ body: { slug: string } }>);

      expect(response.body.slug).toBe('integration-in-public');
      expect(articlesServiceMock.getPublicArticleBySlug).toHaveBeenCalledWith(
        'integration-in-public',
      );
    });
  });

  describe('DSH-03 Dashboard participant endpoint', () => {
    let app: INestApplication;

    const dashboardServiceMock: jest.Mocked<
      Pick<DashboardService, 'getAggregate'>
    > = {
      getAggregate: jest.fn(),
    };

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [DashboardController],
        providers: [
          { provide: DashboardService, useValue: dashboardServiceMock },
        ],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      dashboardServiceMock.getAggregate.mockResolvedValue({
        generatedAt: '2026-01-05T10:00:00.000Z',
        programs: [],
        upcomingSessions: [],
        recentAnnouncements: [],
      });
    });

    afterAll(async () => {
      await app.close();
    });

    it('Given a missing authorization header, When loading the dashboard, Then it returns 401', async () => {
      await (request(app.getHttpServer())
        .get('/dashboard')
        .expect(401) as unknown as Promise<void>);

      expect(dashboardServiceMock.getAggregate).not.toHaveBeenCalled();
    });

    it('Given a valid access token, When loading the dashboard, Then it returns 200 and forwards the token', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .set('authorization', 'Bearer participant-token')
        .expect(200);

      expect(response.body.generatedAt).toBe('2026-01-05T10:00:00.000Z');
      expect(dashboardServiceMock.getAggregate).toHaveBeenCalledWith(
        'participant-token',
      );
    });
  });

  describe('CMS-02.1 Admin Articles endpoints', () => {
    let app: INestApplication;

    const articlesServiceMock: jest.Mocked<
      Pick<
        ArticlesService,
        | 'listArticles'
        | 'getArticleById'
        | 'createArticle'
        | 'updateArticle'
        | 'deleteArticle'
      >
    > = {
      listArticles: jest.fn(),
      getArticleById: jest.fn(),
      createArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };

    const articleFixture = {
      id: 'article-1',
      slug: 'article-1',
      title: 'Article 1',
      excerpt: 'Résumé article 1',
      content: '<p>Contenu article 1</p>',
      status: 'draft' as const,
      coverImageUrl: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: null,
      authorId: 'author-1',
      categoryIds: ['category-1'],
      tagIds: ['tag-1'],
      createdAt: '2026-05-24T10:00:00.000Z',
      updatedAt: '2026-05-24T10:00:00.000Z',
    };

    beforeAll(async () => {
      app = await buildHttpApp({
        controllers: [ArticlesController],
        providers: [
          { provide: ArticlesService, useValue: articlesServiceMock },
        ],
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      articlesServiceMock.listArticles.mockResolvedValue([articleFixture]);
      articlesServiceMock.getArticleById.mockResolvedValue(articleFixture);
      articlesServiceMock.createArticle.mockResolvedValue(articleFixture);
      articlesServiceMock.updateArticle.mockResolvedValue({
        ...articleFixture,
        title: 'Article 1 mis à jour',
      });
      articlesServiceMock.deleteArticle.mockResolvedValue(undefined);
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 401 on missing authorization header for admin list endpoint', async () => {
      await (request(app.getHttpServer())
        .get('/admin/articles')
        .expect(401) as unknown as Promise<void>);

      expect(articlesServiceMock.listArticles).not.toHaveBeenCalled();
    });

    it('returns 200 on authorized admin list endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/articles')
        .set('authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(articlesServiceMock.listArticles).toHaveBeenCalledWith(
        'admin-token',
      );
    });

    it('returns 403 when the service rejects list access for admin scope', async () => {
      articlesServiceMock.listArticles.mockRejectedValueOnce(
        new ForbiddenException({
          success: false,
          message: 'Accès admin requis.',
        }),
      );

      await request(app.getHttpServer())
        .get('/admin/articles')
        .set('authorization', 'Bearer admin-token')
        .expect(403);

      expect(articlesServiceMock.listArticles).toHaveBeenCalledWith(
        'admin-token',
      );
    });

    it('returns 400 on invalid create payload', async () => {
      await request(app.getHttpServer())
        .post('/admin/articles')
        .set('authorization', 'Bearer admin-token')
        .send({ slug: '' })
        .expect(400);

      expect(articlesServiceMock.createArticle).not.toHaveBeenCalled();
    });

    it('returns 404 when the service reports a missing article on detail endpoint', async () => {
      articlesServiceMock.getArticleById.mockRejectedValueOnce(
        new NotFoundException({
          success: false,
          message: 'Article introuvable.',
        }),
      );

      await request(app.getHttpServer())
        .get('/admin/articles/article-missing')
        .set('authorization', 'Bearer admin-token')
        .expect(404);

      expect(articlesServiceMock.getArticleById).toHaveBeenCalledWith(
        'admin-token',
        'article-missing',
      );
    });

    it('returns 201 on valid create payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/articles')
        .set('authorization', 'Bearer admin-token')
        .send({
          slug: 'article-1',
          title: 'Article 1',
          excerpt: 'Résumé article 1',
          content: '<p>Contenu article 1</p>',
          status: 'draft',
          authorId: 'author-1',
          categoryIds: ['category-1'],
          tagIds: ['tag-1'],
        })
        .expect(201);

      expect(response.body.id).toBe('article-1');
      expect(articlesServiceMock.createArticle).toHaveBeenCalledWith(
        'admin-token',
        expect.objectContaining({
          slug: 'article-1',
          title: 'Article 1',
        }),
      );
    });

    it('returns 200 on valid update payload', async () => {
      const response = await request(app.getHttpServer())
        .patch('/admin/articles/article-1')
        .set('authorization', 'Bearer admin-token')
        .send({ title: 'Article 1 mis à jour' })
        .expect(200);

      expect(response.body.title).toBe('Article 1 mis à jour');
      expect(articlesServiceMock.updateArticle).toHaveBeenCalledWith(
        'admin-token',
        'article-1',
        { title: 'Article 1 mis à jour' },
      );
    });

    it('returns 500 when the service raises an unexpected update error', async () => {
      articlesServiceMock.updateArticle.mockRejectedValueOnce(
        new Error('boom'),
      );

      await request(app.getHttpServer())
        .patch('/admin/articles/article-1')
        .set('authorization', 'Bearer admin-token')
        .send({ title: 'Article 1 mis à jour' })
        .expect(500);

      expect(articlesServiceMock.updateArticle).toHaveBeenCalledWith(
        'admin-token',
        'article-1',
        { title: 'Article 1 mis à jour' },
      );
    });

    it('returns 400 when the service rejects archived category or tag relations', async () => {
      articlesServiceMock.updateArticle.mockRejectedValueOnce(
        new BadRequestException({
          success: false,
          message:
            'Certaines catégories ou certains tags sont introuvables ou archivés.',
        }),
      );

      await request(app.getHttpServer())
        .patch('/admin/articles/article-1')
        .set('authorization', 'Bearer admin-token')
        .send({ categoryIds: ['category-archived'] })
        .expect(400);

      expect(articlesServiceMock.updateArticle).toHaveBeenCalledWith(
        'admin-token',
        'article-1',
        { categoryIds: ['category-archived'] },
      );
    });

    it('returns 204 on delete endpoint and forwards id', async () => {
      await (request(app.getHttpServer())
        .delete('/admin/articles/article-1')
        .set('authorization', 'Bearer admin-token')
        .expect(204) as unknown as Promise<void>);

      expect(articlesServiceMock.deleteArticle).toHaveBeenCalledWith(
        'admin-token',
        'article-1',
      );
    });
  });

  describe('SUP-01 Support endpoints', () => {
    let app: INestApplication;

    const supportServiceMock: jest.Mocked<
      Pick<SupportService, 'submitContact' | 'listSupportRequests'>
    > = {
      submitContact: jest.fn(),
      listSupportRequests: jest.fn(),
    };

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
      await (request(app.getHttpServer())
        .get('/support/requests')
        .expect(401) as unknown as Promise<void>);
      expect(supportServiceMock.listSupportRequests).not.toHaveBeenCalled();
    });
  });
});
