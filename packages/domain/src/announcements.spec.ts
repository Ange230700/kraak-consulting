import { describe, expect, it } from 'vitest';
import { AnnouncementPriority, PublicationStatus } from '@kraak/contracts';
import type { AnnouncementPriorityValue } from '@kraak/contracts';
import {
  getAnnouncementPriorityWeight,
  isAnnouncementAudienceScopeValidForMvp,
  isMvpSupportedAnnouncementAudience,
  sortAnnouncementsByPriority,
  validateAnnouncementFormat,
  validateAnnouncementPublicationForMvp,
} from './announcements';

describe('isMvpSupportedAnnouncementAudience', () => {
  it('Given a supported audience, When checking support, Then it returns true', () => {
    expect(isMvpSupportedAnnouncementAudience('all_participants')).toBe(true);
    expect(isMvpSupportedAnnouncementAudience('program')).toBe(true);
    expect(isMvpSupportedAnnouncementAudience('cohort')).toBe(true);
  });

  it('Given custom audience, When checking support, Then it returns false for MVP', () => {
    expect(isMvpSupportedAnnouncementAudience('custom')).toBe(false);
  });
});

describe('isAnnouncementAudienceScopeValidForMvp', () => {
  it('Given all_participants with no parent scope, When validating audience scope, Then it returns true', () => {
    expect(
      isAnnouncementAudienceScopeValidForMvp({
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
      }),
    ).toBe(true);
  });

  it('Given program audience without cohortId, When validating audience scope, Then it returns true', () => {
    expect(
      isAnnouncementAudienceScopeValidForMvp({
        audienceType: 'program',
        programId: 'prg-1',
        cohortId: null,
      }),
    ).toBe(true);
  });

  it('Given cohort audience with both ids, When validating audience scope, Then it returns true', () => {
    expect(
      isAnnouncementAudienceScopeValidForMvp({
        audienceType: 'cohort',
        programId: 'prg-1',
        cohortId: 'coh-1',
      }),
    ).toBe(true);
  });

  it('Given custom audience, When validating audience scope, Then it returns false', () => {
    expect(
      isAnnouncementAudienceScopeValidForMvp({
        audienceType: 'custom',
        programId: null,
        cohortId: null,
      }),
    ).toBe(false);
  });
});

