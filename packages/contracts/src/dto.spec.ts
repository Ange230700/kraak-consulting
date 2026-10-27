import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  AppUserDto,
  AuthorDto,
  ArticleDto,
  CategoryDto,
  CreateAppUserDto,
  CreateAuthorDto,
  CreateArticleDto,
  CreateCategoryDto,
  UpdateAppUserDto,
  ContactFormDto,
  ContactSubmissionResultDto,
  UpdateSupportRequestStatusDto,
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
  CreatePartnerDto,
  CreateStatisticDto,
  CreateTagDto,
  CreateTeamMemberDto,
  CreateTestimonialDto,
  CmsHomepageContentDto,
  PartnerDto,
  StatisticDto,
  TagDto,
  TeamMemberDto,
  TestimonialDto,
  UpdateSupportRequestDto,
  UpdateAuthorDto,
  UpdateArticleDto,
  UpdateCategoryDto,
  UpdatePartnerDto,
  UpdateStatisticDto,
  UpdateTagDto,
  UpdateTeamMemberDto,
  UpdateTestimonialDto,
  DashboardAggregateDto,
  DashboardProgramSummaryDto,
  DashboardSessionReminderDto,
  DashboardAnnouncementSummaryDto,
  ParticipantProgramListItemDto,
  ParticipantProgramDetailDto,
  ProgramAnnouncementPreviewDto,
  ProgramProgressDto,
  MarkProgramSessionProgressRequestDto,
  MarkProgramSessionProgressResponseDto,
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
  ResourceThemeValue,
  ResourceAudienceValue,
  AudienceTypeValue,
  AnnouncementPriorityValue,
  EnrollmentStatusValue,
  ProgramProgressStatusValue,
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
    expectTypeOf<ContactSubmissionResultDto>()
      .toHaveProperty('requestId')
      .toEqualTypeOf<string | undefined>();
    expectTypeOf<ContactSubmissionResultDto>()
      .toHaveProperty('requestStatus')
      .toEqualTypeOf<SupportRequestStatusValue | undefined>();
  });
});

describe('UpdateSupportRequestStatusDto', () => {
  it('should expose the minimal status transition payload', () => {
    expectTypeOf<UpdateSupportRequestStatusDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<SupportRequestStatusValue>();
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
    expectTypeOf<ParticipantProgramListItemDto>()
      .toHaveProperty('progress')
      .toEqualTypeOf<ProgramProgressDto>();
  });
});

describe('ProgramProgressDto', () => {
  it('should expose minimal progression markers for participant programs', () => {
    expectTypeOf<ProgramProgressDto>()
      .toHaveProperty('totalSessions')
      .toBeNumber();
    expectTypeOf<ProgramProgressDto>()
      .toHaveProperty('completedSessions')
      .toBeNumber();
    expectTypeOf<ProgramProgressDto>()
      .toHaveProperty('completionRate')
      .toBeNumber();
    expectTypeOf<ProgramProgressDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<ProgramProgressStatusValue>();
    expectTypeOf<ProgramProgressDto>()
      .toHaveProperty('completedSessionIds')
      .toEqualTypeOf<string[]>();
    expectTypeOf<ProgramProgressDto>()
      .toHaveProperty('updatedAt')
      .toEqualTypeOf<string | null>();
  });
});

