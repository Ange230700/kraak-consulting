import {
  assignOptionalTrimmedString,
  assignRequiredTrimmedString,
  isObjectPayload,
  readNullableString,
} from '../shared/dto-validation.utils';
import type { ValidationResult } from '../shared/validation-result.type';

export interface ServiceDto {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceDetailDto {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWithDetailsDto extends ServiceDto {
  details: ServiceDetailDto[];
}

export interface CreateServiceDto {
  title: string;
  description: string;
  icon?: string | null;
  sortOrder?: number;
}

export interface UpdateServiceDto {
  title?: string;
  description?: string;
  icon?: string | null;
  sortOrder?: number;
}

export interface CreateServiceDetailDto {
  title: string;
  description: string;
  sortOrder?: number;
}

export interface UpdateServiceDetailDto {
  title?: string;
  description?: string;
  sortOrder?: number;
}

function assignNullableIcon(
  body: Record<string, unknown>,
  updates: Partial<CreateServiceDto> | UpdateServiceDto,
): void {
  if (!('icon' in body)) {
    return;
  }

  updates.icon = readNullableString(body['icon']);
}

function assignOptionalSortOrder<T extends { sortOrder?: number }>(
  body: Record<string, unknown>,
  errors: string[],
  updates: T,
): void {
  if (!('sortOrder' in body)) {
    return;
  }

  const value = body['sortOrder'];

  if (!Number.isInteger(value)) {
    errors.push('Le champ sortOrder doit être un entier.');
    return;
  }

  updates.sortOrder = value as number;
}

export function validateCreateServicePayload(
  body: unknown,
): ValidationResult<CreateServiceDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const errors: string[] = [];
  const data: Partial<CreateServiceDto> = {};

  assignRequiredTrimmedString(body, 'title', errors, data);
  assignRequiredTrimmedString(body, 'description', errors, data);
  assignNullableIcon(body, data);
  assignOptionalSortOrder(body, errors, data);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: data as CreateServiceDto,
  };
}

export function validateUpdateServicePayload(
  body: unknown,
): ValidationResult<UpdateServiceDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const errors: string[] = [];
  const data: UpdateServiceDto = {};

  assignOptionalTrimmedString(body, 'title', errors, data);
  assignOptionalTrimmedString(body, 'description', errors, data);
  assignNullableIcon(body, data);
  assignOptionalSortOrder(body, errors, data);

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

export function validateCreateServiceDetailPayload(
  body: unknown,
): ValidationResult<CreateServiceDetailDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const errors: string[] = [];
  const data: Partial<CreateServiceDetailDto> = {};

  assignRequiredTrimmedString(body, 'title', errors, data);
  assignRequiredTrimmedString(body, 'description', errors, data);
  assignOptionalSortOrder(body, errors, data);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: data as CreateServiceDetailDto,
  };
}

export function validateUpdateServiceDetailPayload(
  body: unknown,
): ValidationResult<UpdateServiceDetailDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const errors: string[] = [];
  const data: UpdateServiceDetailDto = {};

  assignOptionalTrimmedString(body, 'title', errors, data);
  assignOptionalTrimmedString(body, 'description', errors, data);
  assignOptionalSortOrder(body, errors, data);

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
