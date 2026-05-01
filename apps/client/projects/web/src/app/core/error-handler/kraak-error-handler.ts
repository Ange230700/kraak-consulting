import { ErrorHandler } from '@angular/core';

const benignResizeObserverMessage =
  'ResizeObserver loop completed with undelivered notifications.';

export class KraakErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    if (isBenignResizeObserverError(error)) {
      return;
    }

    super.handleError(error);
  }
}

function isBenignResizeObserverError(error: unknown): boolean {
  const pending: unknown[] = [error];
  const visited = new Set<unknown>();

  while (pending.length > 0) {
    const current = pending.shift();

    if (current == null) {
      continue;
    }

    if (typeof current === 'string') {
      if (current.includes(benignResizeObserverMessage)) {
        return true;
      }

      continue;
    }

    if (typeof current !== 'object' || visited.has(current)) {
      continue;
    }

    visited.add(current);

    const errorLike = current as Record<string, unknown>;

    pending.push(errorLike['message'], errorLike['cause'], errorLike['error']);
  }

  return false;
}
