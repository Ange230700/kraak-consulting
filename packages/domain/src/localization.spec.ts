import { describe, expect, it } from 'vitest';

import {
  FALLBACK_LOCALE,
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  normalizeLocaleCandidate,
  resolveSupportedLocale,
} from './localization';

describe('localization contract', () => {
  it('Given the locale contract, When supported locales are inspected, Then only fr-CI and en-GB are exposed', () => {
    expect(SUPPORTED_LOCALES).toEqual(['fr-CI', 'en-GB']);
  });

  it('Given the locale contract, When source and fallback are inspected, Then both use fr-CI', () => {
    expect(SOURCE_LOCALE).toBe('fr-CI');
    expect(FALLBACK_LOCALE).toBe('fr-CI');
  });

  it.each([
    ['fr-CI', 'fr-CI'],
    ['en-GB', 'en-GB'],
  ] as const)(
    'Given an exact supported locale %s, When it is normalized, Then %s is returned',
    (candidate, expected) => {
      expect(normalizeLocaleCandidate(candidate)).toBe(expected);
    },
  );

  it.each([
    ['fr-ci', 'fr-CI'],
    ['en-gb', 'en-GB'],
  ] as const)(
    'Given a lower-case locale %s, When it is normalized, Then %s is returned',
    (candidate, expected) => {
      expect(normalizeLocaleCandidate(candidate)).toBe(expected);
    },
  );

  it.each([
    ['fr_CI', 'fr-CI'],
    ['en_GB', 'en-GB'],
  ] as const)(
    'Given an underscore locale %s, When it is normalized, Then %s is returned',
    (candidate, expected) => {
      expect(normalizeLocaleCandidate(candidate)).toBe(expected);
    },
  );

  it.each([
    ['fr', 'fr-CI'],
    ['en', 'en-GB'],
  ] as const)(
    'Given a language-only locale %s, When it is normalized, Then %s is returned',
    (candidate, expected) => {
      expect(normalizeLocaleCandidate(candidate)).toBe(expected);
    },
  );

  it('Given a regional English locale, When it is normalized, Then en-GB is returned', () => {
    expect(normalizeLocaleCandidate('en-US')).toBe('en-GB');
  });

  it('Given an unsupported locale, When fallback is resolved, Then fr-CI is returned', () => {
    expect(resolveSupportedLocale('de-DE')).toBe('fr-CI');
  });

  it('Given an empty locale, When fallback is resolved, Then fr-CI is returned', () => {
    expect(resolveSupportedLocale('')).toBe('fr-CI');
  });

  it('Given an undefined locale, When fallback is resolved, Then fr-CI is returned', () => {
    expect(resolveSupportedLocale(undefined)).toBe('fr-CI');
  });

  it('Given locale candidates, When support is checked, Then only exact supported values are accepted', () => {
    expect(isSupportedLocale('fr-CI')).toBe(true);
    expect(isSupportedLocale('en-GB')).toBe(true);
    expect(isSupportedLocale('fr-ci')).toBe(false);
    expect(isSupportedLocale('en-US')).toBe(false);
  });

  it('Given the supported locale list, When runtime immutability is inspected, Then it is frozen', () => {
    expect(Object.isFrozen(SUPPORTED_LOCALES)).toBe(true);
  });
});
