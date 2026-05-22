import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { AnnouncementDto } from '@kraak/contracts';
import * as domainUtils from '@kraak/domain';
import { AnnouncementsService } from './announcements.service';
import { SupabaseService } from '../supabase/supabase.service';

jest.mock('@kraak/domain', () => {
  const actual = jest.requireActual('@kraak/domain');

  return {
    ...actual,
    isMvpSupportedAnnouncementAudience: jest.fn(
      actual.isMvpSupportedAnnouncementAudience,
    ),
  };
});

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;

  const mockAnnouncement: AnnouncementDto = {
    id: 'ann-001',
    title: 'Important Update',
    body: 'This is an important announcement for all participants',
    priority: 'high',
    audienceType: 'all_participants',
    programId: null,
    cohortId: null,
    status: 'published',
    publishedAt: '2026-04-20T10:00:00Z',
    createdByUserId: 'user-001',
    createdAt: '2026-04-19T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  };

  const mockProgramAnnouncement: AnnouncementDto = {
    id: 'ann-002',
    title: 'Program Specific Notice',
    body: 'This announcement is for a specific program',
    priority: 'normal',
    audienceType: 'program',
    programId: 'prog-001',
    cohortId: null,
    status: 'published',
    publishedAt: '2026-04-20T11:00:00Z',
    createdByUserId: 'user-001',
    createdAt: '2026-04-19T11:00:00Z',
    updatedAt: '2026-04-20T11:00:00Z',
  };

  const mockAuthClient = {
    auth: {
      getUser: jest.fn(),
    },
  };

  const mockSupabaseService = {
    createAuthClient: jest.fn(() => mockAuthClient),
    getClient: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnnouncementsService(
      mockSupabaseService as unknown as SupabaseService,
    );
  });

  const createAsyncQuery = <TResult extends object>(
    terminalResult: TResult,
    options?: { withOrder?: boolean; withRange?: boolean; withIn?: boolean },
  ) => {
    const base = Promise.resolve(terminalResult) as Promise<TResult> & {
      from?: ReturnType<typeof jest.fn>;
      select?: ReturnType<typeof jest.fn>;
      eq?: ReturnType<typeof jest.fn>;
      in?: ReturnType<typeof jest.fn>;
      order?: ReturnType<typeof jest.fn>;
      range?: ReturnType<typeof jest.fn>;
      single?: ReturnType<typeof jest.fn>;
    };

    base.select = jest.fn().mockReturnValue(base);
    base.eq = jest.fn().mockReturnValue(base);

    if (options?.withIn) {
      base.in = jest.fn().mockReturnValue(base);
    }

    if (options?.withOrder) {
      base.order = jest.fn().mockReturnValue(base);
    }

    if (options?.withRange) {
      base.range = jest.fn().mockReturnValue(base);
    }

    if (terminalResult !== null && 'error' in terminalResult) {
      base.single = jest.fn().mockReturnValue(base);
    }

    return base;
  };

  const createClientMock = (tableQueries: Record<string, unknown> = {}) => ({
    from: jest.fn((table: string) => tableQueries[table]),
  });

  describe('listAnnouncements', () => {
    it('Given: valid access token and enrolled participant, When: listAnnouncements called, Then: return filtered announcements', async () => {
      const accessToken = 'valid-token';
      const participantId = 'participant-001';
      const userId = 'user-001';

      mockAuthClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: userId },
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: participantId },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: mockAnnouncement.id,
              title: mockAnnouncement.title,
              body: mockAnnouncement.body,
              priority: mockAnnouncement.priority,
              audience_type: mockAnnouncement.audienceType,
              program_id: mockAnnouncement.programId,
              cohort_id: mockAnnouncement.cohortId,
              status: mockAnnouncement.status,
              published_at: mockAnnouncement.publishedAt,
              created_by_user_id: mockAnnouncement.createdByUserId,
              created_at: mockAnnouncement.createdAt,
              updated_at: mockAnnouncement.updatedAt,
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [
            {
              program_id: 'prog-001',
              cohort_id: null,
            },
          ],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements(accessToken, 1, 20);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result.data.length).toBeGreaterThan(0);
      expect(mockAuthClient.auth.getUser).toHaveBeenCalledWith(accessToken);
    });

    it('Given: invalid access token, When: listAnnouncements called, Then: throw error', async () => {
      const accessToken = 'invalid-token';

      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      await expect(service.listAnnouncements(accessToken)).rejects.toThrow();
    });

    it('Given: invalid pagination values, When: listAnnouncements called, Then: fallback pagination defaults are applied', async () => {
      const accessToken = 'valid-token';
      const participantId = 'participant-001';
      const userId = 'user-001';

      mockAuthClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: userId },
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: participantId },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-001',
              title: 'A1',
              body: 'Body 1',
              priority: 'high',
              audience_type: 'all_participants',
              program_id: null,
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T10:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T10:00:00Z',
              updated_at: '2026-04-20T10:00:00Z',
            },
            {
              id: 'ann-002',
              title: 'A2',
              body: 'Body 2',
              priority: 'normal',
              audience_type: 'all_participants',
              program_id: null,
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T09:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T09:00:00Z',
              updated_at: '2026-04-20T09:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements(
        accessToken,
        Number.NaN,
        -5,
      );

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('ann-001');
    });

    it('Given: missing priority column on announcement, When: listAnnouncements called, Then: fallback query returns announcements with normal priority', async () => {
      const accessToken = 'valid-token';
      const participantId = 'participant-001';
      const userId = 'user-001';

      mockAuthClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: userId },
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: participantId },
        error: null,
      });

      const announcementsQueryWithMissingPriority = createAsyncQuery(
        {
          data: null,
          error: {
            code: '42703',
            message: 'column announcement.priority does not exist',
          },
        },
        { withOrder: true },
      );

      const announcementsFallbackQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-001',
              title: 'Fallback Announcement',
              body: 'Body',
              audience_type: 'all_participants',
              program_id: null,
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T10:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T10:00:00Z',
              updated_at: '2026-04-20T10:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [],
          error: null,
        },
        { withIn: true },
      );

      let announcementCalls = 0;
      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'participant') {
            return participantQuery;
          }

          if (table === 'announcement') {
            announcementCalls += 1;
            return announcementCalls === 1
              ? announcementsQueryWithMissingPriority
              : announcementsFallbackQuery;
          }

          if (table === 'enrollment') {
            return enrollmentsQuery;
          }

          return undefined;
        }),
      });

      const result = await service.listAnnouncements(accessToken, 1, 20);

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'ann-001',
        priority: 'normal',
      });
    });
  });

  describe('getAnnouncementById', () => {
    it('Given: valid announcement ID and authorized participant, When: getAnnouncementById called, Then: return announcement detail', async () => {
      const accessToken = 'valid-token';
      const participantId = 'participant-001';
      const userId = 'user-001';
      const announcementId = 'ann-001';

      mockAuthClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: userId },
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: participantId },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: mockAnnouncement.id,
          title: mockAnnouncement.title,
          body: mockAnnouncement.body,
          priority: mockAnnouncement.priority,
          audience_type: mockAnnouncement.audienceType,
          program_id: mockAnnouncement.programId,
          cohort_id: mockAnnouncement.cohortId,
          status: mockAnnouncement.status,
          published_at: mockAnnouncement.publishedAt,
          created_by_user_id: mockAnnouncement.createdByUserId,
          created_at: mockAnnouncement.createdAt,
          updated_at: mockAnnouncement.updatedAt,
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        {
          data: [{ id: 'enrollment-001' }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementQuery,
          enrollment: enrollmentQuery,
        }),
      );

      const result = await service.getAnnouncementById(
        announcementId,
        accessToken,
      );

      expect(result.id).toBe(announcementId);
      expect(result.title).toBe(mockAnnouncement.title);
      expect(mockAuthClient.auth.getUser).toHaveBeenCalledWith(accessToken);
    });

    it('Given: non-existent announcement ID, When: getAnnouncementById called, Then: throw NotFoundException', async () => {
      const accessToken = 'valid-token';
      const announcementId = 'non-existent';

      mockAuthClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-001' },
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: null,
        error: new Error('Not found'),
      });

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementQuery,
        }),
      );

      await expect(
        service.getAnnouncementById(announcementId, accessToken),
      ).rejects.toThrow(NotFoundException);
    });

    it('Given: unauthorized participant, When: getAnnouncementById called, Then: throw NotFoundException', async () => {
      const accessToken = 'valid-token';
      const participantId = 'participant-001';
      const userId = 'user-001';
      const announcementId = 'ann-002';

      mockAuthClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: userId },
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: participantId },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: mockProgramAnnouncement.id,
          title: mockProgramAnnouncement.title,
          body: mockProgramAnnouncement.body,
          priority: mockProgramAnnouncement.priority,
          audience_type: mockProgramAnnouncement.audienceType,
          program_id: mockProgramAnnouncement.programId,
          cohort_id: mockProgramAnnouncement.cohortId,
          status: mockProgramAnnouncement.status,
          published_at: mockProgramAnnouncement.publishedAt,
          created_by_user_id: mockProgramAnnouncement.createdByUserId,
          created_at: mockProgramAnnouncement.createdAt,
          updated_at: mockProgramAnnouncement.updatedAt,
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        {
          data: [],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementQuery,
          enrollment: enrollmentQuery,
        }),
      );

      await expect(
        service.getAnnouncementById(announcementId, accessToken),
      ).rejects.toThrow(NotFoundException);
    });

    it('Given: missing priority column on announcement, When: getAnnouncementById called, Then: fallback query returns the announcement with normal priority', async () => {
      const accessToken = 'valid-token';
      const announcementId = 'ann-001';

      mockAuthClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-001' },
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQueryWithMissingPriority = createAsyncQuery({
        data: null,
        error: {
          code: '42703',
          message: 'column announcement.priority does not exist',
        },
      });

      const announcementFallbackQuery = createAsyncQuery({
        data: {
          id: announcementId,
          title: 'Fallback Announcement',
          body: 'Body',
          audience_type: 'all_participants',
          program_id: null,
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T10:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T10:00:00Z',
          updated_at: '2026-04-20T10:00:00Z',
        },
        error: null,
      });

      let announcementCalls = 0;
      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'participant') {
            return participantQuery;
          }

          if (table === 'announcement') {
            announcementCalls += 1;
            return announcementCalls === 1
              ? announcementQueryWithMissingPriority
              : announcementFallbackQuery;
          }

          return undefined;
        }),
      });

      const result = await service.getAnnouncementById(
        announcementId,
        accessToken,
      );

      expect(result).toMatchObject({
        id: announcementId,
        priority: 'normal',
      });
    });
  });

  it('Given: une erreur DB sur enrollments, When: listAnnouncements appelé, Then: une erreur est levée', async () => {
    mockAuthClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-001' } },
      error: null,
    });

    const participantQuery = createAsyncQuery({
      data: { id: 'participant-001' },
      error: null,
    });

    const announcementsQuery = createAsyncQuery(
      { data: [], error: null },
      { withOrder: true },
    );

    const enrollmentsQuery = createAsyncQuery(
      { data: null, error: { message: 'enrollment DB error' } },
      { withIn: true },
    );

    mockSupabaseService.getClient.mockReturnValue(
      createClientMock({
        participant: participantQuery,
        announcement: announcementsQuery,
        enrollment: enrollmentsQuery,
      }),
    );

    await expect(service.listAnnouncements('valid-token')).rejects.toThrow(
      'Failed to get enrollments',
    );
  });

  it('Given: announcements et enrollments null sans erreur, When: listAnnouncements appelé, Then: retourne une liste vide', async () => {
    mockAuthClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-001' } },
      error: null,
    });

    const participantQuery = createAsyncQuery({
      data: { id: 'participant-001' },
      error: null,
    });

    const announcementsQuery = createAsyncQuery(
      { data: null, error: null },
      { withOrder: true },
    );

    const enrollmentsQuery = createAsyncQuery(
      { data: null, error: null },
      { withIn: true },
    );

    mockSupabaseService.getClient.mockReturnValue(
      createClientMock({
        participant: participantQuery,
        announcement: announcementsQuery,
        enrollment: enrollmentsQuery,
      }),
    );

    const result = await service.listAnnouncements('valid-token');
    expect(result.total).toBe(0);
    expect(result.data).toHaveLength(0);
  });

  it("Given: audience helper retourne false pour all_participants, When: listAnnouncements appelé, Then: lève 'Invalid audience type'", async () => {
    const audienceMock =
      domainUtils.isMvpSupportedAnnouncementAudience as jest.MockedFunction<
        typeof domainUtils.isMvpSupportedAnnouncementAudience
      >;
    audienceMock.mockReturnValueOnce(false);

    mockAuthClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-001' } },
      error: null,
    });

    const participantQuery = createAsyncQuery({
      data: { id: 'participant-001' },
      error: null,
    });

    const announcementsQuery = createAsyncQuery(
      { data: [], error: null },
      { withOrder: true },
    );

    const enrollmentsQuery = createAsyncQuery(
      { data: [], error: null },
      { withIn: true },
    );

    mockSupabaseService.getClient.mockReturnValue(
      createClientMock({
        participant: participantQuery,
        announcement: announcementsQuery,
        enrollment: enrollmentsQuery,
      }),
    );

    await expect(service.listAnnouncements('valid-token')).rejects.toThrow(
      'Invalid audience type',
    );
  });
  describe('getAnnouncementById — audience program et cohort (regression doublons staging-main)', () => {
    it('Given: annonce de type program avec participant inscrit, When: getAnnouncementById appelé, Then: retourne annonce', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-002',
          title: 'Program Specific',
          body: 'Body',
          priority: 'normal',
          audience_type: 'program',
          program_id: 'prog-001',
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: [{ id: 'enr-1' }], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementQuery,
          enrollment: enrollmentQuery,
        }),
      );

      const result = await service.getAnnouncementById(
        'ann-002',
        'valid-token',
      );
      expect(result.id).toBe('ann-002');
      expect(result.audienceType).toBe('program');
    });

    it('Given: annonce de type cohort avec participant inscrit, When: getAnnouncementById appelé, Then: retourne annonce', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-003',
          title: 'Cohort Announcement',
          body: 'Body',
          priority: 'normal',
          audience_type: 'cohort',
          program_id: null,
          cohort_id: 'cohort-001',
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: [{ id: 'enr-2' }], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementQuery,
          enrollment: enrollmentQuery,
        }),
      );

      const result = await service.getAnnouncementById(
        'ann-003',
        'valid-token',
      );
      expect(result.id).toBe('ann-003');
      expect(result.audienceType).toBe('cohort');
    });
  });

  describe('getAnnouncementById — branches non couvertes (regression doublons staging-main)', () => {
    it('Given: auth réussit mais participant introuvable, When: getAnnouncementById appelé, Then: lève une erreur de résolution participant', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-001',
          title: 'Test',
          body: 'Body',
          priority: 'normal',
          audience_type: 'all_participants',
          program_id: null,
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: null,
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementQuery,
          participant: participantQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('ann-001', 'valid-token'),
      ).rejects.toThrow('Could not resolve participant ID from access token');
    });

    it("Given: annonce inexistante (data null, pas d'erreur), When: getAnnouncementById appelé, Then: lève une NotFoundException", async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: null,
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('non-existent', 'valid-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('Given: annonce visible type all_participants, erreur enrollment dans isAnnouncementVisibleToParticipant, When: getAnnouncementById appelé, Then: lève une erreur', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-004',
          title: 'Program Announcement',
          body: 'Body',
          priority: 'normal',
          audience_type: 'program',
          program_id: 'prog-001',
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: null, error: { message: 'DB error' } },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementQuery,
          enrollment: enrollmentQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('ann-004', 'valid-token'),
      ).rejects.toThrow('Failed to verify announcement access');
    });

    it('Given: annonce avec audience_type non supporté dans filterAnnouncementsByScope, When: listAnnouncements appelé, Then: annonce exclue du résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-unsupported',
              title: 'Custom Announcement',
              body: 'Body',
              priority: 'normal',
              audience_type: 'custom',
              program_id: null,
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        { data: [], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(0);
    });

    it('Given: participant inscrit au programme, annonce de type program, When: listAnnouncements appelé, Then: annonce visible incluse dans le résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-prog-001',
              title: 'Programme Announcement',
              body: 'Announcement for program participants',
              priority: 'normal',
              audience_type: 'program',
              program_id: 'prog-001',
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [{ program_id: 'prog-001', cohort_id: null }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe('ann-prog-001');
    });

    it('Given: annonce program avec program_id non inscrit, When: listAnnouncements appelé, Then: annonce exclue du résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-prog-unmatched',
              title: 'Programme non inscrit',
              body: 'Announcement for another program',
              priority: 'normal',
              audience_type: 'program',
              program_id: 'prog-999',
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [{ program_id: 'prog-001', cohort_id: null }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(0);
    });

    it('Given: participant inscrit à la cohorte ciblée, annonce de type cohort, When: listAnnouncements appelé, Then: annonce visible incluse dans le résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-cohort-001',
              title: 'Cohort Announcement',
              body: 'Announcement for cohort participants',
              priority: 'normal',
              audience_type: 'cohort',
              program_id: null,
              cohort_id: 'cohort-001',
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [{ program_id: null, cohort_id: 'cohort-001' }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe('ann-cohort-001');
    });

    it('Given: annonce cohort sans cohort_id, When: listAnnouncements appelé, Then: annonce exclue du résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-cohort-null',
              title: 'Malformed Cohort Announcement',
              body: 'No cohort target',
              priority: 'normal',
              audience_type: 'cohort',
              program_id: null,
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [{ program_id: null, cohort_id: 'cohort-001' }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(0);
    });

    it('Given: annonce avec audience_type non supporté dans isAnnouncementVisibleToParticipant, When: getAnnouncementById appelé, Then: lève une NotFoundException', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-custom',
          title: 'Custom Type',
          body: 'Body',
          priority: 'normal',
          audience_type: 'custom',
          program_id: null,
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementQuery,
          participant: participantQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('ann-custom', 'valid-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('Given: annonce program et enrollment query sans data, When: getAnnouncementById appelé, Then: lève une NotFoundException', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-prog-no-data',
          title: 'Program Type',
          body: 'Body',
          priority: 'normal',
          audience_type: 'program',
          program_id: 'prog-001',
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: undefined, error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementQuery,
          participant: participantQuery,
          enrollment: enrollmentQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('ann-prog-no-data', 'valid-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listAnnouncements — cas limites (bloc fusion rebase)', () => {
    it('Given: participant introuvable (resolveParticipantId retourne null), When: listAnnouncements appelé, Then: une erreur UnauthorizedException est levée', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid'),
      });

      const announcementsQuery = createAsyncQuery(
        { data: [], error: null },
        { withOrder: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementsQuery,
        }),
      );

      await expect(
        service.listAnnouncements('bad-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('Given: une erreur DB sur announcements, When: listAnnouncements appelé, Then: une erreur est levée', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        { data: null, error: { message: 'DB failure' } },
        { withOrder: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
        }),
      );

      await expect(service.listAnnouncements('valid-token')).rejects.toThrow(
        'Failed to list announcements',
      );
    });

    it('Given: une erreur DB sur enrollments, When: listAnnouncements appelé, Then: une erreur est levée', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        { data: [], error: null },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        { data: null, error: { message: 'enrollment DB error' } },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      await expect(service.listAnnouncements('valid-token')).rejects.toThrow(
        'Failed to get enrollments',
      );
    });

    it('Given: announcements et enrollments null sans erreur, When: listAnnouncements appelé, Then: retourne une liste vide', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        { data: null, error: null },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        { data: null, error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it("Given: audience helper retourne false pour all_participants, When: listAnnouncements appelé, Then: lève 'Invalid audience type'", async () => {
      const audienceMock =
        domainUtils.isMvpSupportedAnnouncementAudience as jest.MockedFunction<
          typeof domainUtils.isMvpSupportedAnnouncementAudience
        >;
      audienceMock.mockReturnValueOnce(false);

      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        { data: [], error: null },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        { data: [], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      await expect(service.listAnnouncements('valid-token')).rejects.toThrow(
        'Invalid audience type',
      );
    });
  });

  describe('getAnnouncementById — audience program et cohort (bloc fusion rebase)', () => {
    it('Given: annonce de type program avec participant inscrit, When: getAnnouncementById appelé, Then: retourne annonce', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-002',
          title: 'Program Specific',
          body: 'Body',
          priority: 'normal',
          audience_type: 'program',
          program_id: 'prog-001',
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: [{ id: 'enr-1' }], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementQuery,
          enrollment: enrollmentQuery,
        }),
      );

      const result = await service.getAnnouncementById(
        'ann-002',
        'valid-token',
      );
      expect(result.id).toBe('ann-002');
      expect(result.audienceType).toBe('program');
    });

    it('Given: annonce de type cohort avec participant inscrit, When: getAnnouncementById appelé, Then: retourne annonce', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-003',
          title: 'Cohort Announcement',
          body: 'Body',
          priority: 'normal',
          audience_type: 'cohort',
          program_id: null,
          cohort_id: 'cohort-001',
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: [{ id: 'enr-2' }], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementQuery,
          enrollment: enrollmentQuery,
        }),
      );

      const result = await service.getAnnouncementById(
        'ann-003',
        'valid-token',
      );
      expect(result.id).toBe('ann-003');
      expect(result.audienceType).toBe('cohort');
    });
  });

  describe('getAnnouncementById — branches non couvertes (bloc fusion rebase)', () => {
    it('Given: auth réussit mais participant introuvable, When: getAnnouncementById appelé, Then: lève une erreur de résolution participant', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-001',
          title: 'Test',
          body: 'Body',
          priority: 'normal',
          audience_type: 'all_participants',
          program_id: null,
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: null,
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementQuery,
          participant: participantQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('ann-001', 'valid-token'),
      ).rejects.toThrow('Could not resolve participant ID from access token');
    });

    it("Given: annonce inexistante (data null, pas d'erreur), When: getAnnouncementById appelé, Then: lève une NotFoundException", async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: null,
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('non-existent', 'valid-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('Given: annonce visible type all_participants, erreur enrollment dans isAnnouncementVisibleToParticipant, When: getAnnouncementById appelé, Then: lève une erreur', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-004',
          title: 'Program Announcement',
          body: 'Body',
          priority: 'normal',
          audience_type: 'program',
          program_id: 'prog-001',
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: null, error: { message: 'DB error' } },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementQuery,
          enrollment: enrollmentQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('ann-004', 'valid-token'),
      ).rejects.toThrow('Failed to verify announcement access');
    });

    it('Given: annonce avec audience_type non supporté dans filterAnnouncementsByScope, When: listAnnouncements appelé, Then: annonce exclue du résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-unsupported',
              title: 'Custom Announcement',
              body: 'Body',
              priority: 'normal',
              audience_type: 'custom',
              program_id: null,
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        { data: [], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(0);
    });

    it('Given: participant inscrit au programme, annonce de type program, When: listAnnouncements appelé, Then: annonce visible incluse dans le résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-prog-001',
              title: 'Programme Announcement',
              body: 'Announcement for program participants',
              priority: 'normal',
              audience_type: 'program',
              program_id: 'prog-001',
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [{ program_id: 'prog-001', cohort_id: null }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe('ann-prog-001');
    });

    it('Given: annonce program avec program_id non inscrit, When: listAnnouncements appelé, Then: annonce exclue du résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-prog-unmatched',
              title: 'Programme non inscrit',
              body: 'Announcement for another program',
              priority: 'normal',
              audience_type: 'program',
              program_id: 'prog-999',
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [{ program_id: 'prog-001', cohort_id: null }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(0);
    });

    it('Given: participant inscrit à la cohorte ciblée, annonce de type cohort, When: listAnnouncements appelé, Then: annonce visible incluse dans le résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-cohort-001',
              title: 'Cohort Announcement',
              body: 'Announcement for cohort participants',
              priority: 'normal',
              audience_type: 'cohort',
              program_id: null,
              cohort_id: 'cohort-001',
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [{ program_id: null, cohort_id: 'cohort-001' }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe('ann-cohort-001');
    });

    it('Given: annonce cohort sans cohort_id, When: listAnnouncements appelé, Then: annonce exclue du résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-cohort-null',
              title: 'Malformed Cohort Announcement',
              body: 'No cohort target',
              priority: 'normal',
              audience_type: 'cohort',
              program_id: null,
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [{ program_id: null, cohort_id: 'cohort-001' }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          participant: participantQuery,
          announcement: announcementsQuery,
          enrollment: enrollmentsQuery,
        }),
      );

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(0);
    });

    it('Given: annonce avec audience_type non supporté dans isAnnouncementVisibleToParticipant, When: getAnnouncementById appelé, Then: lève une NotFoundException', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-custom',
          title: 'Custom Type',
          body: 'Body',
          priority: 'normal',
          audience_type: 'custom',
          program_id: null,
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementQuery,
          participant: participantQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('ann-custom', 'valid-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('Given: annonce program et enrollment query sans data, When: getAnnouncementById appelé, Then: lève une NotFoundException', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-prog-no-data',
          title: 'Program Type',
          body: 'Body',
          priority: 'normal',
          audience_type: 'program',
          program_id: 'prog-001',
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: undefined, error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementQuery,
          participant: participantQuery,
          enrollment: enrollmentQuery,
        }),
      );

      await expect(
        service.getAnnouncementById('ann-prog-no-data', 'valid-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listAnnouncements — cas limites', () => {
    it('Given: participant introuvable (resolveParticipantId retourne null), When: listAnnouncements appelé, Then: une erreur est levée', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid'),
      });

      const announcementsQuery = createAsyncQuery(
        { data: [], error: null },
        { withOrder: true },
      );

      mockSupabaseService.getClient.mockReturnValue(
        createClientMock({
          announcement: announcementsQuery,
        }),
      );

      await expect(
        service.listAnnouncements('bad-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('Given: une erreur DB sur announcements, When: listAnnouncements appelé, Then: une erreur est levée', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        { data: null, error: { message: 'DB failure' } },
        { withOrder: true },
      );

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'participant') return participantQuery;
          if (table === 'announcement') return announcementsQuery;
        }),
      });

      await expect(service.listAnnouncements('valid-token')).rejects.toThrow(
        'Failed to list announcements',
      );
    });

    it('Given: une erreur DB sur enrollments, When: listAnnouncements appelé, Then: une erreur est levée', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        { data: [], error: null },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        { data: null, error: { message: 'enrollment DB error' } },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'participant') return participantQuery;
          if (table === 'announcement') return announcementsQuery;
          if (table === 'enrollment') return enrollmentsQuery;
        }),
      });

      await expect(service.listAnnouncements('valid-token')).rejects.toThrow(
        'Failed to get enrollments',
      );
    });
  });

  describe('getAnnouncementById — audience program et cohort', () => {
    it('Given: annonce de type program avec participant inscrit, When: getAnnouncementById appelé, Then: retourne annonce', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-002',
          title: 'Program Specific',
          body: 'Body',
          priority: 'normal',
          audience_type: 'program',
          program_id: 'prog-001',
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: [{ id: 'enr-1' }], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'participant') return participantQuery;
          if (table === 'announcement') return announcementQuery;
          if (table === 'enrollment') return enrollmentQuery;
        }),
      });

      const result = await service.getAnnouncementById(
        'ann-002',
        'valid-token',
      );
      expect(result.id).toBe('ann-002');
      expect(result.audienceType).toBe('program');
    });

    it('Given: annonce de type cohort avec participant inscrit, When: getAnnouncementById appelé, Then: retourne annonce', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-003',
          title: 'Cohort Announcement',
          body: 'Body',
          priority: 'normal',
          audience_type: 'cohort',
          program_id: null,
          cohort_id: 'cohort-001',
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: [{ id: 'enr-2' }], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'participant') return participantQuery;
          if (table === 'announcement') return announcementQuery;
          if (table === 'enrollment') return enrollmentQuery;
        }),
      });

      const result = await service.getAnnouncementById(
        'ann-003',
        'valid-token',
      );
      expect(result.id).toBe('ann-003');
      expect(result.audienceType).toBe('cohort');
    });
  });

  describe('getAnnouncementById — branches non couvertes', () => {
    it('Given: auth réussit mais participant introuvable, When: getAnnouncementById appelé, Then: lève une erreur de résolution participant', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-001',
          title: 'Test',
          body: 'Body',
          priority: 'normal',
          audience_type: 'all_participants',
          program_id: null,
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: null,
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'announcement') return announcementQuery;
          if (table === 'participant') return participantQuery;
        }),
      });

      await expect(
        service.getAnnouncementById('ann-001', 'valid-token'),
      ).rejects.toThrow('Could not resolve participant ID from access token');
    });

    it("Given: annonce inexistante (data null, pas d'erreur), When: getAnnouncementById appelé, Then: lève une NotFoundException", async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: null,
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'announcement') return announcementQuery;
        }),
      });

      await expect(
        service.getAnnouncementById('non-existent', 'valid-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('Given: annonce visible type all_participants, erreur enrollment dans isAnnouncementVisibleToParticipant, When: getAnnouncementById appelé, Then: lève une erreur', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-004',
          title: 'Program Announcement',
          body: 'Body',
          priority: 'normal',
          audience_type: 'program',
          program_id: 'prog-001',
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      const enrollmentQuery = createAsyncQuery(
        { data: null, error: { message: 'DB error' } },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'participant') return participantQuery;
          if (table === 'announcement') return announcementQuery;
          if (table === 'enrollment') return enrollmentQuery;
        }),
      });

      await expect(
        service.getAnnouncementById('ann-004', 'valid-token'),
      ).rejects.toThrow('Failed to verify announcement access');
    });

    it('Given: annonce avec audience_type non supporté dans filterAnnouncementsByScope, When: listAnnouncements appelé, Then: annonce exclue du résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-unsupported',
              title: 'Custom Announcement',
              body: 'Body',
              priority: 'normal',
              audience_type: 'custom',
              program_id: null,
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        { data: [], error: null },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'participant') return participantQuery;
          if (table === 'announcement') return announcementsQuery;
          if (table === 'enrollment') return enrollmentsQuery;
        }),
      });

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(0);
    });

    it('Given: participant inscrit au programme, annonce de type program, When: listAnnouncements appelé, Then: annonce visible incluse dans le résultat', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementsQuery = createAsyncQuery(
        {
          data: [
            {
              id: 'ann-prog-001',
              title: 'Programme Announcement',
              body: 'Announcement for program participants',
              priority: 'normal',
              audience_type: 'program',
              program_id: 'prog-001',
              cohort_id: null,
              status: 'published',
              published_at: '2026-04-20T11:00:00Z',
              created_by_user_id: 'user-001',
              created_at: '2026-04-19T11:00:00Z',
              updated_at: '2026-04-20T11:00:00Z',
            },
          ],
          error: null,
        },
        { withOrder: true },
      );

      const enrollmentsQuery = createAsyncQuery(
        {
          data: [{ program_id: 'prog-001', cohort_id: null }],
          error: null,
        },
        { withIn: true },
      );

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'participant') return participantQuery;
          if (table === 'announcement') return announcementsQuery;
          if (table === 'enrollment') return enrollmentsQuery;
        }),
      });

      const result = await service.listAnnouncements('valid-token');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe('ann-prog-001');
    });
    it('Given: annonce avec audience_type non supporté dans isAnnouncementVisibleToParticipant, When: getAnnouncementById appelé, Then: lève une NotFoundException', async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      });

      const participantQuery = createAsyncQuery({
        data: { id: 'participant-001' },
        error: null,
      });

      const announcementQuery = createAsyncQuery({
        data: {
          id: 'ann-custom',
          title: 'Custom Type',
          body: 'Body',
          priority: 'normal',
          audience_type: 'custom',
          program_id: null,
          cohort_id: null,
          status: 'published',
          published_at: '2026-04-20T11:00:00Z',
          created_by_user_id: 'user-001',
          created_at: '2026-04-19T11:00:00Z',
          updated_at: '2026-04-20T11:00:00Z',
        },
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn((table: string) => {
          if (table === 'announcement') return announcementQuery;
          if (table === 'participant') return participantQuery;
        }),
      });

      await expect(
        service.getAnnouncementById('ann-custom', 'valid-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
