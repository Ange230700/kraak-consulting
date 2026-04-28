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
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
  };
}

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

  beforeEach(async () => {
    jest.clearAllMocks();

    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });

    const enrollmentQuery = createListQuery({
      data: [
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
              status: 'published',
              visibility: 'participants',
            },
          ],
          cohort: [
            {
              id: 'cohort-1',
              name: 'Cohorte Avril',
              status: 'active',
              start_date: '2026-04-01',
              end_date: null,
            },
          ],
        },
      ],
      error: null,
    });

    const sessionQuery = createListQuery({
      data: [
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
      error: null,
    });

    const announcementQuery = createListQuery({
      data: [
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
      error: null,
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
    const participantQuery = createSingleRowQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.getAggregate('access-token')).resolves.toMatchObject({
      programs: [],
      upcomingSessions: [],
      recentAnnouncements: [],
    });
  });
});
