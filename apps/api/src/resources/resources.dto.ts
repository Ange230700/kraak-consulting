import { apiMessage, type ApiMessageValue } from '../i18n/api-message';
import type { CreateResourceDto, UpdateResourceDto } from '@kraak/contracts';
import {
  assignRequiredTrimmedString,
  isObjectPayload,
  readNullableDateTime,
  readNullableString,
  readTrimmedString,
} from '../shared/dto-validation.utils';
import type { ValidationResult } from '../shared/validation-result.type';

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
  errors: ApiMessageValue[],
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
    errors.push(
      apiMessage('validation.invalidField', { field: String(field) }),
    );
    return;
  }

  (updates as Record<string, unknown>)[field] = normalized;
}

function assignEnumField<T extends string>(
  body: Record<string, unknown>,
  field: keyof CreateResourceDto,
  values: Set<T>,
  errors: ApiMessageValue[],
  updates: Partial<CreateResourceDto>,
): void {
  if (!(field in body)) {
    return;
  }

  const value = readTrimmedString(body[field]);

  if (!values.has(value as T)) {
    errors.push(
      apiMessage('validation.invalidField', { field: String(field) }),
    );
    return;
  }

  (updates as Record<string, unknown>)[field] = value;
}

function assignOptionalTitle(
  body: Record<string, unknown>,
  errors: ApiMessageValue[],
  updates: UpdateResourceDto,
): void {
  if (!('title' in body)) {
    return;
  }

  const title = readTrimmedString(body.title);
  if (title.length === 0) {
    errors.push(apiMessage('validation.requiredField', { field: 'title' }));
    return;
  }

  updates.title = title;
}

function assignSharedResourceFields(
  body: Record<string, unknown>,
  errors: ApiMessageValue[],
  updates: Partial<CreateResourceDto>,
): void {
  assignNullableString(body, 'description', updates);
  assignEnumField(body, 'resourceType', resourceTypes, errors, updates);
  assignEnumField(body, 'resourceTheme', resourceThemes, errors, updates);
  assignEnumField(body, 'resourceAudience', resourceAudiences, errors, updates);
  assignNullableString(body, 'url', updates);
  assignNullableString(body, 'filePath', updates);
  assignEnumField(body, 'status', publicationStatuses, errors, updates);
  assignNullableDateTime(body, 'publishedAt', errors, updates);
  assignNullableString(body, 'programId', updates);
  assignNullableString(body, 'cohortId', updates);
}

export function validateCreateResourcePayload(
  body: unknown,
): ValidationResult<CreateResourceDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: [apiMessage('validation.invalidBody')],
    };
  }

  const errors: ApiMessageValue[] = [];
  const data: Partial<CreateResourceDto> = {};

  assignRequiredTrimmedString(body, 'title', errors, data);
  assignSharedResourceFields(body, errors, data);

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
      errors: [apiMessage('validation.invalidBody')],
    };
  }

  const errors: ApiMessageValue[] = [];
  const data: UpdateResourceDto = {};

  assignOptionalTitle(body, errors, data);
  assignSharedResourceFields(body, errors, data);

  if (Object.keys(data).length === 0 && errors.length === 0) {
    return {
      valid: false,
      errors: [apiMessage('validation.updateRequiresField')],
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
