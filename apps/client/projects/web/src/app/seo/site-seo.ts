// apps\client\projects\web\src\app\seo\site-seo.ts

import siteSeoDefinitions from './site-seo.json';
import blogSitemapDefinitions from './blog-sitemap-pages.json';
import { resolveSiteUrl } from '../core/runtime/runtime-config';
import { CLIENT_DEFAULTS } from '../shared/client-defaults';

export type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface SeoPageDefinition {
  path: string;
  title: string;
  description: string;
  robots?: string;
  openGraph: {
    title: string;
    description: string;
    imagePath: string;
    imageAlt: string;
  };
  sitemap: {
    changeFrequency: SitemapChangeFrequency;
    priority: number;
  };
}

const runtimeGlobals = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

export const seoPages = siteSeoDefinitions as SeoPageDefinition[];
const blogSitemapPages = blogSitemapDefinitions as SeoPageDefinition[];

const SLASH_CHAR_CODE = '/'.codePointAt(0);

const trimLeadingSlashes = (str: string): string => {
  let start = 0;
  while (start < str.length && str.codePointAt(start) === SLASH_CHAR_CODE)
    start++;
  return start === 0 ? str : str.slice(start);
};

const trimTrailingSlashes = (str: string): string => {
  let end = str.length;
  while (end > 0 && str.codePointAt(end - 1) === SLASH_CHAR_CODE) end--;
  return end === str.length ? str : str.slice(0, end);
};

const normalizeRoutePath = (path: string): string =>
  trimTrailingSlashes(trimLeadingSlashes(path));

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
  try {
    const absoluteUrl = new URL(path);
    if (absoluteUrl.protocol === 'http:' || absoluteUrl.protocol === 'https:') {
      return absoluteUrl.toString();
    }
  } catch {
    // Keep relative path behavior when URL parsing fails.
  }

  const normalizedPath = normalizeRoutePath(path);
  const pathname = normalizedPath.length > 0 ? `/${normalizedPath}` : '/';

  return new URL(pathname, `${normalizeSiteUrl(siteUrl)}/`).toString();
};

export const findSeoPageByPath = (
  path: string,
): SeoPageDefinition | undefined => {
  const normalizedPath = normalizeRoutePath(path);

  return seoPages.find(
    (page) => normalizeRoutePath(page.path) === normalizedPath,
  );
};

const isIndexablePage = (page: SeoPageDefinition): boolean =>
  !(page.robots ?? '').toLowerCase().includes('noindex');

export const buildSitemapXml = (siteUrl: string): string => {
  const normalizedSiteUrl = resolvePublicSiteUrl(siteUrl);
  const urls = [...seoPages.filter(isIndexablePage), ...blogSitemapPages]
    .map(
      (page) => `  <url>
    <loc>${buildAbsoluteUrl(page.path, normalizedSiteUrl)}</loc>
    <changefreq>${page.sitemap.changeFrequency}</changefreq>
    <priority>${page.sitemap.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
