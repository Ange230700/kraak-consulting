import type {
  UserRoleValue,
  LifecycleStatusValue,
  PublicationStatusValue,
  ProgramVisibilityValue,
  CohortStatusValue,
  SessionStatusValue,
  LocationTypeValue,
  ResourceTypeValue,
  ResourceThemeValue,
  ResourceAudienceValue,
  AudienceTypeValue,
  EnrollmentStatusValue,
  ProgramProgressStatusValue,
  NotificationTypeValue,
  NotificationChannelValue,
  SupportRequestStatusValue,
  SupportCategoryValue,
} from './enums';

// ---------------------------------------------------------------------------
// ContactForm
// ---------------------------------------------------------------------------
export interface ContactFormDto {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: SupportCategoryValue;
}

export interface ContactSubmissionResultDto {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Auth / Session
// ---------------------------------------------------------------------------
export interface SignInRequestDto {
  email: string;
  password: string;
}

export interface SignUpRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  preferredContactChannel?: string | null;
  redirectTo?: string | null;
}

export interface RefreshSessionRequestDto {
  refreshToken: string;
}

export interface PasswordResetRequestDto {
  email: string;
  redirectTo?: string | null;
}

export interface AuthSessionTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: string;
  tokenType: string;
}

export interface AuthProfileDto {
  appUser: AppUserDto;
  participant: ParticipantDto | null;
}

export interface AuthSessionBundleDto {
  session: AuthSessionTokensDto;
  profile: AuthProfileDto;
}

export interface SignUpResponseDto {
  message: string;
  requiresEmailConfirmation: boolean;
  session: AuthSessionTokensDto | null;
  profile: AuthProfileDto | null;
}

export interface PasswordResetResponseDto {
  success: boolean;
  message: string;
}

