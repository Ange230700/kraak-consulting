import { SOURCE_LOCALE, type SupportedLocale } from '@kraak/domain';

import blogSitemapDefinitions from './blog-sitemap-pages.json';
import englishSiteSeoDefinitions from './site-seo.en-GB.json';
import siteSeoDefinitions from './site-seo.json';
import { resolveSiteUrl } from '../core/runtime/runtime-config';
import {
  LOCALIZED_PUBLIC_ROUTE_LOCALES,
  findLocalizedPublicRouteEntriesByPageId,
  findLocalizedPublicRouteEntryByPath,
  localizedPublicRouteEntries,
  normalizeAbsolutePath,
  type LocalizedPublicPageId,
  type LocalizedPublicRouteEntry,
} from '../routing/localized-public-routes';
import { CLIENT_DEFAULTS } from '../shared/client-defaults';

export type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface HreflangLinkDefinition {
  readonly hreflang: SupportedLocale | 'x-default';
  readonly path: string;
}

export interface SeoPageDefinition {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly robots?: string;
  readonly locale?: SupportedLocale;
  readonly htmlLang?: SupportedLocale;
  readonly openGraphLocale?: string;
  readonly canonicalPath?: string;
  readonly pageId?: LocalizedPublicPageId;
  readonly temporary?: boolean;
  readonly hreflangLinks?: readonly HreflangLinkDefinition[];
  readonly openGraph: {
    readonly title: string;
    readonly description: string;
    readonly imagePath: string;
    readonly imageAlt: string;
  };
  readonly sitemap: {
    readonly changeFrequency: SitemapChangeFrequency;
    readonly priority: number;
  };
}

interface SitemapBuildOptions {
  readonly pages?: readonly SeoPageDefinition[];
  readonly blogPages?: readonly SeoPageDefinition[];
}

const NOINDEX_ROBOTS_DIRECTIVE = 'noindex, nofollow';
const DEFAULT_CHANGE_FREQUENCY: SitemapChangeFrequency = 'never';
const DEFAULT_PRIORITY = 0.1;
const DEFAULT_SHARE_IMAGE =
  '/assets/site-visuals/photos/home-hero-workshop.jpg';
const DEFAULT_SHARE_IMAGE_ALT =
  "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.";

const runtimeGlobals = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

export const seoPages = siteSeoDefinitions as readonly SeoPageDefinition[];
const reviewedSeoPagesByLocale: Partial<
  Record<SupportedLocale, readonly SeoPageDefinition[]>
> = {
  'en-GB': englishSiteSeoDefinitions as readonly SeoPageDefinition[],
};
const blogSitemapPages = blogSitemapDefinitions as readonly SeoPageDefinition[];

const statusSeoPages = Object.freeze([
  buildStatusSeoPage({
    path: '401',
    title: 'Authentification requise | KRAAK Consulting',
    description:
      'Cette ressource nécessite une authentification. Connectez-vous pour poursuivre votre parcours KRAAK.',
  }),
  buildStatusSeoPage({
    path: '403',
    title: 'Accès refusé | KRAAK Consulting',
    description:
      'Cette ressource est protégée. Contactez KRAAK si vous pensez disposer des droits nécessaires.',
  }),
  buildStatusSeoPage({
    path: '404',
    title: 'Page introuvable | KRAAK Consulting',
    description:
      "La page demandée est introuvable. Retrouvez la FAQ, l'accueil ou le formulaire de contact KRAAK.",
  }),
  buildStatusSeoPage({
    path: '500',
    title: 'Incident technique | KRAAK Consulting',
    description:
      'Une erreur technique est survenue. Réessayez dans un instant ou contactez KRAAK.',
  }),
] as const);

export const localizedSeoPages = Object.freeze(
  localizedPublicRouteEntries.map((entry) => buildLocalizedSeoPage(entry)),
);

const SLASH_CHAR_CODE = '/'.codePointAt(0);

function trimLeadingSlashes(str: string): string {
  let start = 0;
  while (start < str.length && str.codePointAt(start) === SLASH_CHAR_CODE)
    start++;
  return start === 0 ? str : str.slice(start);
}

