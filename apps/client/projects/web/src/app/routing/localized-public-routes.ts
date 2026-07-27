import {
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  resolveSupportedLocale,
} from '@kraak/domain';

import routeModel from './localized-public-routes.json';

export type LocalizedPublicPageId =
  | 'home'
  | 'about'
  | 'services'
  | 'faq'
  | 'programs'
  | 'resources'
  | 'contact'
  | 'legalNotice'
  | 'privacyPolicy'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'serverError';

export type LocalizedPublicComponentKey =
  | 'home'
  | 'about'
  | 'services'
  | 'faq'
  | 'programs'
  | 'resources'
  | 'contact'
  | 'legalNotice'
  | 'privacyPolicy'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'serverError';

export interface LocalizedPublicLocaleDefinition {
  readonly locale: SupportedLocale;
  readonly segment: string;
  readonly htmlLang: SupportedLocale;
  readonly openGraphLocale: string;
  readonly defaultIndexable: boolean;
}

export interface LocalizedPublicPageDefinition {
  readonly id: LocalizedPublicPageId;
  readonly component: LocalizedPublicComponentKey;
  readonly seoPath: string;
  readonly includeInSitemap: boolean;
  readonly indexableByLocale?: Partial<Record<SupportedLocale, boolean>>;
  readonly statusCode?: number;
  readonly paths: Record<SupportedLocale, string>;
  readonly legacyAliases?: readonly string[];
}

export interface LocalizedPublicRouteEntry {
  readonly pageId: LocalizedPublicPageId;
  readonly component: LocalizedPublicComponentKey;
  readonly seoPath: string;
  readonly locale: SupportedLocale;
  readonly localeSegment: string;
  readonly htmlLang: SupportedLocale;
  readonly openGraphLocale: string;
  readonly path: string;
  readonly routePath: string;
  readonly childPath: string;
  readonly canonicalPath: string;
  readonly includeInSitemap: boolean;
  readonly indexable: boolean;
  readonly temporary: boolean;
  readonly statusCode?: number;
}

export interface PublicRedirectRule {
  readonly source: string;
  readonly destination: string;
  readonly renderPermanentRedirect: boolean;
}

interface LocalizedPublicRouteModel {
  readonly locales: readonly LocalizedPublicLocaleDefinition[];
  readonly pages: readonly LocalizedPublicPageDefinition[];
}

const rawRouteModel = routeModel as LocalizedPublicRouteModel;

export const LOCALIZED_PUBLIC_LOCALES = rawRouteModel.locales;
export const LOCALIZED_PUBLIC_PAGES = rawRouteModel.pages;

export const LOCALIZED_PUBLIC_ROUTE_LOCALES = Object.freeze(
  Object.fromEntries(
    LOCALIZED_PUBLIC_LOCALES.map((localeDefinition) => [
      localeDefinition.locale,
      localeDefinition,
    ]),
  ) as Record<SupportedLocale, LocalizedPublicLocaleDefinition>,
);

export const localizedPublicRouteEntries = Object.freeze(
  LOCALIZED_PUBLIC_PAGES.flatMap((page) =>
    SUPPORTED_LOCALES.map((locale) =>
      buildLocalizedPublicRouteEntry(page, locale),
    ),
  ),
);

export const localizedPublicPrerenderPaths = Object.freeze(
  localizedPublicRouteEntries.map((entry) => entry.routePath),
);

export const legacyPublicRedirects = Object.freeze(
  LOCALIZED_PUBLIC_PAGES.flatMap((page) => {
    const destination = page.paths[SOURCE_LOCALE];

    return (page.legacyAliases ?? []).map((source) => ({
      source: normalizeAbsolutePath(source),
      destination,
      renderPermanentRedirect: normalizeAbsolutePath(source) !== '/',
    }));
  }),
);

export const renderPublicRedirects = Object.freeze(
  legacyPublicRedirects.filter((redirect) => redirect.renderPermanentRedirect),
);

