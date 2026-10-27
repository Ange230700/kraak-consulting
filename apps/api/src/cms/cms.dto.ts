import { apiMessage, type ApiMessageValue } from '../i18n/api-message';
import type {
  CreatePartnerDto,
  CreateStatisticDto,
  CreateTeamMemberDto,
  CreateTestimonialDto,
  UpdatePartnerDto,
  UpdateStatisticDto,
  UpdateTeamMemberDto,
  UpdateTestimonialDto,
} from '@kraak/contracts';
import {
  isObjectPayload,
  readTrimmedString,
} from '../shared/dto-validation.utils';
import type { ValidationResult } from '../shared/validation-result.type';

const publicationStatuses = new Set(['draft', 'published', 'archived']);
type CmsPublicationFields = Pick<CreateStatisticDto, 'sortOrder' | 'status'>;

function finalizeCmsCreate<T>(
  data: T,
  sortOrder: number | null,
  status: string | null,
  errors: ApiMessageValue[],
): ValidationResult<T & CmsPublicationFields> {
  if (sortOrder === null) {
    errors.push(
      apiMessage('validation.nonNegativeIntegerField', { field: 'sortOrder' }),
    );
  }

  if (!status) {
    errors.push(apiMessage('validation.invalidField', { field: 'status' }));
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      ...data,
      sortOrder: sortOrder as number,
      status: status as CmsPublicationFields['status'],
    },
  };
}

function readNullableString(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  const normalized = readTrimmedString(value);
  return normalized.length > 0 ? normalized : null;
}

function readNullableUrl(value: unknown): {
  value: string | null;
  isInvalid: boolean;
} {
  if (value === null) {
    return { value: null, isInvalid: false };
  }

  const normalized = readTrimmedString(value);
  if (!normalized) {
    return { value: null, isInvalid: false };
  }

  try {
    new URL(normalized);
    return { value: normalized, isInvalid: false };
  } catch {
    return { value: null, isInvalid: true };
  }
}

function readNonNegativeInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }

  const normalized = readTrimmedString(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function readStatus(value: unknown): string | null {
  const status = readTrimmedString(value);
  return publicationStatuses.has(status) ? status : null;
}

function assignOptionalRequiredStringField<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  field: string,
  errors: ApiMessageValue[],
  data: T,
): void {
  if (!(field in body)) {
    return;
  }

  const value = readTrimmedString(body[field]);

  if (value.length > 0) {
    data[field as keyof T] = value as T[keyof T];
    return;
  }

  errors.push(apiMessage('validation.requiredField', { field: String(field) }));
}

function assignOptionalNullableStringField<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  field: string,
  data: T,
): void {
  if (!(field in body)) {
    return;
  }

  data[field as keyof T] = readNullableString(body[field]) as T[keyof T];
}

function assignOptionalNonNegativeIntegerField<
  T extends Record<string, unknown>,
>(
  body: Record<string, unknown>,
  field: string,
  errors: ApiMessageValue[],
  data: T,
): void {
  if (!(field in body)) {
    return;
  }

  const value = readNonNegativeInteger(body[field]);

  if (value !== null) {
    data[field as keyof T] = value as T[keyof T];
    return;
  }

  errors.push(
    apiMessage('validation.nonNegativeIntegerField', { field: String(field) }),
  );
}

function assignOptionalStatusField<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  errors: ApiMessageValue[],
  data: T,
): void {
  if (!('status' in body)) {
    return;
  }

  const status = readStatus(body['status']);

  if (status !== null) {
    (data as Record<string, unknown>)['status'] = status;
    return;
  }

  errors.push(apiMessage('validation.invalidField', { field: 'status' }));
}

