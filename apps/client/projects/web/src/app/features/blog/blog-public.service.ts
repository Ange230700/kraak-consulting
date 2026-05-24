import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { ArticleDto } from '@kraak/contracts';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { resolveApiBaseUrl } from '../../core/runtime/runtime-config';
import {
  BlogArticle,
  getFallbackBlogArticles,
  mapPublicArticleToBlogArticle,
  mapPublicArticlesToBlogArticles,
} from './blog.data';

@Injectable({ providedIn: 'root' })
export class BlogPublicService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${resolveApiBaseUrl(environment.apiBaseUrl)}/articles`;
  private readonly slashCodePoint = '/'.codePointAt(0);

  private normalizeSlug(slug: string): string {
    const trimmedSlug = slug.trim();
    let start = 0;
    let end = trimmedSlug.length;

    while (
      start < end &&
      trimmedSlug.codePointAt(start) === this.slashCodePoint
    ) {
      start += 1;
    }

    while (
      end > start &&
      trimmedSlug.codePointAt(end - 1) === this.slashCodePoint
    ) {
      end -= 1;
    }

    return trimmedSlug.slice(start, end);
  }

  listPublishedArticles(): Observable<BlogArticle[]> {
    return this.http.get<ArticleDto[]>(this.endpoint).pipe(
      map((articles) => mapPublicArticlesToBlogArticles(articles)),
      catchError((error: unknown) => {
        console.error('[BlogPublicService] listPublishedArticles fallback', {
          error,
        });

        return of([...getFallbackBlogArticles()]);
      }),
    );
  }

  getPublishedArticleBySlug(slug: string): Observable<BlogArticle | null> {
    const normalizedSlug = this.normalizeSlug(slug);

    return this.http.get<ArticleDto>(`${this.endpoint}/${normalizedSlug}`).pipe(
      map((article) => mapPublicArticleToBlogArticle(article)),
      catchError((error: unknown) => {
        const fallbackArticles = [...getFallbackBlogArticles()];
        const decodedSlug = this.decodeSlugSafely(normalizedSlug);
        const fallback =
          fallbackArticles.find((article) => article.slug === normalizedSlug) ??
          fallbackArticles.find((article) => article.slug === decodedSlug) ??
          fallbackArticles.find(
            (article) =>
              normalizedSlug.includes(article.slug) ||
              article.slug.includes(normalizedSlug),
          ) ??
          null;

        console.error(
          '[BlogPublicService] getPublishedArticleBySlug fallback',
          {
            slug: normalizedSlug,
            decodedSlug,
            hasFallback: fallback !== null,
            fallbackCount: fallbackArticles.length,
            error,
          },
        );

        return of(fallback);
      }),
    );
  }

  private decodeSlugSafely(slug: string): string {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  }
}
