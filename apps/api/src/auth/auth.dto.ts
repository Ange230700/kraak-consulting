import type {
  PasswordResetRequestDto,
  RefreshSessionRequestDto,
  SignInRequestDto,
  SignUpRequestDto,
} from '@kraak/contracts';
import {
  isObjectPayload,
  isValidEmail,
  readTrimmedString,
  validateEmail,
} from '../shared/dto-validation.utils';

type ValidationSuccess<T> = {
  valid: true;
  data: T;
};

type ValidationFailure = {
  valid: false;
  errors: string[];
};

type AccessTokenSuccess = {
  valid: true;
  data: string;
};

type AccessTokenFailure = {
  valid: false;
  error: string;
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function readOptionalString(value: unknown, maxLength?: number): string | null {
  const normalized = readTrimmedString(value);

  if (!normalized) {
    return null;
  }

  return maxLength && normalized.length > maxLength
    ? normalized.slice(0, maxLength)
    : normalized;
}

function isValidRedirectTarget(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validatePassword(password: string, errors: string[]): void {
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères.');
  } else if (password.length > 128) {
    errors.push('Le mot de passe ne peut pas dépasser 128 caractères.');
  }
}

function validateRequiredText(
  value: string,
  label: string,
  errors: string[],
  maxLength = 80,
): void {
  if (!value) {
    errors.push(`Le ${label} est requis.`);
  } else if (value.length > maxLength) {
    errors.push(`Le ${label} ne peut pas dépasser ${maxLength} caractères.`);
  }
}

function validateRedirectTarget(
  redirectTo: string | null,
  errors: string[],
): void {
  if (redirectTo && !isValidRedirectTarget(redirectTo)) {
    errors.push('Le lien de redirection est invalide.');
  }
}

export function validateSignInPayload(
  body: unknown,
): ValidationResult<SignInRequestDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const email = readTrimmedString(body['email']);
  const password = typeof body['password'] === 'string' ? body['password'] : '';
  const errors: string[] = [];

  validateEmail(email, errors);
  validatePassword(password, errors);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      email,
      password,
    },
  };
}

export function validateSignUpPayload(
  body: unknown,
): ValidationResult<SignUpRequestDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const email = readTrimmedString(body['email']);
  const password = typeof body['password'] === 'string' ? body['password'] : '';
  const firstName = readTrimmedString(body['firstName']);
  const lastName = readTrimmedString(body['lastName']);
  const phone = readOptionalString(body['phone'], 40);
  const preferredContactChannel = readOptionalString(
    body['preferredContactChannel'],
    40,
  );
  const redirectTo = readOptionalString(body['redirectTo']);
  const errors: string[] = [];

  validateEmail(email, errors);
  validatePassword(password, errors);
  validateRequiredText(firstName, 'prénom', errors);
  validateRequiredText(lastName, 'nom', errors);
  validateRedirectTarget(redirectTo, errors);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      email,
      password,
      firstName,
      lastName,
      phone,
      preferredContactChannel,
      redirectTo,
    },
  };
}

export function validateRefreshSessionPayload(
  body: unknown,
): ValidationResult<RefreshSessionRequestDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const refreshToken = readTrimmedString(body['refreshToken']);

  if (!refreshToken) {
    return {
      valid: false,
      errors: ['Le refresh token est requis.'],
    };
  }

  return {
    valid: true,
    data: {
      refreshToken,
    },
  };
}

export function validatePasswordResetPayload(
  body: unknown,
): ValidationResult<PasswordResetRequestDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const email = readTrimmedString(body['email']);
  const redirectTo = readOptionalString(body['redirectTo']);
  const errors: string[] = [];

  validateEmail(email, errors);
  validateRedirectTarget(redirectTo, errors);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      email,
      redirectTo,
    },
  };
}

export function extractAccessToken(
  authorizationHeader: unknown,
): AccessTokenSuccess | AccessTokenFailure {
  const header = readTrimmedString(authorizationHeader);

  if (!header) {
    return {
      valid: false,
      error: "Le header d'autorisation Bearer est requis.",
    };
  }

  const [scheme, token, ...extraParts] = header.split(/\s+/);

  if (
    scheme?.toLowerCase() !== 'bearer' ||
    !token ||
    extraParts.length > 0 ||
    !token.trim()
  ) {
    return {
      valid: false,
      error: "Le header d'autorisation Bearer est requis.",
    };
  }

  return {
    valid: true,
    data: token.trim(),
  };
}
