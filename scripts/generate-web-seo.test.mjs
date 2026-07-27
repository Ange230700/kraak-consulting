import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildLocalizedRouteEntries,
  buildLocalizedSitemapPages,
  buildRobotsTxt,
  buildSitemapXml,
} from './generate-web-seo.mjs';

const repoRoot = process.cwd();
const defaultSiteUrl = 'https://kraak-web-prod.onrender.com';
const seoPages = JSON.parse(
  readFileSync(
    join(
      repoRoot,
      'apps',
      'client',
      'projects',
      'web',
      'src',
      'app',
      'seo',
      'site-seo.json',
    ),
    'utf8',
  ),
);
const routeModel = JSON.parse(
  readFileSync(
    join(
      repoRoot,
      'apps',
      'client',
      'projects',
      'web',
      'src',
      'app',
      'routing',
      'localized-public-routes.json',
    ),
    'utf8',
  ),
);

test('Given the PR 3 route model, When localized sitemap pages are built, Then only indexable French public routes are included', () => {
  const pages = buildLocalizedSitemapPages({ seoPages, routeModel });
  const paths = pages.map((page) => page.path);

  assert.deepEqual(paths, [
    '/fr/',
    '/fr/a-propos',
    '/fr/services',
    '/fr/faq',
    '/fr/programmes',
    '/fr/ressources',
    '/fr/contact',
    '/fr/mentions-legales',
    '/fr/politique-de-confidentialite',
  ]);
});

test('Given the PR 3 route model, When sitemap XML is generated, Then English scaffold and private routes are excluded', () => {
  const pages = buildLocalizedSitemapPages({ seoPages, routeModel });
  const sitemap = buildSitemapXml({
    pages,
    routeModel,
    siteUrl: defaultSiteUrl,
  });

  assert.match(sitemap, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.match(
    sitemap,
    /<loc>https:\/\/kraak-web-prod\.onrender\.com\/fr\/services<\/loc>/,
  );
  assert.doesNotMatch(sitemap, /\/en\/services/);
  assert.doesNotMatch(sitemap, /\/connexion/);
  assert.doesNotMatch(sitemap, /\/auth\/reset/);
  assert.doesNotMatch(
    sitemap,
    /<loc>https:\/\/kraak-web-prod\.onrender\.com\/about<\/loc>/,
  );
});

test('Given localized French sitemap entries, When alternates are generated, Then fr-CI and x-default are present without en-GB', () => {
  const pages = buildLocalizedSitemapPages({ seoPages, routeModel });
  const sitemap = buildSitemapXml({
    pages,
    routeModel,
    siteUrl: defaultSiteUrl,
  });

  assert.match(
    sitemap,
    /<xhtml:link rel="alternate" hreflang="fr-CI" href="https:\/\/kraak-web-prod\.onrender\.com\/fr\/services" \/>/,
  );
  assert.match(
    sitemap,
    /<xhtml:link rel="alternate" hreflang="x-default" href="https:\/\/kraak-web-prod\.onrender\.com\/fr\/services" \/>/,
  );
  assert.doesNotMatch(sitemap, /hreflang="en-GB"/);
});

test('Given English indexability is enabled later, When sitemap pages are built, Then English URLs and hreflang pairs are supported by data only', () => {
  const futureRouteModel = structuredClone(routeModel);
  futureRouteModel.locales = futureRouteModel.locales.map((localeDefinition) =>
    localeDefinition.locale === 'en-GB'
      ? { ...localeDefinition, defaultIndexable: true }
      : localeDefinition,
  );
  const pages = buildLocalizedSitemapPages({
    seoPages,
    routeModel: futureRouteModel,
  });
  const sitemap = buildSitemapXml({
    pages,
    routeModel: futureRouteModel,
    siteUrl: defaultSiteUrl,
  });

  assert.match(
    sitemap,
    /<loc>https:\/\/kraak-web-prod\.onrender\.com\/en\/services<\/loc>/,
  );
  assert.match(sitemap, /hreflang="en-GB"/);
});

test('Given XML-sensitive values, When sitemap XML is generated, Then URLs are escaped', () => {
  const sitemap = buildSitemapXml({
    pages: [
      {
        path: '/fr/contact?x=1&y=2',
        canonicalPath: '/fr/contact?x=1&y=2',
        alternates: [],
        sitemap: {
          changeFrequency: 'weekly',
          priority: 0.8,
        },
      },
    ],
    routeModel,
    siteUrl: defaultSiteUrl,
  });

  assert.match(sitemap, /x=1&amp;y=2/);
});

test('Given sitemap generation, When it is run twice, Then output ordering is deterministic', () => {
  const pages = buildLocalizedSitemapPages({ seoPages, routeModel });
  const first = buildSitemapXml({ pages, routeModel, siteUrl: defaultSiteUrl });
  const second = buildSitemapXml({
    pages,
    routeModel,
    siteUrl: defaultSiteUrl,
  });

  assert.equal(first, second);
});

test('Given robots generation, When robots.txt is built, Then it points to one production sitemap URL', () => {
  const robots = buildRobotsTxt(defaultSiteUrl, routeModel);

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(
    robots,
    /Sitemap: https:\/\/kraak-web-prod\.onrender\.com\/sitemap\.xml/,
  );
});

test('Given route entries, When redirects are not requested, Then legacy sources are not part of sitemap candidates', () => {
  const entries = buildLocalizedRouteEntries(routeModel);
  const paths = entries.map((entry) => entry.path);

  assert.ok(!paths.includes('/about'));
  assert.ok(!paths.includes('/programs'));
  assert.ok(!paths.includes('/resources'));
});
