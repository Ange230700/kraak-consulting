import {
  AnnouncementPriority,
  PublicationStatus,
  type AnnouncementPriorityValue,
  type AudienceTypeValue,
  type PublicationStatusValue,
} from '@kraak/contracts';

export interface AnnouncementAudienceScope {
  audienceType: AudienceTypeValue;
  programId: string | null;
  cohortId: string | null;
}

export interface AnnouncementPublicationInput extends AnnouncementAudienceScope {
  status: PublicationStatusValue;
  publishedAt: string | null;
  priority: AnnouncementPriorityValue;
}

export interface AnnouncementFormatInput {
  title: string;
  body: string;
}

export interface AnnouncementValidationResult {
  isValid: boolean;
  violations: string[];
}

const MVP_SUPPORTED_AUDIENCES: readonly AudienceTypeValue[] = [
  'all_participants',
  'program',
  'cohort',
] as const;

const ANNOUNCEMENT_PRIORITY_ORDER: readonly AnnouncementPriorityValue[] = [
  AnnouncementPriority.CRITICAL,
  AnnouncementPriority.HIGH,
  AnnouncementPriority.NORMAL,
  AnnouncementPriority.LOW,
] as const;

const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 120;
const MIN_BODY_LENGTH = 20;
const MAX_BODY_LENGTH = 5000;

export function isMvpSupportedAnnouncementAudience(
  audienceType: AudienceTypeValue,
): boolean {
  return MVP_SUPPORTED_AUDIENCES.includes(audienceType);
}

export function isAnnouncementAudienceScopeValidForMvp(
  scope: AnnouncementAudienceScope,
): boolean {
  if (!isMvpSupportedAnnouncementAudience(scope.audienceType)) {
    return false;
  }

  if (scope.audienceType === 'all_participants') {
    return scope.programId === null && scope.cohortId === null;
  }

  if (scope.audienceType === 'program') {
    return scope.programId !== null && scope.cohortId === null;
  }

  return scope.programId !== null && scope.cohortId !== null;
}

export function validateAnnouncementFormat(
  input: AnnouncementFormatInput,
): AnnouncementValidationResult {
  const violations: string[] = [];
  const titleLength = input.title.trim().length;
  const bodyLength = input.body.trim().length;

  if (titleLength < MIN_TITLE_LENGTH || titleLength > MAX_TITLE_LENGTH) {
    violations.push(
      `Le titre doit contenir entre ${MIN_TITLE_LENGTH} et ${MAX_TITLE_LENGTH} caractères.`,
    );
  }

  if (bodyLength < MIN_BODY_LENGTH || bodyLength > MAX_BODY_LENGTH) {
    violations.push(
      `Le corps doit contenir entre ${MIN_BODY_LENGTH} et ${MAX_BODY_LENGTH} caractères.`,
    );
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

export function validateAnnouncementPublicationForMvp(
  input: AnnouncementPublicationInput,
): AnnouncementValidationResult {
  const violations: string[] = [];

  if (!isAnnouncementAudienceScopeValidForMvp(input)) {
    violations.push(
      'Le ciblage MVP est invalide: all_participants sans parent, program avec programId uniquement, cohort avec programId + cohortId.',
    );
  }

  if (
    input.status === PublicationStatus.PUBLISHED &&
    input.publishedAt === null
  ) {
    violations.push(
      'Une annonce publiée doit avoir un horodatage publishedAt.',
    );
  }

  if (input.status === PublicationStatus.DRAFT && input.publishedAt !== null) {
    violations.push('Une annonce en brouillon ne doit pas avoir publishedAt.');
  }

  if (!ANNOUNCEMENT_PRIORITY_ORDER.includes(input.priority)) {
    violations.push("La priorité de l'annonce est invalide.");
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

export function getAnnouncementPriorityWeight(
  priority: AnnouncementPriorityValue,
): number {
  const index = ANNOUNCEMENT_PRIORITY_ORDER.indexOf(priority);

  if (index === -1) {
    return ANNOUNCEMENT_PRIORITY_ORDER.length;
  }

  return index;
}

export interface AnnouncementForSorting {
  priority: AnnouncementPriorityValue;
  publishedAt: string | null;
}

/**
 * Sort announcements by priority (descending) and then by publishedAt (descending).
 * Higher priority announcements come first, then by most recent publication date.
 */
export function sortAnnouncementsByPriority<T extends AnnouncementForSorting>(
  announcements: T[],
): T[] {
  return [...announcements].sort((a, b) => {
    const priorityWeightA = getAnnouncementPriorityWeight(a.priority);
    const priorityWeightB = getAnnouncementPriorityWeight(b.priority);

    if (priorityWeightA !== priorityWeightB) {
      return priorityWeightA - priorityWeightB;
    }

    if (!a.publishedAt || !b.publishedAt) {
      return 0;
    }

    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();

    return dateB - dateA;
  });
}