describe('MarkProgramSessionProgress DTOs', () => {
  it('should expose request payload for a session marker update', () => {
    expectTypeOf<MarkProgramSessionProgressRequestDto>()
      .toHaveProperty('sessionId')
      .toBeString();
    expectTypeOf<MarkProgramSessionProgressRequestDto>()
      .toHaveProperty('completed')
      .toBeBoolean();
  });

  it('should expose response payload with updated progression state', () => {
    expectTypeOf<MarkProgramSessionProgressResponseDto>()
      .toHaveProperty('enrollmentId')
      .toBeString();
    expectTypeOf<MarkProgramSessionProgressResponseDto>()
      .toHaveProperty('enrollmentStatus')
      .toEqualTypeOf<EnrollmentStatusValue>();
    expectTypeOf<MarkProgramSessionProgressResponseDto>()
      .toHaveProperty('progress')
      .toEqualTypeOf<ProgramProgressDto>();
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
      .toHaveProperty('progress')
      .toEqualTypeOf<ProgramProgressDto>();
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
// CMS / Editorial model
// ---------------------------------------------------------------------------
describe('AuthorDto', () => {
  it('Given an editorial author contract When inspected Then required author fields are exposed', () => {
    expectTypeOf<AuthorDto>().toHaveProperty('id').toBeString();
    expectTypeOf<AuthorDto>().toHaveProperty('email').toBeString();
    expectTypeOf<AuthorDto>().toHaveProperty('displayName').toBeString();
    expectTypeOf<AuthorDto>()
      .toHaveProperty('bio')
      .toEqualTypeOf<string | null>();
    expectTypeOf<AuthorDto>()
      .toHaveProperty('avatarUrl')
      .toEqualTypeOf<string | null>();
    expectTypeOf<AuthorDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<AuthorDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('Given create and update author DTOs When compared Then create omits server fields and update is partial', () => {
    expectTypeOf<CreateAuthorDto>().toHaveProperty('email').toBeString();
    expectTypeOf<CreateAuthorDto>().toHaveProperty('displayName').toBeString();
    expectTypeOf<CreateAuthorDto>().not.toHaveProperty('id');
    expectTypeOf<CreateAuthorDto>().not.toHaveProperty('createdAt');
    expectTypeOf<CreateAuthorDto>().not.toHaveProperty('updatedAt');

    expectTypeOf<UpdateAuthorDto>().toMatchTypeOf<Partial<CreateAuthorDto>>();
  });
});

describe('CategoryDto', () => {
  it('Given an editorial category contract When inspected Then required category fields are exposed', () => {
    expectTypeOf<CategoryDto>().toHaveProperty('id').toBeString();
    expectTypeOf<CategoryDto>().toHaveProperty('slug').toBeString();
    expectTypeOf<CategoryDto>().toHaveProperty('label').toBeString();
    expectTypeOf<CategoryDto>()
      .toHaveProperty('description')
      .toEqualTypeOf<string | null>();
    expectTypeOf<CategoryDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<CategoryDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('Given create and update category DTOs When compared Then update stays partial', () => {
    expectTypeOf<CreateCategoryDto>().toHaveProperty('slug').toBeString();
    expectTypeOf<CreateCategoryDto>().not.toHaveProperty('id');
    expectTypeOf<UpdateCategoryDto>().toMatchTypeOf<
      Partial<CreateCategoryDto>
    >();
  });
});

describe('TagDto', () => {
  it('Given an editorial tag contract When inspected Then required tag fields are exposed', () => {
    expectTypeOf<TagDto>().toHaveProperty('id').toBeString();
    expectTypeOf<TagDto>().toHaveProperty('slug').toBeString();
    expectTypeOf<TagDto>().toHaveProperty('label').toBeString();
    expectTypeOf<TagDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<TagDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('Given create and update tag DTOs When compared Then update stays partial', () => {
    expectTypeOf<CreateTagDto>().toHaveProperty('slug').toBeString();
    expectTypeOf<CreateTagDto>().not.toHaveProperty('id');
    expectTypeOf<UpdateTagDto>().toMatchTypeOf<Partial<CreateTagDto>>();
  });
});

describe('ArticleDto', () => {
  it('Given an editorial article contract When inspected Then article metadata and relations are exposed', () => {
    expectTypeOf<ArticleDto>().toHaveProperty('id').toBeString();
    expectTypeOf<ArticleDto>().toHaveProperty('slug').toBeString();
    expectTypeOf<ArticleDto>().toHaveProperty('title').toBeString();
    expectTypeOf<ArticleDto>().toHaveProperty('excerpt').toBeString();
    expectTypeOf<ArticleDto>().toHaveProperty('content').toBeString();
    expectTypeOf<ArticleDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<PublicationStatusValue>();
    expectTypeOf<ArticleDto>()
      .toHaveProperty('coverImageUrl')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ArticleDto>()
      .toHaveProperty('seoTitle')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ArticleDto>()
      .toHaveProperty('seoDescription')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ArticleDto>()
      .toHaveProperty('publishedAt')
      .toEqualTypeOf<string | null>();
    expectTypeOf<ArticleDto>().toHaveProperty('authorId').toBeString();
    expectTypeOf<ArticleDto>()
      .toHaveProperty('categoryIds')
      .toEqualTypeOf<string[]>();
    expectTypeOf<ArticleDto>()
      .toHaveProperty('tagIds')
      .toEqualTypeOf<string[]>();
    expectTypeOf<ArticleDto>().toHaveProperty('createdAt').toBeString();
    expectTypeOf<ArticleDto>().toHaveProperty('updatedAt').toBeString();
  });

  it('Given create and update article DTOs When compared Then update stays partial', () => {
    expectTypeOf<CreateArticleDto>().toHaveProperty('slug').toBeString();
    expectTypeOf<CreateArticleDto>()
      .toHaveProperty('categoryIds')
      .toEqualTypeOf<string[]>();
    expectTypeOf<CreateArticleDto>().not.toHaveProperty('id');
    expectTypeOf<UpdateArticleDto>().toMatchTypeOf<Partial<CreateArticleDto>>();
  });
});

describe('StatisticDto', () => {
  it('Given a homepage statistic contract When inspected Then required fields are exposed', () => {
    expectTypeOf<StatisticDto>().toHaveProperty('id').toBeString();
    expectTypeOf<StatisticDto>().toHaveProperty('label').toBeString();
    expectTypeOf<StatisticDto>().toHaveProperty('value').toBeString();
    expectTypeOf<StatisticDto>()
      .toHaveProperty('suffix')
      .toEqualTypeOf<string | null>();
    expectTypeOf<StatisticDto>().toHaveProperty('sortOrder').toBeNumber();
    expectTypeOf<StatisticDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<PublicationStatusValue>();
  });

  it('Given create and update statistic DTOs Then update stays partial', () => {
    expectTypeOf<CreateStatisticDto>().toHaveProperty('label').toBeString();
    expectTypeOf<UpdateStatisticDto>().toMatchTypeOf<
      Partial<CreateStatisticDto>
    >();
  });
});

describe('PartnerDto', () => {
  it('Given a homepage partner contract When inspected Then required fields are exposed', () => {
    expectTypeOf<PartnerDto>().toHaveProperty('id').toBeString();
    expectTypeOf<PartnerDto>().toHaveProperty('name').toBeString();
    expectTypeOf<PartnerDto>().toHaveProperty('logoUrl').toBeString();
    expectTypeOf<PartnerDto>()
      .toHaveProperty('websiteUrl')
      .toEqualTypeOf<string | null>();
    expectTypeOf<PartnerDto>().toHaveProperty('sortOrder').toBeNumber();
    expectTypeOf<PartnerDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<PublicationStatusValue>();
  });

  it('Given create and update partner DTOs Then update stays partial', () => {
    expectTypeOf<CreatePartnerDto>().toHaveProperty('name').toBeString();
    expectTypeOf<UpdatePartnerDto>().toMatchTypeOf<Partial<CreatePartnerDto>>();
  });
});

describe('TestimonialDto', () => {
  it('Given a homepage testimonial contract When inspected Then required fields are exposed', () => {
    expectTypeOf<TestimonialDto>().toHaveProperty('id').toBeString();
    expectTypeOf<TestimonialDto>().toHaveProperty('quote').toBeString();
    expectTypeOf<TestimonialDto>().toHaveProperty('authorName').toBeString();
    expectTypeOf<TestimonialDto>()
      .toHaveProperty('avatarUrl')
      .toEqualTypeOf<string | null>();
    expectTypeOf<TestimonialDto>().toHaveProperty('sortOrder').toBeNumber();
    expectTypeOf<TestimonialDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<PublicationStatusValue>();
  });

  it('Given create and update testimonial DTOs Then update stays partial', () => {
    expectTypeOf<CreateTestimonialDto>().toHaveProperty('quote').toBeString();
    expectTypeOf<UpdateTestimonialDto>().toMatchTypeOf<
      Partial<CreateTestimonialDto>
    >();
  });
});

describe('TeamMemberDto', () => {
  it('Given a team member contract When inspected Then required fields are exposed', () => {
    expectTypeOf<TeamMemberDto>().toHaveProperty('id').toBeString();
    expectTypeOf<TeamMemberDto>().toHaveProperty('fullName').toBeString();
    expectTypeOf<TeamMemberDto>().toHaveProperty('role').toBeString();
    expectTypeOf<TeamMemberDto>()
      .toHaveProperty('linkedinUrl')
      .toEqualTypeOf<string | null>();
    expectTypeOf<TeamMemberDto>().toHaveProperty('sortOrder').toBeNumber();
    expectTypeOf<TeamMemberDto>()
      .toHaveProperty('status')
      .toEqualTypeOf<PublicationStatusValue>();
  });

  it('Given create and update team member DTOs Then update stays partial', () => {
    expectTypeOf<CreateTeamMemberDto>().toHaveProperty('fullName').toBeString();
    expectTypeOf<UpdateTeamMemberDto>().toMatchTypeOf<
      Partial<CreateTeamMemberDto>
    >();
  });
});

describe('CmsHomepageContentDto', () => {
  it('Given homepage content DTO When inspected Then all sections are typed as lists', () => {
    expectTypeOf<CmsHomepageContentDto>()
      .toHaveProperty('statistics')
      .toEqualTypeOf<StatisticDto[]>();
    expectTypeOf<CmsHomepageContentDto>()
      .toHaveProperty('partners')
      .toEqualTypeOf<PartnerDto[]>();
    expectTypeOf<CmsHomepageContentDto>()
      .toHaveProperty('testimonials')
      .toEqualTypeOf<TestimonialDto[]>();
    expectTypeOf<CmsHomepageContentDto>()
      .toHaveProperty('teamMembers')
      .toEqualTypeOf<TeamMemberDto[]>();
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
      .toHaveProperty('resourceTheme')
      .toEqualTypeOf<ResourceThemeValue>();
    expectTypeOf<ResourceDto>()
      .toHaveProperty('resourceAudience')
      .toEqualTypeOf<ResourceAudienceValue>();
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
    expectTypeOf<CreateResourceDto>()
      .toHaveProperty('resourceTheme')
      .toEqualTypeOf<ResourceThemeValue>();
    expectTypeOf<CreateResourceDto>()
      .toHaveProperty('resourceAudience')
      .toEqualTypeOf<ResourceAudienceValue>();
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
      .toHaveProperty('priority')
      .toEqualTypeOf<AnnouncementPriorityValue>();
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
      .toHaveProperty('priority')
      .toEqualTypeOf<AnnouncementPriorityValue>();
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
