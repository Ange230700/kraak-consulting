import type {
  ContactFormDto,
  SupportRequestStatusValue,
  UpdateSupportRequestStatusDto,
} from '@kraak/contracts';

type ContactCategory = ContactFormDto['category'];

type ContactFormValidationSuccess = {
  valid: true;
  data: ContactFormDto;
};

type ContactFormValidationFailure = {
  valid: false;
  errors: string[];
};

export type ContactFormValidationResult =
  | ContactFormValidationSuccess
  | ContactFormValidationFailure;

type SupportStatusUpdateValidationSuccess = {
  valid: true;
  data: UpdateSupportRequestStatusDto;
};

type SupportStatusUpdateValidationFailure = {
  valid: false;
  errors: string[];
};

export type SupportStatusUpdateValidationResult =
  | SupportStatusUpdateValidationSuccess
  | SupportStatusUpdateValidationFailure;

const supportCategories: Set<ContactCategory> = new Set([
  'technical',
  'program',
  'session',
  'billing',
  'other',
]);

const supportRequestStatuses: Set<SupportRequestStatusValue> = new Set([
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSupportCategory(value: string): value is ContactCategory {
  return supportCategories.has(value as ContactCategory);
}

function isSupportRequestStatus(
  value: string,
): value is SupportRequestStatusValue {
  return supportRequestStatuses.has(value as SupportRequestStatusValue);
}

function validateName(name: string, errors: string[]): void {
  if (!name) {
    errors.push('Le nom est requis.');
  } else if (name.length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères.');
  } else if (name.length > 80) {
    errors.push('Le nom ne peut pas dépasser 80 caractères.');
  }
}

function validateEmail(email: string, errors: string[]): void {
  if (!email || !isValidEmail(email)) {
    errors.push("L'adresse e-mail est invalide.");
  }
}

function validateSubject(subject: string, errors: string[]): void {
  if (!subject) {
    errors.push("L'objet est requis.");
  } else if (subject.length < 3) {
    errors.push("L'objet doit contenir au moins 3 caractères.");
  } else if (subject.length > 120) {
    errors.push("L'objet ne peut pas dépasser 120 caractères.");
  }
}

function validateMessage(message: string, errors: string[]): void {
  if (!message) {
    errors.push('Le message est requis.');
  } else if (message.length < 10) {
    errors.push('Le message doit contenir au moins 10 caractères.');
  } else if (message.length > 2000) {
    errors.push('Le message ne peut pas dépasser 2000 caractères.');
  }
}

function validateCategory(rawCategory: string, errors: string[]): void {
  if (rawCategory && !isSupportCategory(rawCategory)) {
    errors.push('La catégorie de support est invalide.');
  }
}

export function validateContactForm(
  body: unknown,
): ContactFormValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const dto = body as Record<string, unknown>;
  const name = readTrimmedString(dto['name']);
  const email = readTrimmedString(dto['email']);
  const subject = readTrimmedString(dto['subject']);
  const message = readTrimmedString(dto['message']);
  const rawCategory = readTrimmedString(dto['category']);
  const errors: string[] = [];

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
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const status = readTrimmedString((body as Record<string, unknown>)['status']);

  if (!status || !isSupportRequestStatus(status)) {
    return {
      valid: false,
      errors: ['Le statut de la demande de support est invalide.'],
    };
  }

  return {
    valid: true,
    data: {
      status,
    },
  };
}
