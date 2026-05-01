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
const defaultSiteUrl = 'https://kraak-group.vercel.app';

const trimTrailingSlashes = (value) => {
  let end = value.length;

  while (end > 0 && value.charCodeAt(end - 1) === 47) {
    end -= 1;
  }

  return value.slice(0, end);
};

const normalizeSiteUrl = (siteUrl) =>
  trimTrailingSlashes(siteUrl) || defaultSiteUrl;

const trimSlashes = (value) => {
  let start = 0;
  let end = value.length;

  while (start < end && value.charCodeAt(start) === 47) {
    start += 1;
  }

  while (end > start && value.charCodeAt(end - 1) === 47) {
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
  const siteUrl = normalizeSiteUrl(
    process.env['PUBLIC_SITE_URL'] || defaultSiteUrl,
  );

  await mkdir(publicDir, { recursive: true });
  await writeFile(join(publicDir, 'robots.txt'), buildRobotsTxt(siteUrl), 'utf8');
  await writeFile(
    join(publicDir, 'sitemap.xml'),
    buildSitemapXml(seoPages, siteUrl),
    'utf8',
  );
};

await main();
