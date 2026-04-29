import { describe, expect, it } from 'vitest';
import { AnnouncementPriority, PublicationStatus } from '@kraak/contracts';
import {
  getAnnouncementPriorityWeight,
  isAnnouncementAudienceScopeValidForMvp,
  isMvpSupportedAnnouncementAudience,
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
});
