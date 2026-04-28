import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service';
import { DashboardService } from './dashboard.service';

function createSingleRowQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function createListQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
  };
}

type QueryConfig = {
  participantData?: unknown;
  participantError?: unknown;
  enrollmentData?: unknown;
  enrollmentError?: unknown;
  sessionData?: unknown;
  sessionError?: unknown;
  announcementData?: unknown;
  announcementError?: unknown;
};

describe('DashboardService', () => {
  let service: DashboardService;

  const authClient = {
    auth: {
      getUser: jest.fn(),
    },
  };

  const adminClient = {
    from: jest.fn(),
  };

  const supabaseService = {
    createAuthClient: jest.fn(() => authClient),
    getClient: jest.fn(() => adminClient),
  };

  const defaultConfig = (): QueryConfig => ({
    participantData: { id: 'participant-1' },
    participantError: null,
    enrollmentData: [
      {
        id: 'enrollment-1',
        status: 'active',
        program_id: 'program-1',
        cohort_id: 'cohort-1',
        program: {
          id: 'program-1',
          slug: 'leadership-essentials',
          title: 'Leadership Essentials',
          summary: 'Bases du leadership de service.',
          status: 'published',
          visibility: 'participants',
        },
        cohort: {
          id: 'cohort-1',
          name: 'Cohorte Avril',
          status: 'active',
          start_date: '2026-04-01',
          end_date: null,
        },
      },
    ],
    enrollmentError: null,
    sessionData: [
      {
        id: 'session-1',
        cohort_id: 'cohort-1',
        title: 'Atelier Vision',
        status: 'scheduled',
        starts_at: '2026-04-30T09:00:00.000Z',
        ends_at: '2026-04-30T11:00:00.000Z',
        location_type: 'online',
        location_label: null,
        meeting_link: 'https://meet.example.com/kraak',
        cohort: {
          id: 'cohort-1',
          name: 'Cohorte Avril',
          program: {
            id: 'program-1',
            slug: 'leadership-essentials',
            title: 'Leadership Essentials',
          },
        },
      },
    ],
    sessionError: null,
    announcementData: [
      {
        id: 'announcement-1',
        title: 'Session spéciale mentorat',
        body: 'Une session additionnelle est planifiée vendredi prochain.',
        audience_type: 'all_participants',
        program_id: null,
        cohort_id: null,
        published_at: '2026-04-27T08:00:00.000Z',
      },
    ],
    announcementError: null,
  });

  function mockDashboardQueries(overrides?: QueryConfig) {
    const config = {
      ...defaultConfig(),
      ...overrides,
    };

    const participantQuery = createSingleRowQuery({
      data: config.participantData,
      error: config.participantError,
    });

    const enrollmentQuery = createListQuery({
      data: config.enrollmentData,
      error: config.enrollmentError,
    });

    const sessionQuery = createListQuery({
      data: config.sessionData,
      error: config.sessionError,
    });

    const announcementQuery = createListQuery({
      data: config.announcementData,
      error: config.announcementError,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        return enrollmentQuery;
      }

      if (tableName === 'session') {
        return sessionQuery;
      }

      if (tableName === 'announcement') {
        return announcementQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDashboardQueries();

    authClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
        },
      },
      error: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: SupabaseService,
          useValue: supabaseService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  // Given un participant authentifié avec des données dashboard
  // When l'agrégat est demandé
  // Then le service renvoie les programmes, sessions à venir et annonces récentes
  it('Given un participant authentifié, When getAggregate est appelé, Then les blocs dashboard agrégés sont renvoyés', async () => {
    await expect(service.getAggregate('access-token')).resolves.toMatchObject({
      programs: [
        {
          enrollmentId: 'enrollment-1',
          programId: 'program-1',
          title: 'Leadership Essentials',
          enrollmentStatus: 'active',
        },
      ],
      upcomingSessions: [
        {
          id: 'session-1',
          title: 'Atelier Vision',
          programId: 'program-1',
          programTitle: 'Leadership Essentials',
        },
      ],
      recentAnnouncements: [
        {
          id: 'announcement-1',
          title: 'Session spéciale mentorat',
          audienceType: 'all_participants',
        },
      ],
    });
  });

  // Given un token invalide
  // When l'agrégat dashboard est demandé
  // Then une erreur d'authentification explicite est renvoyée
  it('Given un token invalide, When getAggregate est appelé, Then une UnauthorizedException explicite est renvoyée', async () => {
    authClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'invalid token' },
    });

    await expect(service.getAggregate('expired-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  // Given un utilisateur authentifié sans participant lié
  // When l'agrégat dashboard est demandé
  // Then une réponse vide et stable est renvoyée
  it('Given un utilisateur sans participant, When getAggregate est appelé, Then une réponse vide est renvoyée', async () => {
    mockDashboardQueries({
      participantData: null,
    });

    await expect(service.getAggregate('access-token')).resolves.toMatchObject({
      programs: [],
      upcomingSessions: [],
      recentAnnouncements: [],
    });
  });

  // Given une liste d'annonces mixte
  // When l'agrégat dashboard est construit
  // Then seules les annonces visibles du participant sont conservées
  it('Given des annonces mixtes, When getAggregate est appelé, Then seules les annonces visibles sont renvoyées', async () => {
    mockDashboardQueries({
      announcementData: [
        {
          id: 'announcement-custom',
          title: 'Annonce custom',
          body: 'Non visible',
          audience_type: 'custom',
          program_id: null,
          cohort_id: null,
          published_at: '2026-05-01T11:00:00.000Z',
        },
        {
          id: 'announcement-program',
          title: 'Annonce programme',
          body: 'Visible via programme',
          audience_type: 'program',
          program_id: 'program-1',
          cohort_id: null,
          published_at: '2026-05-01T10:00:00.000Z',
        },
        {
          id: 'announcement-cohort',
          title: 'Annonce cohorte',
          body: 'Visible via cohorte',
          audience_type: 'cohort',
          program_id: null,
          cohort_id: 'cohort-1',
          published_at: '2026-05-01T09:00:00.000Z',
        },
      ],
    });

    await expect(service.getAggregate('access-token')).resolves.toMatchObject({
      recentAnnouncements: [
        {
          id: 'announcement-program',
        },
        {
          id: 'announcement-cohort',
        },
      ],
    });
  });

  // Given une erreur de lecture des annonces
  // When l'agrégat dashboard est demandé
  // Then une erreur serveur explicite est renvoyée
  it('Given une erreur de base sur les annonces, When getAggregate est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    mockDashboardQueries({
      announcementData: null,
      announcementError: { message: 'db-error' },
    });

    await expect(service.getAggregate('access-token')).rejects.toMatchObject({
      response: {
        success: false,
        message: 'Impossible de charger les annonces du dashboard.',
      },
    });
  });

  // Given une erreur de lecture du participant
  // When l'agrégat dashboard est demandé
  // Then une erreur serveur explicite est renvoyée
  it('Given une erreur sur participant, When getAggregate est appelé, Then une InternalServerErrorException explicite est renvoyée', async () => {
    mockDashboardQueries({
      participantData: null,
      participantError: { message: 'db-error' },
    });

    await expect(service.getAggregate('access-token')).rejects.toMatchObject({
      response: {
        success: false,
        message: 'Impossible de charger le participant courant.',
      },
    });
  });

  // Given une erreur de lecture des programmes
  // When l'agrégat dashboard est demandé
  // Then une erreur serveur explicite est renvoyée
  it('Given une erreur sur enrollment, When getAggregate est appelé, Then une InternalServerErrorException explicite est renvoyée', async () => {
    mockDashboardQueries({
      enrollmentData: null,
      enrollmentError: { message: 'db-error' },
    });

    await expect(service.getAggregate('access-token')).rejects.toMatchObject({
      response: {
        success: false,
        message: 'Impossible de charger les programmes du dashboard.',
      },
    });
  });

  // Given une erreur de lecture des sessions
  // When l'agrégat dashboard est demandé
  // Then une erreur serveur explicite est renvoyée
  it('Given une erreur sur session, When getAggregate est appelé, Then une InternalServerErrorException explicite est renvoyée', async () => {
    mockDashboardQueries({
      sessionData: null,
      sessionError: { message: 'db-error' },
    });

    await expect(service.getAggregate('access-token')).rejects.toMatchObject({
      response: {
        success: false,
        message: 'Impossible de charger les sessions à venir du dashboard.',
      },
    });
  });

  // Given des relations imbriquées renvoyées sous forme de tableau
  // When l'agrégat dashboard est demandé
  // Then le service normalise les relations et conserve les données utiles
  it('Given des relations en tableau, When getAggregate est appelé, Then la normalisation garde les données attendues', async () => {
    mockDashboardQueries({
      enrollmentData: [
        {
          id: 'enrollment-1',
          status: 'active',
          program_id: 'program-1',
          cohort_id: 'cohort-1',
          program: [
            {
              id: 'program-1',
              slug: 'leadership-essentials',
              title: 'Leadership Essentials',
              summary: 'Bases du leadership de service.',
            },
          ],
          cohort: [
            {
              id: 'cohort-1',
              name: 'Cohorte Avril',
              status: 'active',
              start_date: '2026-04-01',
            },
          ],
        },
      ],
      sessionData: [
        {
          id: 'session-1',
          cohort_id: 'cohort-1',
          title: 'Atelier Vision',
          status: 'scheduled',
          starts_at: '2026-04-30T09:00:00.000Z',
          ends_at: '2026-04-30T11:00:00.000Z',
          location_type: 'online',
          location_label: null,
          meeting_link: 'https://meet.example.com/kraak',
          cohort: [
            {
              id: 'cohort-1',
              name: 'Cohorte Avril',
              program: [
                {
                  id: 'program-1',
                  slug: 'leadership-essentials',
                  title: 'Leadership Essentials',
                },
              ],
            },
          ],
        },
      ],
    });

    await expect(service.getAggregate('access-token')).resolves.toMatchObject({
      programs: [
        {
          title: 'Leadership Essentials',
        },
      ],
      upcomingSessions: [
        {
          programTitle: 'Leadership Essentials',
        },
      ],
    });
  });
});