export function buildLocalizedPublicRouteEntry(
  page: LocalizedPublicPageDefinition,
  locale: SupportedLocale,
): LocalizedPublicRouteEntry {
  const localeDefinition = LOCALIZED_PUBLIC_ROUTE_LOCALES[locale];
  const path = normalizeAbsolutePath(page.paths[locale]);
  const routePath = toAngularRoutePath(path);
  const childPath = removeLocalePrefix(path, localeDefinition.segment);
  const indexable =
    page.indexableByLocale?.[locale] ?? localeDefinition.defaultIndexable;

  return {
    pageId: page.id,
    component: page.component,
    seoPath: page.seoPath,
    locale,
    localeSegment: localeDefinition.segment,
    htmlLang: localeDefinition.htmlLang,
    openGraphLocale: localeDefinition.openGraphLocale,
    path,
    routePath,
    childPath,
    canonicalPath: path,
    includeInSitemap: page.includeInSitemap,
    indexable,
    temporary: locale !== SOURCE_LOCALE && !indexable,
    ...(page.statusCode ? { statusCode: page.statusCode } : {}),
  };
}

export function findLocalizedPublicRouteEntryByPath(
  path: string,
): LocalizedPublicRouteEntry | undefined {
  const normalizedPath = normalizeAbsolutePath(path);

  return localizedPublicRouteEntries.find(
    (entry) => entry.path === normalizedPath,
  );
}

export function findLegacyPublicRedirectBySourcePath(
  path: string,
): PublicRedirectRule | undefined {
  const normalizedPath = normalizeAbsolutePath(path);

  return legacyPublicRedirects.find(
    (redirect) => redirect.source === normalizedPath,
  );
}

export function findLocalizedPublicRouteEntry(
  pageId: LocalizedPublicPageId,
  localeCandidate: string | null | undefined,
): LocalizedPublicRouteEntry {
  const locale = resolveSupportedLocale(localeCandidate);
  const entry = localizedPublicRouteEntries.find(
    (candidate) => candidate.pageId === pageId && candidate.locale === locale,
  );

  if (!entry) {
    throw new Error(`Missing localized public route for ${pageId}/${locale}.`);
  }

  return entry;
}

export function findLocalizedPublicRouteEntryByLegacyPath(
  path: string,
  localeCandidate: string | null | undefined,
): LocalizedPublicRouteEntry | undefined {
  const normalizedPath = normalizeAbsolutePath(path);
  const page = LOCALIZED_PUBLIC_PAGES.find((candidate) =>
    (candidate.legacyAliases ?? []).some(
      (alias) => normalizeAbsolutePath(alias) === normalizedPath,
    ),
  );

  return page
    ? findLocalizedPublicRouteEntry(page.id, localeCandidate)
    : undefined;
}

export function findLocalizedPublicRouteEntriesByPageId(
  pageId: LocalizedPublicPageId,
): readonly LocalizedPublicRouteEntry[] {
  return localizedPublicRouteEntries.filter((entry) => entry.pageId === pageId);
}

export function resolveLocaleFromPublicPath(
  path: string,
): SupportedLocale | undefined {
  const firstSegment = toAngularRoutePath(path).split('/')[0];
  const localeDefinition = LOCALIZED_PUBLIC_LOCALES.find(
    (candidate) => candidate.segment === firstSegment,
  );

  return localeDefinition?.locale;
}

export function toAngularRoutePath(path: string): string {
  const normalizedPath = normalizeAbsolutePath(path);

  return normalizedPath === '/' ? '' : trimSlashes(normalizedPath);
}

export function normalizeAbsolutePath(path: string): string {
  const trimmedPath = trimSlashes(path);

  if (trimmedPath.length === 0) {
    return '/';
  }

  const normalizedPath = `/${trimmedPath}`;

  return LOCALIZED_PUBLIC_LOCALES.some(
    (localeDefinition) => localeDefinition.segment === trimmedPath,
  )
    ? `${normalizedPath}/`
    : normalizedPath;
}

function removeLocalePrefix(path: string, localeSegment: string): string {
  const routePath = toAngularRoutePath(path);
  const prefix = `${localeSegment}/`;

  if (routePath === localeSegment) {
    return '';
  }

  if (!routePath.startsWith(prefix)) {
    throw new Error(
      `Localized public path "${path}" does not start with /${localeSegment}.`,
    );
  }

  return routePath.slice(prefix.length);
}

function trimSlashes(value: string): string {
  let start = 0;
  let end = value.length;

  while (start < end && value.codePointAt(start) === 47) {
    start++;
  }

  while (end > start && value.codePointAt(end - 1) === 47) {
    end--;
  }

  return value.slice(start, end);
}
