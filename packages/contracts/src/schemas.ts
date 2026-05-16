import { z } from 'zod';
import {
  ResourceTheme,
  ResourceAudience,
  type ResourceThemeValue,
  type ResourceAudienceValue,
} from './enums.js';

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------
export const ContactFormSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    subject: z.string().trim().min(3).max(120),
    message: z.string().trim().min(10).max(2000),
    category: z
      .enum([
        'technical',
        'training',
        'program',
        'session',
        'billing',
        'project_management',
        'immigration',
        'business',
        'partnership',
        'other',
      ])
      .default('other'),
  })
  .strict();

export const ContactSubmissionResultSchema = z
  .object({
    success: z.boolean(),
    message: z.string().trim().min(1),
    requestId: z.string().trim().min(1).optional(),
    requestStatus: z
      .enum(['open', 'in_progress', 'resolved', 'closed'])
      .optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Auth / Session
// ---------------------------------------------------------------------------
const NullableOptionalTrimmedStringSchema = z
  .union([z.string().trim().min(1), z.null()])
  .optional()
  .transform((value) => value ?? null);

const NullableOptionalRedirectSchema = z
  .union([z.string().trim().url(), z.null()])
  .optional()
  .transform((value) => value ?? null);

export const SignInRequestSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(128),
  })
  .strict();

export const SignUpRequestSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(128),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: NullableOptionalTrimmedStringSchema,
    preferredContactChannel: NullableOptionalTrimmedStringSchema,
    redirectTo: NullableOptionalRedirectSchema,
  })
  .strict();

export const RefreshSessionRequestSchema = z
  .object({
    refreshToken: z.string().trim().min(1),
  })
  .strict();

export const PasswordResetRequestSchema = z
  .object({
    email: z.string().trim().email(),
    redirectTo: NullableOptionalRedirectSchema,
  })
  .strict();

export const AuthSessionTokensSchema = z
  .object({
    accessToken: z.string().trim().min(1),
    refreshToken: z.string().trim().min(1),
    expiresIn: z.number().int().positive(),
    expiresAt: z.string().trim().min(1),
    tokenType: z.string().trim().min(1),
  })
  .strict();

// ---------------------------------------------------------------------------
// AppUser
// ---------------------------------------------------------------------------
export const AppUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['participant', 'admin', 'trainer']),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  preferredContactChannel: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateAppUserSchema = AppUserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateAppUserSchema = CreateAppUserSchema.partial();

// ---------------------------------------------------------------------------
// Participant
// ---------------------------------------------------------------------------
export const ParticipantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lifecycleStatus: z.enum([
    'invited',
    'registered',
    'active',
    'completed',
    'inactive',
  ]),
  referenceCode: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateParticipantSchema = ParticipantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateParticipantSchema = CreateParticipantSchema.partial();

export const AuthProfileSchema = z
  .object({
    appUser: AppUserSchema,
    participant: ParticipantSchema.nullable(),
  })
  .strict();

export const AuthSessionBundleSchema = z
  .object({
    session: AuthSessionTokensSchema,
    profile: AuthProfileSchema,
  })
  .strict();

export const SignUpResponseSchema = z
  .object({
    message: z.string().trim().min(1),
    requiresEmailConfirmation: z.boolean(),
    session: AuthSessionTokensSchema.nullable(),
    profile: AuthProfileSchema.nullable(),
  })
  .strict();

export const PasswordResetResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string().trim().min(1),
  })
  .strict();

