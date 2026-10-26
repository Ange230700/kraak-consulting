import {
  Component,
  ElementRef,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RevealOnScrollDirective } from './reveal-on-scroll.directive';

let observedElement: Element | null = null;
let observerCallback: IntersectionObserverCallback | null = null;

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  observe(target: Element): void {
    observedElement = target;
  }

  unobserve(): void {
    observedElement = null;
  }

  disconnect(): void {
    observerCallback = null;
  }
}

@Component({
  standalone: true,
  imports: [RevealOnScrollDirective],
  template: `
    <section
      id="target"
      kraakRevealOnScroll
      [revealDelayMs]="40"
      [revealOnce]="revealOnce"
    ></section>
  `,
})
class HostComponent {
  revealOnce = true;
}

@Component({
  standalone: true,
  imports: [RevealOnScrollDirective],
  template: `
    <section
      id="target-mobile"
      kraakRevealOnScroll
      [revealDelayMs]="100"
      [revealDelayMobileMs]="30"
    ></section>
  `,
})
class HostMobileDelayComponent {}

describe('RevealOnScrollDirective', () => {
  function createDirective() {
    const element = document.createElement('section');
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementRef, useValue: new ElementRef(element) },
        {
          provide: Renderer2,
          useFactory: (factory: RendererFactory2) =>
            factory.createRenderer(null, null),
          deps: [RendererFactory2],
        },
      ],
    });
    const directive = TestBed.runInInjectionContext(
      () => new RevealOnScrollDirective(),
    );
    return { directive, element };
  }

  it('Given un délai de révélation, When la directive démarre, Then le délai reste configurable sans surcharger directement la transition CSS', () => {
    const { directive, element } = createDirective();
    directive.revealDelayMs = 120;
    directive.ngOnInit();
    expect(element.style.getPropertyValue('--reveal-delay')).toBe('120ms');
    expect(element.style.transitionDelay).toBe('');
    directive.ngOnDestroy();
  });

  it('Given un rendu sans navigateur, When la directive démarre, Then le contenu est immédiatement visible sans décalage mobile', () => {
    const { directive, element } = createDirective();
    directive.revealDelayMs = 80;
    directive.revealDelayMobileMs = 20;
    vi.stubGlobal('window', undefined);
    directive.ngOnInit();
    vi.unstubAllGlobals();
    expect(element.classList.contains('motion-reveal-visible')).toBe(true);
    expect(element.style.getPropertyValue('--reveal-delay')).toBe('80ms');
    directive.ngOnDestroy();
  });

  it('Given aucun observateur disponible, When la directive démarre, Then le contenu reste visible', () => {
    const { directive, element } = createDirective();
    vi.stubGlobal('window', {});
    directive.ngOnInit();
    vi.unstubAllGlobals();
    expect(element.classList.contains('motion-reveal-visible')).toBe(true);
  });

  it('Given une animation réversible, When l’élément entre puis sort du viewport, Then sa visibilité suit chaque intersection', () => {
    const { directive, element } = createDirective();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    directive.revealOnce = false;
    directive.ngOnInit();
    const callback = observerCallback!;
    callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(element.classList.contains('motion-reveal-visible')).toBe(true);
    callback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(element.classList.contains('motion-reveal-visible')).toBe(false);
    directive.revealOnce = true;
    callback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(element.classList.contains('motion-reveal-visible')).toBe(false);
    directive.ngOnDestroy();
    vi.unstubAllGlobals();
  });

  it('Given aucune détection de viewport, When un délai mobile est configuré, Then le délai standard est utilisé', () => {
    const { directive, element } = createDirective();
    vi.stubGlobal('matchMedia', undefined);
    directive.revealDelayMs = 90;
    directive.revealDelayMobileMs = 20;
    directive.ngOnInit();
    vi.unstubAllGlobals();
    expect(element.style.getPropertyValue('--reveal-delay')).toBe('90ms');
    directive.ngOnDestroy();
  });

  it('Given un observateur dont le nettoyage échoue, When la directive est détruite, Then l’erreur est journalisée sans bloquer la destruction', () => {
    const { directive } = createDirective();
    const error = new Error('observateur indisponible');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    directive['observer'] = {
      unobserve: () => {
        throw error;
      },
    } as unknown as IntersectionObserver;
    expect(() => directive.ngOnDestroy()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      '[RevealOnScrollDirective] Observer cleanup failed.',
      { context: 'ngOnDestroy', error },
    );
    warn.mockRestore();
  });
  it('Given un element avec la directive, When il est initialise, Then la classe de base est appliquee avec le delai', async () => {
    const originalObserver = globalThis.IntersectionObserver;
    (
      globalThis as { IntersectionObserver: typeof IntersectionObserver }
    ).IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    try {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
      }).compileComponents();

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const target = fixture.nativeElement.querySelector(
        '#target',
      ) as HTMLElement;

      expect(target.classList.contains('motion-reveal-base')).toBe(true);
      expect(target.style.getPropertyValue('--reveal-delay')).toBe('40ms');
      expect(observedElement).toBe(target);
    } finally {
      if (originalObserver) {
        (
          globalThis as { IntersectionObserver: typeof IntersectionObserver }
        ).IntersectionObserver = originalObserver;
      }
    }
  });

  it('Given une intersection visible, When le callback observer est execute, Then la classe visible est appliquee', async () => {
    const originalObserver = globalThis.IntersectionObserver;
    (
      globalThis as { IntersectionObserver: typeof IntersectionObserver }
    ).IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    try {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
      }).compileComponents();

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const target = fixture.nativeElement.querySelector(
        '#target',
      ) as HTMLElement;
      const callback = observerCallback;

      expect(callback).toBeTruthy();

      callback?.(
        [
          {
            isIntersecting: true,
            target,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );

      expect(target.classList.contains('motion-reveal-visible')).toBe(true);
    } finally {
      if (originalObserver) {
        (
          globalThis as { IntersectionObserver: typeof IntersectionObserver }
        ).IntersectionObserver = originalObserver;
      }

      observedElement = null;
      observerCallback = null;
    }
  });

  it('Given un viewport mobile, When revealDelayMobileMs est fourni, Then le delai mobile est applique', async () => {
    const originalObserver = globalThis.IntersectionObserver;
    const originalMatchMedia = globalThis.matchMedia;
    (
      globalThis as { IntersectionObserver: typeof IntersectionObserver }
    ).IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width: 767px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    try {
      await TestBed.configureTestingModule({
        imports: [HostMobileDelayComponent],
      }).compileComponents();

      const fixture = TestBed.createComponent(HostMobileDelayComponent);
      fixture.detectChanges();

      const target = fixture.nativeElement.querySelector(
        '#target-mobile',
      ) as HTMLElement;

      expect(target.style.getPropertyValue('--reveal-delay')).toBe('30ms');
    } finally {
      if (originalObserver) {
        (
          globalThis as { IntersectionObserver: typeof IntersectionObserver }
        ).IntersectionObserver = originalObserver;
      }

      if (originalMatchMedia) {
        vi.stubGlobal('matchMedia', originalMatchMedia);
      } else {
        vi.unstubAllGlobals();
      }

      observedElement = null;
      observerCallback = null;
    }
  });
});