function trimTrailingSlashes(str: string): string {
  let end = str.length;
  while (end > 0 && str.codePointAt(end - 1) === SLASH_CHAR_CODE) end--;
  return end === str.length ? str : str.slice(0, end);
}

export function normalizeRoutePath(path: string): string {
  return trimTrailingSlashes(trimLeadingSlashes(path));
}

export const normalizeSiteUrl = (siteUrl: string): string =>
  trimTrailingSlashes(siteUrl) || CLIENT_DEFAULTS.siteUrl;

export const resolvePublicSiteUrl = (siteUrl?: string): string => {
  const runtimeSiteUrl = runtimeGlobals.process?.env?.['PUBLIC_SITE_URL'] ?? '';
  const runtimeConfigSiteUrl = resolveSiteUrl('');

  return normalizeSiteUrl(
    runtimeSiteUrl ||
      runtimeConfigSiteUrl ||
      siteUrl ||
      CLIENT_DEFAULTS.siteUrl,
  );
};

export const buildAbsoluteUrl = (path: string, siteUrl: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return new URL(path).toString();
  }

  return new URL(
    normalizeAbsolutePath(path),
    `${normalizeSiteUrl(siteUrl)}/`,
  ).toString();
};

export const findSeoPageByPath = (
  path: string,
): SeoPageDefinition | undefined => {
  const localizedPage = findLocalizedSeoPageByPath(path);

  if (localizedPage) {
    return localizedPage;
  }

  return findRawSeoPageByPath(path);
};

export const findLocalizedSeoPageByPath = (
  path: string,
): SeoPageDefinition | undefined => {
  const normalizedPath = normalizeAbsolutePath(path);

  return localizedSeoPages.find(
    (page) => normalizeAbsolutePath(page.path) === normalizedPath,
  );
};

export const isIndexableSeoPage = (page: SeoPageDefinition): boolean =>
  !(page.robots ?? '').toLowerCase().includes('noindex');

export const buildSitemapXml = (
  siteUrl: string,
  options: SitemapBuildOptions = {},
): string => {
  const normalizedSiteUrl = resolvePublicSiteUrl(siteUrl);
  const urls = [
    ...(options.pages ?? localizedSeoPages).filter(shouldIncludeInSitemap),
    ...(options.blogPages ?? blogSitemapPages).filter(isIndexableSeoPage),
  ]
    .map((page) => buildSitemapUrlXml(page, normalizedSiteUrl))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
};

export const buildRobotsTxt = (siteUrl: string): string =>
  `User-agent: *
Allow: /

Sitemap: ${buildAbsoluteUrl('sitemap.xml', resolvePublicSiteUrl(siteUrl))}
`;

export const seoDefaults = {
  locale: CLIENT_DEFAULTS.locale,
  robots: CLIENT_DEFAULTS.robots,
  siteName: CLIENT_DEFAULTS.siteName,
};

function buildLocalizedSeoPage(
  entry: LocalizedPublicRouteEntry,
): SeoPageDefinition {
  const sourceSeo = findRawSeoPageByPath(entry.seoPath);

  if (!sourceSeo) {
    throw new Error(`Missing SEO metadata for public page "${entry.seoPath}".`);
  }

  if (entry.temporary) {
    return {
      ...buildTemporaryEnglishSeo(sourceSeo),
      path: entry.path,
      robots: NOINDEX_ROBOTS_DIRECTIVE,
      locale: entry.locale,
      htmlLang: entry.htmlLang,
      openGraphLocale: entry.openGraphLocale,
      canonicalPath: entry.canonicalPath,
      pageId: entry.pageId,
      temporary: true,
      hreflangLinks: buildHreflangLinks(entry),
      sitemap: sourceSeo.sitemap,
    };
  }

  const reviewedSeo = findReviewedSeoPage(entry, sourceSeo);

  return {
    ...reviewedSeo,
    path: entry.path,
    robots: entry.indexable
      ? reviewedSeo.robots
      : (reviewedSeo.robots ?? NOINDEX_ROBOTS_DIRECTIVE),
    locale: entry.locale,
    htmlLang: entry.htmlLang,
    openGraphLocale: entry.openGraphLocale,
    canonicalPath: entry.canonicalPath,
    pageId: entry.pageId,
    temporary: false,
    hreflangLinks: buildHreflangLinks(entry),
  };
}

