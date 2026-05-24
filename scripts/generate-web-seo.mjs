// scripts\generate-web-seo.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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
const publicDir = join(repoRoot, 'apps', 'client', 'projects', 'web', 'public');
const defaultSiteUrl = 'https://kraak-consulting.vercel.app';

function extractBlogSitemapPages(seoConfig) {
  const candidateCollections = [
    seoConfig?.blog?.articles,
    seoConfig?.blogArticles,
    seoConfig?.pages,
    seoConfig?.routes,
  ];

  for (const collection of candidateCollections) {
    if (!Array.isArray(collection)) {
      continue;
    }

    const blogPages = collection
      .map((entry) => {
        if (typeof entry === 'string') {
          return {
            path: entry.replace(/^\/+|\/+$/gu, ''),
            sitemap: {
              changeFrequency: 'monthly',
              priority: 0.5,
            },
          };
        }

        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const normalizedPath =
          typeof entry.path === 'string'
            ? entry.path.replace(/^\/+|\/+$/gu, '')
            : null;

        if (!normalizedPath) {
          return null;
        }

        return {
          ...entry,
          path: normalizedPath,
          sitemap: {
            changeFrequency: 'monthly',
            priority: 0.5,
            ...(entry.sitemap ?? {}),
          },
        };
      })
      .filter((entry) => entry && entry.path.startsWith('blog/'));

    if (blogPages.length > 0) {
      return blogPages;
    }
  }

  throw new Error(
    `Unable to derive blog sitemap pages from ${seoSourcePath}. ` +
      'Add blog entries to site-seo.json so it remains the single source of truth.',
  );
}

const seoSource = JSON.parse(await readFile(seoSourcePath, 'utf8'));
const blogSitemapPages = extractBlogSitemapPages(seoSource);

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

const buildAbsoluteUrl = (path, siteUrl) => {
  const normalizedPath = trimSlashes(path);
  const pathname = normalizedPath.length > 0 ? `/${normalizedPath}` : '/';

  return new URL(pathname, `${normalizeSiteUrl(siteUrl)}/`).toString();
};

const buildSitemapXml = (pages, siteUrl) => {
  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${buildAbsoluteUrl(page.path, siteUrl)}</loc>
    <changefreq>${page.sitemap.changeFrequency}</changefreq>
    <priority>${Number(page.sitemap.priority).toFixed(1)}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
};

const buildRobotsTxt = (siteUrl) => `User-agent: *
Allow: /

Sitemap: ${buildAbsoluteUrl('sitemap.xml', siteUrl)}
`;

const main = async () => {
  const rawSeoConfig = await readFile(seoSourcePath, 'utf8');
  const seoPages = JSON.parse(rawSeoConfig);
  const sitemapPages = [...seoPages, ...blogSitemapPages];
  const siteUrl = normalizeSiteUrl(
    process.env['PUBLIC_SITE_URL'] || defaultSiteUrl,
  );

  await mkdir(publicDir, { recursive: true });
  await writeFile(join(publicDir, 'robots.txt'), buildRobotsTxt(siteUrl), 'utf8');
  await writeFile(
    join(publicDir, 'sitemap.xml'),
    buildSitemapXml(sitemapPages, siteUrl),
    'utf8',
  );
};

await main();
