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

function createListQuery(result: {
  data: unknown;
  error: unknown;
  count?: number | null;
}) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockResolvedValue(result),
  };
}

function createUpdateQuery(result: { error: unknown }) {
  return {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue(result),
  };
}

function createProgramMutationQuery(result: { data: unknown; error: unknown }) {
  const query = {
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
  };

  return query;
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
          completed_at: null,
          program_id: 'program-1',
          cohort_id: 'cohort-1',
          progress_completed_session_ids: ['session-1'],
          progress_updated_at: '2026-04-29T10:00:00.000Z',
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
    const sessionsByCohortQuery = createListQuery({
      data: [{ id: 'session-1', cohort_id: 'cohort-1' }],
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
        return sessionsByCohortQuery;
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

  it('Given aucune session utilisateur, When listPrograms est appelé sans token, Then les programmes publiés sont renvoyés', async () => {
    const publishedQuery = createListQuery({
      data: [
        {
          id: 'program-public-1',
          slug: 'leadership-public',
          title: 'Leadership Public',
          summary: 'Résumé public',
          description: 'Description publique',
          status: 'published',
          visibility: 'public',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
      ],
      error: null,
    });

    adminClient.from.mockReturnValue(publishedQuery);

    await expect(service.listPrograms()).resolves.toMatchObject([
      {
        id: 'program-public-1',
        slug: 'leadership-public',
        status: 'published',
      },
    ]);

    expect(publishedQuery.eq).toHaveBeenCalledWith('status', 'published');
  });

  it('Given une erreur DB sur les programmes publiés, When listPrograms est appelé sans token, Then une InternalServerErrorException est renvoyée', async () => {
    const publishedQuery = createListQuery({
      data: null,
      error: { message: 'db-error' },
    });

    adminClient.from.mockReturnValue(publishedQuery);

    await expect(service.listPrograms()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('Given aucun programme publié avec data null sans erreur, When listPrograms est appelé sans token, Then une liste vide est renvoyée', async () => {
    const publishedQuery = createListQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockReturnValue(publishedQuery);

    await expect(service.listPrograms()).resolves.toEqual([]);
  });

  it('Given une session admin, When listAllPrograms est appelé, Then tous les programmes sont renvoyés', async () => {
    const adminQuery = createListQuery({
      data: [
        {
          id: 'program-1',
          slug: 'leadership-essentials',
          title: 'Leadership Essentials',
          summary: 'Bases du leadership.',
          description: 'Parcours complet.',
          status: 'draft',
          visibility: 'private',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
      ],
      error: null,
      count: 1,
    });

    adminClient.from.mockReturnValue(adminQuery);

    const result = await service.listAllPrograms();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'program-1',
      status: 'draft',
    });
  });

  it('Given une erreur DB, When listAllPrograms est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const adminQuery = createListQuery({
      data: null,
      error: { message: 'db-error' },
    });

    adminClient.from.mockReturnValue(adminQuery);

    await expect(service.listAllPrograms()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('Given aucun programme en base, When listAllPrograms est appelé, Then une liste vide est renvoyée', async () => {
    const adminQuery = createListQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockReturnValue(adminQuery);

    await expect(service.listAllPrograms()).resolves.toEqual([]);
  });

  it('Given un payload création programme, When createProgram est appelé, Then le programme est inséré et mappé', async () => {
    const mutationQuery = createProgramMutationQuery({
      data: {
        id: 'program-2',
        slug: 'new-program',
        title: 'New Program',
        summary: 'Summary',
        description: 'Description',
        status: 'draft',
        visibility: 'private',
        created_at: '2026-04-10T10:00:00.000Z',
        updated_at: '2026-04-10T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(
      service.createProgram({
        slug: 'new-program',
        title: 'New Program',
        summary: 'Summary',
        description: 'Description',
        status: 'draft',
        visibility: 'private',
      }),
    ).resolves.toMatchObject({
      id: 'program-2',
      slug: 'new-program',
    });

    expect(mutationQuery.insert).toHaveBeenCalledWith({
      slug: 'new-program',
      title: 'New Program',
      summary: 'Summary',
      description: 'Description',
      status: 'draft',
      visibility: 'private',
    });
  });

  it('Given une erreur de création programme, When createProgram est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const mutationQuery = createProgramMutationQuery({
      data: null,
      error: { message: 'insert error' },
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(
      service.createProgram({
        slug: 'new-program',
        title: 'New Program',
        summary: 'Summary',
        description: 'Description',
        status: 'draft',
        visibility: 'private',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('Given un payload mise à jour programme, When updateProgram est appelé, Then le programme est mis à jour', async () => {
    const mutationQuery = createProgramMutationQuery({
      data: {
        id: 'program-1',
        slug: 'leadership-essentials',
        title: 'Leadership Essentials',
        summary: 'Bases du leadership.',
        description: 'Parcours complet.',
        status: 'published',
        visibility: 'participants',
        created_at: '2026-04-01T00:00:00.000Z',
        updated_at: '2026-04-10T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(
      service.updateProgram('program-1', {
        title: 'Leadership Essentials',
        status: 'published',
        visibility: 'participants',
      }),
    ).resolves.toMatchObject({
      id: 'program-1',
      status: 'published',
    });

    expect(mutationQuery.update).toHaveBeenCalledWith({
      title: 'Leadership Essentials',
      status: 'published',
      visibility: 'participants',
    });
    expect(mutationQuery.eq).toHaveBeenCalledWith('id', 'program-1');
  });

  it('Given un payload complet, When updateProgram est appelé, Then tous les champs modifiables sont transmis', async () => {
    const mutationQuery = createProgramMutationQuery({
      data: {
        id: 'program-1',
        slug: 'leadership-advanced',
        title: 'Leadership Advanced',
        summary: 'Résumé avancé',
        description: 'Description avancée',
        status: 'published',
        visibility: 'participants',
        created_at: '2026-04-01T00:00:00.000Z',
        updated_at: '2026-04-10T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(
      service.updateProgram('program-1', {
        slug: 'leadership-advanced',
        title: 'Leadership Advanced',
        summary: 'Résumé avancé',
        description: 'Description avancée',
        status: 'published',
        visibility: 'participants',
      }),
    ).resolves.toMatchObject({ id: 'program-1', slug: 'leadership-advanced' });

    expect(mutationQuery.update).toHaveBeenCalledWith({
      slug: 'leadership-advanced',
      title: 'Leadership Advanced',
      summary: 'Résumé avancé',
      description: 'Description avancée',
      status: 'published',
      visibility: 'participants',
    });
  });

  it('Given un update sans erreur technique mais sans data, When updateProgram est appelé, Then une NotFoundException est renvoyée', async () => {
    const mutationQuery = createProgramMutationQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(
      service.updateProgram('program-missing', {
        title: 'Programme mis à jour',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given un programme existant, When deleteProgram est appelé, Then le programme est archivé', async () => {
    const mutationQuery = createProgramMutationQuery({
      data: { id: 'program-1' },
      error: null,
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(service.deleteProgram('program-1')).resolves.toBeUndefined();

    expect(mutationQuery.update).toHaveBeenCalledWith({ status: 'archived' });
  });

  it('Given un programme introuvable, When deleteProgram est appelé, Then une NotFoundException est renvoyée', async () => {
    const mutationQuery = createProgramMutationQuery({
      data: null,
      error: { message: 'not-found' },
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(
      service.deleteProgram('program-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given des fonctionnalités programme existantes, When listProgramFeatures est appelé, Then la liste triée est mappée', async () => {
    const programQuery = createSingleRowQuery({
      data: {
        id: 'program-1',
        status: 'published',
        visibility: 'public',
      },
      error: null,
    });
    const featureQuery = createListQuery({
      data: [
        {
          id: 'feature-1',
          program_id: 'program-1',
          title: 'Mentorat',
          sort_order: 1,
          created_at: '2026-04-29T10:00:00.000Z',
          updated_at: '2026-04-29T10:00:00.000Z',
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'program') {
        return programQuery;
      }

      if (table === 'program_feature') {
        return featureQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(service.listProgramFeatures('program-1')).resolves.toEqual([
      {
        id: 'feature-1',
        programId: 'program-1',
        title: 'Mentorat',
        sortOrder: 1,
        createdAt: '2026-04-29T10:00:00.000Z',
        updatedAt: '2026-04-29T10:00:00.000Z',
      },
    ]);
  });

  it('Given une erreur DB sur les fonctionnalités, When listProgramFeatures est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const programQuery = createSingleRowQuery({
      data: {
        id: 'program-1',
        status: 'published',
        visibility: 'public',
      },
      error: null,
    });
    const featureQuery = createListQuery({
      data: null,
      error: { message: 'feature-db-error' },
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'program') {
        return programQuery;
      }

      if (table === 'program_feature') {
        return featureQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      service.listProgramFeatures('program-1'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('Given des fonctionnalités nulles sans erreur, When listProgramFeatures est appelé, Then une liste vide est renvoyée', async () => {
    const programQuery = createSingleRowQuery({
      data: {
        id: 'program-1',
        status: 'published',
        visibility: 'public',
      },
      error: null,
    });
    const featureQuery = createListQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'program') {
        return programQuery;
      }

      if (table === 'program_feature') {
        return featureQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(service.listProgramFeatures('program-1')).resolves.toEqual([]);
  });

  it('Given un programme non public, When listProgramFeatures est appelé, Then une NotFoundException est renvoyée', async () => {
    const programQuery = createSingleRowQuery({
      data: {
        id: 'program-1',
        status: 'draft',
        visibility: 'private',
      },
      error: null,
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'program') {
        return programQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      service.listProgramFeatures('program-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given un programme existant, When createProgramFeature est appelé, Then la fonctionnalité est créée', async () => {
    const programLookupQuery = createProgramMutationQuery({
      data: { id: 'program-1' },
      error: null,
    });
    const featureMutationQuery = createProgramMutationQuery({
      data: {
        id: 'feature-1',
        program_id: 'program-1',
        title: 'Mentorat',
        sort_order: 2,
        created_at: '2026-04-29T10:00:00.000Z',
        updated_at: '2026-04-29T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'program') {
        return programLookupQuery;
      }

      if (table === 'program_feature') {
        return featureMutationQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      service.createProgramFeature('program-1', {
        title: 'Mentorat',
        sortOrder: 2,
      }),
    ).resolves.toMatchObject({
      id: 'feature-1',
      programId: 'program-1',
    });
  });

  it('Given un payload sans sortOrder, When createProgramFeature est appelé, Then sort_order par défaut vaut 0', async () => {
    const programLookupQuery = createProgramMutationQuery({
      data: { id: 'program-1' },
      error: null,
    });
    const featureMutationQuery = createProgramMutationQuery({
      data: {
        id: 'feature-1',
        program_id: 'program-1',
        title: 'Mentorat',
        sort_order: 0,
        created_at: '2026-04-29T10:00:00.000Z',
        updated_at: '2026-04-29T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'program') {
        return programLookupQuery;
      }

      if (table === 'program_feature') {
        return featureMutationQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      service.createProgramFeature('program-1', {
        title: 'Mentorat',
      }),
    ).resolves.toMatchObject({ id: 'feature-1', sortOrder: 0 });

    expect(featureMutationQuery.insert).toHaveBeenCalledWith({
      program_id: 'program-1',
      title: 'Mentorat',
      sort_order: 0,
    });
  });

  it('Given une erreur à la création de fonctionnalité, When createProgramFeature est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const programLookupQuery = createProgramMutationQuery({
      data: { id: 'program-1' },
      error: null,
    });
    const featureMutationQuery = createProgramMutationQuery({
      data: null,
      error: { message: 'feature insert error' },
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'program') {
        return programLookupQuery;
      }

      if (table === 'program_feature') {
        return featureMutationQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      service.createProgramFeature('program-1', {
        title: 'Mentorat',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('Given un programme introuvable, When createProgramFeature est appelé, Then une NotFoundException est renvoyée', async () => {
    const programLookupQuery = createProgramMutationQuery({
      data: null,
      error: { message: 'program-not-found' },
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'program') {
        return programLookupQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      service.createProgramFeature('program-missing', {
        title: 'Mentorat',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given une fonctionnalité programme existante, When updateProgramFeature est appelé, Then la fonctionnalité est mise à jour', async () => {
    const featureMutationQuery = createProgramMutationQuery({
      data: {
        id: 'feature-1',
        program_id: 'program-1',
        title: 'Mentorat avancé',
        sort_order: 3,
        created_at: '2026-04-29T10:00:00.000Z',
        updated_at: '2026-04-30T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockReturnValue(featureMutationQuery);

    await expect(
      service.updateProgramFeature('program-1', 'feature-1', {
        title: 'Mentorat avancé',
        sortOrder: 3,
      }),
    ).resolves.toMatchObject({
      id: 'feature-1',
      sortOrder: 3,
    });

    expect(featureMutationQuery.eq).toHaveBeenNthCalledWith(
      1,
      'program_id',
      'program-1',
    );
    expect(featureMutationQuery.eq).toHaveBeenNthCalledWith(
      2,
      'id',
      'feature-1',
    );
  });

  it('Given une fonctionnalité introuvable, When updateProgramFeature est appelé, Then une NotFoundException est renvoyée', async () => {
    const featureMutationQuery = createProgramMutationQuery({
      data: null,
      error: { message: 'feature not found' },
    });

    adminClient.from.mockReturnValue(featureMutationQuery);

    await expect(
      service.updateProgramFeature('program-1', 'feature-missing', {
        title: 'Nouveau titre',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given une fonctionnalité programme existante, When deleteProgramFeature est appelé, Then la suppression est effectuée', async () => {
    const featureMutationQuery = createProgramMutationQuery({
      data: { id: 'feature-1' },
      error: null,
    });

    adminClient.from.mockReturnValue(featureMutationQuery);

    await expect(
      service.deleteProgramFeature('program-1', 'feature-1'),
    ).resolves.toBeUndefined();

    expect(featureMutationQuery.delete).toHaveBeenCalledTimes(1);
  });

  it('Given une fonctionnalité introuvable, When deleteProgramFeature est appelé, Then une NotFoundException est renvoyée', async () => {
    const featureMutationQuery = createProgramMutationQuery({
      data: null,
      error: { message: 'feature not found' },
    });

    adminClient.from.mockReturnValue(featureMutationQuery);

    await expect(
      service.deleteProgramFeature('program-1', 'feature-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given un programme introuvable, When listProgramFeatures est appelé, Then une NotFoundException est renvoyée', async () => {
    const programQuery = createSingleRowQuery({
      data: null,
      error: { message: 'program-not-found' },
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'program') {
        return programQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      service.listProgramFeatures('program-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Given plus de 200 sessions visibles sur une cohorte
  // When listPrograms est appelé
  // Then le total de progression utilise toutes les pages de sessions
  it("Given des sessions paginées, When listPrograms est appelé, Then la progression n'est pas tronquée", async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createListQuery({
      data: [
        {
          id: 'enrollment-1',
          status: 'active',
          completed_at: null,
          program_id: 'program-1',
          cohort_id: 'cohort-1',
          progress_completed_session_ids: ['session-201'],
          progress_updated_at: '2026-04-29T10:00:00.000Z',
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
    const firstPage = Array.from({ length: 200 }, (_, index) => ({
      id: `session-${index + 1}`,
      cohort_id: 'cohort-1',
    }));
    const pagedSessionsByCohortQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest
        .fn()
        .mockResolvedValueOnce({ data: firstPage, error: null })
        .mockResolvedValueOnce({
          data: [{ id: 'session-201', cohort_id: 'cohort-1' }],
          error: null,
        }),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        return enrollmentQuery;
      }

      if (tableName === 'session') {
        return pagedSessionsByCohortQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).resolves.toMatchObject([
      {
        enrollmentId: 'enrollment-1',
        progress: {
          totalSessions: 201,
          completedSessions: 1,
        },
      },
    ]);

    expect(pagedSessionsByCohortQuery.range).toHaveBeenCalledTimes(2);
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

  it('Given un fallback enrollment sans données, When listPrograms est appelé, Then une liste vide est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createListQuery({
      data: null,
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

    await expect(service.listPrograms('access-token')).resolves.toEqual([]);
  });

  // Given un schéma staging sans colonnes de progression enrollment
  // When la liste programmes est demandée
  // Then un fallback sans colonnes de progression est utilisé
  it('Given des colonnes de progression absentes, When listPrograms est appelé, Then les programmes restent renvoyés avec une progression vide', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQueryWithMissingProgress = createListQuery({
      data: null,
      error: {
        code: '42703',
        message:
          'column enrollment.progress_completed_session_ids does not exist',
      },
    });
    const enrollmentFallbackQuery = createListQuery({
      data: [
        {
          id: 'enrollment-1',
          status: 'active',
          completed_at: null,
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
    const sessionsByCohortQuery = createListQuery({
      data: [{ id: 'session-1', cohort_id: 'cohort-1' }],
      error: null,
    });

    let enrollmentCalls = 0;
    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        enrollmentCalls += 1;
        return enrollmentCalls === 1
          ? enrollmentQueryWithMissingProgress
          : enrollmentFallbackQuery;
      }

      if (tableName === 'session') {
        return sessionsByCohortQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).resolves.toMatchObject([
      {
        enrollmentId: 'enrollment-1',
        progress: {
          totalSessions: 1,
          completedSessions: 0,
        },
      },
    ]);
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

  // Given un marquage de session valide pour un participant
  // When markSessionProgress est appelé
  // Then la progression est mise à jour et renvoyée
  it('Given un marquage progression valide, When markSessionProgress est appelé, Then la progression est persistée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentSelectQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        completed_at: null,
        program_id: 'program-1',
        cohort_id: 'cohort-1',
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const sessionsQuery = createListQuery({
      data: [
        {
          id: 'session-1',
          cohort_id: 'cohort-1',
          title: 'Atelier Vision',
          description: null,
          status: 'scheduled',
          starts_at: '2026-05-02T09:00:00.000Z',
          ends_at: '2026-05-02T11:00:00.000Z',
          location_type: 'online',
          location_label: null,
          meeting_link: null,
          trainer_user_id: null,
          created_at: '2026-04-20T00:00:00.000Z',
          updated_at: '2026-04-20T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const enrollmentUpdateQuery = createUpdateQuery({ error: null });

    let enrollmentCalls = 0;
    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        enrollmentCalls += 1;
        return enrollmentCalls === 1
          ? enrollmentSelectQuery
          : enrollmentUpdateQuery;
      }

      if (tableName === 'session') {
        return sessionsQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-1',
        completed: true,
      }),
    ).resolves.toMatchObject({
      enrollmentId: 'enrollment-1',
      enrollmentStatus: 'completed',
      progress: {
        totalSessions: 1,
        completedSessions: 1,
        completionRate: 100,
        status: 'completed',
        completedSessionIds: ['session-1'],
      },
    });
  });

  // Given une session hors du programme
  // When markSessionProgress est appelé
  // Then une NotFoundException est renvoyée
  it('Given une session hors programme, When markSessionProgress est appelé, Then une NotFoundException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentSelectQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        completed_at: null,
        program_id: 'program-1',
        cohort_id: 'cohort-1',
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const sessionsQuery = createListQuery({
      data: [
        {
          id: 'session-1',
          cohort_id: 'cohort-1',
          title: 'Atelier Vision',
          description: null,
          status: 'scheduled',
          starts_at: '2026-05-02T09:00:00.000Z',
          ends_at: '2026-05-02T11:00:00.000Z',
          location_type: 'online',
          location_label: null,
          meeting_link: null,
          trainer_user_id: null,
          created_at: '2026-04-20T00:00:00.000Z',
          updated_at: '2026-04-20T00:00:00.000Z',
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        return enrollmentSelectQuery;
      }

      if (tableName === 'session') {
        return sessionsQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-unknown',
        completed: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Given un enrollment avec cohort en tableau (retour Supabase)
  // When listPrograms est appelé
  // Then normalizeRelation extrait le premier élément du tableau
  it('Given un cohort en tableau dans enrollment, When listPrograms est appelé, Then normalizeRelation extrait le premier élément', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const cohortObj = {
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
    };
    const enrollmentQuery = createListQuery({
      data: [
        {
          id: 'enrollment-1',
          status: 'active',
          completed_at: null,
          program_id: 'program-1',
          cohort_id: 'cohort-1',
          progress_completed_session_ids: [],
          progress_updated_at: null,
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
          cohort: [cohortObj],
        },
      ],
      error: null,
    });
    const sessionsQuery = createListQuery({
      data: [{ id: 'session-1', cohort_id: 'cohort-1' }],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentQuery;
      if (tableName === 'session') return sessionsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).resolves.toMatchObject([
      { enrollmentId: 'enrollment-1', cohort: { id: 'cohort-1' } },
    ]);
  });

  // Given un enrollment dont le programme est null
  // When listPrograms est appelé
  // Then l'enrollment sans programme est filtré de la liste
  it("Given un enrollment sans programme, When listPrograms est appelé, Then l'enrollment sans programme est filtré", async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createListQuery({
      data: [
        {
          id: 'enrollment-null-program',
          status: 'active',
          completed_at: null,
          program_id: 'program-1',
          cohort_id: null,
          progress_completed_session_ids: [],
          progress_updated_at: null,
          program: null,
          cohort: null,
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).resolves.toEqual([]);
  });

  // Given des enrollments sans cohorte
  // When listPrograms est appelé
  // Then readSessionIdsByCohort reçoit un tableau vide et renvoie une Map vide
  it('Given des enrollments sans cohorte, When listPrograms est appelé, Then les programmes sans sessions sont renvoyés', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createListQuery({
      data: [
        {
          id: 'enrollment-1',
          status: 'active',
          completed_at: null,
          program_id: 'program-1',
          cohort_id: null,
          progress_completed_session_ids: [],
          progress_updated_at: null,
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
      ],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).resolves.toMatchObject([
      { enrollmentId: 'enrollment-1', cohort: null },
    ]);
  });

  it('Given des sessions cohort paginées avec data null, When listPrograms est appelé, Then le fallback de pagination produit une progression à zéro', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createListQuery({
      data: [
        {
          id: 'enrollment-1',
          status: 'active',
          completed_at: null,
          program_id: 'program-1',
          cohort_id: 'cohort-1',
          progress_completed_session_ids: ['session-unknown'],
          progress_updated_at: null,
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
    const sessionsByCohortQuery = createListQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentQuery;
      if (tableName === 'session') return sessionsByCohortQuery;

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).resolves.toMatchObject([
      {
        enrollmentId: 'enrollment-1',
        progress: {
          totalSessions: 0,
          completedSessions: 0,
        },
      },
    ]);
  });

  // Given une erreur DB sur le participant dans resolveParticipantId
  // When listPrograms est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given une erreur DB sur participant dans resolveParticipantId, When listPrograms est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: null,
      error: { message: 'participant db error' },
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  // Given un utilisateur authentifié sans participant lié
  // When getProgramDetail est appelé
  // Then une NotFoundException est renvoyée
  it('Given un utilisateur sans participant, When getProgramDetail est appelé, Then une NotFoundException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Given un enrollment avec programme null
  // When getProgramDetail est appelé
  // Then une NotFoundException est renvoyée
  it('Given un enrollment avec programme null, When getProgramDetail est appelé, Then une NotFoundException est renvoyée', async () => {
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
        progress_completed_session_ids: [],
        progress_updated_at: null,
        program: null,
        cohort: null,
      },
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Given une erreur DB sur enrollment dans getProgramDetail
  // When getProgramDetail est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given une erreur DB sur enrollment, When getProgramDetail est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentDetailQuery = createSingleRowQuery({
      data: null,
      error: { message: 'enrollment db error' },
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  // Given un schéma staging sans colonnes de progression enrollment
  // When le détail programme est demandé
  // Then le fallback d'enrollment sans progression permet de charger le détail
  it('Given des colonnes de progression absentes, When getProgramDetail est appelé, Then le détail programme reste disponible', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQueryWithMissingProgress = createSingleRowQuery({
      data: null,
      error: {
        code: '42703',
        message: 'column enrollment.progress_updated_at does not exist',
      },
    });
    const enrollmentFallbackQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        completed_at: null,
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
    const resourcesQuery = createListQuery({ data: [], error: null });
    const announcementsQuery = createListQuery({ data: [], error: null });

    let enrollmentCalls = 0;
    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        enrollmentCalls += 1;
        return enrollmentCalls === 1
          ? enrollmentQueryWithMissingProgress
          : enrollmentFallbackQuery;
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
      progress: {
        totalSessions: 1,
        completedSessions: 0,
      },
    });
  });

  // Given une requête sessions avec data null sans erreur
  // When getProgramDetail est appelé
  // Then les sessions sont vides et la progression reste calculée
  it('Given des sessions null sans erreur, When getProgramDetail est appelé, Then le détail renvoie une liste de sessions vide', async () => {
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
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const sessionsQuery = createListQuery({
      data: null,
      error: null,
    });
    const resourcesQuery = createListQuery({ data: [], error: null });
    const announcementsQuery = createListQuery({ data: [], error: null });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      if (tableName === 'session') return sessionsQuery;
      if (tableName === 'resource') return resourcesQuery;
      if (tableName === 'announcement') return announcementsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).resolves.toMatchObject({
      enrollmentId: 'enrollment-1',
      sessions: [],
      progress: {
        totalSessions: 0,
        completedSessions: 0,
      },
    });
  });

  // Given une erreur DB sur sessions dans getProgramDetail
  // When getProgramDetail est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given une erreur DB sur session, When getProgramDetail est appelé, Then une InternalServerErrorException est renvoyée', async () => {
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
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const sessionsQuery = createListQuery({
      data: null,
      error: { message: 'session db error' },
    });
    const resourcesQuery = createListQuery({ data: [], error: null });
    const announcementsQuery = createListQuery({ data: [], error: null });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      if (tableName === 'session') return sessionsQuery;
      if (tableName === 'resource') return resourcesQuery;
      if (tableName === 'announcement') return announcementsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  // Given une erreur DB sur annonces dans getProgramDetail
  // When getProgramDetail est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given une erreur DB sur announcement, When getProgramDetail est appelé, Then une InternalServerErrorException est renvoyée', async () => {
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
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const resourcesQuery = createListQuery({ data: [], error: null });
    const announcementsQuery = createListQuery({
      data: null,
      error: { message: 'announcement db error' },
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      if (tableName === 'resource') return resourcesQuery;
      if (tableName === 'announcement') return announcementsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  // Given plusieurs ressources dont une sans published_at
  // When getProgramDetail est appelé
  // Then les ressources sont triées et la ressource sans date est gérée
  it('Given plusieurs ressources, When getProgramDetail est appelé, Then les ressources sont triées par date de publication', async () => {
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
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
      data: [
        {
          id: 'resource-newer',
          program_id: 'program-1',
          cohort_id: null,
          title: 'Guide récent',
          description: null,
          resource_type: 'document',
          resource_theme: null,
          resource_audience: null,
          url: null,
          file_path: '/resources/guide-recent.pdf',
          status: 'published',
          published_at: '2026-04-22T00:00:00.000Z',
          created_at: '2026-04-21T00:00:00.000Z',
          updated_at: '2026-04-21T00:00:00.000Z',
        },
        {
          id: 'resource-no-date',
          program_id: 'program-1',
          cohort_id: null,
          title: 'Guide sans date',
          description: null,
          resource_type: 'document',
          resource_theme: null,
          resource_audience: null,
          url: null,
          file_path: '/resources/guide-old.pdf',
          status: 'published',
          published_at: null,
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const announcementsQuery = createListQuery({ data: [], error: null });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      if (tableName === 'resource') return resourcesQuery;
      if (tableName === 'announcement') return announcementsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    const result = await service.getProgramDetail('access-token', 'program-1');
    expect(result.resources).toHaveLength(2);
    expect(result.resources[0].id).toBe('resource-newer');
  });

  it('Given des ressources nulles sans erreur et des annonces nulles, When getProgramDetail est appelé, Then resources et announcements sont des listes vides', async () => {
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
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const resourcesQuery = createListQuery({ data: null, error: null });
    const announcementsQuery = createListQuery({ data: null, error: null });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      if (tableName === 'resource') return resourcesQuery;
      if (tableName === 'announcement') return announcementsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.getProgramDetail('access-token', 'program-1'),
    ).resolves.toMatchObject({
      resources: [],
      announcements: [],
    });
  });

  it('Given des ressources programme et cohorte avec dates mixtes, When getProgramDetail est appelé, Then le tri merged gère published_at null', async () => {
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
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const sessionsQuery = createListQuery({ data: [], error: null });
    const programResourcesQuery = createListQuery({
      data: [
        {
          id: 'resource-null-date',
          program_id: 'program-1',
          cohort_id: null,
          title: 'Ressource sans date',
          description: null,
          resource_type: 'document',
          resource_theme: null,
          resource_audience: null,
          url: null,
          file_path: '/resources/null-date.pdf',
          status: 'published',
          published_at: null,
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const cohortResourcesQuery = createListQuery({
      data: [
        {
          id: 'resource-with-date',
          program_id: 'program-1',
          cohort_id: 'cohort-1',
          title: 'Ressource datée',
          description: null,
          resource_type: 'document',
          resource_theme: null,
          resource_audience: null,
          url: null,
          file_path: '/resources/with-date.pdf',
          status: 'published',
          published_at: '2026-05-01T00:00:00.000Z',
          created_at: '2026-04-30T00:00:00.000Z',
          updated_at: '2026-04-30T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const announcementsQuery = createListQuery({ data: [], error: null });

    let resourceCalls = 0;
    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      if (tableName === 'session') return sessionsQuery;
      if (tableName === 'resource') {
        resourceCalls += 1;
        return resourceCalls === 1
          ? programResourcesQuery
          : cohortResourcesQuery;
      }
      if (tableName === 'announcement') return announcementsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    const result = await service.getProgramDetail('access-token', 'program-1');
    expect(result.resources.map((resource) => resource.id)).toEqual([
      'resource-with-date',
      'resource-null-date',
    ]);
  });

  // Given un utilisateur sans participant
  // When markSessionProgress est appelé
  // Then une NotFoundException est renvoyée
  it('Given un utilisateur sans participant, When markSessionProgress est appelé, Then une NotFoundException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-1',
        completed: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Given un enrollment introuvable pour markSessionProgress
  // When markSessionProgress est appelé
  // Then une NotFoundException est renvoyée
  it('Given un enrollment introuvable pour markSessionProgress, When markSessionProgress est appelé, Then une NotFoundException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createSingleRowQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-1',
        completed: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Given une erreur DB sur enrollment dans markSessionProgress
  // When markSessionProgress est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given une erreur DB sur enrollment dans markSessionProgress, When markSessionProgress est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createSingleRowQuery({
      data: null,
      error: { message: 'enrollment db error' },
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-1',
        completed: true,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  // Given un enrollment sans cohorte
  // When markSessionProgress est appelé
  // Then une NotFoundException est renvoyée
  it('Given un enrollment sans cohorte pour markSessionProgress, When markSessionProgress est appelé, Then une NotFoundException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        completed_at: null,
        program_id: 'program-1',
        cohort_id: null,
        progress_completed_session_ids: [],
        progress_updated_at: null,
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

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-1',
        completed: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Given une erreur sur la pagination des sessions dans markSessionProgress
  // When markSessionProgress est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given une erreur sur la pagination des sessions, When markSessionProgress est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentSelectQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        completed_at: null,
        program_id: 'program-1',
        cohort_id: 'cohort-1',
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const pagedSessionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'session range error' },
      }),
    };

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentSelectQuery;
      if (tableName === 'session') return pagedSessionsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-1',
        completed: true,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  // Given une erreur de mise à jour DB dans markSessionProgress
  // When markSessionProgress est appelé
  // Then une InternalServerErrorException est renvoyée
  it('Given une erreur de mise à jour DB, When markSessionProgress est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentSelectQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        completed_at: null,
        program_id: 'program-1',
        cohort_id: 'cohort-1',
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const pagedSessionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest
        .fn()
        .mockResolvedValueOnce({ data: [{ id: 'session-1' }], error: null }),
    };
    const enrollmentUpdateQuery = createUpdateQuery({
      error: { message: 'update error' },
    });

    let enrollmentCalls = 0;
    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') {
        enrollmentCalls += 1;
        return enrollmentCalls === 1
          ? enrollmentSelectQuery
          : enrollmentUpdateQuery;
      }
      if (tableName === 'session') return pagedSessionsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-1',
        completed: true,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  // Given un cohort avec plus d'une page de sessions
  // When markSessionProgress cible une session de la deuxième page
  // Then le marquage est accepté et persisté
  it('Given une session en page suivante, When markSessionProgress est appelé, Then la pagination des sessions permet le marquage', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentSelectQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        completed_at: null,
        program_id: 'program-1',
        cohort_id: 'cohort-1',
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const firstPage = Array.from({ length: 200 }, (_, index) => ({
      id: `session-${index + 1}`,
    }));
    const pagedSessionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest
        .fn()
        .mockResolvedValueOnce({ data: firstPage, error: null })
        .mockResolvedValueOnce({ data: [{ id: 'session-201' }], error: null }),
    };
    const enrollmentUpdateQuery = createUpdateQuery({ error: null });

    let enrollmentCalls = 0;
    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') {
        return participantQuery;
      }

      if (tableName === 'enrollment') {
        enrollmentCalls += 1;
        return enrollmentCalls === 1
          ? enrollmentSelectQuery
          : enrollmentUpdateQuery;
      }

      if (tableName === 'session') {
        return pagedSessionsQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-201',
        completed: true,
      }),
    ).resolves.toMatchObject({
      enrollmentId: 'enrollment-1',
      enrollmentStatus: 'active',
      progress: {
        totalSessions: 201,
        completedSessions: 1,
      },
    });

    expect(pagedSessionsQuery.range).toHaveBeenCalledTimes(2);
  });

  // Given un enrollment avec program en tableau vide (normalizeRelation — tableau vide)
  // When listPrograms est appelé
  // Then l'enrollment avec programme vide est filtré de la liste
  it("Given un enrollment avec program en tableau vide, When listPrograms est appelé, Then l'enrollment est filtré", async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentQuery = createListQuery({
      data: [
        {
          id: 'enrollment-empty-program-array',
          status: 'active',
          completed_at: null,
          program_id: 'program-1',
          cohort_id: null,
          progress_completed_session_ids: [],
          progress_updated_at: null,
          program: [],
          cohort: null,
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listPrograms('access-token')).resolves.toEqual([]);
  });

  // Given une annonce de type cohort quand l'enrollment n'a pas de cohorte
  // When getProgramDetail est appelé
  // Then l'annonce cohort est filtrée (cohortId est null)
  it("Given une annonce cohort quand cohortId est null, When getProgramDetail est appelé, Then l'annonce cohort est filtrée", async () => {
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
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
    const resourcesQuery = createListQuery({ data: [], error: null });
    const announcementsQuery = createListQuery({
      data: [
        {
          id: 'announcement-cohort-orphan',
          title: 'Annonce cohorte orpheline',
          audience_type: 'cohort',
          published_at: '2026-04-25T00:00:00.000Z',
          program_id: null,
          cohort_id: 'cohort-other',
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      if (tableName === 'resource') return resourcesQuery;
      if (tableName === 'announcement') return announcementsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    const result = await service.getProgramDetail('access-token', 'program-1');
    expect(result.announcements).toHaveLength(0);
  });

  // Given une annonce de type cohort avec une cohorte différente de l'enrollment
  // When getProgramDetail est appelé
  // Then l'annonce cohort non correspondante est filtrée
  it("Given une annonce cohort avec cohorte différente, When getProgramDetail est appelé, Then l'annonce est filtrée", async () => {
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
        progress_completed_session_ids: [],
        progress_updated_at: null,
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
          id: 'announcement-wrong-cohort',
          title: 'Annonce mauvaise cohorte',
          audience_type: 'cohort',
          published_at: '2026-04-25T00:00:00.000Z',
          program_id: null,
          cohort_id: 'cohort-2',
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') return enrollmentDetailQuery;
      if (tableName === 'session') return sessionsQuery;
      if (tableName === 'resource') return resourcesQuery;
      if (tableName === 'announcement') return announcementsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    const result = await service.getProgramDetail('access-token', 'program-1');
    expect(result.announcements).toHaveLength(0);
  });

  // Given un enrollment avec progress_completed_session_ids null
  // When markSessionProgress est appelé
  // Then la progression est calculée depuis une liste vide
  it('Given progress_completed_session_ids null, When markSessionProgress est appelé, Then la progression est calculée depuis zéro', async () => {
    const participantQuery = createSingleRowQuery({
      data: { id: 'participant-1' },
      error: null,
    });
    const enrollmentSelectQuery = createSingleRowQuery({
      data: {
        id: 'enrollment-1',
        status: 'active',
        completed_at: null,
        program_id: 'program-1',
        cohort_id: 'cohort-1',
        progress_completed_session_ids: null,
        progress_updated_at: null,
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
    const pagedSessionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValueOnce({
        data: [{ id: 'session-1' }, { id: 'session-2' }],
        error: null,
      }),
    };
    const enrollmentUpdateQuery = createUpdateQuery({ error: null });

    let enrollmentCalls = 0;
    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'participant') return participantQuery;
      if (tableName === 'enrollment') {
        enrollmentCalls += 1;
        return enrollmentCalls === 1
          ? enrollmentSelectQuery
          : enrollmentUpdateQuery;
      }
      if (tableName === 'session') return pagedSessionsQuery;
      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.markSessionProgress('access-token', 'program-1', {
        sessionId: 'session-1',
        completed: true,
      }),
    ).resolves.toMatchObject({
      enrollmentId: 'enrollment-1',
      enrollmentStatus: 'active',
      progress: {
        totalSessions: 2,
        completedSessions: 1,
      },
    });
  });
});
