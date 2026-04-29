import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service';
import { ProgramsService } from './programs.service';

function createSingleRowQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function createListQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
  };
}

describe('ProgramsService', () => {
  let service: ProgramsService;

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
        ProgramsService,
        {
          provide: SupabaseService,
          useValue: supabaseService,
        },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  // Given un participant authentifié avec des enrollments visibles
  // When la liste des programmes est demandée
  // Then la liste mappée des programmes est renvoyée
  it('Given un participant authentifié, When listPrograms est appelé, Then les programmes visibles sont renvoyés', async () => {
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
          program: {
            id: 'program-1',
            slug: 'leadership-essentials',
            title: 'Leadership Essentials',
            summary: 'Bases du leadership.',
            description: 'Parcours complet.',
            status: 'published',
            visibility: 'participants',
            created_at: '2026-04-01T00:00:00.000Z',
            updated_at: '2026-04-01T00:00:00.000Z',
          },
          cohort: {
            id: 'cohort-1',
            program_id: 'program-1',
            name: 'Cohorte Avril',
            code: 'APR-26',
            status: 'active',
            start_date: '2026-04-10',
            end_date: null,
            capacity: 25,
            created_at: '2026-04-01T00:00:00.000Z',
            updated_at: '2026-04-01T00:00:00.000Z',
          },
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

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).resolves.toMatchObject([
      {
        enrollmentId: 'enrollment-1',
        enrollmentStatus: 'active',
        program: {
          id: 'program-1',
          slug: 'leadership-essentials',
        },
        cohort: {
          id: 'cohort-1',
          name: 'Cohorte Avril',
        },
      },
    ]);
  });

  // Given un token invalide
  // When une liste programmes est demandée
  // Then une erreur d'authentification explicite est renvoyée
  it('Given un token invalide, When listPrograms est appelé, Then une UnauthorizedException est renvoyée', async () => {
    authClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'invalid token' },
    });

    await expect(service.listPrograms('expired-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  // Given un utilisateur authentifié sans participant lié
  // When la liste programmes est demandée
  // Then une liste vide stable est renvoyée
  it('Given un utilisateur sans participant, When listPrograms est appelé, Then une liste vide est renvoyée', async () => {
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

    await expect(service.listPrograms('access-token')).resolves.toEqual([]);
  });

  // Given une erreur de lecture des enrollments
  // When la liste programmes est demandée
  // Then une InternalServerErrorException explicite est renvoyée
  it('Given une erreur sur enrollment, When listPrograms est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createListQuery({
      data: null,
      error: { message: 'db-error' },
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        return enrollmentQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  // Given un programme accessible avec cohorte
  // When le détail programme est demandé
  // Then le détail inclut sessions, ressources et annonces visibles
  it('Given un programme accessible, When getProgramDetail est appelé, Then le détail agrégé est renvoyé', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentDetailQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        program_id: 'program-1',
        cohort_id: 'cohort-1',
        program: {
          id: 'program-1',
          slug: 'leadership-essentials',
          title: 'Leadership Essentials',
          summary: 'Bases du leadership.',
          description: 'Parcours complet.',
          status: 'published',
          visibility: 'participants',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
        cohort: {
          id: 'cohort-1',
          program_id: 'program-1',
          name: 'Cohorte Avril',
          code: 'APR-26',
          status: 'active',
          start_date: '2026-04-10',
          end_date: null,
          capacity: 25,
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
      },
      error: null,
    });
    const sessionsQuery = createListQuery({
      data: [
        {
          id: 'session-1',
          cohort_id: 'cohort-1',
          title: 'Atelier Vision',
          description: 'Vision et priorités',
          status: 'scheduled',
          starts_at: '2026-05-02T09:00:00.000Z',
          ends_at: '2026-05-02T11:00:00.000Z',
          location_type: 'online',
          location_label: null,
          meeting_link: 'https://meet.example.com/kraak',
          trainer_user_id: null,
          created_at: '2026-04-20T00:00:00.000Z',
          updated_at: '2026-04-20T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const resourcesQuery = createListQuery({
      data: [
        {
          id: 'resource-1',
          program_id: 'program-1',
          cohort_id: null,
          title: 'Guide participant',
          description: null,
          resource_type: 'document',
          url: null,
          file_path: '/resources/guide.pdf',
          status: 'published',
          published_at: '2026-04-21T00:00:00.000Z',
          created_at: '2026-04-20T00:00:00.000Z',
          updated_at: '2026-04-20T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const announcementsQuery = createListQuery({
      data: [
        {
          id: 'announcement-1',
          title: 'Message cohorte',
          audience_type: 'cohort',
          published_at: '2026-04-22T00:00:00.000Z',
          program_id: null,
          cohort_id: 'cohort-1',
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        return enrollmentDetailQuery;
      }

      if (tableName === 'session') {
        return sessionsQuery;
      }

      if (tableName === 'resource') {
        return resourcesQuery;
      }

      if (tableName === 'announcement') {
        return announcementsQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).resolves.toMatchObject({
      enrollmentId: 'enrollment-1',
      program: { id: 'program-1' },
      sessions: [{ id: 'session-1' }],
      resources: [{ id: 'resource-1' }],
      announcements: [{ id: 'announcement-1' }],
    });
  });

  // Given un enrollment introuvable pour le participant
  // When le détail programme est demandé
  // Then une NotFoundException explicite est renvoyée
  it('Given un enrollment introuvable, When getProgramDetail est appelé, Then une NotFoundException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentDetailQuery = createSingleRowQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        return enrollmentDetailQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Given une erreur de lecture des ressources
  // When le détail programme est demandé
  // Then une InternalServerErrorException explicite est renvoyée
  it('Given une erreur sur resource, When getProgramDetail est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentDetailQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        program_id: 'program-1',
        cohort_id: null,
        program: {
          id: 'program-1',
          slug: 'leadership-essentials',
          title: 'Leadership Essentials',
          summary: 'Bases du leadership.',
          description: 'Parcours complet.',
          status: 'published',
          visibility: 'participants',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
        cohort: null,
      },
      error: null,
    });
    const resourcesQuery = createListQuery({
      data: null,
      error: { message: 'db-error' },
    });
    const announcementsQuery = createListQuery({
      data: [],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        return enrollmentDetailQuery;
      }

      if (tableName === 'resource') {
        return resourcesQuery;
      }

      if (tableName === 'announcement') {
        return announcementsQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  // Given des annonces mixtes
  // When le détail programme est demandé
  // Then seules les annonces visibles pour le programme/cohorte sont renvoyées
  it('Given des annonces mixtes, When getProgramDetail est appelé, Then seules les annonces visibles sont conservées', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentDetailQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        program_id: 'program-1',
        cohort_id: 'cohort-1',
        program: {
          id: 'program-1',
          slug: 'leadership-essentials',
          title: 'Leadership Essentials',
          summary: 'Bases du leadership.',
          description: 'Parcours complet.',
          status: 'published',
          visibility: 'participants',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
        cohort: {
          id: 'cohort-1',
          program_id: 'program-1',
          name: 'Cohorte Avril',
          code: null,
          status: 'active',
          start_date: '2026-04-10',
          end_date: null,
          capacity: null,
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
      },
      error: null,
    });
    const sessionsQuery = createListQuery({ data: [], error: null });
    const resourcesQuery = createListQuery({ data: [], error: null });
    const announcementsQuery = createListQuery({
      data: [
        {
          id: 'announcement-visible-all',
          title: 'Visible all',
          audience_type: 'all_participants',
          published_at: '2026-04-25T00:00:00.000Z',
          program_id: null,
          cohort_id: null,
        },
        {
          id: 'announcement-visible-program',
          title: 'Visible program',
          audience_type: 'program',
          published_at: '2026-04-24T00:00:00.000Z',
          program_id: 'program-1',
          cohort_id: null,
        },
        {
          id: 'announcement-visible-cohort',
          title: 'Visible cohort',
          audience_type: 'cohort',
          published_at: '2026-04-23T00:00:00.000Z',
          program_id: null,
          cohort_id: 'cohort-1',
        },
        {
          id: 'announcement-hidden-custom',
          title: 'Hidden custom',
          audience_type: 'custom',
          published_at: '2026-04-22T00:00:00.000Z',
          program_id: null,
          cohort_id: null,
        },
        {
          id: 'announcement-hidden-program',
          title: 'Hidden program',
          audience_type: 'program',
          published_at: '2026-04-21T00:00:00.000Z',
          program_id: 'program-other',
          cohort_id: null,
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        return enrollmentDetailQuery;
      }

      if (tableName === 'session') {
        return sessionsQuery;
      }

      if (tableName === 'resource') {
        return resourcesQuery;
      }

      if (tableName === 'announcement') {
        return announcementsQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).resolves.toMatchObject({
      announcements: [
        { id: 'announcement-visible-all' },
        { id: 'announcement-visible-program' },
        { id: 'announcement-visible-cohort' },
      ],
    });
  });
});
