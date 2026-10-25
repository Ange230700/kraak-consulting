import { SOURCE_LOCALE, SUPPORTED_LOCALES } from '@kraak/domain';

import {
  LOCALIZED_PUBLIC_LOCALES,
  LOCALIZED_PUBLIC_PAGES,
  buildLegacyPublicRedirects,
  buildLocalizedPublicRouteEntry,
  buildLocalizedBlogArticlePath,
  buildLocalizedPublicLocalePath,
  findLocalizedPublicRouteEntry,
  findLocalizedPublicRouteEntryByPath,
  findLocalizedPublicRouteEntryByLegacyPath,
  legacyPublicRedirects,
  localizedPublicPrerenderPaths,
  localizedPublicRouteEntries,
  normalizeAbsolutePath,
  renderPublicRedirects,
  resolveLocaleFromPublicPath,
} from './localized-public-routes';

const PRIVATE_ROUTE_PREFIXES = [
  '/auth/reset',
  '/auth/callback',
  '/connexion',
  '/inscription',
  '/mot-de-passe-oublie',
  '/participant',
  '/admin',
];

describe('Given the localized public route model', () => {
  it('Given une page sans ancien alias, When une ancienne destination est recherchée, Then aucune correspondance artificielle n’est créée', () => {
    expect(
      findLocalizedPublicRouteEntryByLegacyPath('/absent', 'fr-CI', [
        { ...LOCALIZED_PUBLIC_PAGES[0], legacyAliases: undefined },
      ]),
    ).toBeUndefined();
  });
  it('Given une page sans ancien alias, When les redirections sont construites, Then aucune redirection artificielle n’est ajoutée', () => {
    expect(
      buildLegacyPublicRedirects([
        { ...LOCALIZED_PUBLIC_PAGES[0], legacyAliases: undefined },
      ]),
    ).toEqual([]);
  });

  it('Given un slug vide ou imbriqué, When une URL d’article est demandée, Then le chemin invalide est refusé', () => {
    expect(() => buildLocalizedBlogArticlePath('///')).toThrow(
      'Invalid Blog article slug',
    );
    expect(() => buildLocalizedBlogArticlePath('article/sous-page')).toThrow(
      'Invalid Blog article slug',
    );
    expect(
      buildLocalizedPublicLocalePath('/fr/blog/article/sous-page', 'en-GB'),
    ).toBe('/en/');
  });

  it('Given une page dont le préfixe ne correspond pas à sa locale, When son entrée est construite, Then la configuration invalide est signalée', () => {
    const page = LOCALIZED_PUBLIC_PAGES[0];
    expect(() =>
      buildLocalizedPublicRouteEntry(
        { ...page, paths: { ...page.paths, 'fr-CI': '/incorrect/contact' } },
        'fr-CI',
      ),
    ).toThrow('does not start with /fr');
  });

  it('Given un identifiant de page inconnu, When sa route est exigée, Then une erreur explicite identifie la locale', () => {
    expect(() =>
      findLocalizedPublicRouteEntry('inconnue' as never, 'fr-CI'),
    ).toThrow('Missing localized public route for inconnue/fr-CI');
  });
  it('Given public page identifiers, when routes are flattened, then every page has one French route and one English route', () => {
    for (const page of LOCALIZED_PUBLIC_PAGES) {
      const pageEntries = localizedPublicRouteEntries.filter(
        (entry) => entry.pageId === page.id,
      );

      expect(pageEntries.map((entry) => entry.locale).sort()).toEqual([
        'en-GB',
        'fr-CI',
      ]);
    }
  });

  it('Given supported locales, when locale metadata is read, then it matches the i18n contract', () => {
    expect(LOCALIZED_PUBLIC_LOCALES.map((entry) => entry.locale)).toEqual([
      ...SUPPORTED_LOCALES,
    ]);
    expect(findLocalizedPublicRouteEntry('home', SOURCE_LOCALE).path).toBe(
      '/fr/',
    );
    expect(findLocalizedPublicRouteEntry('home', 'en').path).toBe('/en/');
  });

  it('Given human approval for the English homepage, When route policy is resolved, Then only that English conversion entry is indexable', () => {
    expect(findLocalizedPublicRouteEntry('home', 'en-GB').indexable).toBe(true);
    expect(findLocalizedPublicRouteEntry('contact', 'en-GB').indexable).toBe(
      false,
    );
    expect(findLocalizedPublicRouteEntry('services', 'en-GB').indexable).toBe(
      false,
    );
    expect(findLocalizedPublicRouteEntry('programs', 'en-GB').indexable).toBe(
      false,
    );
    expect(findLocalizedPublicRouteEntry('about', 'en-GB').indexable).toBe(
      false,
    );
  });

  it('Given localized paths, when the model is checked, then every public path is unique', () => {
    const paths = localizedPublicRouteEntries.map((entry) => entry.path);

    expect(new Set(paths).size).toBe(paths.length);
  });

  it('Given legacy aliases, when redirects are generated, then every source is unique and avoids loops', () => {
    const sources = legacyPublicRedirects.map((redirect) => redirect.source);

    expect(new Set(sources).size).toBe(sources.length);

    for (const redirect of legacyPublicRedirects) {
      expect(redirect.source).not.toBe(redirect.destination);
      expect(
        legacyPublicRedirects.some(
          (candidate) =>
            candidate.source === redirect.destination &&
            candidate.destination === redirect.source,
        ),
      ).toBe(false);
    }
  });

  it('Given Render-supported redirects, when rules are generated, then the root redirect is excluded from Render routes', () => {
    expect(
      legacyPublicRedirects.find((redirect) => redirect.source === '/'),
    ).toEqual({
      source: '/',
      destination: '/fr/',
      renderPermanentRedirect: false,
    });
    expect(
      renderPublicRedirects.map((redirect) => redirect.source),
    ).not.toContain('/');
  });

  it('Given private and auth callback paths, when localized entries and redirects are inspected, then they are excluded', () => {
    const routeSurface = [
      ...localizedPublicRouteEntries.map((entry) => entry.path),
      ...legacyPublicRedirects.map((redirect) => redirect.source),
    ];

    for (const privateRoutePrefix of PRIVATE_ROUTE_PREFIXES) {
      expect(routeSurface).not.toContain(privateRoutePrefix);
      expect(routeSurface).not.toContain(`/fr${privateRoutePrefix}`);
      expect(routeSurface).not.toContain(`/en${privateRoutePrefix}`);
    }
  });

  it('Given canonical public paths, when they are normalized, then root and trailing slash behavior are deterministic', () => {
    expect(normalizeAbsolutePath('')).toBe('/');
    expect(normalizeAbsolutePath('/fr/services/')).toBe('/fr/services');
    expect(normalizeAbsolutePath('en/about')).toBe('/en/about');
  });

  it('Given a public URL, when locale is derived, then only supported prefixes are accepted', () => {
    expect(resolveLocaleFromPublicPath('/fr/services')).toBe('fr-CI');
    expect(resolveLocaleFromPublicPath('/en/services')).toBe('en-GB');
    expect(resolveLocaleFromPublicPath('/de/services')).toBeUndefined();
    expect(resolveLocaleFromPublicPath('/connexion')).toBeUndefined();
  });

  it('Given route lookup by path, when a localized URL is used, then the matching route entry is returned', () => {
    expect(findLocalizedPublicRouteEntryByPath('/fr/a-propos')?.pageId).toBe(
      'about',
    );
    expect(findLocalizedPublicRouteEntryByPath('/en/about')?.pageId).toBe(
      'about',
    );
  });

  it('Given a legacy path and an active public locale, when a localized entry is requested, then navigation preserves the active locale', () => {
    expect(
      findLocalizedPublicRouteEntryByLegacyPath('/contact', 'fr-CI')?.path,
    ).toBe('/fr/contact');
    expect(
      findLocalizedPublicRouteEntryByLegacyPath('/contact', 'en-GB')?.path,
    ).toBe('/en/contact');
  });

  describe('Given a requested public locale switch', () => {
    it('Given a localized page with query and fragment, When English is requested, Then the equivalent English page preserves both suffixes', () => {
      expect(
        buildLocalizedPublicLocalePath(
          '/fr/programmes?campaign=summer#offres',
          'en-GB',
        ),
      ).toBe('/en/programs?campaign=summer#offres');
    });

    it('Given an English page with a translated slug, When French is requested, Then the equivalent French slug is returned', () => {
      expect(buildLocalizedPublicLocalePath('/en/about', 'fr-CI')).toBe(
        '/fr/a-propos',
      );
    });

    it.each([
      ['/fr/inconnu?stale=1#old', 'en-GB', '/en/'],
      ['/participant/dashboard?stale=1#old', 'fr-CI', '/fr/'],
    ] as const)(
      'Given an unmapped path %s, When %s is requested, Then the target homepage is returned without stale suffixes',
      (currentUrl, targetLocale, expectedPath) => {
        expect(buildLocalizedPublicLocalePath(currentUrl, targetLocale)).toBe(
          expectedPath,
        );
      },
    );

    it.each([
      ['/fr/', 'en-GB', '/en/'],
      ['/en/', 'fr-CI', '/fr/'],
    ] as const)(
      'Given a localized homepage %s, When %s is requested, Then the target homepage keeps its trailing slash',
      (currentUrl, targetLocale, expectedPath) => {
        expect(buildLocalizedPublicLocalePath(currentUrl, targetLocale)).toBe(
          expectedPath,
        );
      },
    );
  });

  it('Given a localized Blog article with query and fragment, when another locale is requested, then the same article slug and suffix are preserved', () => {
    expect(
      buildLocalizedPublicLocalePath(
        '/fr/blog/article-exemple?campaign=summer#details',
        'en-GB',
      ),
    ).toBe('/en/blog/article-exemple?campaign=summer#details');

    expect(
      buildLocalizedPublicLocalePath('/en/blog/article-exemple', 'fr-CI'),
    ).toBe('/fr/blog/article-exemple');

    expect(buildLocalizedBlogArticlePath('article-exemple', 'en-GB')).toBe(
      '/en/blog/article-exemple',
    );
  });

  it('Given prerender paths, when the route set is generated, then every localized public path is present once', () => {
    expect(localizedPublicPrerenderPaths).toHaveLength(
      localizedPublicRouteEntries.length,
    );
    expect(new Set(localizedPublicPrerenderPaths).size).toBe(
      localizedPublicPrerenderPaths.length,
    );
    expect(localizedPublicPrerenderPaths).toContain('fr/services');
    expect(localizedPublicPrerenderPaths).toContain('en/services');
  });
});
