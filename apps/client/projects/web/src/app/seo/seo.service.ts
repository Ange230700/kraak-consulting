import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '../../environments/environment';
import {
  SeoPageDefinition,
  buildAbsoluteUrl,
  resolvePublicSiteUrl,
  seoDefaults,
} from './site-seo';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  applyPageSeo(page: SeoPageDefinition, siteUrl = environment.siteUrl): void {
    const publicSiteUrl = resolvePublicSiteUrl(siteUrl);
    const canonicalUrl = buildAbsoluteUrl(
      page.canonicalPath ?? page.path,
      publicSiteUrl,
    );
    const openGraphImageUrl = buildAbsoluteUrl(
      page.openGraph.imagePath,
      publicSiteUrl,
    );

    this.title.setTitle(page.title);
    this.meta.updateTag({
      name: 'description',
      content: page.description,
    });
    this.meta.updateTag({
      name: 'robots',
      content: page.robots ?? seoDefaults.robots,
    });
    this.meta.updateTag({
      property: 'og:title',
      content: page.openGraph.title,
    });
    this.meta.updateTag({
      property: 'og:description',
      content: page.openGraph.description,
    });
    this.meta.updateTag({
      property: 'og:type',
      content: 'website',
    });
    this.meta.updateTag({
      property: 'og:url',
      content: canonicalUrl,
    });
    this.meta.updateTag({
      property: 'og:image',
      content: openGraphImageUrl,
    });
    this.meta.updateTag({
      property: 'og:image:alt',
      content: page.openGraph.imageAlt,
    });
    this.meta.updateTag({
      property: 'og:site_name',
      content: seoDefaults.siteName,
    });
    this.meta.updateTag({
      property: 'og:locale',
      content: page.openGraphLocale ?? seoDefaults.locale,
    });
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.meta.updateTag({
      name: 'twitter:title',
      content: page.openGraph.title,
    });
    this.meta.updateTag({
      name: 'twitter:description',
      content: page.openGraph.description,
    });
    this.meta.updateTag({
      name: 'twitter:image',
      content: openGraphImageUrl,
    });

    this.updateCanonicalLink(canonicalUrl);
    this.updateAlternateLinks(page, publicSiteUrl);
    this.updateOpenGraphLocaleAlternates(page);
    this.updateDocumentLanguage(page.htmlLang ?? 'fr-CI');
  }

  private updateCanonicalLink(canonicalUrl: string): void {
    const head = this.document.head;
    let canonicalLink = head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );

    if (!canonicalLink) {
      canonicalLink = this.document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      head.appendChild(canonicalLink);
    }

    canonicalLink.setAttribute('href', canonicalUrl);
  }

  private updateAlternateLinks(
    page: SeoPageDefinition,
    publicSiteUrl: string,
  ): void {
    this.document.head
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((element) => element.remove());

    for (const link of page.hreflangLinks ?? []) {
      const alternateLink = this.document.createElement('link');
      alternateLink.setAttribute('rel', 'alternate');
      alternateLink.setAttribute('hreflang', link.hreflang);
      alternateLink.setAttribute(
        'href',
        buildAbsoluteUrl(link.path, publicSiteUrl),
      );
      this.document.head.appendChild(alternateLink);
    }
  }

  private updateOpenGraphLocaleAlternates(page: SeoPageDefinition): void {
    this.document.head
      .querySelectorAll('meta[property="og:locale:alternate"]')
      .forEach((element) => element.remove());

    const localeAlternates = new Set(
      (page.hreflangLinks ?? [])
        .filter((link) => link.hreflang !== 'x-default')
        .filter((link) => link.hreflang !== page.locale)
        .map((link) => link.hreflang.replace('-', '_')),
    );

    for (const locale of localeAlternates) {
      this.meta.addTag({
        property: 'og:locale:alternate',
        content: locale,
      });
    }
  }

  private updateDocumentLanguage(htmlLang: string): void {
    this.document.documentElement.setAttribute('lang', htmlLang);
  }
}
