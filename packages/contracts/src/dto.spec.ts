import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  AppUserDto,
  CreateAppUserDto,
  UpdateAppUserDto,
  ContactFormDto,
  ContactSubmissionResultDto,
  ParticipantDto,
  CreateParticipantDto,
  UpdateParticipantDto,
  ProgramDto,
  CreateProgramDto,
  UpdateProgramDto,
  CohortDto,
  CreateCohortDto,
  UpdateCohortDto,
  SessionDto,
  CreateSessionDto,
  UpdateSessionDto,
  ResourceDto,
  CreateResourceDto,
  UpdateResourceDto,
  AnnouncementDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  EnrollmentDto,
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  NotificationDto,
  CreateNotificationDto,
  SupportRequestDto,
  CreateSupportRequestDto,
  UpdateSupportRequestDto,
  DashboardAggregateDto,
  DashboardProgramSummaryDto,
  DashboardSessionReminderDto,
  DashboardAnnouncementSummaryDto,
  ParticipantProgramListItemDto,
  ParticipantProgramDetailDto,
  ProgramAnnouncementPreviewDto,
} from './dto';

// Runtime import to ensure the module actually exists (prevents vacuous type test passes)
import * as dtoModule from './dto';
import type {
  UserRoleValue,
  LifecycleStatusValue,
  PublicationStatusValue,
  ProgramVisibilityValue,
  CohortStatusValue,
  SessionStatusValue,
  LocationTypeValue,
  ResourceTypeValue,
  AudienceTypeValue,
  EnrollmentStatusValue,
  NotificationTypeValue,
  NotificationChannelValue,
  SupportRequestStatusValue,
  SupportCategoryValue,
} from './enums';

