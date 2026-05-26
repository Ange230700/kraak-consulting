import {
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AnnouncementDto,
  AnnouncementPriorityValue,
  AudienceTypeValue,
  PublicationStatusValue,
} from '@kraak/contracts';
import {
  isMvpSupportedAnnouncementAudience,
  sortAnnouncementsByPriority,
} from '@kraak/domain';
import { SupabaseService } from '../supabase/supabase.service';
import type {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './announcements.dto';
import {
  isSupabaseColumnMissingError,
  readSupabaseErrorCode,
  readSupabaseErrorMessage,
  readSupabaseQueryWithFallback,
} from '../shared/supabase-query-fallback.utils';

const ANNOUNCEMENT_SELECT_FIELDS =
  'id, title, body, priority, audience_type, program_id, cohort_id, status, published_at, created_by_user_id, created_at, updated_at';
const ANNOUNCEMENT_SELECT_FIELDS_WITHOUT_PRIORITY =
  'id, title, body, audience_type, program_id, cohort_id, status, published_at, created_by_user_id, created_at, updated_at';

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  priority?: AnnouncementPriorityValue | null;
  audience_type: AudienceTypeValue;
  program_id: string | null;
  cohort_id: string | null;
  status: PublicationStatusValue;
  published_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

type EnrollmentRow = {
  program_id: string;
  cohort_id: string | null;
};

function isAnnouncementPriorityColumnMissing(error: unknown): boolean {
  return isSupabaseColumnMissingError(error, ['announcement.priority']);
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createAnnouncement(
    payload: CreateAnnouncementDto,
    createdByUserId: string,
  ): Promise<AnnouncementDto> {
    const adminClient = this.supabaseService.getClient();
    const status = payload.status ?? 'draft';
    const publishedAt = this.resolvePublishedAt({
      status,
      publishedAt: payload.publishedAt,
    });
    const { data, error } = await adminClient
      .from('announcement')
      .insert({
        title: payload.title,
        body: payload.body,
        priority: payload.priority ?? 'normal',
        audience_type: payload.audienceType,
        program_id: payload.programId ?? null,
        cohort_id: payload.cohortId ?? null,
        status,
        published_at: publishedAt,
        created_by_user_id: createdByUserId,
      })
      .select(ANNOUNCEMENT_SELECT_FIELDS)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de créer l’annonce.',
      });
    }

    return this.mapAnnouncement(data as AnnouncementRow);
  }

  async updateAnnouncement(
    id: string,
    payload: UpdateAnnouncementDto,
  ): Promise<AnnouncementDto> {
    const updatePayload: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      updatePayload['title'] = payload.title;
    }

    if (payload.body !== undefined) {
      updatePayload['body'] = payload.body;
    }

    if (payload.priority !== undefined) {
      updatePayload['priority'] = payload.priority;
    }

    if (payload.audienceType !== undefined) {
      updatePayload['audience_type'] = payload.audienceType;
    }

    if (payload.programId !== undefined) {
      updatePayload['program_id'] = payload.programId;
    }

    if (payload.cohortId !== undefined) {
      updatePayload['cohort_id'] = payload.cohortId;
    }

    if (payload.status !== undefined) {
      updatePayload['status'] = payload.status;
      updatePayload['published_at'] = this.resolvePublishedAt({
        status: payload.status,
        publishedAt: payload.publishedAt,
      });
    } else if (payload.publishedAt !== undefined) {
      updatePayload['published_at'] = payload.publishedAt;
    }

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('announcement')
      .update(updatePayload)
      .eq('id', id)
      .select(ANNOUNCEMENT_SELECT_FIELDS)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: 'Annonce introuvable.',
      });
    }

    return this.mapAnnouncement(data as AnnouncementRow);
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('announcement')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: 'Annonce introuvable.',
      });
    }
  }

  /**
   * List announcements visible to the authenticated participant.
   * Filters by participant's enrollment scope (all_participants, program, cohort).
   * Results are ordered by priority and then by publishedAt descending.
   * @param accessToken - The access token of the authenticated participant
   * @param page - Page number (1-based, default: 1)
   * @param limit - Items per page (default: 20, max: 100)
   */
  async listAnnouncements(
    accessToken?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: AnnouncementDto[]; total: number }> {
    const paginationLimit = this.resolvePaginationLimit(limit);
    const paginationPage = this.resolvePaginationPage(page);

    const { data: allAnnouncements, error: announcementsError } =
      await this.readPublishedAnnouncements();

    if (announcementsError) {
      if (!accessToken) {
        console.error('Public announcements listing failed', {
          context: 'announcements.list.public',
          code: readSupabaseErrorCode(announcementsError),
          message: readSupabaseErrorMessage(announcementsError),
        });
        return {
          data: [],
          total: 0,
        };
      }

      throw new Error(
        `Failed to list announcements: ${readSupabaseErrorMessage(announcementsError) ?? 'unknown error'}`,
      );
    }

    // Public mode: return all published announcements when no token is provided.
    if (!accessToken) {
      const announcementRows = allAnnouncements ?? [];
      const sorted = sortAnnouncementsByPriority(
        announcementRows.map((row) => this.mapAnnouncement(row)),
      );
      const offset = (paginationPage - 1) * paginationLimit;
      const paginated = sorted.slice(offset, offset + paginationLimit);

      return {
        data: paginated,
        total: sorted.length,
      };
    }

    // Authenticated mode: filter by participant scope.
    const participantId = await this.resolveParticipantId(accessToken);
    if (!participantId) {
      throw new UnauthorizedException({
        success: false,
        message: 'La session est invalide ou expirée.',
      });
    }

    // Get participant's enrollments
    const adminClient = this.supabaseService.getClient();
    const { data: enrollments, error: enrollmentsError } = await adminClient
      .from('enrollment')
      .select('program_id, cohort_id')
      .eq('participant_id', participantId)
      .in('status', ['pending', 'active', 'completed']);

    if (enrollmentsError) {
      throw new Error(`Failed to get enrollments: ${enrollmentsError.message}`);
    }

    // Filter announcements based on participant's scope
    const announcementRows = allAnnouncements ?? [];
    const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
    const visibleAnnouncements = this.filterAnnouncementsByScope(
      announcementRows,
      enrollmentRows,
    );

    // Sort by priority and publishedAt
    const sorted = sortAnnouncementsByPriority(
      visibleAnnouncements.map((row) => this.mapAnnouncement(row)),
    );

    // Apply pagination
    const offset = (paginationPage - 1) * paginationLimit;
    const paginated = sorted.slice(offset, offset + paginationLimit);

    return {
      data: paginated,
      total: sorted.length,
    };
  }

  private async readPublishedAnnouncements(): Promise<{
    data: AnnouncementRow[] | null;
    error: unknown;
  }> {
    return this.readAnnouncementQuery<AnnouncementRow[] | null>(
      (selectClause) =>
        this.supabaseService
          .getClient()
          .from('announcement')
          .select(selectClause)
          .eq('status', 'published')
          .order('published_at', { ascending: false }) as PromiseLike<{
          data: AnnouncementRow[] | null;
          error: unknown;
        }>,
      'announcements.list',
    );
  }

  private async readPublishedAnnouncementById(id: string): Promise<{
    data: AnnouncementRow | null;
    error: unknown;
  }> {
    return this.readAnnouncementQuery<AnnouncementRow | null>(
      (selectClause) =>
        this.supabaseService
          .getClient()
          .from('announcement')
          .select(selectClause)
          .eq('id', id)
          .eq('status', 'published')
          .single() as PromiseLike<{
          data: AnnouncementRow | null;
          error: unknown;
        }>,
      'announcements.getById',
    );
  }

  private async readAnnouncementQuery<T>(
    loadQuery: (
      selectClause: string,
    ) => PromiseLike<{ data: T; error: unknown }>,
    context: string,
  ): Promise<{ data: T; error: unknown }> {
    return readSupabaseQueryWithFallback({
      loadQuery,
      primarySelect: ANNOUNCEMENT_SELECT_FIELDS,
      fallbackSelect: ANNOUNCEMENT_SELECT_FIELDS_WITHOUT_PRIORITY,
      shouldRetry: isAnnouncementPriorityColumnMissing,
      context,
      retryNotice: 'Announcement priority column missing; retrying fallback',
      fallbackFailureNotice: 'Announcement fallback query failed',
    });
  }

  private resolvePaginationLimit(limit?: number): number {
    const parsedLimit = Number(limit);

    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
      return 20;
    }

    return Math.min(Math.floor(parsedLimit), 100);
  }

  private resolvePaginationPage(page?: number): number {
    const parsedPage = Number(page);

    if (!Number.isFinite(parsedPage) || parsedPage < 1) {
      return 1;
    }

    return Math.floor(parsedPage);
  }

  /**
   * Get a single announcement by ID.
   * Verifies that the participant has access to this announcement based on their enrollment scope.
   * @param id - Announcement ID
   * @param accessToken - The access token of the authenticated participant
   */
  async getAnnouncementById(
    id: string,
    accessToken: string,
  ): Promise<AnnouncementDto> {
    const { data: announcementData, error: announcementError } =
      await this.readPublishedAnnouncementById(id);

    if (announcementError || !announcementData) {
      throw new NotFoundException('Announcement not found or not published');
    }

    const announcement = announcementData;

    // Get participant ID from access token
    const participantId = await this.resolveParticipantId(accessToken);
    if (!participantId) {
      throw new Error('Could not resolve participant ID from access token');
    }

    // Check if announcement is visible to participant
    const isVisible = await this.isAnnouncementVisibleToParticipant(
      announcement,
      participantId,
    );

    if (!isVisible) {
      throw new NotFoundException('Announcement not found or not accessible');
    }

    return this.mapAnnouncement(announcement);
  }

  /**
   * Filter announcements based on participant's enrollment scope.
   * A participant can see:
   * 1. Announcements targeting all_participants
   * 2. Announcements for their enrolled programs
   * 3. Announcements for their enrolled cohorts
   */
  private filterAnnouncementsByScope(
    announcements: AnnouncementRow[],
    enrollments: EnrollmentRow[],
  ): AnnouncementRow[] {
    if (!isMvpSupportedAnnouncementAudience('all_participants')) {
      throw new Error('Invalid audience type');
    }

    const enrolledProgramIds = new Set(enrollments.map((e) => e.program_id));
    const enrolledCohortIds = new Set(
      enrollments.map((e) => e.cohort_id).filter((c) => c !== null),
    );

    return announcements.filter((announcement) => {
      if (!isMvpSupportedAnnouncementAudience(announcement.audience_type)) {
        return false;
      }

      if (announcement.audience_type === 'all_participants') {
        return true;
      }

      if (
        announcement.audience_type === 'program' &&
        announcement.program_id &&
        enrolledProgramIds.has(announcement.program_id)
      ) {
        return true;
      }

      return (
        announcement.audience_type === 'cohort' &&
        announcement.cohort_id !== null &&
        enrolledCohortIds.has(announcement.cohort_id)
      );
    });
  }

  /**
   * Check if an announcement is visible to a participant.
   */
  private async isAnnouncementVisibleToParticipant(
    announcement: AnnouncementRow,
    participantId: string,
  ): Promise<boolean> {
    if (!isMvpSupportedAnnouncementAudience(announcement.audience_type)) {
      return false;
    }

    if (announcement.audience_type === 'all_participants') {
      return true;
    }

    const adminClient = this.supabaseService.getClient();

    // Get participant's enrollments
    let query = adminClient
      .from('enrollment')
      .select('id')
      .eq('participant_id', participantId)
      .in('status', ['pending', 'active', 'completed']);

    if (announcement.audience_type === 'program' && announcement.program_id) {
      query = query.eq('program_id', announcement.program_id);
    } else if (
      announcement.audience_type === 'cohort' &&
      announcement.cohort_id
    ) {
      query = query.eq('cohort_id', announcement.cohort_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to verify announcement access: ${error.message}`);
    }

    return (data?.length ?? 0) > 0;
  }

  /**
   * Resolve participant ID from access token using auth.getUser()
   */
  private async resolveParticipantId(
    accessToken: string,
  ): Promise<string | null> {
    const authClient = this.supabaseService.createAuthClient();

    const { data, error } = await authClient.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    const userId = data.user.id;

    // Get participant linked to this user
    const adminClient = this.supabaseService.getClient();
    const { data: participantData, error: participantError } = await adminClient
      .from('participant')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (participantError || !participantData) {
      return null;
    }

    return participantData.id;
  }

  /**
   * Map database row to DTO.
   */
  private mapAnnouncement(row: AnnouncementRow): AnnouncementDto {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      priority: row.priority ?? 'normal',
      audienceType: row.audience_type,
      programId: row.program_id,
      cohortId: row.cohort_id,
      status: row.status,
      publishedAt: row.published_at,
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private resolvePublishedAt(params: {
    status: PublicationStatusValue;
    publishedAt?: string | null;
  }): string | null {
    if (params.publishedAt !== undefined) {
      return params.publishedAt;
    }

    if (params.status === 'draft') {
      return null;
    }

    return new Date().toISOString();
  }
}
