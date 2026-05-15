import {
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  applySessionProgressMark,
  calculateProgramProgress,
  canMarkSessionProgress,
  canTransitionEnrollmentStatus,
} from '@kraak/domain';
import type {
  AudienceTypeValue,
  CohortDto,
  CohortStatusValue,
  EnrollmentStatusValue,
  MarkProgramSessionProgressRequestDto,
  MarkProgramSessionProgressResponseDto,
  ParticipantProgramDetailDto,
  ParticipantProgramListItemDto,
  ProgramAnnouncementPreviewDto,
  ProgramDto,
  ProgramVisibilityValue,
  PublicationStatusValue,
  ResourceDto,
  SessionDto,
  SessionStatusValue,
  LocationTypeValue,
} from '@kraak/contracts';
import { SupabaseService } from '../supabase/supabase.service';
import { mapResource, type ResourceRow } from '../shared/resource-mapper.utils';

type ParticipantRow = {
  id: string;
};

type ProgramRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  status: PublicationStatusValue;
  visibility: ProgramVisibilityValue;
  created_at: string;
  updated_at: string;
};

type CohortRow = {
  id: string;
  program_id: string;
  name: string;
  code: string | null;
  status: CohortStatusValue;
  start_date: string;
  end_date: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
};

type EnrollmentRow = {
  id: string;
  status: EnrollmentStatusValue;
  completed_at: string | null;
  program_id: string;
  cohort_id: string | null;
  progress_completed_session_ids: string[] | null;
  progress_updated_at: string | null;
  program: ProgramRow | ProgramRow[] | null;
  cohort: CohortRow | CohortRow[] | null;
};