// ---------------------------------------------------------------------------
// Module existence smoke test
// ---------------------------------------------------------------------------
describe('dto module', () => {
  it('should be importable at runtime', () => {
    expect(dtoModule).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// ContactForm
// ---------------------------------------------------------------------------
describe('ContactFormDto', () => {
  it('should expose the public contact/support payload shape', () => {
    expectTypeOf<ContactFormDto>().toHaveProperty('name').toBeString();
    expectTypeOf<ContactFormDto>().toHaveProperty('email').toBeString();
    expectTypeOf<ContactFormDto>().toHaveProperty('subject').toBeString();
    expectTypeOf<ContactFormDto>().toHaveProperty('message').toBeString();
    expectTypeOf<ContactFormDto>()
      .toHaveProperty('category')
      .toEqualTypeOf<SupportCategoryValue>();
  });
});

describe('ContactSubmissionResultDto', () => {
  it('should expose a simple acknowledgement payload', () => {
    expectTypeOf<ContactSubmissionResultDto>()
      .toHaveProperty('success')
      .toBeBoolean();
    expectTypeOf<ContactSubmissionResultDto>()
      .toHaveProperty('message')
      .toBeString();
  });
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
describe('DashboardAggregateDto', () => {
  it('should expose a stable aggregate payload for participant dashboard', () => {
    expectTypeOf<DashboardAggregateDto>()
      .toHaveProperty('generatedAt')
      .toBeString();
    expectTypeOf<DashboardAggregateDto>()
      .toHaveProperty('programs')
      .toEqualTypeOf<DashboardProgramSummaryDto[]>();
    expectTypeOf<DashboardAggregateDto>()
      .toHaveProperty('upcomingSessions')
      .toEqualTypeOf<DashboardSessionReminderDto[]>();
    expectTypeOf<DashboardAggregateDto>()
      .toHaveProperty('recentAnnouncements')
      .toEqualTypeOf<DashboardAnnouncementSummaryDto[]>();
  });
});

// ---------------------------------------------------------------------------
// Programs for participant area
// ---------------------------------------------------------------------------
describe('ParticipantProgramListItemDto', () => {
  it('should expose list item payload for participant programs', () => {
    expectTypeOf<ParticipantProgramListItemDto>()
      .toHaveProperty('enrollmentId')
      .toBeString();
    expectTypeOf<ParticipantProgramListItemDto>()
      .toHaveProperty('enrollmentStatus')
      .toEqualTypeOf<EnrollmentStatusValue>();
    expectTypeOf<ParticipantProgramListItemDto>()
      .toHaveProperty('program')
      .toEqualTypeOf<ProgramDto>();
    expectTypeOf<ParticipantProgramListItemDto>()
      .toHaveProperty('cohort')
      .toEqualTypeOf<CohortDto | null>();
  });
});

describe('ParticipantProgramDetailDto', () => {
  it('should expose detail payload for participant program page', () => {
    expectTypeOf<ParticipantProgramDetailDto>()
      .toHaveProperty('enrollmentId')
      .toBeString();
    expectTypeOf<ParticipantProgramDetailDto>()
      .toHaveProperty('enrollmentStatus')
      .toEqualTypeOf<EnrollmentStatusValue>();
    expectTypeOf<ParticipantProgramDetailDto>()
      .toHaveProperty('program')
      .toEqualTypeOf<ProgramDto>();
    expectTypeOf<ParticipantProgramDetailDto>()
      .toHaveProperty('cohort')
      .toEqualTypeOf<CohortDto | null>();
    expectTypeOf<ParticipantProgramDetailDto>()
      .toHaveProperty('sessions')
      .toEqualTypeOf<SessionDto[]>();
    expectTypeOf<ParticipantProgramDetailDto>()
      .toHaveProperty('resources')
      .toEqualTypeOf<ResourceDto[]>();
    expectTypeOf<ParticipantProgramDetailDto>()
      .toHaveProperty('announcements')
      .toEqualTypeOf<ProgramAnnouncementPreviewDto[]>();
  });
});

describe('ProgramAnnouncementPreviewDto', () => {
  it('should expose lightweight announcement summary for program detail', () => {
    expectTypeOf<ProgramAnnouncementPreviewDto>()
      .toHaveProperty('id')
      .toBeString();
    expectTypeOf<ProgramAnnouncementPreviewDto>()
      .toHaveProperty('title')
      .toBeString();
    expectTypeOf<ProgramAnnouncementPreviewDto>()
      .toHaveProperty('audienceType')
      .toEqualTypeOf<AudienceTypeValue>();
    expectTypeOf<ProgramAnnouncementPreviewDto>()
      .toHaveProperty('publishedAt')
      .toEqualTypeOf<string | null>();
  });
});

// ---------------------------------------------------------------------------
// AppUser
// ---------------------------------------------------------------------------
describe('AppUserDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<AppUserDto>().toHaveProperty('id').toBeString();
    expectTypeOf<AppUserDto>().toHaveProperty('email').toBeString();
    expectTypeOf<AppUserDto>()
      .toHaveProperty('role')
      .toEqualTypeOf<UserRoleValue>();
    expectTypeOf<AppUserDto>().toHaveProperty('firstName').toBeString();
    expectTypeOf<AppUserDto>().toHaveProperty('lastName').toBeString();
    expectTypeOf<AppUserDto>()
      .toHaveProperty('phone')
      .toEqualTypeOf<string | null>();
    expectTypeOf<AppUserDto>()
      .toHaveProperty('preferredContactChannel')
      .toEqualTypeOf<string | null>();
    expectTypeOf<AppUserDto>().toHaveProperty('isActive').toBeBoolean();
    expectTypeOf<AppUserDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<AppUserDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('CreateAppUserDto should omit server-generated fields', () => {
    expectTypeOf<CreateAppUserDto>().toHaveProperty('email').toBeString();
    expectTypeOf<CreateAppUserDto>().toHaveProperty('firstName').toBeString();
    expectTypeOf<CreateAppUserDto>().toHaveProperty('lastName').toBeString();
    expectTypeOf<CreateAppUserDto>().not.toHaveProperty('id');
    expectTypeOf<CreateAppUserDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateAppUserDto>().not.toHaveProperty('updatedAt');
  });

  it('UpdateAppUserDto should have all fields optional', () => {
    expectTypeOf<UpdateAppUserDto>().toMatchTypeOf<Partial<CreateAppUserDto>>();
  });
});

// ---------------------------------------------------------------------------
// Participant
// ---------------------------------------------------------------------------
describe('ParticipantDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<ParticipantDto>().toHaveProperty('id').toBeString();
    expectTypeOf<ParticipantDto>().toHaveProperty('userId').toBeString();
    expectTypeOf<ParticipantDto>()
      .toHaveProperty('lifecycleStatus')
      .toEqualTypeOf<LifecycleStatusValue>();
    expectTypeOf<ParticipantDto>()
      .toHaveProperty('referenceCode')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ParticipantDto>()
      .toHaveProperty('country')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ParticipantDto>()
      .toHaveProperty('city')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ParticipantDto>()
      .toHaveProperty('notes')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ParticipantDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<ParticipantDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('CreateParticipantDto should omit server-generated fields', () => {
    expectTypeOf<CreateParticipantDto>().toHaveProperty('userId').toBeString();
    expectTypeOf<CreateParticipantDto>().not.toHaveProperty('id');
    expectTypeOf<CreateParticipantDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateParticipantDto>().not.toHaveProperty('updatedAt');
  });

  it('UpdateParticipantDto should have all fields optional', () => {
    expectTypeOf<UpdateParticipantDto>().toMatchTypeOf<
      Partial<CreateParticipantDto>
    >();
  });
});

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------
describe('ProgramDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<ProgramDto>().toHaveProperty('id').toBeString();
    expectTypeOf<ProgramDto>().toHaveProperty('slug').toBeString();
    expectTypeOf<ProgramDto>().toHaveProperty('title').toBeString();
    expectTypeOf<ProgramDto>().toHaveProperty('summary').toBeString();
    expectTypeOf<ProgramDto>().toHaveProperty('description').toBeString();
    expectTypeOf<ProgramDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<PublicationStatusValue>();
    expectTypeOf<ProgramDto>()
      .toHaveProperty('visibility')
      .toEqualTypeOf<ProgramVisibilityValue>();
    expectTypeOf<ProgramDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<ProgramDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('CreateProgramDto should omit server-generated fields', () => {
    expectTypeOf<CreateProgramDto>().toHaveProperty('slug').toBeString();
    expectTypeOf<CreateProgramDto>().toHaveProperty('title').toBeString();
    expectTypeOf<CreateProgramDto>().toHaveProperty('summary').toBeString();
    expectTypeOf<CreateProgramDto>().toHaveProperty('description').toBeString();
    expectTypeOf<CreateProgramDto>().not.toHaveProperty('id');
    expectTypeOf<CreateProgramDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateProgramDto>().not.toHaveProperty('updatedAt');
  });

  it('UpdateProgramDto should have all fields optional', () => {
    expectTypeOf<UpdateProgramDto>().toMatchTypeOf<Partial<CreateProgramDto>>();
  });
});

// ---------------------------------------------------------------------------
// Cohort
// ---------------------------------------------------------------------------
describe('CohortDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<CohortDto>().toHaveProperty('id').toBeString();
    expectTypeOf<CohortDto>().toHaveProperty('programId').toBeString();
    expectTypeOf<CohortDto>().toHaveProperty('name').toBeString();
    expectTypeOf<CohortDto>()
      .toHaveProperty('code')
      .toEqualTypeOf<string | null>();
    expectTypeOf<CohortDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<CohortStatusValue>();
    expectTypeOf<CohortDto>().toHaveProperty('startDate').toBeString();
    expectTypeOf<CohortDto>()
      .toHaveProperty('endDate')
      .toEqualTypeOf<string | null>();
    expectTypeOf<CohortDto>()
      .toHaveProperty('capacity')
      .toEqualTypeOf<number | null>();
    expectTypeOf<CohortDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<CohortDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('CreateCohortDto should omit server-generated fields', () => {
    expectTypeOf<CreateCohortDto>().toHaveProperty('programId').toBeString();
    expectTypeOf<CreateCohortDto>().toHaveProperty('name').toBeString();
    expectTypeOf<CreateCohortDto>().toHaveProperty('startDate').toBeString();
    expectTypeOf<CreateCohortDto>().not.toHaveProperty('id');
    expectTypeOf<CreateCohortDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateCohortDto>().not.toHaveProperty('updatedAt');
  });

  it('UpdateCohortDto should have all fields optional', () => {
    expectTypeOf<UpdateCohortDto>().toMatchTypeOf<Partial<CreateCohortDto>>();
  });
});

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
describe('SessionDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<SessionDto>().toHaveProperty('id').toBeString();
    expectTypeOf<SessionDto>().toHaveProperty('cohortId').toBeString();
    expectTypeOf<SessionDto>().toHaveProperty('title').toBeString();
    expectTypeOf<SessionDto>()
      .toHaveProperty('description')
      .toEqualTypeOf<string | null>();
    expectTypeOf<SessionDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<SessionStatusValue>();
    expectTypeOf<SessionDto>().toHaveProperty('startsAt').toBeString();
    expectTypeOf<SessionDto>().toHaveProperty('endsAt').toBeString();
    expectTypeOf<SessionDto>()
      .toHaveProperty('locationType')
      .toEqualTypeOf<LocationTypeValue>();
    expectTypeOf<SessionDto>()
      .toHaveProperty('locationLabel')
      .toEqualTypeOf<string | null>();
    expectTypeOf<SessionDto>()
      .toHaveProperty('meetingLink')
      .toEqualTypeOf<string | null>();
    expectTypeOf<SessionDto>()
      .toHaveProperty('trainerUserId')
      .toEqualTypeOf<string | null>();
    expectTypeOf<SessionDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<SessionDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('CreateSessionDto should omit server-generated fields', () => {
    expectTypeOf<CreateSessionDto>().toHaveProperty('cohortId').toBeString();
    expectTypeOf<CreateSessionDto>().toHaveProperty('title').toBeString();
    expectTypeOf<CreateSessionDto>().toHaveProperty('startsAt').toBeString();
    expectTypeOf<CreateSessionDto>().toHaveProperty('endsAt').toBeString();
    expectTypeOf<CreateSessionDto>().not.toHaveProperty('id');
    expectTypeOf<CreateSessionDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateSessionDto>().not.toHaveProperty('updatedAt');
  });

  it('UpdateSessionDto should have all fields optional', () => {
    expectTypeOf<UpdateSessionDto>().toMatchTypeOf<Partial<CreateSessionDto>>();
  });
});

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------
describe('ResourceDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<ResourceDto>().toHaveProperty('id').toBeString();
    expectTypeOf<ResourceDto>()
      .toHaveProperty('programId')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ResourceDto>()
      .toHaveProperty('cohortId')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ResourceDto>().toHaveProperty('title').toBeString();
    expectTypeOf<ResourceDto>()
      .toHaveProperty('description')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ResourceDto>()
      .toHaveProperty('resourceType')
      .toEqualTypeOf<ResourceTypeValue>();
    expectTypeOf<ResourceDto>()
      .toHaveProperty('url')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ResourceDto>()
      .toHaveProperty('filePath')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ResourceDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<PublicationStatusValue>();
    expectTypeOf<ResourceDto>()
      .toHaveProperty('publishedAt')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ResourceDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<ResourceDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('CreateResourceDto should omit server-generated fields', () => {
    expectTypeOf<CreateResourceDto>().toHaveProperty('title').toBeString();
    expectTypeOf<CreateResourceDto>()
      .toHaveProperty('resourceType')
      .toEqualTypeOf<ResourceTypeValue>();
    expectTypeOf<CreateResourceDto>().not.toHaveProperty('id');
    expectTypeOf<CreateResourceDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateResourceDto>().not.toHaveProperty('updatedAt');
  });

  it('UpdateResourceDto should have all fields optional', () => {
    expectTypeOf<UpdateResourceDto>().toMatchTypeOf<
      Partial<CreateResourceDto>
    >();
  });
});

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------
describe('AnnouncementDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<AnnouncementDto>().toHaveProperty('id').toBeString();
    expectTypeOf<AnnouncementDto>().toHaveProperty('title').toBeString();
    expectTypeOf<AnnouncementDto>().toHaveProperty('body').toBeString();
    expectTypeOf<AnnouncementDto>()
      .toHaveProperty('audienceType')
      .toEqualTypeOf<AudienceTypeValue>();
    expectTypeOf<AnnouncementDto>()
      .toHaveProperty('programId')
      .toEqualTypeOf<string | null>();
    expectTypeOf<AnnouncementDto>()
      .toHaveProperty('cohortId')
      .toEqualTypeOf<string | null>();
    expectTypeOf<AnnouncementDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<PublicationStatusValue>();
    expectTypeOf<AnnouncementDto>()
      .toHaveProperty('publishedAt')
      .toEqualTypeOf<string | null>();
    expectTypeOf<AnnouncementDto>()
      .toHaveProperty('createdByUserId')
      .toBeString();
    expectTypeOf<AnnouncementDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<AnnouncementDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('CreateAnnouncementDto should omit server-generated fields', () => {
    expectTypeOf<CreateAnnouncementDto>().toHaveProperty('title').toBeString();
    expectTypeOf<CreateAnnouncementDto>().toHaveProperty('body').toBeString();
    expectTypeOf<CreateAnnouncementDto>()
      .toHaveProperty('audienceType')
      .toEqualTypeOf<AudienceTypeValue>();
    expectTypeOf<CreateAnnouncementDto>()
      .toHaveProperty('createdByUserId')
      .toBeString();
    expectTypeOf<CreateAnnouncementDto>().not.toHaveProperty('id');
    expectTypeOf<CreateAnnouncementDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateAnnouncementDto>().not.toHaveProperty('updatedAt');
  });

  it('UpdateAnnouncementDto should have all fields optional', () => {
    expectTypeOf<UpdateAnnouncementDto>().toMatchTypeOf<
      Partial<CreateAnnouncementDto>
    >();
  });
});

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------
describe('EnrollmentDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<EnrollmentDto>().toHaveProperty('id').toBeString();
    expectTypeOf<EnrollmentDto>().toHaveProperty('participantId').toBeString();
    expectTypeOf<EnrollmentDto>().toHaveProperty('programId').toBeString();
    expectTypeOf<EnrollmentDto>()
      .toHaveProperty('cohortId')
      .toEqualTypeOf<string | null>();
    expectTypeOf<EnrollmentDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<EnrollmentStatusValue>();
    expectTypeOf<EnrollmentDto>().toHaveProperty('enrolledAt').toBeString();
    expectTypeOf<EnrollmentDto>()
      .toHaveProperty('completedAt')
      .toEqualTypeOf<string | null>();
    expectTypeOf<EnrollmentDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<EnrollmentDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('CreateEnrollmentDto should omit server-generated fields', () => {
    expectTypeOf<CreateEnrollmentDto>()
      .toHaveProperty('participantId')
      .toBeString();
    expectTypeOf<CreateEnrollmentDto>()
      .toHaveProperty('programId')
      .toBeString();
    expectTypeOf<CreateEnrollmentDto>().not.toHaveProperty('id');
    expectTypeOf<CreateEnrollmentDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateEnrollmentDto>().not.toHaveProperty('updatedAt');
    expectTypeOf<CreateEnrollmentDto>().not.toHaveProperty('enrolledAt');
  });

  it('UpdateEnrollmentDto should have all fields optional', () => {
    expectTypeOf<UpdateEnrollmentDto>().toMatchTypeOf<
      Partial<CreateEnrollmentDto>
    >();
  });
});

