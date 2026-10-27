import { apiMessage, type ApiMessageValue } from '../i18n/api-message';
import type {
  CreateProgramDto,
  MarkProgramSessionProgressRequestDto,
  UpdateProgramDto,
} from '@kraak/contracts';
import {
  isObjectPayload,
  readTrimmedString,
} from '../shared/dto-validation.utils';
import type { ValidationResult } from '../shared/validation-result.type';

const publicationStatuses = new Set(['draft', 'published', 'archived']);
const programVisibilities = new Set(['private', 'participants', 'public']);

export interface ProgramFeatureDto {
  id: string;
  programId: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramFeatureDto {
  title: string;
  sortOrder?: number;
}

export interface UpdateProgramFeatureDto {
  title?: string;
  sortOrder?: number;
}

function isValidSlug(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
}

function assignOptionalString(
  body: Record<string, unknown>,
  field: keyof CreateProgramDto,
  updates: UpdateProgramDto,
): void {
  if (!(field in body)) {
    return;
  }

  (updates as Record<string, unknown>)[field] = readTrimmedString(body[field]);
}

function assignRequiredString(
  body: Record<string, unknown>,
  field: keyof CreateProgramDto,
  errors: ApiMessageValue[],
  updates: Partial<CreateProgramDto>,
): void {
  if (!(field in body)) {
    errors.push(
      apiMessage('validation.requiredField', { field: String(field) }),
    );
    return;
  }

  const value = readTrimmedString(body[field]);

  if (!value) {
    errors.push(
      apiMessage('validation.requiredField', { field: String(field) }),
    );
    return;
  }

  (updates as Record<string, unknown>)[field] = value;
}

function assignStatus(
  body: Record<string, unknown>,
  errors: ApiMessageValue[],
  updates: Partial<CreateProgramDto> | UpdateProgramDto,
): void {
  if (!('status' in body)) {
    return;
  }

  const status = readTrimmedString(body['status']);

  if (!publicationStatuses.has(status)) {
    errors.push(apiMessage('validation.invalidField', { field: 'status' }));
    return;
  }

  (updates as Record<string, unknown>).status = status;
}

function assignVisibility(
  body: Record<string, unknown>,
  errors: ApiMessageValue[],
  updates: Partial<CreateProgramDto> | UpdateProgramDto,
): void {
  if (!('visibility' in body)) {
    return;
  }

  const visibility = readTrimmedString(body['visibility']);

  if (!programVisibilities.has(visibility)) {
    errors.push(apiMessage('validation.invalidField', { field: 'visibility' }));
    return;
  }

  (updates as Record<string, unknown>).visibility = visibility;
}

function assignFeatureRequiredTitle(
  body: Record<string, unknown>,
  errors: ApiMessageValue[],
  updates: Partial<CreateProgramFeatureDto>,
): void {
  if (!('title' in body)) {
    errors.push(apiMessage('validation.requiredField', { field: 'title' }));
    return;
  }

  const title = readTrimmedString(body['title']);

  if (!title) {
    errors.push(apiMessage('validation.requiredField', { field: 'title' }));
    return;
  }

  updates.title = title;
}

function assignFeatureOptionalTitle(
  body: Record<string, unknown>,
  errors: ApiMessageValue[],
  updates: UpdateProgramFeatureDto,
): void {
  if (!('title' in body)) {
    return;
  }

  const title = readTrimmedString(body['title']);

  if (!title) {
    errors.push(apiMessage('validation.requiredField', { field: 'title' }));
    return;
  }

  updates.title = title;
}

function assignFeatureSortOrder<T extends { sortOrder?: number }>(
  body: Record<string, unknown>,
  errors: ApiMessageValue[],
  updates: T,
): void {
  if (!('sortOrder' in body)) {
    return;
  }

  if (!Number.isInteger(body['sortOrder'])) {
    errors.push(apiMessage('validation.integerField', { field: 'sortOrder' }));
    return;
  }

  updates.sortOrder = body['sortOrder'] as number;
}

export function validateCreateProgramPayload(
  body: unknown,
): ValidationResult<CreateProgramDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: [apiMessage('validation.invalidBody')],
    };
  }

  const errors: ApiMessageValue[] = [];
  const data: Partial<CreateProgramDto> = {};

  assignRequiredString(body, 'slug', errors, data);
  if (typeof data.slug === 'string' && isValidSlug(data.slug) === false) {
    errors.push(apiMessage('validation.invalidField', { field: 'slug' }));
  }

  assignRequiredString(body, 'title', errors, data);
  assignRequiredString(body, 'summary', errors, data);
  assignRequiredString(body, 'description', errors, data);
  assignStatus(body, errors, data);
  assignVisibility(body, errors, data);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: data as CreateProgramDto,
  };
}

export function validateUpdateProgramPayload(
  body: unknown,
): ValidationResult<UpdateProgramDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: [apiMessage('validation.invalidBody')],
    };
  }

  const errors: ApiMessageValue[] = [];
  const data: UpdateProgramDto = {};

  if ('slug' in body) {
    const slug = readTrimmedString(body['slug']);
    if (!slug) {
      errors.push(apiMessage('validation.requiredField', { field: 'slug' }));
    } else if (isValidSlug(slug) === false) {
      errors.push(apiMessage('validation.invalidField', { field: 'slug' }));
    } else {
      data.slug = slug;
    }
  }

  assignOptionalString(body, 'title', data);
  assignOptionalString(body, 'summary', data);
  assignOptionalString(body, 'description', data);
  assignStatus(body, errors, data);
  assignVisibility(body, errors, data);

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

export function validateCreateProgramFeaturePayload(
  body: unknown,
): ValidationResult<CreateProgramFeatureDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: [apiMessage('validation.invalidBody')],
    };
  }

  const errors: ApiMessageValue[] = [];
  const data: Partial<CreateProgramFeatureDto> = {};

  assignFeatureRequiredTitle(body, errors, data);
  assignFeatureSortOrder(body, errors, data);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: data as CreateProgramFeatureDto,
  };
}

export function validateUpdateProgramFeaturePayload(
  body: unknown,
): ValidationResult<UpdateProgramFeatureDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: [apiMessage('validation.invalidBody')],
    };
  }

  const errors: ApiMessageValue[] = [];
  const data: UpdateProgramFeatureDto = {};

  assignFeatureOptionalTitle(body, errors, data);
  assignFeatureSortOrder(body, errors, data);

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

export function validateMarkSessionProgressPayload(
  body: unknown,
): ValidationResult<MarkProgramSessionProgressRequestDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: [apiMessage('validation.invalidBody')],
    };
  }

  const sessionId = readTrimmedString(body['sessionId']);
  const completedValue = body['completed'];
  const errors: ApiMessageValue[] = [];

  if (!sessionId) {
    errors.push(apiMessage('validation.requiredField', { field: 'sessionId' }));
  }

  if (typeof completedValue !== 'boolean') {
    errors.push(apiMessage('validation.booleanField', { field: 'completed' }));
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const completed = completedValue as boolean;

  return {
    valid: true,
    data: {
      sessionId,
      completed,
    },
  };
}
