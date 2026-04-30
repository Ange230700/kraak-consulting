import { Injectable, NotFoundException } from '@nestjs/common';
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

const ANNOUNCEMENT_SELECT_FIELDS =
  'id, title, body, priority, audience_type, program_id, cohort_id, status, published_at, created_by_user_id, created_at, updated_at';

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriorityValue;
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

@Injectable()
export class AnnouncementsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * List announcements visible to the authenticated participant.
   * Filters by participant's enrollment scope (all_participants, program, cohort).
   * Results are ordered by priority and then by publishedAt descending.
   * @param accessToken - The access token of the authenticated participant
   * @param page - Page number (1-based, default: 1)
   * @param limit - Items per page (default: 20, max: 100)
   */
  async listAnnouncements(
    accessToken: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: AnnouncementDto[]; total: number }> {
    const adminClient = this.supabaseService.getClient();
    const paginationLimit = this.resolvePaginationLimit(limit);
    const paginationPage = this.resolvePaginationPage(page);

    // Get participant ID from access token
    const participantId = await this.resolveParticipantId(accessToken);
    if (!participantId) {
      throw new Error('Could not resolve participant ID from access token');
    }

    // Get all published announcements
    const { data: allAnnouncements, error: announcementsError } =
      await adminClient
        .from('announcement')
        .select(ANNOUNCEMENT_SELECT_FIELDS)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    if (announcementsError) {
      throw new Error(
        `Failed to list announcements: ${announcementsError.message}`,
      );
    }

    // Get participant's enrollments
    const { data: enrollments, error: enrollmentsError } = await adminClient
      .from('enrollment')
      .select('program_id, cohort_id')
      .eq('participant_id', participantId)
      .in('status', ['pending', 'active', 'completed']);

    if (enrollmentsError) {
      throw new Error(`Failed to get enrollments: ${enrollmentsError.message}`);
    }

    // Filter announcements based on participant's scope
    const visibleAnnouncements = this.filterAnnouncementsByScope(
      (allAnnouncements ?? []) as AnnouncementRow[],
      (enrollments ?? []) as EnrollmentRow[],
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
    const adminClient = this.supabaseService.getClient();

    // Get the announcement
    const { data: announcementData, error: announcementError } =
      await adminClient
        .from('announcement')
        .select(ANNOUNCEMENT_SELECT_FIELDS)
        .eq('id', id)
        .eq('status', 'published')
        .single();

    if (announcementError || !announcementData) {
      throw new NotFoundException('Announcement not found or not published');
    }

    const announcement = announcementData as AnnouncementRow;

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
      priority: row.priority,
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
}