// ---------------------------------------------------------------------------
// Notification (no UpdateDto — notifications are immutable)
// ---------------------------------------------------------------------------
describe('NotificationDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<NotificationDto>().toHaveProperty('id').toBeString();
    expectTypeOf<NotificationDto>().toHaveProperty('userId').toBeString();
    expectTypeOf<NotificationDto>().toHaveProperty('title').toBeString();
    expectTypeOf<NotificationDto>().toHaveProperty('body').toBeString();
    expectTypeOf<NotificationDto>()
      .toHaveProperty('notificationType')
      .toEqualTypeOf<NotificationTypeValue>();
    expectTypeOf<NotificationDto>()
      .toHaveProperty('channel')
      .toEqualTypeOf<NotificationChannelValue>();
    expectTypeOf<NotificationDto>().toHaveProperty('isRead').toBeBoolean();
    expectTypeOf<NotificationDto>()
      .toHaveProperty('readAt')
      .toEqualTypeOf<string | null>();
    expectTypeOf<NotificationDto>()
      .toHaveProperty('sourceType')
      .toEqualTypeOf<string | null>();
    expectTypeOf<NotificationDto>()
      .toHaveProperty('sourceId')
      .toEqualTypeOf<string | null>();
    expectTypeOf<NotificationDto>().toHaveProperty('createdAt').toBeString();
  });

  it('should not have updatedAt (notifications are immutable)', () => {
    expectTypeOf<NotificationDto>().not.toHaveProperty('updatedAt');
  });

  it('CreateNotificationDto should omit server-generated fields', () => {
    expectTypeOf<CreateNotificationDto>().toHaveProperty('userId').toBeString();
    expectTypeOf<CreateNotificationDto>().toHaveProperty('title').toBeString();
    expectTypeOf<CreateNotificationDto>().toHaveProperty('body').toBeString();
    expectTypeOf<CreateNotificationDto>()
      .toHaveProperty('notificationType')
      .toEqualTypeOf<NotificationTypeValue>();
    expectTypeOf<CreateNotificationDto>().not.toHaveProperty('id');
    expectTypeOf<CreateNotificationDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateNotificationDto>().not.toHaveProperty('isRead');
    expectTypeOf<CreateNotificationDto>().not.toHaveProperty('readAt');
  });
});

