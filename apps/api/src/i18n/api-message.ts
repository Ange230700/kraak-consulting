import { SOURCE_LOCALE, type SupportedLocale } from '@kraak/domain';
import FRENCH_API_MESSAGES from './api-messages.fr-CI.json';
import ENGLISH_API_MESSAGES from './api-messages.en-GB.json';

export type ApiMessageKey = keyof typeof FRENCH_API_MESSAGES;

const API_MESSAGES: Record<
  SupportedLocale,
  Readonly<Record<ApiMessageKey, string>>
> = {
  'fr-CI': FRENCH_API_MESSAGES,
  'en-GB': ENGLISH_API_MESSAGES,
};

export interface ApiMessageDescriptor {
  readonly key: ApiMessageKey;
  readonly params?: Readonly<Record<string, string | number>>;
}

export type ApiMessageValue = string | ApiMessageDescriptor;

export function apiMessage(
  key: ApiMessageKey,
  params?: Readonly<Record<string, string | number>>,
): ApiMessageDescriptor {
  return params ? { key, params } : { key };
}

export function isApiMessageDescriptor(
  value: unknown,
): value is ApiMessageDescriptor {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const key = (value as { key?: unknown }).key;

  return typeof key === 'string' && Object.hasOwn(FRENCH_API_MESSAGES, key);
}

export function translateApiMessage(
  locale: SupportedLocale,
  value: ApiMessageValue,
): string {
  if (typeof value === 'string') {
    return value;
  }

  const catalog = API_MESSAGES[locale] ?? API_MESSAGES[SOURCE_LOCALE];
  const template = catalog[value.key];

  return template.replace(
    /\{\{(\w+)\}\}/g,
    (placeholder, parameter: string) => {
      const replacement = value.params?.[parameter];
      return replacement === undefined ? placeholder : String(replacement);
    },
  );
}
