import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { BlogPublicService } from './blog-public.service';

describe('BlogPublicService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('Given the public articles endpoint, When listing published articles, Then API values are mapped to blog cards', () => {
    const service = TestBed.inject(BlogPublicService);
    const httpController = TestBed.inject(HttpTestingController);

    let receivedTitle = '';

    service.listPublishedArticles().subscribe((articles) => {
      receivedTitle = articles[0]?.title ?? '';
    });

    const request = httpController.expectOne('http://localhost:3000/articles');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'article-1',
        slug: 'article-api',
        title: 'Article API',
        excerpt: 'Résumé API',
        content: '<p>Contenu</p>',
        status: 'published',
        coverImageUrl: null,
        seoTitle: null,
        seoDescription: null,
        publishedAt: '2026-05-24T09:00:00.000Z',
        authorId: 'author-1',
        categoryIds: [],
        tagIds: [],
        createdAt: '2026-05-24T09:00:00.000Z',
        updatedAt: '2026-05-24T09:00:00.000Z',
      },
    ]);

    httpController.verify();
    expect(receivedTitle).toBe('Article API');
  });

  it('Given an API failure, When listing published articles, Then fallback articles are returned', () => {
    const service = TestBed.inject(BlogPublicService);
    const httpController = TestBed.inject(HttpTestingController);

    let receivedCount = 0;

    service.listPublishedArticles().subscribe((articles) => {
      receivedCount = articles.length;
    });

    const request = httpController.expectOne('http://localhost:3000/articles');
    request.flush(
      { message: 'error' },
      { status: 500, statusText: 'Server Error' },
    );

    httpController.verify();
    expect(receivedCount).toBeGreaterThan(0);
  });

  it('Given a missing API article, When loading by slug, Then fallback lookup returns null when slug is unknown', () => {
    const service = TestBed.inject(BlogPublicService);
    const httpController = TestBed.inject(HttpTestingController);

    let received: unknown = 'uninitialized';

    service
      .getPublishedArticleBySlug('slug-introuvable')
      .subscribe((article) => {
        received = article;
      });

    const request = httpController.expectOne(
      'http://localhost:3000/articles/slug-introuvable',
    );
    request.flush(
      { message: 'not found' },
      { status: 404, statusText: 'Not Found' },
    );

    httpController.verify();
    expect(received).toBeNull();
  });

  it('Given a malformed encoded slug, When API fails, Then fallback lookup does not throw and returns null', () => {
    const service = TestBed.inject(BlogPublicService);
    const httpController = TestBed.inject(HttpTestingController);

    let received: unknown = 'uninitialized';

    service.getPublishedArticleBySlug('%').subscribe((article) => {
      received = article;
    });

    const request = httpController.expectOne(
      'http://localhost:3000/articles/%',
    );
    request.flush(
      { message: 'not found' },
      { status: 404, statusText: 'Not Found' },
    );

    httpController.verify();
    expect(received).toBeNull();
  });
});
