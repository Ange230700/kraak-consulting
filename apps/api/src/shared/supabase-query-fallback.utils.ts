export type SupabaseQueryResult<T> = {
  data: T;
  error: unknown;
};

type ReadSupabaseQueryWithFallbackOptions<T> = {
  loadQuery: (selectClause: string) => PromiseLike<SupabaseQueryResult<T>>;
  primarySelect: string;
  fallbackSelect: string;
  shouldRetry: (error: unknown) => boolean;
  context: string;
  retryNotice: string;
  fallbackFailureNotice: string;
  primaryFailureNotice?: string;
};

function isObjectPayload(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readSupabaseErrorCode(error: unknown): string | null {
  if (!isObjectPayload(error) || typeof error['code'] !== 'string') {
    return null;
  }

  return error['code'];
}

export function readSupabaseErrorMessage(error: unknown): string | null {
  if (!isObjectPayload(error) || typeof error['message'] !== 'string') {
    return null;
  }

  return error['message'];
}

export function isSupabaseColumnMissingError(
  error: unknown,
  columnFragments: string[],
): boolean {
  const message = readSupabaseErrorMessage(error);

  if (!message || readSupabaseErrorCode(error) !== '42703') {
    return false;
  }

  return columnFragments.some((columnFragment) =>
    message.includes(columnFragment),
  );
}

export async function readSupabaseQueryWithFallback<T>({
  loadQuery,
  primarySelect,
  fallbackSelect,
  shouldRetry,
  context,
  retryNotice,
  fallbackFailureNotice,
  primaryFailureNotice,
}: ReadSupabaseQueryWithFallbackOptions<T>): Promise<SupabaseQueryResult<T>> {
  const primaryResult = await loadQuery(primarySelect);

  if (!primaryResult.error) {
    return primaryResult;
  }

  if (!shouldRetry(primaryResult.error)) {
    if (primaryFailureNotice) {
      console.error(primaryFailureNotice, {
        context,
        code: readSupabaseErrorCode(primaryResult.error),
        message: readSupabaseErrorMessage(primaryResult.error),
      });
    }

    return primaryResult;
  }

  console.warn(retryNotice, {
    context,
    code: readSupabaseErrorCode(primaryResult.error),
    message: readSupabaseErrorMessage(primaryResult.error),
  });

  const fallbackResult = await loadQuery(fallbackSelect);

  if (fallbackResult.error) {
    console.error(fallbackFailureNotice, {
      context,
      code: readSupabaseErrorCode(fallbackResult.error),
      message: readSupabaseErrorMessage(fallbackResult.error),
    });
  }

  return fallbackResult;
}