function findReviewedSeoPage(
  entry: LocalizedPublicRouteEntry,
  sourceSeo: SeoPageDefinition,
): SeoPageDefinition {
  if (entry.locale === SOURCE_LOCALE) {
    return sourceSeo;
  }

  const localizedSeo = reviewedSeoPagesByLocale[entry.locale]?.find(
    (page) =>
      normalizeRoutePath(page.path) === normalizeRoutePath(entry.seoPath),
  );

  if (!localizedSeo) {
    throw new Error(
      `Métadonnées SEO révisées introuvables pour la route publique "${entry.path}".`,
    );
  }

  return localizedSeo;
}

function findRawSeoPageByPath(path: string): SeoPageDefinition | undefined {
  const normalizedPath = normalizeRoutePath(path);

  return [...seoPages, ...statusSeoPages].find(
    (page) => normalizeRoutePath(page.path) === normalizedPath,
  );
}

function buildStatusSeoPage({
  path,
  title,
  description,
}: {
  readonly path: string;
  readonly title: string;
  readonly description: string;
}): SeoPageDefinition {
  return {
    path,
    title,
    description,
    robots: NOINDEX_ROBOTS_DIRECTIVE,
    openGraph: {
      title,
      description,
      imagePath: DEFAULT_SHARE_IMAGE,
      imageAlt: DEFAULT_SHARE_IMAGE_ALT,
    },
    sitemap: {
      changeFrequency: DEFAULT_CHANGE_FREQUENCY,
      priority: DEFAULT_PRIORITY,
    },
  };
}

function buildTemporaryEnglishSeo(
  sourceSeo: SeoPageDefinition,
): SeoPageDefinition {
  const temporaryTitle = 'KRAAK Consulting | English route scaffold';
  const temporaryDescription =
    'Temporary non-indexable English SEO scaffold pending reviewed PR 4 content.';

  return {
    ...sourceSeo,
    title: temporaryTitle,
    description: temporaryDescription,
    openGraph: {
      ...sourceSeo.openGraph,
      title: temporaryTitle,
      description: temporaryDescription,
      imageAlt: 'Temporary non-indexable KRAAK English route scaffold.',
    },
  };
}

function buildHreflangLinks(
  entry: LocalizedPublicRouteEntry,
): readonly HreflangLinkDefinition[] {
  const relatedEntries = findLocalizedPublicRouteEntriesByPageId(entry.pageId);
  const indexableLinks = relatedEntries
    .filter((candidate) => candidate.indexable)
    .map((candidate) => ({
      hreflang: candidate.locale,
      path: candidate.canonicalPath,
    }));
  const sourceEntry =
    relatedEntries.find((candidate) => candidate.locale === SOURCE_LOCALE) ??
    entry;

  return [
    ...indexableLinks,
    {
      hreflang: 'x-default',
      path: sourceEntry.canonicalPath,
    },
  ];
}

function shouldIncludeInSitemap(page: SeoPageDefinition): boolean {
  const entry = findLocalizedPublicRouteEntryByPath(page.path);

  return Boolean(
    entry?.includeInSitemap && isIndexableSeoPage(page) && page.locale,
  );
}

function buildSitemapUrlXml(
  page: SeoPageDefinition,
  normalizedSiteUrl: string,
): string {
  const alternates = (page.hreflangLinks ?? [])
    .filter((link) => {
      if (link.hreflang === 'x-default') {
        return true;
      }

      const localeDefinition = LOCALIZED_PUBLIC_ROUTE_LOCALES[link.hreflang];

      return Boolean(localeDefinition);
    })
    .map(
      (link) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(link.hreflang)}" href="${escapeXml(
          buildAbsoluteUrl(link.path, normalizedSiteUrl),
        )}" />`,
    )
    .join('\n');
  const alternateBlock = alternates.length > 0 ? `\n${alternates}` : '';

  return `  <url>
    <loc>${escapeXml(
      buildAbsoluteUrl(page.canonicalPath ?? page.path, normalizedSiteUrl),
    )}</loc>${alternateBlock}
    <changefreq>${page.sitemap.changeFrequency}</changefreq>
    <priority>${page.sitemap.priority.toFixed(1)}</priority>
  </url>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