function assignOptionalUrlField<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  field: string,
  errors: ApiMessageValue[],
  data: T,
  options?: { requiredWhenPresent?: boolean },
): void {
  if (!(field in body)) {
    return;
  }

  const url = readNullableUrl(body[field]);
  const requiresValue = options?.requiredWhenPresent === true;

  if (url.isInvalid || (requiresValue && url.value === null)) {
    if (requiresValue) {
      errors.push(
        apiMessage('validation.requiredValidUrlField', {
          field: String(field),
        }),
      );
      return;
    }

    errors.push(
      apiMessage('validation.invalidField', { field: String(field) }),
    );
    return;
  }

  data[field as keyof T] = url.value as T[keyof T];
}

export function validateCreateStatisticPayload(
  body: unknown,
): ValidationResult<CreateStatisticDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const label = readTrimmedString(body['label']);
  const value = readTrimmedString(body['value']);
  const suffix = readNullableString(body['suffix']);
  const sortOrder = readNonNegativeInteger(body['sortOrder']);
  const status = readStatus(body['status']);

  const errors: ApiMessageValue[] = [];

  if (!label) {
    errors.push(apiMessage('validation.requiredField', { field: 'label' }));
  }

  if (!value) {
    errors.push(apiMessage('validation.requiredField', { field: 'value' }));
  }

  return finalizeCmsCreate({ label, value, suffix }, sortOrder, status, errors);
}

export function validateUpdateStatisticPayload(
  body: unknown,
): ValidationResult<UpdateStatisticDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const data: UpdateStatisticDto = {};
  const errors: ApiMessageValue[] = [];

  assignOptionalRequiredStringField(body, 'label', errors, data);
  assignOptionalRequiredStringField(body, 'value', errors, data);
  assignOptionalNullableStringField(body, 'suffix', data);
  assignOptionalNonNegativeIntegerField(body, 'sortOrder', errors, data);
  assignOptionalStatusField(body, errors, data);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      errors: [apiMessage('validation.updateRequiresField')],
    };
  }

  return { valid: true, data };
}

export function validateCreatePartnerPayload(
  body: unknown,
): ValidationResult<CreatePartnerDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const name = readTrimmedString(body['name']);
  const logoUrlResult = readNullableUrl(body['logoUrl']);
  const websiteUrlResult = readNullableUrl(body['websiteUrl']);
  const sortOrder = readNonNegativeInteger(body['sortOrder']);
  const status = readStatus(body['status']);
  const errors: ApiMessageValue[] = [];

  if (!name) {
    errors.push(apiMessage('validation.requiredField', { field: 'name' }));
  }

  if (logoUrlResult.value === null || logoUrlResult.isInvalid) {
    errors.push(
      apiMessage('validation.requiredValidUrlField', { field: 'logoUrl' }),
    );
  }

  if (websiteUrlResult.isInvalid) {
    errors.push(apiMessage('validation.invalidField', { field: 'websiteUrl' }));
  }

  return finalizeCmsCreate(
    {
      name,
      logoUrl: logoUrlResult.value as string,
      websiteUrl: websiteUrlResult.value,
    },
    sortOrder,
    status,
    errors,
  );
}

export function validateUpdatePartnerPayload(
  body: unknown,
): ValidationResult<UpdatePartnerDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const data: UpdatePartnerDto = {};
  const errors: ApiMessageValue[] = [];

  assignOptionalRequiredStringField(body, 'name', errors, data);
  assignOptionalUrlField(body, 'logoUrl', errors, data, {
    requiredWhenPresent: true,
  });
  assignOptionalUrlField(body, 'websiteUrl', errors, data);
  assignOptionalNonNegativeIntegerField(body, 'sortOrder', errors, data);
  assignOptionalStatusField(body, errors, data);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      errors: [apiMessage('validation.updateRequiresField')],
    };
  }

  return { valid: true, data };
}

