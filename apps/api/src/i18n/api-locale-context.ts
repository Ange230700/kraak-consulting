import { Injectable, type NestMiddleware } from '@nestjs/common';
import {
  SOURCE_LOCALE,
  normalizeLocaleCandidate,
  type SupportedLocale,
} from '@kraak/domain';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { IncomingHttpHeaders } from 'node:http';

type AcceptLanguageHeader = string | readonly string[] | undefined;

interface LanguagePreference {
  readonly candidate: string;
  readonly quality: number;
  readonly order: number;
}

export function resolveRequestLocale(
  header: AcceptLanguageHeader,
): SupportedLocale {
  const headerValues =
    header === undefined
      ? []
      : typeof header === 'string'
        ? [header]
        : [...header];

  const preferences = headerValues
    .flatMap((value) => value.split(','))
    .map(parseLanguagePreference)
    .filter(
      (preference): preference is LanguagePreference =>
        preference !== undefined,
    )
    .sort(
      (left, right) => right.quality - left.quality || left.order - right.order,
    );

  for (const preference of preferences) {
    const locale = normalizeLocaleCandidate(preference.candidate);

    if (locale) {
      return locale;
    }
  }

  return SOURCE_LOCALE;
}

function parseLanguagePreference(
  rawPreference: string,
  order: number,
): LanguagePreference | undefined {
  const [rawCandidate, ...rawParameters] = rawPreference.split(';');
  const candidate = rawCandidate.trim();

  if (!candidate || candidate === '*') {
    return undefined;
  }

  let quality = 1;

  for (const rawParameter of rawParameters) {
    const parameter = rawParameter.trim();

    if (!/^q\s*=/i.test(parameter)) {
      continue;
    }

    const match = /^q\s*=\s*(\d+(?:\.\d+)?)$/i.exec(parameter);

    if (!match) {
      return undefined;
    }

    quality = Number(match[1]);

    if (!Number.isFinite(quality) || quality > 1) {
      return undefined;
    }
  }

  if (quality === 0) {
    return undefined;
  }

  return {
    candidate,
    quality,
    order,
  };
}

@Injectable()
export class ApiLocaleContext {
  private readonly storage = new AsyncLocalStorage<SupportedLocale>();

  locale(): SupportedLocale {
    return this.storage.getStore() ?? SOURCE_LOCALE;
  }

  run<T>(locale: SupportedLocale, callback: () => T): T {
    return this.storage.run(locale, callback);
  }
}

@Injectable()
export class ApiLocaleMiddleware implements NestMiddleware {
  constructor(private readonly localeContext: ApiLocaleContext) {}

  use(
    request: { headers: IncomingHttpHeaders },
    _response: unknown,
    next: () => void,
  ): void {
    const locale = resolveRequestLocale(request.headers['accept-language']);

    this.localeContext.run(locale, next);
  }
}
