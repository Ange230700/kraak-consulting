import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const seoSourcePath = join(
  repoRoot,
  'apps',
  'client',
  'projects',
  'web',
  'src',
  'app',
  'seo',
  'site-seo.json',
);
const englishSeoSourcePath = join(
  repoRoot,
  'apps',
  'client',
  'projects',
  'web',
  'src',
  'app',
  'seo',
  'site-seo.en-GB.json',
);
const blogSitemapSourcePath = join(
  repoRoot,
  'apps',
  'client',
  'projects',
  'web',
  'src',
  'app',
  'seo',
  'blog-sitemap-pages.json',
);
const routeModelSourcePath = join(
  repoRoot,
  'apps',
  'client',
  'projects',
  'web',
  'src',
  'app',
  'routing',
  'localized-public-routes.json',
);
const publicDir = join(repoRoot, 'apps', 'client', 'projects', 'web', 'public');
const defaultSiteUrl = 'https://kraak-web-prod.onrender.com';
const sourceLocale = 'fr-CI';

const trimTrailingSlashes = (value) => {
  let end = value.length;

  while (end > 0 && value.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return value.slice(0, end);
};

const normalizeSiteUrl = (siteUrl) =>
  trimTrailingSlashes(siteUrl) || defaultSiteUrl;

const trimSlashes = (value) => {
  let start = 0;
  let end = value.length;

  while (start < end && value.codePointAt(start) === 47) {
    start += 1;
  }

  while (end > start && value.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return value.slice(start, end);
};

const normalizeAbsolutePath = (path, routeModel) => {
  const trimmedPath = trimSlashes(path);

  if (trimmedPath.length === 0) {
    return '/';
  }

  const normalizedPath = `/${trimmedPath}`;
  const isLocaleHome = routeModel.locales.some(
    (localeDefinition) => localeDefinition.segment === trimmedPath,
  );

  return isLocaleHome ? `${normalizedPath}/` : normalizedPath;
};

const buildAbsoluteUrl = (path, siteUrl, routeModel) => {
  if (/^https?:\/\//i.test(path)) {
    return new URL(path).toString();
  }

  return new URL(
    normalizeAbsolutePath(path, routeModel),
    `${normalizeSiteUrl(siteUrl)}/`,
  ).toString();
};

const isIndexablePage = (page) =>
  !`${page.robots ?? ''}`.toLowerCase().includes('noindex');

export function buildLocalizedRouteEntries(routeModel) {
  const localesByCode = new Map(
    routeModel.locales.map((localeDefinition) => [
      localeDefinition.locale,
      localeDefinition,
    ]),
  );

  return routeModel.pages.flatMap((page) =>
    routeModel.locales.map((localeDefinition) => {
      const indexable =
        page.indexableByLocale?.[localeDefinition.locale] ??
        localeDefinition.defaultIndexable;
      const path = normalizeAbsolutePath(
        page.paths[localeDefinition.locale],
        routeModel,
      );

      if (!localesByCode.has(localeDefinition.locale)) {
        throw new Error(`Locale non supportee: ${localeDefinition.locale}`);
      }

      return {
        pageId: page.id,
        seoPath: page.seoPath,
        locale: localeDefinition.locale,
        path,
        canonicalPath: path,
        includeInSitemap: page.includeInSitemap,
        indexable,
      };
    }),
  );
}

export function buildLocalizedSitemapPages({
  seoPages,
  localizedSeoPages = {},
  routeModel,
  entries = buildLocalizedRouteEntries(routeModel),
}) {
  const seoByLocaleAndPath = buildSeoByLocaleAndPath(
    seoPages,
    localizedSeoPages,
  );

  return entries
    .filter((entry) => entry.includeInSitemap && entry.indexable)
    .map((entry) => {
      const seo = seoByLocaleAndPath
        .get(entry.locale)
        ?.get(trimSlashes(entry.seoPath));

      if (!seo) {
        if (entry.locale !== sourceLocale) {
          throw new Error(
            `SEO anglais revu introuvable pour la route ${entry.path}.`,
          );
        }

        throw new Error(`SEO introuvable pour la route ${entry.path}.`);
      }

      return {
        ...seo,
        path: entry.path,
        canonicalPath: entry.canonicalPath,
        locale: entry.locale,
        alternates: buildSitemapAlternates(entry, entries),
      };
    });
}

function buildSeoByLocaleAndPath(seoPages, localizedSeoPages) {
  const entries = [
    [sourceLocale, seoPages],
    ...Object.entries(localizedSeoPages),
  ];

  return new Map(
    entries.map(([locale, pages]) => [
      locale,
      new Map(pages.map((page) => [trimSlashes(page.path), page])),
    ]),
  );
}

export function buildSitemapXml({
  pages,
  blogSitemapPages = [],
  routeModel,
  siteUrl,
}) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const sitemapPages = [
    ...pages,
    ...blogSitemapPages.filter(isIndexablePage).map((page) => ({
      ...page,
      canonicalPath: page.path,
      alternates: [],
    })),
  ];
  const urls = sitemapPages
    .map((page) => buildSitemapUrlXml(page, normalizedSiteUrl, routeModel))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

export const buildRobotsTxt = (siteUrl, routeModel) => `User-agent: *
Allow: /

Sitemap: ${buildAbsoluteUrl('sitemap.xml', siteUrl, routeModel)}
`;

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

const main = async () => {
  const seoPages = await readJson(seoSourcePath);
  const englishSeoPages = await readJson(englishSeoSourcePath);
  const blogSitemapPages = await readJson(blogSitemapSourcePath);
  const routeModel = await readJson(routeModelSourcePath);
  const sitemapPages = buildLocalizedSitemapPages({
    seoPages,
    localizedSeoPages: { 'en-GB': englishSeoPages },
    routeModel,
  });
  const siteUrl = normalizeSiteUrl(
    process.env['PUBLIC_SITE_URL'] || defaultSiteUrl,
  );

  await mkdir(publicDir, { recursive: true });
  await writeFile(
    join(publicDir, 'robots.txt'),
    buildRobotsTxt(siteUrl, routeModel),
    'utf8',
  );
  await writeFile(
    join(publicDir, 'sitemap.xml'),
    buildSitemapXml({
      pages: sitemapPages,
      blogSitemapPages,
      routeModel,
      siteUrl,
    }),
    'utf8',
  );
};

function buildSitemapAlternates(entry, entries) {
  const relatedEntries = entries.filter(
    (candidate) =>
      candidate.pageId === entry.pageId &&
      candidate.includeInSitemap &&
      candidate.indexable,
  );
  const sourceEntry =
    entries.find(
      (candidate) =>
        candidate.pageId === entry.pageId && candidate.locale === sourceLocale,
    ) ?? entry;

  return [
    ...relatedEntries.map((candidate) => ({
      hreflang: candidate.locale,
      path: candidate.canonicalPath,
    })),
    {
      hreflang: 'x-default',
      path: sourceEntry.canonicalPath,
    },
  ];
}

function buildSitemapUrlXml(page, normalizedSiteUrl, routeModel) {
  const alternates = page.alternates
    .map(
      (alternate) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(
          buildAbsoluteUrl(alternate.path, normalizedSiteUrl, routeModel),
        )}" />`,
    )
    .join('\n');
  const alternateBlock = alternates.length > 0 ? `\n${alternates}` : '';

  return `  <url>
    <loc>${escapeXml(
      buildAbsoluteUrl(page.canonicalPath, normalizedSiteUrl, routeModel),
    )}</loc>${alternateBlock}
    <changefreq>${page.sitemap.changeFrequency}</changefreq>
    <priority>${Number(page.sitemap.priority).toFixed(1)}</priority>
  </url>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

if (resolve(process.argv[1] ?? '') === __filename) {
  await main();
}
