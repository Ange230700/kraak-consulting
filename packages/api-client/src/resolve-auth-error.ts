import { ApiError } from './client.js';

export function resolveAuthErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof ApiError && isObjectRecord(error.body)) {
    const body = error.body;

    if (
      'message' in body &&
      typeof body['message'] === 'string' &&
      body['message'].trim().length > 0
    ) {
      return body['message'];
    }

    if ('errors' in body && Array.isArray(body['errors'])) {
      const firstError = body['errors'].find(
        (value: unknown): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      );

      if (firstError) {
        return firstError;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
