import type { CreateAppUserDto, UpdateAppUserDto } from '@kraak/contracts';
import { isValidEmail } from '../shared/dto-validation.utils';

export type { CreateAppUserDto, UpdateAppUserDto };

const ALLOWED_ROLES = ['participant', 'admin', 'trainer'] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

function isAllowedRole(value: unknown): value is AllowedRole {
  return (
    typeof value === 'string' && ALLOWED_ROLES.includes(value as AllowedRole)
  );
}

function normalizeOptionalText(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() || null : null;
}

function normalizeOptionalEmail(
  value: unknown,
): { valid: true; value?: string } | { valid: false; error: string } {
  if (value === undefined) {
    return { valid: true };
  }

  if (typeof value !== 'string' || !value.trim()) {
    return { valid: false, error: "L'adresse email est invalide" };
  }

  const normalized = value.trim();
  if (!isValidEmail(normalized)) {
    return { valid: false, error: "L'adresse email n'est pas valide" };
  }

  return { valid: true, value: normalized };
}

function normalizeRequiredName(
  value: unknown,
  requiredError: string,
): { valid: true; value: string } | { valid: false; error: string } {
  if (typeof value !== 'string' || !value.trim()) {
    return { valid: false, error: requiredError };
  }

  return { valid: true, value: value.trim() };
}

function normalizeOptionalName(
  value: unknown,
  invalidError: string,
): { valid: true; value?: string } | { valid: false; error: string } {
  if (value === undefined) {
    return { valid: true };
  }

  if (typeof value !== 'string' || !value.trim()) {
    return { valid: false, error: invalidError };
  }

  return { valid: true, value: value.trim() };
}

function normalizeOptionalRole(
  value: unknown,
): { valid: true; value?: AllowedRole } | { valid: false; error: string } {
  if (value === undefined) {
    return { valid: true };
  }

  if (!isAllowedRole(value)) {
    return {
      valid: false,
      error: `Le rôle doit être l'un des suivants : ${ALLOWED_ROLES.join(', ')}`,
    };
  }

  return { valid: true, value };
}

function normalizeOptionalIsActive(
  value: unknown,
): { valid: true; value?: boolean } | { valid: false; error: string } {
  if (value === undefined) {
    return { valid: true };
  }

  if (typeof value !== 'boolean') {
    return { valid: false, error: 'Le statut actif doit être un booléen' };
  }

  return { valid: true, value };
}

export function validateCreateUserPayload(
  body: unknown,
): { valid: true; data: CreateAppUserDto } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de requête manquant ou invalide' };
  }

  const payload = body as Record<string, unknown>;

  const emailValidation = normalizeOptionalEmail(payload['email']);
  if (!emailValidation.valid || !emailValidation.value) {
    return {
      valid: false,
      error: emailValidation.valid
        ? "L'adresse email est obligatoire"
        : emailValidation.error,
    };
  }

  const firstNameValidation = normalizeRequiredName(
    payload['firstName'],
    'Le prénom est obligatoire',
  );
  if (!firstNameValidation.valid) {
    return firstNameValidation;
  }

  const lastNameValidation = normalizeRequiredName(
    payload['lastName'],
    'Le nom de famille est obligatoire',
  );
  if (!lastNameValidation.valid) {
    return lastNameValidation;
  }

  const roleValidation = normalizeOptionalRole(payload['role']);
  if (!roleValidation.valid || !roleValidation.value) {
    return {
      valid: false,
      error: roleValidation.valid
        ? `Le rôle doit être l'un des suivants : ${ALLOWED_ROLES.join(', ')}`
        : roleValidation.error,
    };
  }

  const isActiveValidation = normalizeOptionalIsActive(payload['isActive']);
  if (!isActiveValidation.valid) {
    return isActiveValidation;
  }

  return {
    valid: true,
    data: {
      email: emailValidation.value,
      firstName: firstNameValidation.value,
      lastName: lastNameValidation.value,
      role: roleValidation.value,
      phone: normalizeOptionalText(payload['phone']),
      preferredContactChannel: normalizeOptionalText(
        payload['preferredContactChannel'],
      ),
      isActive: isActiveValidation.value ?? true,
    },
  };
}

export function validateUpdateUserPayload(
  body: unknown,
): { valid: true; data: UpdateAppUserDto } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de requête manquant ou invalide' };
  }

  const payload = body as Record<string, unknown>;
  const data: UpdateAppUserDto = {};

  const emailValidation = normalizeOptionalEmail(payload['email']);
  if (!emailValidation.valid) {
    return emailValidation;
  }
  if (emailValidation.value !== undefined) {
    data.email = emailValidation.value;
  }

  const firstNameValidation = normalizeOptionalName(
    payload['firstName'],
    'Le prénom est invalide',
  );
  if (!firstNameValidation.valid) {
    return firstNameValidation;
  }
  if (firstNameValidation.value !== undefined) {
    data.firstName = firstNameValidation.value;
  }

  const lastNameValidation = normalizeOptionalName(
    payload['lastName'],
    'Le nom de famille est invalide',
  );
  if (!lastNameValidation.valid) {
    return lastNameValidation;
  }
  if (lastNameValidation.value !== undefined) {
    data.lastName = lastNameValidation.value;
  }

  const roleValidation = normalizeOptionalRole(payload['role']);
  if (!roleValidation.valid) {
    return roleValidation;
  }
  if (roleValidation.value !== undefined) {
    data.role = roleValidation.value;
  }

  if (payload['phone'] !== undefined) {
    data.phone = normalizeOptionalText(payload['phone']);
  }

  if (payload['preferredContactChannel'] !== undefined) {
    data.preferredContactChannel = normalizeOptionalText(
      payload['preferredContactChannel'],
    );
  }

  const isActiveValidation = normalizeOptionalIsActive(payload['isActive']);
  if (!isActiveValidation.valid) {
    return isActiveValidation;
  }
  if (isActiveValidation.value !== undefined) {
    data.isActive = isActiveValidation.value;
  }

  return { valid: true, data };
}
