import { describe, expect, it } from 'vitest';
import {
  LifecycleStatus,
  CohortStatus,
  SessionStatus,
  EnrollmentStatus,
  SupportRequestStatus,
  PublicationStatus,
} from '@kraak/contracts';
import {
  canTransitionLifecycle,
  getNextLifecycleStatuses,
  canTransitionCohortStatus,
  getNextCohortStatuses,
  canTransitionSessionStatus,
  getNextSessionStatuses,
  canTransitionEnrollmentStatus,
  getNextEnrollmentStatuses,
  canTransitionSupportRequestStatus,
  getNextSupportRequestStatuses,
  canTransitionPublicationStatus,
  getNextPublicationStatuses,
} from './transitions';

// ---------------------------------------------------------------------------
// LifecycleStatus transitions
// invited → registered → active → completed
//                         active → inactive
//                         inactive → active
// ---------------------------------------------------------------------------
describe('canTransitionLifecycle', () => {
  const valid: [string, string][] = [
    [LifecycleStatus.INVITED, LifecycleStatus.REGISTERED],
    [LifecycleStatus.REGISTERED, LifecycleStatus.ACTIVE],
    [LifecycleStatus.ACTIVE, LifecycleStatus.COMPLETED],
    [LifecycleStatus.ACTIVE, LifecycleStatus.INACTIVE],
    [LifecycleStatus.INACTIVE, LifecycleStatus.ACTIVE],
  ];

  it.each(valid)('allows %s → %s', (from, to) => {
    expect(canTransitionLifecycle(from, to)).toBe(true);
  });

  const invalid: [string, string][] = [
    [LifecycleStatus.INVITED, LifecycleStatus.ACTIVE],
    [LifecycleStatus.INVITED, LifecycleStatus.COMPLETED],
    [LifecycleStatus.REGISTERED, LifecycleStatus.COMPLETED],
    [LifecycleStatus.COMPLETED, LifecycleStatus.ACTIVE],
    [LifecycleStatus.COMPLETED, LifecycleStatus.INVITED],
    [LifecycleStatus.INACTIVE, LifecycleStatus.COMPLETED],
  ];

  it.each(invalid)('rejects %s → %s', (from, to) => {
    expect(canTransitionLifecycle(from, to)).toBe(false);
  });

  it('rejects self-transitions', () => {
    for (const s of Object.values(LifecycleStatus)) {
      expect(canTransitionLifecycle(s, s)).toBe(false);
    }
  });

  it('Given unknown status, When canTransitionLifecycle called, Then returns false', () => {
    expect(
      canTransitionLifecycle('unknown_status', LifecycleStatus.REGISTERED),
    ).toBe(false);
  });
});

