import type { CreateResourceDto, UpdateResourceDto } from '@kraak/contracts';

type ValidationSuccess<T> = {
  valid: true;
  data: T;
};

type ValidationFailure = {
  valid: false;
  errors: string[];
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function isObjectPayload(body: unknown): body is Record<string, unknown> {
  return Boolean(body) && typeof body === 'object' && !Array.isArray(body);
}

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

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

const publicationStatuses = new Set(['draft', 'published', 'archived']);
const resourceTypes = new Set(['link', 'file', 'video', 'document']);
const resourceThemes = new Set([
  'training',
  'project_management',
  'immigration',
  'career',
]);
const resourceAudiences = new Set([
  'all',
  'young_professionals_students',
  'organizations',
  'international_candidates',
]);

function assignRequiredString(
  body: Record<string, unknown>,
  field: keyof CreateResourceDto,
  errors: string[],
  updates: Partial<CreateResourceDto>,
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

function assignNullableString(
  body: Record<string, unknown>,
  field: keyof CreateResourceDto,
  updates: Partial<CreateResourceDto>,
): void {
  if (!(field in body)) {
    return;
  }

  (updates as Record<string, unknown>)[field] = readNullableString(body[field]);
}

function assignNullableDateTime(
  body: Record<string, unknown>,
  field: keyof CreateResourceDto,
  errors: string[],
  updates: Partial<CreateResourceDto>,
): void {
  if (!(field in body)) {
    return;
  }

  const value = body[field];
  if (value === null) {
    (updates as Record<string, unknown>)[field] = null;
    return;
  }

  const normalized = readNullableDateTime(value);
  if (normalized === null && readTrimmedString(value)) {
    errors.push(`Le champ ${field} est invalide.`);
    return;
  }

  (updates as Record<string, unknown>)[field] = normalized;
}

function assignEnumField<T extends string>(
  body: Record<string, unknown>,
  field: keyof CreateResourceDto,
  values: Set<T>,
  errors: string[],
  updates: Partial<CreateResourceDto>,
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

export function validateCreateResourcePayload(
  body: unknown,
): ValidationResult<CreateResourceDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const errors: string[] = [];
  const data: Partial<CreateResourceDto> = {};

  assignRequiredString(body, 'title', errors, data);
  assignNullableString(body, 'description', data);
  assignEnumField(body, 'resourceType', resourceTypes, errors, data);
  assignEnumField(body, 'resourceTheme', resourceThemes, errors, data);
  assignEnumField(body, 'resourceAudience', resourceAudiences, errors, data);
  assignNullableString(body, 'url', data);
  assignNullableString(body, 'filePath', data);
  assignEnumField(body, 'status', publicationStatuses, errors, data);
  assignNullableDateTime(body, 'publishedAt', errors, data);
  assignNullableString(body, 'programId', data);
  assignNullableString(body, 'cohortId', data);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: data as CreateResourceDto,
  };
}

export function validateUpdateResourcePayload(
  body: unknown,
): ValidationResult<UpdateResourceDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const errors: string[] = [];
  const data: UpdateResourceDto = {};

  if ('title' in body) {
    const title = readTrimmedString(body.title);
    if (title.length === 0) {
      errors.push('Le champ title est requis.');
    } else {
      data.title = title;
    }
  }

  assignNullableString(body, 'description', data);
  assignEnumField(body, 'resourceType', resourceTypes, errors, data);
  assignEnumField(body, 'resourceTheme', resourceThemes, errors, data);
  assignEnumField(body, 'resourceAudience', resourceAudiences, errors, data);
  assignNullableString(body, 'url', data);
  assignNullableString(body, 'filePath', data);
  assignEnumField(body, 'status', publicationStatuses, errors, data);
  assignNullableDateTime(body, 'publishedAt', errors, data);
  assignNullableString(body, 'programId', data);
  assignNullableString(body, 'cohortId', data);

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
