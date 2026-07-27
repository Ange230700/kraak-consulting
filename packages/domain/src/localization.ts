export const SUPPORTED_LOCALES = Object.freeze(['fr-CI', 'en-GB'] as const);

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const SOURCE_LOCALE: SupportedLocale = 'fr-CI';
export const FALLBACK_LOCALE: SupportedLocale = SOURCE_LOCALE;

const LANGUAGE_LOCALE_MAP = {
  fr: 'fr-CI',
  en: 'en-GB',
} as const satisfies Record<string, SupportedLocale>;

type SupportedLanguage = keyof typeof LANGUAGE_LOCALE_MAP;

function isSupportedLanguage(
  candidate: string,
): candidate is SupportedLanguage {
  return Object.hasOwn(LANGUAGE_LOCALE_MAP, candidate);
}

function normalizeLocaleSeparators(candidate: string): string {
  return candidate.trim().replace(/_/g, '-');
}

function readLanguage(candidate: string): string | undefined {
  return normalizeLocaleSeparators(candidate).split('-')[0]?.toLowerCase();
}

export function isSupportedLocale(
  candidate: string,
): candidate is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(candidate);
}

export function normalizeLocaleCandidate(
  candidate: string | null | undefined,
): SupportedLocale | undefined {
  const trimmedCandidate = candidate?.trim();

  if (!trimmedCandidate) return undefined;

  const language = readLanguage(trimmedCandidate);

  if (!language) return undefined;

  return isSupportedLanguage(language)
    ? LANGUAGE_LOCALE_MAP[language]
    : undefined;
}

export function resolveSupportedLocale(
  candidate: string | null | undefined,
): SupportedLocale {
  return normalizeLocaleCandidate(candidate) ?? FALLBACK_LOCALE;
}
