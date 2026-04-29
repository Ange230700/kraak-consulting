import type { MarkProgramSessionProgressRequestDto } from '@kraak/contracts';

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

export function validateMarkSessionProgressPayload(
  body: unknown,
): ValidationResult<MarkProgramSessionProgressRequestDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const sessionId = readTrimmedString(body['sessionId']);
  const completed = body['completed'];
  const errors: string[] = [];

  if (!sessionId) {
    errors.push('Le sessionId est requis.');
  }

  if (typeof completed !== 'boolean') {
    errors.push('Le champ completed doit être un booléen.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      sessionId,
      completed,
    },
  };
}