// ---------------------------------------------------------------------------
// SupportRequest
// ---------------------------------------------------------------------------
describe('SupportRequestDto', () => {
  it('should have all required fields with correct types', () => {
    expectTypeOf<SupportRequestDto>().toHaveProperty('id').toBeString();
    expectTypeOf<SupportRequestDto>().toHaveProperty('userId').toBeString();
    expectTypeOf<SupportRequestDto>()
      .toHaveProperty('participantId')
      .toEqualTypeOf<string | null>();
    expectTypeOf<SupportRequestDto>().toHaveProperty('subject').toBeString();
    expectTypeOf<SupportRequestDto>().toHaveProperty('message').toBeString();
    expectTypeOf<SupportRequestDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<SupportRequestStatusValue>();
    expectTypeOf<SupportRequestDto>()
      .toHaveProperty('category')
      .toEqualTypeOf<SupportCategoryValue>();
    expectTypeOf<SupportRequestDto>()
      .toHaveProperty('assignedToUserId')
      .toEqualTypeOf<string | null>();
    expectTypeOf<SupportRequestDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<SupportRequestDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('CreateSupportRequestDto should omit server-generated fields', () => {
    expectTypeOf<CreateSupportRequestDto>()
      .toHaveProperty('userId')
      .toBeString();
    expectTypeOf<CreateSupportRequestDto>()
      .toHaveProperty('subject')
      .toBeString();
    expectTypeOf<CreateSupportRequestDto>()
      .toHaveProperty('message')
      .toBeString();
    expectTypeOf<CreateSupportRequestDto>()
      .toHaveProperty('category')
      .toEqualTypeOf<SupportCategoryValue>();
    expectTypeOf<CreateSupportRequestDto>().not.toHaveProperty('id');
    expectTypeOf<CreateSupportRequestDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateSupportRequestDto>().not.toHaveProperty('updatedAt');
  });

  it('UpdateSupportRequestDto should have all fields optional', () => {
    expectTypeOf<UpdateSupportRequestDto>().toMatchTypeOf<
      Partial<CreateSupportRequestDto>
    >();
  });
});
