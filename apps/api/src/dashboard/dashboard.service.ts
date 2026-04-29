import {
  InternalServerErrorException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AudienceTypeValue,
  CohortStatusValue,
  DashboardAggregateDto,
  DashboardAnnouncementSummaryDto,
  DashboardProgramSummaryDto,
  DashboardSessionReminderDto,
  EnrollmentStatusValue,
  SessionStatusValue,
} from '@kraak/contracts';
import { SupabaseService } from '../supabase/supabase.service';

type ParticipantRow = {
  id: string;
};

type EnrollmentProgramRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
};

type EnrollmentCohortRow = {
  id: string;
  name: string;
  status: CohortStatusValue;
  start_date: string;
};

type EnrollmentRow = {
  id: string;
  status: EnrollmentStatusValue;
  program_id: string;
  cohort_id: string | null;
  program: EnrollmentProgramRow | EnrollmentProgramRow[] | null;
  cohort: EnrollmentCohortRow | EnrollmentCohortRow[] | null;
};

type SessionProgramRow = {
  id: string;
  slug: string;
  title: string;
};

type SessionCohortRow = {
  id: string;
  name: string;
  program: SessionProgramRow | SessionProgramRow[] | null;
};

type SessionRow = {
  id: string;
  title: string;
  status: SessionStatusValue;
  starts_at: string;
  ends_at: string;
  location_type: DashboardSessionReminderDto['locationType'];
  location_label: string | null;
  meeting_link: string | null;
  cohort_id: string;
  cohort: SessionCohortRow | SessionCohortRow[] | null;
};

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  audience_type: AudienceTypeValue;
  program_id: string | null;
  cohort_id: string | null;
  published_at: string | null;
};

const dashboardVisibleEnrollmentStatuses: EnrollmentStatusValue[] = [
  'pending',
  'active',
  'paused',
  'completed',
];

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAggregate(accessToken: string): Promise<DashboardAggregateDto> {
    const authClient = this.supabaseService.createAuthClient();
    const { data, error } = await authClient.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException({
        success: false,
        message: 'La session est invalide ou expirée.',
      });
    }

    const participantId = await this.resolveParticipantId(data.user.id);

    if (!participantId) {
      return this.buildEmptyAggregate();
    }

    const programs = await this.readPrograms(participantId);
    const programIds = [
      ...new Set(programs.map((program) => program.programId)),
    ];
    const cohortIds = [
      ...new Set(
        programs
          .map((program) => program.cohortId)
          .filter((cohortId): cohortId is string => Boolean(cohortId)),
      ),
    ];

    const upcomingSessions =
      cohortIds.length > 0 ? await this.readUpcomingSessions(cohortIds) : [];
    const recentAnnouncements = await this.readRecentAnnouncements(
      programIds,
      cohortIds,
    );

    return {
      generatedAt: new Date().toISOString(),
      programs,
      upcomingSessions,
      recentAnnouncements,
    };
  }

  private async resolveParticipantId(userId: string): Promise<string | null> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('participant')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger le participant courant.',
      });
    }

    return (data as ParticipantRow | null)?.id ?? null;
  }

  private async readPrograms(
    participantId: string,
  ): Promise<DashboardProgramSummaryDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('enrollment')
      .select(
        'id, status, program_id, cohort_id, program:program(id, slug, title, summary), cohort:cohort(id, name, status, start_date)',
      )
      .eq('participant_id', participantId)
      .in('status', dashboardVisibleEnrollmentStatuses)
      .order('enrolled_at', { ascending: false })
      .limit(6);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les programmes du dashboard.',
      });
    }

    return ((data as EnrollmentRow[] | null) ?? [])
      .map((row) => {
        const program = normalizeRelation(row.program);
        const cohort = normalizeRelation(row.cohort);

        return {
          enrollmentId: row.id,
          programId: row.program_id,
          slug: program?.slug ?? '',
          title: program?.title ?? '',
          summary: program?.summary ?? '',
          enrollmentStatus: row.status,
          cohortId: row.cohort_id,
          cohortName: cohort?.name ?? null,
          cohortStatus: cohort?.status ?? null,
          cohortStartDate: cohort?.start_date ?? null,
        };
      })
      .filter((program) => Boolean(program.slug && program.title));
  }

  private async readUpcomingSessions(
    cohortIds: string[],
  ): Promise<DashboardSessionReminderDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('session')
      .select(
        'id, title, status, starts_at, ends_at, location_type, location_label, meeting_link, cohort_id, cohort:cohort(id, name, program:program(id, slug, title))',
      )
      .in('cohort_id', cohortIds)
      .in('status', ['scheduled'])
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(5);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les sessions à venir du dashboard.',
      });
    }

    return ((data as SessionRow[] | null) ?? [])
      .map((row) => {
        const cohort = normalizeRelation(row.cohort);
        const program = normalizeRelation(cohort?.program);

        return {
          id: row.id,
          title: row.title,
          status: row.status,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
          locationType: row.location_type,
          locationLabel: row.location_label,
          meetingLink: row.meeting_link,
          cohortId: row.cohort_id,
          cohortName: cohort?.name ?? '',
          programId: program?.id ?? '',
          programSlug: program?.slug ?? '',
          programTitle: program?.title ?? '',
        };
      })
      .filter((session) => Boolean(session.programId && session.programTitle));
  }

  private async readRecentAnnouncements(
    programIds: string[],
    cohortIds: string[],
  ): Promise<DashboardAnnouncementSummaryDto[]> {
    const adminClient = this.supabaseService.getClient();
    const visibilityFilters = ['audience_type.eq.all_participants'];

    if (programIds.length > 0) {
      visibilityFilters.push(
        `and(audience_type.eq.program,program_id.in.(${programIds.join(',')}))`,
      );
    }

    if (cohortIds.length > 0) {
      visibilityFilters.push(
        `and(audience_type.eq.cohort,cohort_id.in.(${cohortIds.join(',')}))`,
      );
    }

    const { data, error } = await adminClient
      .from('announcement')
      .select(
        'id, title, body, audience_type, program_id, cohort_id, published_at',
      )
      .eq('status', 'published')
      .or(visibilityFilters.join(','))
      .order('published_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les annonces du dashboard.',
      });
    }

    return ((data as AnnouncementRow[] | null) ?? [])
      .filter((row) => this.isAnnouncementVisible(row, programIds, cohortIds))
      .map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        audienceType: row.audience_type,
        programId: row.program_id,
        cohortId: row.cohort_id,
        publishedAt: row.published_at,
      }));
  }

  private isAnnouncementVisible(
    row: AnnouncementRow,
    programIds: string[],
    cohortIds: string[],
  ): boolean {
    if (row.audience_type === 'all_participants') {
      return true;
    }

    if (row.audience_type === 'program') {
      return Boolean(row.program_id && programIds.includes(row.program_id));
    }

    if (row.audience_type === 'cohort') {
      return Boolean(row.cohort_id && cohortIds.includes(row.cohort_id));
    }

    return false;
  }

  private buildEmptyAggregate(): DashboardAggregateDto {
    return {
      generatedAt: new Date().toISOString(),
      programs: [],
      upcomingSessions: [],
      recentAnnouncements: [],
    };
  }
}
