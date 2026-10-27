import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LocalizedPublicPathPipe } from './localized-public-path.pipe';

describe('Given the localized public path pipe', () => {
  it('Given an English public URL, when a page link is resolved, then it preserves en-GB navigation', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { url: '/en/services' } }],
    });

    const pipe = TestBed.runInInjectionContext(
      () => new LocalizedPublicPathPipe(),
    );

    expect(pipe.transform('contact')).toBe('/en/contact');
  });

  it('Given a private URL, when a public page link is resolved, then it falls back to the French source locale', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { url: '/connexion' } }],
    });

    const pipe = TestBed.runInInjectionContext(
      () => new LocalizedPublicPathPipe(),
    );

    expect(pipe.transform('services')).toBe('/fr/services');
  });
});