describe('getNextLifecycleStatuses', () => {
  it('returns [registered] from invited', () => {
    expect(getNextLifecycleStatuses(LifecycleStatus.INVITED)).toEqual([
      LifecycleStatus.REGISTERED,
    ]);
  });

  it('returns [active] from registered', () => {
    expect(getNextLifecycleStatuses(LifecycleStatus.REGISTERED)).toEqual([
      LifecycleStatus.ACTIVE,
    ]);
  });

  it('returns [completed, inactive] from active', () => {
    expect(getNextLifecycleStatuses(LifecycleStatus.ACTIVE)).toEqual(
      expect.arrayContaining([
        LifecycleStatus.COMPLETED,
        LifecycleStatus.INACTIVE,
      ]),
    );
  });

  it('returns [active] from inactive', () => {
    expect(getNextLifecycleStatuses(LifecycleStatus.INACTIVE)).toEqual([
      LifecycleStatus.ACTIVE,
    ]);
  });

  it('returns [] from completed', () => {
    expect(getNextLifecycleStatuses(LifecycleStatus.COMPLETED)).toEqual([]);
  });

  it('Given unknown status, When getNextLifecycleStatuses called, Then returns empty array', () => {
    expect(getNextLifecycleStatuses('unknown_status')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// CohortStatus transitions
// draft → open → active → completed → archived
// ---------------------------------------------------------------------------
describe('canTransitionCohortStatus', () => {
  const valid: [string, string][] = [
    [CohortStatus.DRAFT, CohortStatus.OPEN],
    [CohortStatus.OPEN, CohortStatus.ACTIVE],
    [CohortStatus.ACTIVE, CohortStatus.COMPLETED],
    [CohortStatus.COMPLETED, CohortStatus.ARCHIVED],
  ];

  it.each(valid)('allows %s → %s', (from, to) => {
    expect(canTransitionCohortStatus(from, to)).toBe(true);
  });

  const invalid: [string, string][] = [
    [CohortStatus.DRAFT, CohortStatus.ACTIVE],
    [CohortStatus.OPEN, CohortStatus.ARCHIVED],
    [CohortStatus.ACTIVE, CohortStatus.DRAFT],
    [CohortStatus.ARCHIVED, CohortStatus.DRAFT],
    [CohortStatus.COMPLETED, CohortStatus.ACTIVE],
  ];

  it.each(invalid)('rejects %s → %s', (from, to) => {
    expect(canTransitionCohortStatus(from, to)).toBe(false);
  });

  it('rejects self-transitions', () => {
    for (const s of Object.values(CohortStatus)) {
      expect(canTransitionCohortStatus(s, s)).toBe(false);
    }
  });

  it('Given unknown status, When canTransitionCohortStatus called, Then returns false', () => {
    expect(canTransitionCohortStatus('unknown_status', CohortStatus.OPEN)).toBe(
      false,
    );
  });
});

describe('getNextCohortStatuses', () => {
  it('returns [open] from draft', () => {
    expect(getNextCohortStatuses(CohortStatus.DRAFT)).toEqual([
      CohortStatus.OPEN,
    ]);
  });

  it('returns [active] from open', () => {
    expect(getNextCohortStatuses(CohortStatus.OPEN)).toEqual([
      CohortStatus.ACTIVE,
    ]);
  });

  it('returns [completed] from active', () => {
    expect(getNextCohortStatuses(CohortStatus.ACTIVE)).toEqual([
      CohortStatus.COMPLETED,
    ]);
  });

  it('returns [archived] from completed', () => {
    expect(getNextCohortStatuses(CohortStatus.COMPLETED)).toEqual([
      CohortStatus.ARCHIVED,
    ]);
  });

  it('returns [] from archived', () => {
    expect(getNextCohortStatuses(CohortStatus.ARCHIVED)).toEqual([]);
  });

  it('Given unknown status, When getNextCohortStatuses called, Then returns empty array', () => {
    expect(getNextCohortStatuses('unknown_status')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// SessionStatus transitions
// scheduled → live → completed
// scheduled → cancelled
// ---------------------------------------------------------------------------
describe('canTransitionSessionStatus', () => {
  const valid: [string, string][] = [
    [SessionStatus.SCHEDULED, SessionStatus.LIVE],
    [SessionStatus.LIVE, SessionStatus.COMPLETED],
    [SessionStatus.SCHEDULED, SessionStatus.CANCELLED],
  ];

  it.each(valid)('allows %s → %s', (from, to) => {
    expect(canTransitionSessionStatus(from, to)).toBe(true);
  });

  const invalid: [string, string][] = [
    [SessionStatus.LIVE, SessionStatus.SCHEDULED],
    [SessionStatus.COMPLETED, SessionStatus.LIVE],
    [SessionStatus.CANCELLED, SessionStatus.SCHEDULED],
    [SessionStatus.LIVE, SessionStatus.CANCELLED],
  ];

  it.each(invalid)('rejects %s → %s', (from, to) => {
    expect(canTransitionSessionStatus(from, to)).toBe(false);
  });

  it('rejects self-transitions', () => {
    for (const s of Object.values(SessionStatus)) {
      expect(canTransitionSessionStatus(s, s)).toBe(false);
    }
  });

  it('Given unknown status, When canTransitionSessionStatus called, Then returns false', () => {
    expect(
      canTransitionSessionStatus('unknown_status', SessionStatus.LIVE),
    ).toBe(false);
  });
});

describe('getNextSessionStatuses', () => {
  it('returns [live, cancelled] from scheduled', () => {
    expect(getNextSessionStatuses(SessionStatus.SCHEDULED)).toEqual(
      expect.arrayContaining([SessionStatus.LIVE, SessionStatus.CANCELLED]),
    );
  });

  it('returns [completed] from live', () => {
    expect(getNextSessionStatuses(SessionStatus.LIVE)).toEqual([
      SessionStatus.COMPLETED,
    ]);
  });

  it('returns [] from completed', () => {
    expect(getNextSessionStatuses(SessionStatus.COMPLETED)).toEqual([]);
  });

  it('returns [] from cancelled', () => {
    expect(getNextSessionStatuses(SessionStatus.CANCELLED)).toEqual([]);
  });

  it('Given unknown status, When getNextSessionStatuses called, Then returns empty array', () => {
    expect(getNextSessionStatuses('unknown_status')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// EnrollmentStatus transitions
// pending → active → completed
// pending → cancelled
// ---------------------------------------------------------------------------
describe('canTransitionEnrollmentStatus', () => {
  const valid: [string, string][] = [
    [EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE],
    [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
    [EnrollmentStatus.PENDING, EnrollmentStatus.CANCELLED],
  ];

  it.each(valid)('allows %s → %s', (from, to) => {
    expect(canTransitionEnrollmentStatus(from, to)).toBe(true);
  });

  const invalid: [string, string][] = [
    [EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING],
    [EnrollmentStatus.COMPLETED, EnrollmentStatus.ACTIVE],
    [EnrollmentStatus.CANCELLED, EnrollmentStatus.PENDING],
    [EnrollmentStatus.ACTIVE, EnrollmentStatus.CANCELLED],
  ];

  it.each(invalid)('rejects %s → %s', (from, to) => {
    expect(canTransitionEnrollmentStatus(from, to)).toBe(false);
  });

  it('rejects self-transitions', () => {
    for (const s of Object.values(EnrollmentStatus)) {
      expect(canTransitionEnrollmentStatus(s, s)).toBe(false);
    }
  });

  it('Given unknown status, When canTransitionEnrollmentStatus called, Then returns false', () => {
    expect(
      canTransitionEnrollmentStatus('unknown_status', EnrollmentStatus.ACTIVE),
    ).toBe(false);
  });
});

describe('getNextEnrollmentStatuses', () => {
  it('returns [active, cancelled] from pending', () => {
    expect(getNextEnrollmentStatuses(EnrollmentStatus.PENDING)).toEqual(
      expect.arrayContaining([
        EnrollmentStatus.ACTIVE,
        EnrollmentStatus.CANCELLED,
      ]),
    );
  });

  it('returns [completed] from active', () => {
    expect(getNextEnrollmentStatuses(EnrollmentStatus.ACTIVE)).toEqual([
      EnrollmentStatus.COMPLETED,
    ]);
  });

  it('returns [] from completed', () => {
    expect(getNextEnrollmentStatuses(EnrollmentStatus.COMPLETED)).toEqual([]);
  });

  it('returns [] from cancelled', () => {
    expect(getNextEnrollmentStatuses(EnrollmentStatus.CANCELLED)).toEqual([]);
  });

  it('Given unknown status, When getNextEnrollmentStatuses called, Then returns empty array', () => {
    expect(getNextEnrollmentStatuses('unknown_status')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// SupportRequestStatus transitions
// open → in_progress → resolved → closed
// ---------------------------------------------------------------------------
describe('canTransitionSupportRequestStatus', () => {
  const valid: [string, string][] = [
    [SupportRequestStatus.OPEN, SupportRequestStatus.IN_PROGRESS],
    [SupportRequestStatus.IN_PROGRESS, SupportRequestStatus.RESOLVED],
    [SupportRequestStatus.RESOLVED, SupportRequestStatus.CLOSED],
  ];

  it.each(valid)('allows %s → %s', (from, to) => {
    expect(canTransitionSupportRequestStatus(from, to)).toBe(true);
  });

  const invalid: [string, string][] = [
    [SupportRequestStatus.OPEN, SupportRequestStatus.RESOLVED],
    [SupportRequestStatus.OPEN, SupportRequestStatus.CLOSED],
    [SupportRequestStatus.IN_PROGRESS, SupportRequestStatus.OPEN],
    [SupportRequestStatus.RESOLVED, SupportRequestStatus.IN_PROGRESS],
    [SupportRequestStatus.CLOSED, SupportRequestStatus.OPEN],
  ];

  it.each(invalid)('rejects %s → %s', (from, to) => {
    expect(canTransitionSupportRequestStatus(from, to)).toBe(false);
  });

  it('rejects self-transitions', () => {
    for (const s of Object.values(SupportRequestStatus)) {
      expect(canTransitionSupportRequestStatus(s, s)).toBe(false);
    }
  });

  it('Given unknown status, When canTransitionSupportRequestStatus called, Then returns false', () => {
    expect(
      canTransitionSupportRequestStatus(
        'unknown_status',
        SupportRequestStatus.IN_PROGRESS,
      ),
    ).toBe(false);
  });
});

describe('getNextSupportRequestStatuses', () => {
  it('returns [in_progress] from open', () => {
    expect(getNextSupportRequestStatuses(SupportRequestStatus.OPEN)).toEqual([
      SupportRequestStatus.IN_PROGRESS,
    ]);
  });

  it('returns [resolved] from in_progress', () => {
    expect(
      getNextSupportRequestStatuses(SupportRequestStatus.IN_PROGRESS),
    ).toEqual([SupportRequestStatus.RESOLVED]);
  });

  it('returns [closed] from resolved', () => {
    expect(
      getNextSupportRequestStatuses(SupportRequestStatus.RESOLVED),
    ).toEqual([SupportRequestStatus.CLOSED]);
  });

  it('returns [] from closed', () => {
    expect(getNextSupportRequestStatuses(SupportRequestStatus.CLOSED)).toEqual(
      [],
    );
  });

  it('Given unknown status, When getNextSupportRequestStatuses called, Then returns empty array', () => {
    expect(getNextSupportRequestStatuses('unknown_status')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// PublicationStatus transitions
// draft → published → archived
// ---------------------------------------------------------------------------
describe('canTransitionPublicationStatus', () => {
  const valid: [string, string][] = [
    [PublicationStatus.DRAFT, PublicationStatus.PUBLISHED],
    [PublicationStatus.PUBLISHED, PublicationStatus.ARCHIVED],
  ];

  it.each(valid)('allows %s → %s', (from, to) => {
    expect(canTransitionPublicationStatus(from, to)).toBe(true);
  });

  const invalid: [string, string][] = [
    [PublicationStatus.DRAFT, PublicationStatus.ARCHIVED],
    [PublicationStatus.PUBLISHED, PublicationStatus.DRAFT],
    [PublicationStatus.ARCHIVED, PublicationStatus.DRAFT],
    [PublicationStatus.ARCHIVED, PublicationStatus.PUBLISHED],
  ];

  it.each(invalid)('rejects %s → %s', (from, to) => {
    expect(canTransitionPublicationStatus(from, to)).toBe(false);
  });

  it('rejects self-transitions', () => {
    for (const s of Object.values(PublicationStatus)) {
      expect(canTransitionPublicationStatus(s, s)).toBe(false);
    }
  });

  it('Given unknown status, When canTransitionPublicationStatus called, Then returns false', () => {
    expect(
      canTransitionPublicationStatus(
        'unknown_status',
        PublicationStatus.PUBLISHED,
      ),
    ).toBe(false);
  });
});

describe('getNextPublicationStatuses', () => {
  it('returns [published] from draft', () => {
    expect(getNextPublicationStatuses(PublicationStatus.DRAFT)).toEqual([
      PublicationStatus.PUBLISHED,
    ]);
  });

  it('returns [archived] from published', () => {
    expect(getNextPublicationStatuses(PublicationStatus.PUBLISHED)).toEqual([
      PublicationStatus.ARCHIVED,
    ]);
  });

  it('returns [] from archived', () => {
    expect(getNextPublicationStatuses(PublicationStatus.ARCHIVED)).toEqual([]);
  });

  it('Given unknown status, When getNextPublicationStatuses called, Then returns empty array', () => {
    expect(getNextPublicationStatuses('unknown_status')).toEqual([]);
  });
});
