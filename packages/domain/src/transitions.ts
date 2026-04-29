import {
  LifecycleStatus,
  type LifecycleStatusValue,
  CohortStatus,
  type CohortStatusValue,
  SessionStatus,
  type SessionStatusValue,
  EnrollmentStatus,
  type EnrollmentStatusValue,
  SupportRequestStatus,
  type SupportRequestStatusValue,
  PublicationStatus,
  type PublicationStatusValue,
} from '@kraak/contracts';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function createTransitionHelpers<T extends string>(
  map: Record<string, readonly T[]>,
) {
  return {
    canTransition(from: string, to: string): boolean {
      return (map[from] ?? []).includes(to as T);
    },
    getNext(from: string): readonly T[] {
      return map[from] ?? [];
    },
  };
}

// ---------------------------------------------------------------------------
// Transition maps
// ---------------------------------------------------------------------------

const lifecycle = createTransitionHelpers<LifecycleStatusValue>({
  [LifecycleStatus.INVITED]: [LifecycleStatus.REGISTERED],
  [LifecycleStatus.REGISTERED]: [LifecycleStatus.ACTIVE],
  [LifecycleStatus.ACTIVE]: [
    LifecycleStatus.COMPLETED,
    LifecycleStatus.INACTIVE,
  ],
  [LifecycleStatus.INACTIVE]: [LifecycleStatus.ACTIVE],
  [LifecycleStatus.COMPLETED]: [],
});

const cohort = createTransitionHelpers<CohortStatusValue>({
  [CohortStatus.DRAFT]: [CohortStatus.OPEN],
  [CohortStatus.OPEN]: [CohortStatus.ACTIVE],
  [CohortStatus.ACTIVE]: [CohortStatus.COMPLETED],
  [CohortStatus.COMPLETED]: [CohortStatus.ARCHIVED],
  [CohortStatus.ARCHIVED]: [],
});

const session = createTransitionHelpers<SessionStatusValue>({
  [SessionStatus.SCHEDULED]: [SessionStatus.LIVE, SessionStatus.CANCELLED],
  [SessionStatus.LIVE]: [SessionStatus.COMPLETED],
  [SessionStatus.COMPLETED]: [],
  [SessionStatus.CANCELLED]: [],
});

const enrollment = createTransitionHelpers<EnrollmentStatusValue>({
  [EnrollmentStatus.PENDING]: [
    EnrollmentStatus.ACTIVE,
    EnrollmentStatus.CANCELLED,
  ],
  [EnrollmentStatus.ACTIVE]: [EnrollmentStatus.COMPLETED],
  [EnrollmentStatus.COMPLETED]: [],
  [EnrollmentStatus.CANCELLED]: [],
});

const supportRequest = createTransitionHelpers<SupportRequestStatusValue>({
  [SupportRequestStatus.OPEN]: [SupportRequestStatus.IN_PROGRESS],
  [SupportRequestStatus.IN_PROGRESS]: [SupportRequestStatus.RESOLVED],
  [SupportRequestStatus.RESOLVED]: [SupportRequestStatus.CLOSED],
  [SupportRequestStatus.CLOSED]: [],
});

const publication = createTransitionHelpers<PublicationStatusValue>({
  [PublicationStatus.DRAFT]: [PublicationStatus.PUBLISHED],
  [PublicationStatus.PUBLISHED]: [PublicationStatus.ARCHIVED],
  [PublicationStatus.ARCHIVED]: [],
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const canTransitionLifecycle = lifecycle.canTransition;
export const getNextLifecycleStatuses = lifecycle.getNext;

export const canTransitionCohortStatus = cohort.canTransition;
export const getNextCohortStatuses = cohort.getNext;

export const canTransitionSessionStatus = session.canTransition;
export const getNextSessionStatuses = session.getNext;

export const canTransitionEnrollmentStatus = enrollment.canTransition;
export const getNextEnrollmentStatuses = enrollment.getNext;

export const canTransitionSupportRequestStatus = supportRequest.canTransition;
export const getNextSupportRequestStatuses = supportRequest.getNext;

export const canTransitionPublicationStatus = publication.canTransition;
export const getNextPublicationStatuses = publication.getNext;