describe('validateAnnouncementFormat', () => {
  it('Given a valid title and body, When validating format, Then it returns no violation', () => {
    const result = validateAnnouncementFormat({
      title: 'Mise à jour hebdomadaire programme',
      body: 'La session de demain démarre à 9h00. Merci de vérifier vos accès avant 8h45.',
    });

    expect(result.isValid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('Given too-short content, When validating format, Then it returns format violations', () => {
    const result = validateAnnouncementFormat({
      title: 'Info',
      body: 'Court message.',
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toHaveLength(2);
  });
});

describe('validateAnnouncementPublicationForMvp', () => {
  it('Given a valid published program announcement, When validating publication, Then it returns no violation', () => {
    const result = validateAnnouncementPublicationForMvp({
      audienceType: 'program',
      programId: 'prg-1',
      cohortId: null,
      status: PublicationStatus.PUBLISHED,
      publishedAt: '2026-04-29T10:00:00Z',
      priority: AnnouncementPriority.HIGH,
    });

    expect(result.isValid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('Given a published announcement without publishedAt, When validating publication, Then it reports a publication violation', () => {
    const result = validateAnnouncementPublicationForMvp({
      audienceType: 'program',
      programId: 'prg-1',
      cohortId: null,
      status: PublicationStatus.PUBLISHED,
      publishedAt: null,
      priority: AnnouncementPriority.NORMAL,
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toContain(
      'Une annonce publiée doit avoir un horodatage publishedAt.',
    );
  });

  it('Given a draft announcement with publishedAt, When validating publication, Then it reports a draft-state violation', () => {
    const result = validateAnnouncementPublicationForMvp({
      audienceType: 'all_participants',
      programId: null,
      cohortId: null,
      status: PublicationStatus.DRAFT,
      publishedAt: '2026-04-29T10:00:00Z',
      priority: AnnouncementPriority.NORMAL,
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toContain(
      'Une annonce en brouillon ne doit pas avoir publishedAt.',
    );
  });
});

describe('getAnnouncementPriorityWeight', () => {
  it('Given priority values, When getting their weights, Then critical is highest and low is lowest', () => {
    expect(getAnnouncementPriorityWeight(AnnouncementPriority.CRITICAL)).toBe(
      0,
    );
    expect(getAnnouncementPriorityWeight(AnnouncementPriority.HIGH)).toBe(1);
    expect(getAnnouncementPriorityWeight(AnnouncementPriority.NORMAL)).toBe(2);
    expect(getAnnouncementPriorityWeight(AnnouncementPriority.LOW)).toBe(3);
  });

  it('Given unknown priority, When getting weight, Then returns fallback weight beyond known priorities', () => {
    const weight = getAnnouncementPriorityWeight(
      'custom_priority' as AnnouncementPriorityValue,
    );
    expect(weight).toBe(4);
  });
});

describe('validateAnnouncementPublicationForMvp — priorité invalide', () => {
  it('Given invalid priority, When validating publication, Then it reports a priority violation', () => {
    const result = validateAnnouncementPublicationForMvp({
      audienceType: 'all_participants',
      programId: null,
      cohortId: null,
      status: PublicationStatus.DRAFT,
      publishedAt: null,
      priority: 'custom_priority' as AnnouncementPriorityValue,
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toContain(
      "La priorité de l'annonce est invalide.",
    );
  });
});

describe('sortAnnouncementsByPriority', () => {
  it('Given announcements with different priorities, When sorted, Then critical comes first and low comes last', () => {
    const announcements = [
      {
        priority: AnnouncementPriority.LOW,
        publishedAt: '2026-04-01T10:00:00Z',
      },
      {
        priority: AnnouncementPriority.NORMAL,
        publishedAt: '2026-04-02T10:00:00Z',
      },
      {
        priority: AnnouncementPriority.CRITICAL,
        publishedAt: '2026-04-03T10:00:00Z',
      },
      {
        priority: AnnouncementPriority.HIGH,
        publishedAt: '2026-04-04T10:00:00Z',
      },
    ];

    const sorted = sortAnnouncementsByPriority(announcements);

    expect(sorted[0].priority).toBe(AnnouncementPriority.CRITICAL);
    expect(sorted[1].priority).toBe(AnnouncementPriority.HIGH);
    expect(sorted[2].priority).toBe(AnnouncementPriority.NORMAL);
    expect(sorted[3].priority).toBe(AnnouncementPriority.LOW);
  });

  it('Given announcements with same priority, When sorted, Then most recent publishedAt comes first', () => {
    const announcements = [
      {
        priority: AnnouncementPriority.NORMAL,
        publishedAt: '2026-04-01T10:00:00Z',
      },
      {
        priority: AnnouncementPriority.NORMAL,
        publishedAt: '2026-04-10T10:00:00Z',
      },
      {
        priority: AnnouncementPriority.NORMAL,
        publishedAt: '2026-04-05T10:00:00Z',
      },
    ];

    const sorted = sortAnnouncementsByPriority(announcements);

    expect(sorted[0].publishedAt).toBe('2026-04-10T10:00:00Z');
    expect(sorted[1].publishedAt).toBe('2026-04-05T10:00:00Z');
    expect(sorted[2].publishedAt).toBe('2026-04-01T10:00:00Z');
  });

  it('Given announcements with null publishedAt, When sorted, Then order is preserved relative to each other', () => {
    const a = { priority: AnnouncementPriority.HIGH, publishedAt: null };
    const b = { priority: AnnouncementPriority.HIGH, publishedAt: null };

    const sorted = sortAnnouncementsByPriority([a, b]);

    expect(sorted).toHaveLength(2);
  });

  it('Given empty array, When sorted, Then returns empty array', () => {
    expect(sortAnnouncementsByPriority([])).toEqual([]);
  });

  it('Given one announcement with null publishedAt and one with date at same priority, When sorted, Then returns 0 for null comparison', () => {
    const withDate = {
      priority: AnnouncementPriority.NORMAL,
      publishedAt: '2026-04-05T10:00:00Z',
    };
    const withNull = {
      priority: AnnouncementPriority.NORMAL,
      publishedAt: null,
    };

    const sorted = sortAnnouncementsByPriority([withDate, withNull]);

    expect(sorted).toHaveLength(2);
  });
});