type SessionRow = {
  id: string;
  cohort_id: string;
  title: string;
  description: string | null;
  status: SessionStatusValue;
  starts_at: string;
  ends_at: string;
  location_type: LocationTypeValue;
  location_label: string | null;
  meeting_link: string | null;
  trainer_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type AnnouncementPreviewRow = Pick<
  {
    id: string;
    title: string;
    audience_type: AudienceTypeValue;
    program_id: string | null;
    cohort_id: string | null;
    published_at: string | null;
  },
  'id' | 'title' | 'audience_type' | 'program_id' | 'cohort_id' | 'published_at'
>;

const enrollmentProgramSelect =
  'id, status, completed_at, program_id, cohort_id, progress_completed_session_ids, progress_updated_at, program:program(id, slug, title, summary, description, status, visibility, created_at, updated_at), cohort:cohort(id, program_id, name, code, status, start_date, end_date, capacity, created_at, updated_at)';

const progressUpdateErrorMessage =
  'Impossible de mettre à jour la progression du programme.';
const sessionProgressPageSize = 200;
const programNotFoundMessage = 'Programme introuvable pour ce participant.';
const resourcesReadErrorMessage =
  'Impossible de charger les ressources du programme.';

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

@Injectable()
export class ProgramsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listPrograms(
    accessToken?: string,
  ): Promise<ParticipantProgramListItemDto[] | ProgramDto[]> {
    if (!accessToken) {
      return this.listPublishedPrograms();
    }

    const participantId = await this.resolveParticipantId(accessToken);

    if (!participantId) {
      return [];
    }

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('enrollment')
      .select(enrollmentProgramSelect)
      .eq('participant_id', participantId)
      .in('status', ['pending', 'active', 'completed'])
      .order('enrolled_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger la liste des programmes.',
      });
    }

    const enrollments = (data as EnrollmentRow[] | null) ?? [];
    const cohortIds = enrollments
      .map((row) => normalizeRelation(row.cohort)?.id ?? null)
      .filter((id): id is string => Boolean(id));
    const sessionsByCohort = await this.readSessionIdsByCohort(cohortIds);

    return enrollments
      .map((row) => {
        const program = normalizeRelation(row.program);
        const cohort = normalizeRelation(row.cohort);

        if (!program) {
          return null;
        }

        const sessionIds = cohort
          ? (sessionsByCohort.get(cohort.id) ?? [])
          : [];
        const progress = calculateProgramProgress({
          sessionIds,
          completedSessionIds: row.progress_completed_session_ids ?? [],
          updatedAt: row.progress_updated_at,
        });

        return {
          enrollmentId: row.id,
          enrollmentStatus: row.status,
          program: this.mapProgram(program),
          cohort: this.mapCohort(cohort),
          progress,
        };
      })
      .filter((item): item is ParticipantProgramListItemDto => item !== null);
  }

  private async listPublishedPrograms(): Promise<ProgramDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('program')
      .select(
        'id, slug, title, summary, description, status, visibility, created_at, updated_at',
      )
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger la liste des programmes.',
      });
    }

    return ((data as ProgramRow[] | null) ?? []).map((row) =>
      this.mapProgram(row),
    );
  }

  async getProgramDetail(
    accessToken: string,
    programId: string,
  ): Promise<ParticipantProgramDetailDto> {
    const participantId = await this.resolveParticipantId(accessToken);

    if (!participantId) {
      throw new NotFoundException({
        success: false,
        message: programNotFoundMessage,
      });
    }

    const enrollment = await this.readEnrollmentByProgram(
      participantId,
      programId,
      'Impossible de charger le programme demandé.',
    );

    if (!enrollment) {
      throw new NotFoundException({
        success: false,
        message: programNotFoundMessage,
      });
    }

    const program = normalizeRelation(enrollment.program);

    if (!program) {
      throw new NotFoundException({
        success: false,
        message: programNotFoundMessage,
      });
    }

    const cohort = this.mapCohort(normalizeRelation(enrollment.cohort));
    const [sessions, resources, announcements] = await Promise.all([
      cohort ? this.readSessions(cohort.id) : Promise.resolve<SessionDto[]>([]),
      this.readResources(program.id, cohort?.id ?? null),
      this.readAnnouncements(program.id, cohort?.id ?? null),
    ]);

    const progress = calculateProgramProgress({
      sessionIds: sessions.map((session) => session.id),
      completedSessionIds: enrollment.progress_completed_session_ids ?? [],
      updatedAt: enrollment.progress_updated_at,
    });

    return {
      enrollmentId: enrollment.id,
      enrollmentStatus: enrollment.status,
      program: this.mapProgram(program),
      cohort,
      progress,
      sessions,
      resources,
      announcements,
    };
  }

  async markSessionProgress(
    accessToken: string,
    programId: string,
    payload: MarkProgramSessionProgressRequestDto,
  ): Promise<MarkProgramSessionProgressResponseDto> {
    const participantId = await this.resolveParticipantId(accessToken);

    if (!participantId) {
      throw new NotFoundException({
        success: false,
        message: programNotFoundMessage,
      });
    }

    const enrollment = await this.readEnrollmentByProgram(
      participantId,
      programId,
      progressUpdateErrorMessage,
    );

    if (!enrollment) {
      throw new NotFoundException({
        success: false,
        message: programNotFoundMessage,
      });
    }

    const adminClient = this.supabaseService.getClient();
    const cohort = normalizeRelation(enrollment.cohort);

    if (!cohort) {
      throw new NotFoundException({
        success: false,
        message: 'Session introuvable pour ce programme.',
      });
    }

    const sessionIds = await this.readVisibleSessionIdsByCohort(cohort.id);

    if (!canMarkSessionProgress(sessionIds, payload.sessionId)) {
      throw new NotFoundException({
        success: false,
        message: 'Session introuvable pour ce programme.',
      });
    }

    const nowIso = new Date().toISOString();
    const nextCompletedSessionIds = applySessionProgressMark(
      enrollment.progress_completed_session_ids ?? [],
      payload.sessionId,
      payload.completed,
    );
    const progress = calculateProgramProgress({
      sessionIds,
      completedSessionIds: nextCompletedSessionIds,
      updatedAt: nowIso,
    });

    let nextEnrollmentStatus = enrollment.status;
    const shouldMarkAsCompleted =
      progress.status === 'completed' &&
      canTransitionEnrollmentStatus(enrollment.status, 'completed');

    if (shouldMarkAsCompleted) {
      nextEnrollmentStatus = 'completed';
    }

    const updatePayload: Record<string, unknown> = {
      progress_completed_session_ids: progress.completedSessionIds,
      progress_updated_at: nowIso,
    };

    if (nextEnrollmentStatus !== enrollment.status) {
      updatePayload['status'] = nextEnrollmentStatus;
      if (nextEnrollmentStatus === 'completed') {
        updatePayload['completed_at'] = nowIso;
      }
    }

    const { error: updateError } = await adminClient
      .from('enrollment')
      .update(updatePayload)
      .eq('id', enrollment.id);

    if (updateError) {
      throw new InternalServerErrorException({
        success: false,
        message: progressUpdateErrorMessage,
      });
    }

    return {
      enrollmentId: enrollment.id,
      enrollmentStatus: nextEnrollmentStatus,
      progress,
    };
  }

  private async resolveParticipantId(
    accessToken: string,
  ): Promise<string | null> {
    const authClient = this.supabaseService.createAuthClient();
    const { data, error } = await authClient.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException({
        success: false,
        message: 'La session est invalide ou expirée.',
      });
    }

    const adminClient = this.supabaseService.getClient();
    const { data: participant, error: participantError } = await adminClient
      .from('participant')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (participantError) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger le participant courant.',
      });
    }

    return (participant as ParticipantRow | null)?.id ?? null;
  }

  private async readSessions(cohortId: string): Promise<SessionDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('session')
      .select(
        'id, cohort_id, title, description, status, starts_at, ends_at, location_type, location_label, meeting_link, trainer_user_id, created_at, updated_at',
      )
      .eq('cohort_id', cohortId)
      .in('status', ['scheduled', 'live', 'completed'])
      .order('starts_at', { ascending: true })
      .limit(50);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les sessions du programme.',
      });
    }

    return ((data as SessionRow[] | null) ?? []).map((row) =>
      this.mapSession(row),
    );
  }

  private async readSessionIdsByCohort(
    cohortIds: string[],
  ): Promise<Map<string, string[]>> {
    const uniqueCohortIds = Array.from(new Set(cohortIds));

    if (uniqueCohortIds.length === 0) {
      return new Map();
    }

    const adminClient = this.supabaseService.getClient();
    const rows = await this.readPagedSessionRows<{
      id: string;
      cohort_id: string;
    }>(
      async (from, to) =>
        adminClient
          .from('session')
          .select('id, cohort_id')
          .in('cohort_id', uniqueCohortIds)
          .in('status', ['scheduled', 'live', 'completed'])
          .order('id', { ascending: true })
          .range(from, to),
      'Impossible de charger la progression des programmes.',
    );

    const grouped = new Map<string, string[]>();

    for (const row of rows) {
      const current = grouped.get(row.cohort_id) ?? [];
      current.push(row.id);
      grouped.set(row.cohort_id, current);
    }

    return grouped;
  }

  private async readVisibleSessionIdsByCohort(
    cohortId: string,
  ): Promise<string[]> {
    const adminClient = this.supabaseService.getClient();
    const rows = await this.readPagedSessionRows<{ id: string }>(
      async (from, to) =>
        adminClient
          .from('session')
          .select('id')
          .eq('cohort_id', cohortId)
          .in('status', ['scheduled', 'live', 'completed'])
          .order('id', { ascending: true })
          .range(from, to),
      progressUpdateErrorMessage,
    );

    return rows.map((row) => row.id);
  }

  private async readPagedSessionRows<T>(
    loadPage: (
      from: number,
      to: number,
    ) => Promise<{ data: T[] | null; error: unknown }>,
    errorMessage: string,
  ): Promise<T[]> {
    const rows: T[] = [];
    let from = 0;

    while (true) {
      const to = from + sessionProgressPageSize - 1;
      const { data, error } = await loadPage(from, to);

      if (error) {
        throw new InternalServerErrorException({
          success: false,
          message: errorMessage,
        });
      }

      const batch = data ?? [];
      rows.push(...batch);

      if (batch.length < sessionProgressPageSize) {
        break;
      }

      from += sessionProgressPageSize;
    }

    return rows;
  }

  private async readResources(
    programId: string,
    cohortId: string | null,
  ): Promise<ResourceDto[]> {
    const programResources = await this.readPublishedResources(programId, null);

    let cohortResources: ResourceRow[] = [];

    if (cohortId) {
      cohortResources = await this.readPublishedResources(programId, cohortId);
    }

    const mergedResources = [...programResources, ...cohortResources];

    const uniqueResources = Array.from(
      new Map(mergedResources.map((row) => [row.id, row])).values(),
    ).sort((left, right) => {
      const leftPublishedAt = left.published_at
        ? new Date(left.published_at).getTime()
        : 0;
      const rightPublishedAt = right.published_at
        ? new Date(right.published_at).getTime()
        : 0;

      return rightPublishedAt - leftPublishedAt;
    });

    return uniqueResources.slice(0, 50).map((row) => this.mapResource(row));
  }

  private async readAnnouncements(
    programId: string,
    cohortId: string | null,
  ): Promise<ProgramAnnouncementPreviewDto[]> {
    const adminClient = this.supabaseService.getClient();
    const visibilityFilters = [
      'audience_type.eq.all_participants',
      `and(audience_type.eq.program,program_id.eq.${programId})`,
    ];

    if (cohortId) {
      visibilityFilters.push(
        `and(audience_type.eq.cohort,cohort_id.eq.${cohortId})`,
      );
    }

    const { data, error } = await adminClient
      .from('announcement')
      .select('id, title, audience_type, program_id, cohort_id, published_at')
      .eq('status', 'published')
      .or(visibilityFilters.join(','))
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les annonces du programme.',
      });
    }

    return ((data as AnnouncementPreviewRow[] | null) ?? [])
      .filter((row) => this.isVisibleAnnouncement(row, programId, cohortId))
      .map((row) => ({
        id: row.id,
        title: row.title,
        audienceType: row.audience_type,
        publishedAt: row.published_at,
      }));
  }

  private async readEnrollmentByProgram(
    participantId: string,
    programId: string,
    errorMessage: string,
  ): Promise<EnrollmentRow | null> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('enrollment')
      .select(enrollmentProgramSelect)
      .eq('participant_id', participantId)
      .eq('program_id', programId)
      .in('status', ['pending', 'active', 'completed'])
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: errorMessage,
      });
    }

    return data as EnrollmentRow | null;
  }

  private async readPublishedResources(
    programId: string,
    cohortId: string | null,
  ): Promise<ResourceRow[]> {
    const adminClient = this.supabaseService.getClient();
    const resourceSelect =
      'id, program_id, cohort_id, title, description, resource_type, resource_theme, resource_audience, url, file_path, status, published_at, created_at, updated_at';

    const { data, error } = cohortId
      ? await adminClient
          .from('resource')
          .select(resourceSelect)
          .eq('status', 'published')
          .eq('program_id', programId)
          .eq('cohort_id', cohortId)
          .order('published_at', { ascending: false })
          .limit(50)
      : await adminClient
          .from('resource')
          .select(resourceSelect)
          .eq('status', 'published')
          .eq('program_id', programId)
          .is('cohort_id', null)
          .order('published_at', { ascending: false })
          .limit(50);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: resourcesReadErrorMessage,
      });
    }

    return (data as ResourceRow[] | null) ?? [];
  }

  private isVisibleAnnouncement(
    announcement: AnnouncementPreviewRow,
    programId: string,
    cohortId: string | null,
  ): boolean {
    if (announcement.audience_type === 'all_participants') {
      return true;
    }

    if (announcement.audience_type === 'program') {
      return announcement.program_id === programId;
    }

    if (announcement.audience_type === 'cohort') {
      return Boolean(cohortId && announcement.cohort_id === cohortId);
    }

    return false;
  }

  private mapProgram(row: ProgramRow): ProgramDto {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      description: row.description,
      status: row.status,
      visibility: row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapCohort(row: CohortRow | null): CohortDto | null {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      programId: row.program_id,
      name: row.name,
      code: row.code,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      capacity: row.capacity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSession(row: SessionRow): SessionDto {
    return {
      id: row.id,
      cohortId: row.cohort_id,
      title: row.title,
      description: row.description,
      status: row.status,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      locationType: row.location_type,
      locationLabel: row.location_label,
      meetingLink: row.meeting_link,
      trainerUserId: row.trainer_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapResource(row: ResourceRow): ResourceDto {
    return mapResource(row);
  }
}
