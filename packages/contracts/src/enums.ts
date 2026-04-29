export const UserRole = {
  PARTICIPANT: 'participant',
  ADMIN: 'admin',
  TRAINER: 'trainer',
} as const;

export const LifecycleStatus = {
  INVITED: 'invited',
  REGISTERED: 'registered',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  INACTIVE: 'inactive',
} as const;

export const PublicationStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const ProgramVisibility = {
  PRIVATE: 'private',
  PARTICIPANTS: 'participants',
  PUBLIC: 'public',
} as const;

export const CohortStatus = {
  DRAFT: 'draft',
  OPEN: 'open',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export const SessionStatus = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const LocationType = {
  ONLINE: 'online',
  ONSITE: 'onsite',
  HYBRID: 'hybrid',
} as const;

export const ResourceType = {
  LINK: 'link',
  FILE: 'file',
  VIDEO: 'video',
  DOCUMENT: 'document',
} as const;

export const AudienceType = {
  ALL_PARTICIPANTS: 'all_participants',
  PROGRAM: 'program',
  COHORT: 'cohort',
  CUSTOM: 'custom',
} as const;

export const EnrollmentStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const NotificationType = {
  ANNOUNCEMENT: 'announcement',
  SESSION_REMINDER: 'session_reminder',
  SYSTEM: 'system',
  SUPPORT_UPDATE: 'support_update',
} as const;

export const NotificationChannel = {
  IN_APP: 'in_app',
  PUSH: 'push',
} as const;

export const SupportRequestStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export const SupportCategory = {
  TECHNICAL: 'technical',
  PROGRAM: 'program',
  SESSION: 'session',
  BILLING: 'billing',
  OTHER: 'other',
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];
export type LifecycleStatusValue =
  (typeof LifecycleStatus)[keyof typeof LifecycleStatus];
export type PublicationStatusValue =
  (typeof PublicationStatus)[keyof typeof PublicationStatus];
export type ProgramVisibilityValue =
  (typeof ProgramVisibility)[keyof typeof ProgramVisibility];
export type CohortStatusValue =
  (typeof CohortStatus)[keyof typeof CohortStatus];
export type SessionStatusValue =
  (typeof SessionStatus)[keyof typeof SessionStatus];
export type LocationTypeValue =
  (typeof LocationType)[keyof typeof LocationType];
export type ResourceTypeValue =
  (typeof ResourceType)[keyof typeof ResourceType];
export type AudienceTypeValue =
  (typeof AudienceType)[keyof typeof AudienceType];
export type EnrollmentStatusValue =
  (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];
export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];
export type NotificationChannelValue =
  (typeof NotificationChannel)[keyof typeof NotificationChannel];
export type SupportRequestStatusValue =
  (typeof SupportRequestStatus)[keyof typeof SupportRequestStatus];
export type SupportCategoryValue =
  (typeof SupportCategory)[keyof typeof SupportCategory];
