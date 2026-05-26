import {
  isObjectPayload,
  readTrimmedString,
} from '../shared/dto-validation.utils';
import type { ValidationResult } from '../shared/validation-result.type';

export interface CreateAnnouncementDto {
  title: string;
  body: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  audienceType: 'all_participants' | 'program' | 'cohort';
  programId?: string | null;
  cohortId?: string | null;
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: string | null;
}

export interface UpdateAnnouncementDto {
  title?: string;
  body?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  audienceType?: 'all_participants' | 'program' | 'cohort';
  programId?: string | null;
  cohortId?: string | null;
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: string | null;
}

const announcementPriorities = new Set(['low', 'normal', 'high', 'critical']);
const audienceTypes = new Set(['all_participants', 'program', 'cohort']);
const publicationStatuses = new Set(['draft', 'published', 'archived']);

function readNullableString(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  const normalized = readTrimmedString(value);
  return normalized.length > 0 ? normalized : null;
}

function readNullableDateTime(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  const normalized = readTrimmedString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function assignRequiredString<T extends { title?: string; body?: string }>(
  body: Record<string, unknown>,
  field: 'title' | 'body',
  errors: string[],
  updates: Partial<T>,
): void {
  if (!(field in body)) {
    errors.push(`Le champ ${field} est requis.`);
    return;
  }

  const value = readTrimmedString(body[field]);

  if (!value) {
    errors.push(`Le champ ${field} est requis.`);
    return;
  }

  (updates as Record<string, unknown>)[field] = value;
}

function assignOptionalString<T extends { title?: string; body?: string }>(
  body: Record<string, unknown>,
  field: 'title' | 'body',
  errors: string[],
  updates: T,
): void {
  if (!(field in body)) {
    return;
  }

  const value = readTrimmedString(body[field]);

  if (!value) {
    errors.push(`Le champ ${field} est requis.`);
    return;
  }

  (updates as Record<string, unknown>)[field] = value;
}

function assignEnumField<T extends string>(
  body: Record<string, unknown>,
  field: keyof CreateAnnouncementDto,
  values: Set<T>,
  errors: string[],
  updates: Partial<CreateAnnouncementDto> | UpdateAnnouncementDto,
): void {
  if (!(field in body)) {
    return;
  }

  const value = readTrimmedString(body[field]);

  if (!values.has(value as T)) {
    errors.push(`Le champ ${field} est invalide.`);
    return;
  }

  (updates as Record<string, unknown>)[field] = value;
}

function assignNullableStringField(
  body: Record<string, unknown>,
  field: 'programId' | 'cohortId',
  updates: Partial<CreateAnnouncementDto> | UpdateAnnouncementDto,
): void {
  if (!(field in body)) {
    return;
  }

  (updates as Record<string, unknown>)[field] = readNullableString(body[field]);
}

function assignNullableDateTimeField(
  body: Record<string, unknown>,
  errors: string[],
  updates: Partial<CreateAnnouncementDto> | UpdateAnnouncementDto,
): void {
  if (!('publishedAt' in body)) {
    return;
  }

  const value = body['publishedAt'];

  if (value === null) {
    updates.publishedAt = null;
    return;
  }

  const normalized = readNullableDateTime(value);

  if (normalized === null && readTrimmedString(value)) {
    errors.push('Le champ publishedAt est invalide.');
    return;
  }

  updates.publishedAt = normalized;
}

function validateAudienceScope(
  data: {
    audienceType?: CreateAnnouncementDto['audienceType'];
    programId?: string | null;
    cohortId?: string | null;
  },
  errors: string[],
): void {
  if (!data.audienceType) {
    return;
  }

  if (data.audienceType === 'all_participants') {
    if (data.programId !== undefined && data.programId !== null) {
      errors.push(
        'Le champ programId doit être absent lorsque audienceType vaut all_participants.',
      );
    }

    if (data.cohortId !== undefined && data.cohortId !== null) {
      errors.push(
        'Le champ cohortId doit être absent lorsque audienceType vaut all_participants.',
      );
    }

    return;
  }

  if (data.audienceType === 'program') {
    if (!data.programId) {
      errors.push('Le champ programId est requis lorsque audienceType vaut program.');
    }

    if (data.cohortId !== undefined && data.cohortId !== null) {
      errors.push(
        'Le champ cohortId doit être absent lorsque audienceType vaut program.',
      );
    }

    return;
  }

  if (!data.programId) {
    errors.push('Le champ programId est requis lorsque audienceType vaut cohort.');
  }

  if (!data.cohortId) {
    errors.push('Le champ cohortId est requis lorsque audienceType vaut cohort.');
  }
}

export function validateCreateAnnouncementPayload(
  body: unknown,
): ValidationResult<CreateAnnouncementDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const errors: string[] = [];
  const data: Partial<CreateAnnouncementDto> = {};

  assignRequiredString(body, 'title', errors, data);
  assignRequiredString(body, 'body', errors, data);
  assignEnumField(body, 'priority', announcementPriorities, errors, data);
  assignEnumField(body, 'audienceType', audienceTypes, errors, data);
  assignNullableStringField(body, 'programId', data);
  assignNullableStringField(body, 'cohortId', data);
  assignEnumField(body, 'status', publicationStatuses, errors, data);
  assignNullableDateTimeField(body, errors, data);
  validateAudienceScope(data, errors);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: data as CreateAnnouncementDto,
  };
}

export function validateUpdateAnnouncementPayload(
  body: unknown,
): ValidationResult<UpdateAnnouncementDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const errors: string[] = [];
  const data: UpdateAnnouncementDto = {};

  assignOptionalString(body, 'title', errors, data);
  assignOptionalString(body, 'body', errors, data);
  assignEnumField(body, 'priority', announcementPriorities, errors, data);
  assignEnumField(body, 'audienceType', audienceTypes, errors, data);
  assignNullableStringField(body, 'programId', data);
  assignNullableStringField(body, 'cohortId', data);
  assignEnumField(body, 'status', publicationStatuses, errors, data);
  assignNullableDateTimeField(body, errors, data);

  if (data.audienceType) {
    validateAudienceScope(data, errors);
  }

  if (Object.keys(data).length === 0 && errors.length === 0) {
    return {
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    };
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data,
  };
}