export const AuthSessionContextSchema = z
  .object({
    profile: AuthProfileSchema,
  })
  .strict();

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------
export const ProgramSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  visibility: z.enum(['private', 'participants', 'public']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateProgramSchema = ProgramSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateProgramSchema = CreateProgramSchema.partial();

// ---------------------------------------------------------------------------
// Cohort
// ---------------------------------------------------------------------------
export const CohortSchema = z.object({
  id: z.string(),
  programId: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  status: z.enum(['draft', 'open', 'active', 'completed', 'archived']),
  startDate: z.string(),
  endDate: z.string().nullable(),
  capacity: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateCohortSchema = CohortSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCohortSchema = CreateCohortSchema.partial();

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export const SessionSchema = z.object({
  id: z.string(),
  cohortId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled']),
  startsAt: z.string(),
  endsAt: z.string(),
  locationType: z.enum(['online', 'onsite', 'hybrid']),
  locationLabel: z.string().nullable(),
  meetingLink: z.string().nullable(),
  trainerUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateSessionSchema = SessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSessionSchema = CreateSessionSchema.partial();

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------
const ResourceThemeValues = Object.values(ResourceTheme) as [
  ResourceThemeValue,
  ...ResourceThemeValue[],
];

const ResourceAudienceValues = Object.values(ResourceAudience) as [
  ResourceAudienceValue,
  ...ResourceAudienceValue[],
];

const _ResourceBaseObject = z.object({
  id: z.string(),
  programId: z.string().nullable(),
  cohortId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  resourceType: z.enum(['link', 'file', 'video', 'document']),
  resourceTheme: z.enum(ResourceThemeValues),
  resourceAudience: z.enum(ResourceAudienceValues),
  url: z.string().nullable(),
  filePath: z.string().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const _resourceParentRequired = (data: {
  programId: string | null;
  cohortId: string | null;
}) => data.programId !== null || data.cohortId !== null;

const _resourceParentRequiredMessage = {
  message: 'Au moins un parent (programId ou cohortId) est requis',
};

export const ResourceSchema = _ResourceBaseObject.refine(
  _resourceParentRequired,
  _resourceParentRequiredMessage,
);

const _ResourceCreateBase = _ResourceBaseObject.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateResourceSchema = _ResourceCreateBase.refine(
  _resourceParentRequired,
  _resourceParentRequiredMessage,
);

export const UpdateResourceSchema = _ResourceCreateBase.partial();

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------
const _AnnouncementBaseObject = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  audienceType: z.enum(['all_participants', 'program', 'cohort', 'custom']),
  programId: z.string().nullable(),
  cohortId: z.string().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().nullable(),
  createdByUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const _isAnnouncementAudienceScopeValid = (data: {
  audienceType: 'all_participants' | 'program' | 'cohort' | 'custom';
  programId: string | null;
  cohortId: string | null;
}) => {
  if (data.audienceType === 'all_participants') {
    return data.programId === null && data.cohortId === null;
  }

  if (data.audienceType === 'program') {
    return data.programId !== null && data.cohortId === null;
  }

  if (data.audienceType === 'cohort') {
    return data.programId !== null && data.cohortId !== null;
  }

  // Reserved for future versions (V1.1+), not valid for MVP publication format.
  return false;
};

const _announcementAudienceScopeMessage = {
  message:
    "Le ciblage annonce MVP est invalide: all_participants sans parent, program avec programId uniquement, cohort avec programId + cohortId. 'custom' est hors MVP.",
};

export const AnnouncementSchema = _AnnouncementBaseObject.refine(
  _isAnnouncementAudienceScopeValid,
  _announcementAudienceScopeMessage,
);

const _AnnouncementCreateBase = _AnnouncementBaseObject.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateAnnouncementSchema = _AnnouncementCreateBase.refine(
  _isAnnouncementAudienceScopeValid,
  _announcementAudienceScopeMessage,
);

export const UpdateAnnouncementSchema = _AnnouncementCreateBase.partial();

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------
export const EnrollmentSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  programId: z.string(),
  cohortId: z.string().nullable(),
  status: z.enum(['pending', 'active', 'completed', 'cancelled']),
  enrolledAt: z.string(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateEnrollmentSchema = EnrollmentSchema.omit({
  id: true,
  enrolledAt: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateEnrollmentSchema = CreateEnrollmentSchema.partial();

// ---------------------------------------------------------------------------
// Notification (immutable — pas de updatedAt, pas de Update schema)
// ---------------------------------------------------------------------------
export const NotificationSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    body: z.string(),
    notificationType: z.enum([
      'announcement',
      'session_reminder',
      'system',
      'support_update',
    ]),
    channel: z.enum(['in_app', 'push']),
    isRead: z.boolean(),
    readAt: z.string().nullable(),
    sourceType: z.string().nullable(),
    sourceId: z.string().nullable(),
    createdAt: z.string(),
  })
  .strict();

export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
});

// ---------------------------------------------------------------------------
// SupportRequest
// ---------------------------------------------------------------------------
export const SupportRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  participantId: z.string().nullable(),
  subject: z.string(),
  message: z.string(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  category: z.enum([
    'technical',
    'training',
    'program',
    'session',
    'billing',
    'project_management',
    'immigration',
    'business',
    'partnership',
    'other',
  ]),
  assignedToUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateSupportRequestSchema = SupportRequestSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSupportRequestSchema = CreateSupportRequestSchema.partial();
