import type { DashboardAggregateDto } from '@kraak/contracts';

export interface DashboardLoaderOptions {
  readonly getAggregate: () => Promise<DashboardAggregateDto>;
  readonly setLoading: (value: boolean) => void;
  readonly setData: (value: DashboardAggregateDto | null) => void;
  readonly setError: (value: string | null) => void;
  readonly fallbackMessage?: string;
  readonly resolveErrorMessage?: (error: unknown, fallback: string) => string;
}

const DEFAULT_FALLBACK_MESSAGE =
  'Impossible de charger votre dashboard pour le moment.';

function hasBodyProperty(error: unknown): error is { body: unknown } {
  return typeof error === 'object' && error !== null && 'body' in error;
}

function isApiErrorLike(error: unknown): boolean {
  return (
    hasBodyProperty(error) &&
    typeof (error as { status?: unknown }).status === 'number'
  );
}

function readBodyMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const body = (error as { body?: unknown }).body;
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const message = (body as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim() !== '') {
    return message;
  }
  return null;
}

export function resolveDashboardErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_FALLBACK_MESSAGE,
): string {
  const fromBody = readBodyMessage(error);
  if (fromBody) {
    return fromBody;
  }
  if (isApiErrorLike(error)) {
    return fallback;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

export async function loadDashboardAggregate(
  options: DashboardLoaderOptions,
): Promise<void> {
  const {
    getAggregate,
    setLoading,
    setData,
    setError,
    fallbackMessage = DEFAULT_FALLBACK_MESSAGE,
    resolveErrorMessage = resolveDashboardErrorMessage,
  } = options;

  setLoading(true);
  setError(null);

  try {
    const aggregate = await getAggregate();
    setData(aggregate);
  } catch (error) {
    setData(null);
    setError(resolveErrorMessage(error, fallbackMessage));
  } finally {
    setLoading(false);
  }
}
