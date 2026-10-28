import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildLocalizedRouteEntries,
  buildLocalizedSitemapPages,
  buildRobotsTxt,
  buildSitemapXml,
} from './generate-web-seo.mjs';
import { resolveEndpoint } from './resolve-endpoints.mjs';

const repoRoot = process.cwd();
const defaultSiteUrl = resolveEndpoint('production', 'web');
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
const approvedEnglishHomeSeo = JSON.parse(
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
      'site-seo.en-GB.json',
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
const localizedSeoPages = { 'en-GB': approvedEnglishHomeSeo };

function buildHomeApprovedRouteModel() {
  const approvedRouteModel = structuredClone(routeModel);
  const home = approvedRouteModel.pages.find((page) => page.id === 'home');

  home.indexableByLocale = { 'en-GB': true };

  return approvedRouteModel;
}

test('Given the approved English homepage, When localized sitemap pages are built, Then it joins the indexable French routes', () => {
  const pages = buildLocalizedSitemapPages({
    seoPages,
    localizedSeoPages,
    routeModel,
  });
  const paths = pages.map((page) => page.path);

  assert.deepEqual(paths, [
    '/fr/',
    '/en/',
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

test('Given the approved English homepage, When sitemap XML is generated, Then unreviewed English and private routes are excluded', () => {
  const pages = buildLocalizedSitemapPages({
    seoPages,
    localizedSeoPages,
    routeModel,
  });
  const sitemap = buildSitemapXml({
    pages,
    routeModel,
    siteUrl: defaultSiteUrl,
  });

  assert.match(sitemap, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.ok(sitemap.includes(`<loc>${defaultSiteUrl}/fr/services</loc>`));
  assert.ok(sitemap.includes(`<loc>${defaultSiteUrl}/en/</loc>`));
  assert.doesNotMatch(sitemap, /\/en\/services/);
  assert.doesNotMatch(sitemap, /\/connexion/);
  assert.doesNotMatch(sitemap, /\/auth\/reset/);
  assert.doesNotMatch(
    sitemap,
    /<loc>https:\/\/kraak-web-prod\.onrender\.com\/about<\/loc>/,
  );
});

test('Given localized sitemap entries, When alternates are generated, Then only approved pages expose reciprocal en-GB links', () => {
  const pages = buildLocalizedSitemapPages({
    seoPages,
    localizedSeoPages,
    routeModel,
  });
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
  assert.match(
    sitemap,
    /hreflang="en-GB" href="https:\/\/kraak-web-prod\.onrender\.com\/en\/"/,
  );
  assert.doesNotMatch(
    sitemap,
    /hreflang="en-GB" href="https:\/\/kraak-web-prod\.onrender\.com\/en\/services"/,
  );
});

test('Given approved locale metadata for an indexable English homepage, When sitemap pages are built, Then the reviewed English metadata is selected', () => {
  const approvedRouteModel = buildHomeApprovedRouteModel();
  const pages = buildLocalizedSitemapPages({
    seoPages,
    localizedSeoPages: { 'en-GB': approvedEnglishHomeSeo },
    routeModel: approvedRouteModel,
  });
  const englishHome = pages.find((page) => page.path === '/en/');

  assert.equal(englishHome?.title, approvedEnglishHomeSeo[0].title);
});

test('Given an indexable English homepage without reviewed locale metadata, When sitemap pages are built, Then activation is rejected', () => {
  const approvedRouteModel = buildHomeApprovedRouteModel();

  assert.throws(
    () =>
      buildLocalizedSitemapPages({
        seoPages,
        localizedSeoPages: { 'en-GB': [] },
        routeModel: approvedRouteModel,
      }),
    /SEO anglais revu introuvable pour la route \/en\//,
  );
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
  const pages = buildLocalizedSitemapPages({
    seoPages,
    localizedSeoPages,
    routeModel,
  });
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

test('Given des métadonnées manquantes, When une route indexable est générée, Then chaque locale reçoit une erreur explicite', () => {
  const entry = {
    pageId: 'home',
    seoPath: '',
    path: '/',
    canonicalPath: '/',
    includeInSitemap: true,
    indexable: true,
  };
  assert.throws(
    () =>
      buildLocalizedSitemapPages({
        seoPages: [],
        routeModel,
        entries: [{ ...entry, locale: 'fr-CI' }],
      }),
    /SEO introuvable/,
  );
  assert.throws(
    () =>
      buildLocalizedSitemapPages({
        seoPages: [],
        routeModel,
        entries: [{ ...entry, locale: 'de-DE' }],
      }),
    /SEO anglais revu introuvable/,
  );
  const english = buildLocalizedSitemapPages({
    seoPages: [],
    localizedSeoPages: { 'en-GB': [{ path: '' }] },
    routeModel,
    entries: [{ ...entry, locale: 'en-GB' }],
  });
  assert.deepEqual(english[0].alternates, [
    { hreflang: 'en-GB', path: '/' },
    { hreflang: 'x-default', path: '/' },
  ]);
});

test('Given des articles et URL absolues, When le sitemap est construit, Then noindex est exclu et les chemins racine sont normalisés', () => {
  const sitemap = { changeFrequency: 'monthly', priority: 0.5 };
  const xml = buildSitemapXml({
    pages: [
      {
        canonicalPath: '/',
        alternates: [
          { hreflang: '"<&>\'', path: 'https://exemple.test/absolu' },
        ],
        sitemap,
      },
    ],
    blogSitemapPages: [
      { path: '/visible/', sitemap },
      { path: '/cache', robots: 'NoIndex, follow', sitemap },
    ],
    routeModel,
    siteUrl: '///',
  });
  assert.match(xml, /https:\/\/kraak-web-prod.onrender.com\/<\/loc>/);
  assert.match(xml, /https:\/\/exemple.test\/absolu/);
  assert.match(xml, /&quot;&lt;&amp;&gt;&apos;/);
  assert.match(xml, /\/visible<\/loc>/);
  assert.doesNotMatch(xml, /\/cache/);
  assert.match(
    buildRobotsTxt('https://exemple.test///', routeModel),
    /https:\/\/exemple.test\/sitemap.xml/,
  );
});

test('Given la CLI SEO, When une URL publique est définie ou absente, Then les deux assets sont écrits au bon emplacement', () => {
  const url = new URL('generate-web-seo.mjs', import.meta.url).href;
  for (const configured of [true, false]) {
    const code = `import fs from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';import {fileURLToPath} from 'node:url';const outputs=[];fs.mkdir=async()=>{};fs.writeFile=async(file,content)=>{outputs.push([file,content])};syncBuiltinESMExports();${configured ? "process.env.PUBLIC_SITE_URL='https://exemple.test';" : 'delete process.env.PUBLIC_SITE_URL;'}process.argv[1]=fileURLToPath(${JSON.stringify(url)});await import(${JSON.stringify(url)});console.log(JSON.stringify(outputs));`;
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', code],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    const outputs = JSON.parse(result.stdout);
    assert.equal(outputs.length, 2);
    assert.ok(outputs[0][0].endsWith('robots.txt'));
    assert.ok(outputs[1][0].endsWith('sitemap.xml'));
    assert.ok(
      outputs[0][1].includes(
        configured ? 'https://exemple.test' : defaultSiteUrl,
      ),
    );
  }
  assert.equal(
    spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `await import(${JSON.stringify(url)});`,
    ]).status,
    0,
  );
});
