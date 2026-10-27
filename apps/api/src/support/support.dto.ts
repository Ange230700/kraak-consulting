import { apiMessage, type ApiMessageValue } from '../i18n/api-message';
import type {
  ContactFormDto,
  SupportRequestStatusValue,
  UpdateSupportRequestStatusDto,
} from '@kraak/contracts';
import {
  readTrimmedString,
  validateEmail,
} from '../shared/dto-validation.utils';
import type { ValidationResult } from '../shared/validation-result.type';

type ContactCategory = ContactFormDto['category'];

export type ContactFormValidationResult = ValidationResult<ContactFormDto>;

export type SupportStatusUpdateValidationResult =
  ValidationResult<UpdateSupportRequestStatusDto>;

const supportCategories: Set<ContactCategory> = new Set([
  'technical',
  'training',
  'program',
  'session',
  'billing',
  'project_management',
  'immigration',
  'business',
  'partnership',
  'other',
]);

const supportRequestStatuses: Set<SupportRequestStatusValue> = new Set([
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

function isSupportCategory(value: string): value is ContactCategory {
  return supportCategories.has(value as ContactCategory);
}

function isSupportRequestStatus(
  value: string,
): value is SupportRequestStatusValue {
  return supportRequestStatuses.has(value as SupportRequestStatusValue);
}

function validateName(name: string, errors: ApiMessageValue[]): void {
  if (!name) {
    errors.push(apiMessage('support.nameRequired'));
  } else if (name.length < 2) {
    errors.push(apiMessage('support.nameTooShort'));
  } else if (name.length > 80) {
    errors.push(apiMessage('support.nameTooLong'));
  }
}

function validateSubject(subject: string, errors: ApiMessageValue[]): void {
  if (!subject) {
    errors.push(apiMessage('support.subjectRequired'));
  } else if (subject.length < 3) {
    errors.push(apiMessage('support.subjectTooShort'));
  } else if (subject.length > 120) {
    errors.push(apiMessage('support.subjectTooLong'));
  }
}

function validateMessage(message: string, errors: ApiMessageValue[]): void {
  if (!message) {
    errors.push(apiMessage('support.messageRequired'));
  } else if (message.length < 10) {
    errors.push(apiMessage('support.messageTooShort'));
  } else if (message.length > 2000) {
    errors.push(apiMessage('support.messageTooLong'));
  }
}

function validateCategory(
  rawCategory: string,
  errors: ApiMessageValue[],
): void {
  if (rawCategory && !isSupportCategory(rawCategory)) {
    errors.push(apiMessage('support.categoryInvalid'));
  }
}

export function validateContactForm(
  body: unknown,
): ContactFormValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const dto = body as Record<string, unknown>;
  const name = readTrimmedString(dto['name']);
  const email = readTrimmedString(dto['email']);
  const subject = readTrimmedString(dto['subject']);
  const message = readTrimmedString(dto['message']);
  const rawCategory = readTrimmedString(dto['category']);
  const errors: ApiMessageValue[] = [];

  validateName(name, errors);
  validateEmail(email, errors);
  validateSubject(subject, errors);
  validateMessage(message, errors);
  validateCategory(rawCategory, errors);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name,
      email,
      subject,
      message,
      category:
        rawCategory && isSupportCategory(rawCategory) ? rawCategory : 'other',
    },
  };
}

export function validateSupportStatusUpdatePayload(
  body: unknown,
): SupportStatusUpdateValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const status = readTrimmedString((body as Record<string, unknown>)['status']);

  if (!status || !isSupportRequestStatus(status)) {
    return {
      valid: false,
      errors: [apiMessage('support.statusInvalid')],
    };
  }

  return {
    valid: true,
    data: {
      status,
    },
  };
}
