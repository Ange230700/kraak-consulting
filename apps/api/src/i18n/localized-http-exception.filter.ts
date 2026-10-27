import { type ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { SupportedLocale } from '@kraak/domain';

import { ApiLocaleContext } from './api-locale-context';
import { isApiMessageDescriptor, translateApiMessage } from './api-message';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function localizeValue(value: unknown, locale: SupportedLocale): unknown {
  return isApiMessageDescriptor(value)
    ? translateApiMessage(locale, value)
    : value;
}

export function localizeHttpExceptionResponse(
  response: unknown,
  locale: SupportedLocale,
): unknown {
  if (!isRecord(response)) {
    return response;
  }

  const localized: Record<string, unknown> = { ...response };

  if ('message' in localized) {
    localized['message'] = localizeValue(localized['message'], locale);
  }

  if (Array.isArray(localized['errors'])) {
    localized['errors'] = localized['errors'].map((error) =>
      localizeValue(error, locale),
    );
  }

  return localized;
}

@Catch(HttpException)
export class LocalizedHttpExceptionFilter {
  constructor(
    private readonly localeContext: ApiLocaleContext,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const status = exception.getStatus();
    const rawResponse = exception.getResponse();
    const locale = this.localeContext.locale();

    const body =
      typeof rawResponse === 'string'
        ? {
            statusCode: status,
            message: rawResponse,
          }
        : localizeHttpExceptionResponse(rawResponse, locale);

    this.httpAdapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      body,
      status,
    );
  }
}
