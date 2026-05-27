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
    const canonicalUrl = buildAbsoluteUrl(page.path, publicSiteUrl);
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
      content: seoDefaults.locale,
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
}
