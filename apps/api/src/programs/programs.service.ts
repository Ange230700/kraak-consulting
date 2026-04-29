import {
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AudienceTypeValue,
  CohortDto,
  CohortStatusValue,
  EnrollmentStatusValue,
  ParticipantProgramDetailDto,
  ParticipantProgramListItemDto,
  ProgramAnnouncementPreviewDto,
  ProgramDto,
  ProgramVisibilityValue,
  PublicationStatusValue,
  ResourceDto,
  ResourceTypeValue,
  SessionDto,
  SessionStatusValue,
  LocationTypeValue,
} from '@kraak/contracts';
import { SupabaseService } from '../supabase/supabase.service';

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
  program_id: string;
  cohort_id: string | null;
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

type ResourceRow = {
  id: string;
  program_id: string | null;
  cohort_id: string | null;
  title: string;
  description: string | null;
  resource_type: ResourceTypeValue;
  url: string | null;
  file_path: string | null;
  status: PublicationStatusValue;
  published_at: string | null;
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
    accessToken: string,
  ): Promise<ParticipantProgramListItemDto[]> {
    const participantId = await this.resolveParticipantId(accessToken);

    if (!participantId) {
      return [];
    }

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('enrollment')
      .select(
        'id, status, program_id, cohort_id, program:program(id, slug, title, summary, description, status, visibility, created_at, updated_at), cohort:cohort(id, program_id, name, code, status, start_date, end_date, capacity, created_at, updated_at)',
      )
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

    return ((data as EnrollmentRow[] | null) ?? [])
      .map((row) => {
        const program = normalizeRelation(row.program);

        if (!program) {
          return null;
        }

        return {
          enrollmentId: row.id,
          enrollmentStatus: row.status,
          program: this.mapProgram(program),
          cohort: this.mapCohort(normalizeRelation(row.cohort)),
        };
      })
      .filter((item): item is ParticipantProgramListItemDto => item !== null);
  }

  async getProgramDetail(
    accessToken: string,
    programId: string,
  ): Promise<ParticipantProgramDetailDto> {
    const participantId = await this.resolveParticipantId(accessToken);

    if (!participantId) {
      throw new NotFoundException({
        success: false,
        message: 'Programme introuvable pour ce participant.',
      });
    }

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('enrollment')
      .select(
        'id, status, program_id, cohort_id, program:program(id, slug, title, summary, description, status, visibility, created_at, updated_at), cohort:cohort(id, program_id, name, code, status, start_date, end_date, capacity, created_at, updated_at)',
      )
      .eq('participant_id', participantId)
      .eq('program_id', programId)
      .in('status', ['pending', 'active', 'completed'])
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger le programme demandé.',
      });
    }

    const enrollment = data as EnrollmentRow | null;

    if (!enrollment) {
      throw new NotFoundException({
        success: false,
        message: 'Programme introuvable pour ce participant.',
      });
    }

    const program = normalizeRelation(enrollment.program);

    if (!program) {
      throw new NotFoundException({
        success: false,
        message: 'Programme introuvable pour ce participant.',
      });
    }

    const cohort = this.mapCohort(normalizeRelation(enrollment.cohort));
    const [sessions, resources, announcements] = await Promise.all([
      cohort ? this.readSessions(cohort.id) : Promise.resolve<SessionDto[]>([]),
      this.readResources(program.id, cohort?.id ?? null),
      this.readAnnouncements(program.id, cohort?.id ?? null),
    ]);

    return {
      enrollmentId: enrollment.id,
      enrollmentStatus: enrollment.status,
      program: this.mapProgram(program),
      cohort,
      sessions,
      resources,
      announcements,
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

  private async readResources(
    programId: string,
    cohortId: string | null,
  ): Promise<ResourceDto[]> {
    const adminClient = this.supabaseService.getClient();
    const relationScopedQuery = adminClient
      .from('resource')
      .select(
        'id, program_id, cohort_id, title, description, resource_type, url, file_path, status, published_at, created_at, updated_at',
      )
      .eq('status', 'published');

    const query = cohortId
      ? relationScopedQuery.or(
          `program_id.eq.${programId},cohort_id.eq.${cohortId}`,
        )
      : relationScopedQuery.eq('program_id', programId);

    const { data, error } = await query
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les ressources du programme.',
      });
    }

    return ((data as ResourceRow[] | null) ?? []).map((row) =>
      this.mapResource(row),
    );
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
    return {
      id: row.id,
      programId: row.program_id,
      cohortId: row.cohort_id,
      title: row.title,
      description: row.description,
      resourceType: row.resource_type,
      url: row.url,
      filePath: row.file_path,
      status: row.status,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