export function validateCreateTestimonialPayload(
  body: unknown,
): ValidationResult<CreateTestimonialDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const quote = readTrimmedString(body['quote']);
  const authorName = readTrimmedString(body['authorName']);
  const authorRole = readNullableString(body['authorRole']);
  const company = readNullableString(body['company']);
  const avatarUrlResult = readNullableUrl(body['avatarUrl']);
  const sortOrder = readNonNegativeInteger(body['sortOrder']);
  const status = readStatus(body['status']);
  const errors: ApiMessageValue[] = [];

  if (!quote) {
    errors.push(apiMessage('validation.requiredField', { field: 'quote' }));
  }

  if (!authorName) {
    errors.push(
      apiMessage('validation.requiredField', { field: 'authorName' }),
    );
  }

  if (avatarUrlResult.isInvalid) {
    errors.push(apiMessage('validation.invalidField', { field: 'avatarUrl' }));
  }

  return finalizeCmsCreate(
    {
      quote,
      authorName,
      authorRole,
      company,
      avatarUrl: avatarUrlResult.value,
    },
    sortOrder,
    status,
    errors,
  );
}

export function validateUpdateTestimonialPayload(
  body: unknown,
): ValidationResult<UpdateTestimonialDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const data: UpdateTestimonialDto = {};
  const errors: ApiMessageValue[] = [];

  assignOptionalRequiredStringField(body, 'quote', errors, data);
  assignOptionalRequiredStringField(body, 'authorName', errors, data);
  assignOptionalNullableStringField(body, 'authorRole', data);
  assignOptionalNullableStringField(body, 'company', data);
  assignOptionalUrlField(body, 'avatarUrl', errors, data);
  assignOptionalNonNegativeIntegerField(body, 'sortOrder', errors, data);
  assignOptionalStatusField(body, errors, data);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      errors: [apiMessage('validation.updateRequiresField')],
    };
  }

  return { valid: true, data };
}

export function validateCreateTeamMemberPayload(
  body: unknown,
): ValidationResult<CreateTeamMemberDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const fullName = readTrimmedString(body['fullName']);
  const role = readTrimmedString(body['role']);
  const bio = readNullableString(body['bio']);
  const avatarUrlResult = readNullableUrl(body['avatarUrl']);
  const linkedinUrlResult = readNullableUrl(body['linkedinUrl']);
  const sortOrder = readNonNegativeInteger(body['sortOrder']);
  const status = readStatus(body['status']);
  const errors: ApiMessageValue[] = [];

  if (!fullName) {
    errors.push(apiMessage('validation.requiredField', { field: 'fullName' }));
  }

  if (!role) {
    errors.push(apiMessage('validation.requiredField', { field: 'role' }));
  }

  if (avatarUrlResult.isInvalid) {
    errors.push(apiMessage('validation.invalidField', { field: 'avatarUrl' }));
  }

  if (linkedinUrlResult.isInvalid) {
    errors.push(
      apiMessage('validation.invalidField', { field: 'linkedinUrl' }),
    );
  }

  return finalizeCmsCreate(
    {
      fullName,
      role,
      bio,
      avatarUrl: avatarUrlResult.value,
      linkedinUrl: linkedinUrlResult.value,
    },
    sortOrder,
    status,
    errors,
  );
}

export function validateUpdateTeamMemberPayload(
  body: unknown,
): ValidationResult<UpdateTeamMemberDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const data: UpdateTeamMemberDto = {};
  const errors: ApiMessageValue[] = [];

  assignOptionalRequiredStringField(body, 'fullName', errors, data);
  assignOptionalRequiredStringField(body, 'role', errors, data);
  assignOptionalNullableStringField(body, 'bio', data);
  assignOptionalUrlField(body, 'avatarUrl', errors, data);
  assignOptionalUrlField(body, 'linkedinUrl', errors, data);
  assignOptionalNonNegativeIntegerField(body, 'sortOrder', errors, data);
  assignOptionalStatusField(body, errors, data);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      errors: [apiMessage('validation.updateRequiresField')],
    };
  }

  return { valid: true, data };
}