export interface AuthSessionContextDto {
  profile: AuthProfileDto;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export interface DashboardProgramSummaryDto {
  enrollmentId: string;
  programId: string;
  slug: string;
  title: string;
  summary: string;
  enrollmentStatus: EnrollmentStatusValue;
  cohortId: string | null;
  cohortName: string | null;
  cohortStatus: CohortStatusValue | null;
  cohortStartDate: string | null;
}

export interface DashboardSessionReminderDto {
  id: string;
  title: string;
  status: SessionStatusValue;
  startsAt: string;
  endsAt: string;
  locationType: LocationTypeValue;
  locationLabel: string | null;
  meetingLink: string | null;
  cohortId: string;
  cohortName: string;
  programId: string;
  programSlug: string;
  programTitle: string;
}

export interface DashboardAnnouncementSummaryDto {
  id: string;
  title: string;
  body: string;
  audienceType: AudienceTypeValue;
  programId: string | null;
  cohortId: string | null;
  publishedAt: string | null;
}

export interface DashboardAggregateDto {
  generatedAt: string;
  programs: DashboardProgramSummaryDto[];
  upcomingSessions: DashboardSessionReminderDto[];
  recentAnnouncements: DashboardAnnouncementSummaryDto[];
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------
export interface ParticipantProgramListItemDto {
  enrollmentId: string;
  enrollmentStatus: EnrollmentStatusValue;
  program: ProgramDto;
  cohort: CohortDto | null;
  progress: ProgramProgressDto;
}

export interface ProgramProgressDto {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  status: ProgramProgressStatusValue;
  completedSessionIds: string[];
  updatedAt: string | null;
}

export interface MarkProgramSessionProgressRequestDto {
  sessionId: string;
  completed: boolean;
}

export interface MarkProgramSessionProgressResponseDto {
  enrollmentId: string;
  enrollmentStatus: EnrollmentStatusValue;
  progress: ProgramProgressDto;
}

export interface ProgramAnnouncementPreviewDto {
  id: string;
  title: string;
  audienceType: AudienceTypeValue;
  publishedAt: string | null;
}

export interface ParticipantProgramDetailDto {
  enrollmentId: string;
  enrollmentStatus: EnrollmentStatusValue;
  program: ProgramDto;
  cohort: CohortDto | null;
  progress: ProgramProgressDto;
  sessions: SessionDto[];
  resources: ResourceDto[];
  announcements: ProgramAnnouncementPreviewDto[];
}

// ---------------------------------------------------------------------------
// AppUser
// ---------------------------------------------------------------------------
export interface AppUserDto {
  id: string;
  email: string;
  role: UserRoleValue;
  firstName: string;
  lastName: string;
  phone: string | null;
  preferredContactChannel: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateAppUserDto = Omit<
  AppUserDto,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateAppUserDto = Partial<CreateAppUserDto>;

// ---------------------------------------------------------------------------
// Participant
// ---------------------------------------------------------------------------
export interface ParticipantDto {
  id: string;
  userId: string;
  lifecycleStatus: LifecycleStatusValue;
  referenceCode: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateParticipantDto = Omit<
  ParticipantDto,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateParticipantDto = Partial<CreateParticipantDto>;

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------
export interface ProgramDto {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  status: PublicationStatusValue;
  visibility: ProgramVisibilityValue;
  createdAt: string;
  updatedAt: string;
}

export type CreateProgramDto = Omit<
  ProgramDto,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateProgramDto = Partial<CreateProgramDto>;

// ---------------------------------------------------------------------------
// Cohort
// ---------------------------------------------------------------------------
export interface CohortDto {
  id: string;
  programId: string;
  name: string;
  code: string | null;
  status: CohortStatusValue;
  startDate: string;
  endDate: string | null;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateCohortDto = Omit<CohortDto, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCohortDto = Partial<CreateCohortDto>;

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export interface SessionDto {
  id: string;
  cohortId: string;
  title: string;
  description: string | null;
  status: SessionStatusValue;
  startsAt: string;
  endsAt: string;
  locationType: LocationTypeValue;
  locationLabel: string | null;
  meetingLink: string | null;
  trainerUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateSessionDto = Omit<
  SessionDto,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateSessionDto = Partial<CreateSessionDto>;

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------
export interface ResourceDto {
  id: string;
  programId: string | null;
  cohortId: string | null;
  title: string;
  description: string | null;
  resourceType: ResourceTypeValue;
  resourceTheme: ResourceThemeValue;
  resourceAudience: ResourceAudienceValue;
  url: string | null;
  filePath: string | null;
  status: PublicationStatusValue;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateResourceDto = Omit<
  ResourceDto,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateResourceDto = Partial<CreateResourceDto>;

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------
export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  audienceType: AudienceTypeValue;
  programId: string | null;
  cohortId: string | null;
  status: PublicationStatusValue;
  publishedAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateAnnouncementDto = Omit<
  AnnouncementDto,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateAnnouncementDto = Partial<CreateAnnouncementDto>;

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------
export interface EnrollmentDto {
  id: string;
  participantId: string;
  programId: string;
  cohortId: string | null;
  status: EnrollmentStatusValue;
  enrolledAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateEnrollmentDto = Omit<
  EnrollmentDto,
  'id' | 'createdAt' | 'updatedAt' | 'enrolledAt'
>;
export type UpdateEnrollmentDto = Partial<CreateEnrollmentDto>;

// ---------------------------------------------------------------------------
// Notification (immutable — no UpdateDto, no updatedAt)
// ---------------------------------------------------------------------------
export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  body: string;
  notificationType: NotificationTypeValue;
  channel: NotificationChannelValue;
  isRead: boolean;
  readAt: string | null;
  sourceType: string | null;
  sourceId: string | null;
  createdAt: string;
}

export type CreateNotificationDto = Omit<
  NotificationDto,
  'id' | 'createdAt' | 'isRead' | 'readAt'
>;

// ---------------------------------------------------------------------------
// SupportRequest
// ---------------------------------------------------------------------------
export interface SupportRequestDto {
  id: string;
  userId: string;
  participantId: string | null;
  subject: string;
  message: string;
  status: SupportRequestStatusValue;
  category: SupportCategoryValue;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateSupportRequestDto = Omit<
  SupportRequestDto,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateSupportRequestDto = Partial<CreateSupportRequestDto>;
