import type {
  PasswordResetRequestDto,
  RefreshSessionRequestDto,
  SignInRequestDto,
  SignUpRequestDto,
} from '@kraak/contracts';
import {
  apiMessage,
  type ApiMessageDescriptor,
  type ApiMessageValue,
} from '../i18n/api-message';
import {
  isObjectPayload,
  readTrimmedString,
  validateEmail,
} from '../shared/dto-validation.utils';
import type { ValidationResult } from '../shared/validation-result.type';

type AccessTokenSuccess = {
  valid: true;
  data: string;
};

type AccessTokenFailure = {
  valid: false;
  error: ApiMessageDescriptor;
};

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

function validatePassword(password: string, errors: ApiMessageValue[]): void {
  if (password.length < 8) {
    errors.push(apiMessage('auth.passwordTooShort'));
  } else if (password.length > 128) {
    errors.push(apiMessage('auth.passwordTooLong'));
  }
}

function validateRequiredText(
  value: string,
  field: 'firstName' | 'lastName',
  errors: ApiMessageValue[],
  maxLength = 80,
): void {
  const requiredKey =
    field === 'firstName' ? 'auth.firstNameRequired' : 'auth.lastNameRequired';
  const tooLongKey =
    field === 'firstName' ? 'auth.firstNameTooLong' : 'auth.lastNameTooLong';

  if (!value) {
    errors.push(apiMessage(requiredKey));
  } else if (value.length > maxLength) {
    errors.push(apiMessage(tooLongKey, { maxLength }));
  }
}

function validateRedirectTarget(
  redirectTo: string | null,
  errors: ApiMessageValue[],
): void {
  if (redirectTo && !isValidRedirectTarget(redirectTo)) {
    errors.push(apiMessage('auth.redirectInvalid'));
  }
}

export function validateSignInPayload(
  body: unknown,
): ValidationResult<SignInRequestDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const email = readTrimmedString(body['email']);
  const password = typeof body['password'] === 'string' ? body['password'] : '';
  const errors: ApiMessageValue[] = [];

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
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
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
  const errors: ApiMessageValue[] = [];

  validateEmail(email, errors);
  validatePassword(password, errors);
  validateRequiredText(firstName, 'firstName', errors);
  validateRequiredText(lastName, 'lastName', errors);
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
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const refreshToken = readTrimmedString(body['refreshToken']);

  if (!refreshToken) {
    return {
      valid: false,
      errors: [apiMessage('auth.refreshTokenRequired')],
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
    return { valid: false, errors: [apiMessage('validation.invalidBody')] };
  }

  const email = readTrimmedString(body['email']);
  const redirectTo = readOptionalString(body['redirectTo']);
  const errors: ApiMessageValue[] = [];

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
      error: apiMessage('auth.bearerRequired'),
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
      error: apiMessage('auth.bearerRequired'),
    };
  }

  return {
    valid: true,
    data: token.trim(),
  };
}
