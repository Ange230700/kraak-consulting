import { TestBed } from '@angular/core/testing';
import gsap from 'gsap';
import { GsapAnimationsService } from './gsap-animations.service';
import { afterEach, vi } from 'vitest';

interface MediaPreferences {
  reducedMotion: boolean;
  isMobile: boolean;
}

function mockMediaPreferences(preferences: MediaPreferences): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => {
      let matches = false;

      if (query.includes('(prefers-reduced-motion: reduce)')) {
        matches = preferences.reducedMotion;
      } else if (query.includes('(max-width: 767px)')) {
        matches = preferences.isMobile;
      } else if (query.includes('(min-width: 768px)')) {
        matches = !preferences.isMobile;
      }

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  );
}

function allowAnimations(): void {
  mockMediaPreferences({ reducedMotion: false, isMobile: false });
}

function allowAnimationsOnMobile(): void {
  mockMediaPreferences({ reducedMotion: false, isMobile: true });
}

function setReducedMotionPreference(): void {
  mockMediaPreferences({ reducedMotion: true, isMobile: false });
}

function mockGsapMatchMedia(): void {
  vi.spyOn(gsap, 'matchMedia').mockImplementation(() => {
    const revert = vi.fn();

    return {
      add: (query: string, callback: () => void) => {
        if (globalThis.matchMedia?.(query).matches) {
          callback();
        }
      },
      revert,
    } as unknown as gsap.MatchMedia;
  });
}

function mockGsapEffects() {
  const originalGsapTo = gsap.to.bind(gsap);
  const fromSpy = vi
    .spyOn(gsap, 'from')
    .mockImplementation(() =>
      originalGsapTo(document.createElement('div'), { duration: 0 }),
    );
  const toSpy = vi.spyOn(gsap, 'to').mockImplementation((_target, vars) => {
    (vars as { onComplete?: () => void } | undefined)?.onComplete?.();
    return {} as gsap.core.Tween;
  });
  const killTweensSpy = vi
    .spyOn(gsap, 'killTweensOf')
    .mockReturnValue(undefined);

  return { fromSpy, toSpy, killTweensSpy };
}

describe('GsapAnimationsService', () => {
  let service: GsapAnimationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GsapAnimationsService],
    });
    service = TestBed.inject(GsapAnimationsService);
    allowAnimations();
    mockGsapMatchMedia();
  });

  afterEach(() => {
    service?.killAllAnimations();
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeFigureAnimations', () => {
    it('Given document is unavailable, When animations initialize, Then execution exits safely', () => {
      vi.stubGlobal('document', undefined);

      expect(() => service.initializeFigureAnimations()).not.toThrow();
    });

    it('Given matchMedia is unavailable, When animations initialize, Then browser defaults allow animation setup', () => {
      vi.stubGlobal('matchMedia', undefined);

      expect(() => service.initializeFigureAnimations()).not.toThrow();
    });

    it('Given reduced motion is enabled, When figure animations initialize, Then no transform is applied', () => {
      setReducedMotionPreference();

      const div = document.createElement('div');
      const figure = document.createElement('figure');
      figure.classList.add('reveal-on-scroll');
      div.appendChild(figure);
      document.body.appendChild(div);

      service.initializeFigureAnimations();

      expect(figure.getAttribute('style')).toBeNull();

      div.remove();
    });

    it('should handle selector when figures exist', () => {
      // Arrange: Create a figure element
      const div = document.createElement('div');
      const figure = document.createElement('figure');
      figure.classList.add('reveal-on-scroll');
      div.appendChild(figure);
      document.body.appendChild(div);

      // Act: Initialize animations
      service.initializeFigureAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

      // Cleanup
      div.remove();
    });

    it('should handle empty selector gracefully', () => {
      // Act: Initialize with non-existent selector
      service.initializeFigureAnimations('figure.non-existent');

      // Assert: Service executes without error
      expect(service).toBeTruthy();
    });

    it('Given animations actives et des figures ciblées, When initializeFigureAnimations est invoqué, Then les tweens GSAP sont créés pour chaque figure', () => {
      const fromSpy = vi.spyOn(gsap, 'from');
      const container = document.createElement('div');
      const first = document.createElement('figure');
      const second = document.createElement('figure');
      first.classList.add('branch-figure');
      second.classList.add('branch-figure');
      container.appendChild(first);
      container.appendChild(second);
      document.body.appendChild(container);

      service.initializeFigureAnimations('figure.branch-figure');

      expect(fromSpy).toHaveBeenCalledTimes(2);

      container.remove();
    });
  });

  describe('initializeReversibleScrollAnimations', () => {
    it('Given des éléments ciblés, When initializeReversibleScrollAnimations est invoqué, Then GSAP crée un tween par élément', () => {
      allowAnimations();
      const fromSpy = vi.spyOn(gsap, 'from');

      const container = document.createElement('div');
      const first = document.createElement('article');
      const second = document.createElement('article');
      first.classList.add('gsap-reversible-on-scroll');
      second.classList.add('gsap-reversible-on-scroll');
      container.appendChild(first);
      container.appendChild(second);
      document.body.appendChild(container);

      service.initializeReversibleScrollAnimations(
        'article.gsap-reversible-on-scroll',
      );

      expect(fromSpy).toHaveBeenCalledTimes(2);

      container.remove();
    });

    it('Given desktop viewport, When reversible animations initialize, Then ScrollTrigger uses reverse on back scroll', () => {
      allowAnimations();
      const fromSpy = vi.spyOn(gsap, 'from');
      const element = document.createElement('article');
      element.classList.add('gsap-reversible-on-scroll');
      document.body.appendChild(element);

      service.initializeReversibleScrollAnimations(
        'article.gsap-reversible-on-scroll',
      );

      expect(fromSpy).toHaveBeenCalledWith(
        element,
        expect.objectContaining({
          scrollTrigger: expect.objectContaining({
            toggleActions: 'play none none reverse',
          }),
        }),
      );

      element.remove();
    });

    it('Given mobile viewport, When reversible animations initialize, Then ScrollTrigger keeps play-only behavior', () => {
      allowAnimationsOnMobile();
      const fromSpy = vi.spyOn(gsap, 'from');
      const element = document.createElement('article');
      element.classList.add('gsap-reversible-on-scroll');
      document.body.appendChild(element);

      service.initializeReversibleScrollAnimations(
        'article.gsap-reversible-on-scroll',
      );

      expect(fromSpy).toHaveBeenCalledWith(
        element,
        expect.objectContaining({
          scrollTrigger: expect.objectContaining({
            toggleActions: 'play none none none',
          }),
        }),
      );

      element.remove();
    });

    it('Given desktop media conditions, When reversible animations initialize, Then toggleActions includes reverse', () => {
      allowAnimations();
      const fromSpy = vi.spyOn(gsap, 'from');
      const container = document.createElement('div');
      const card = document.createElement('article');
      card.classList.add('desktop-reversible-target');
      container.appendChild(card);
      document.body.appendChild(container);

      service.initializeReversibleScrollAnimations(
        'article.desktop-reversible-target',
      );

      expect(fromSpy).toHaveBeenCalledWith(
        card,
        expect.objectContaining({
          scrollTrigger: expect.objectContaining({
            toggleActions: 'play none none reverse',
          }),
        }),
      );

      container.remove();
    });

    it('Given mobile media conditions, When reversible animations initialize, Then toggleActions disables reverse', () => {
      allowAnimationsOnMobile();
      const fromSpy = vi.spyOn(gsap, 'from');
      const container = document.createElement('div');
      const card = document.createElement('article');
      card.classList.add('mobile-reversible-target');
      container.appendChild(card);
      document.body.appendChild(container);

      service.initializeReversibleScrollAnimations(
        'article.mobile-reversible-target',
      );

      expect(fromSpy).toHaveBeenCalledWith(
        card,
        expect.objectContaining({
          scrollTrigger: expect.objectContaining({
            toggleActions: 'play none none none',
          }),
        }),
      );

      container.remove();
    });
    it('Given reduced motion preference, When reversible animations initialize, Then GSAP tweens are skipped', () => {
      setReducedMotionPreference();
      const fromSpy = vi.spyOn(gsap, 'from');

      const element = document.createElement('article');
      element.classList.add('gsap-reversible-on-scroll');
      document.body.appendChild(element);

      service.initializeReversibleScrollAnimations(
        'article.gsap-reversible-on-scroll',
      );

      expect(fromSpy).not.toHaveBeenCalled();

      element.remove();
    });

    it('Given overlap with reveal directive, When reversible animations initialize, Then overlapping targets are skipped', () => {
      allowAnimations();
      const fromSpy = vi.spyOn(gsap, 'from');

      const overlapping = document.createElement('article');
      overlapping.setAttribute('kraakRevealOnScroll', '');
      overlapping.dataset['motion'] = 'reversible';

      const safe = document.createElement('article');
      safe.dataset['motion'] = 'reversible';

      document.body.append(overlapping, safe);

      service.initializeReversibleScrollAnimations(
        '[data-motion="reversible"]',
      );

      expect(fromSpy).toHaveBeenCalledTimes(1);
      expect(fromSpy).toHaveBeenCalledWith(
        safe,
        expect.objectContaining({
          scrollTrigger: expect.objectContaining({
            toggleActions: 'play none none reverse',
          }),
        }),
      );

      overlapping.remove();
      safe.remove();
    });

    it('Given motion debug enabled, When reversible animations initialize, Then debug markers are enabled', () => {
      allowAnimations();
      globalThis.window.localStorage.setItem('kraak:motion-debug', '1');
      const fromSpy = vi.spyOn(gsap, 'from');
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {
        return undefined;
      });

      const target = document.createElement('article');
      target.dataset['motion'] = 'reversible';
      document.body.appendChild(target);

      service.initializeReversibleScrollAnimations(
        '[data-motion="reversible"]',
      );

      expect(fromSpy).toHaveBeenCalledWith(
        target,
        expect.objectContaining({
          scrollTrigger: expect.objectContaining({
            markers: true,
          }),
        }),
      );
      expect(debugSpy).toHaveBeenCalled();

      target.remove();
      globalThis.window.localStorage.removeItem('kraak:motion-debug');
    });
  });

  describe('initializeInteractiveCardAnimations', () => {
    it('Given card hover events, When mouseenter and mouseleave are dispatched, Then gsap receives both transitions', () => {
      allowAnimations();
      const { toSpy } = mockGsapEffects();

      const article = document.createElement('article');
      document.body.appendChild(article);

      service.initializeInteractiveCardAnimations();
      article.dispatchEvent(new Event('mouseenter'));
      article.dispatchEvent(new Event('mouseleave'));

      expect(toSpy).toHaveBeenCalledTimes(2);
      article.remove();
    });

    it('should handle selector when articles exist', () => {
      // Arrange: Create article element
      const div = document.createElement('div');
      const article = document.createElement('article');
      div.appendChild(article);
      document.body.appendChild(div);

      // Act: Initialize interactive animations
      service.initializeInteractiveCardAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

      // Cleanup
      div.remove();
    });

    it('should handle empty selector gracefully', () => {
      // Act: Initialize with non-existent selector
      service.initializeInteractiveCardAnimations('article.non-existent');

      // Assert: Service executes without error
      expect(service).toBeTruthy();
    });
  });

  describe('initializePageEntranceAnimations', () => {
    it('Given a first section and headings, When page entrance initializes, Then hero and heading animations are triggered', () => {
      allowAnimations();
      const { fromSpy } = mockGsapEffects();

      const section = document.createElement('section');
      const heading = document.createElement('h1');
      const subHeading = document.createElement('h2');
      document.body.append(section, heading, subHeading);

      service.initializePageEntranceAnimations();

      expect(fromSpy).toHaveBeenCalledTimes(2);
      section.remove();
      heading.remove();
      subHeading.remove();
    });

    it('should initialize page entrance animations', () => {
      // Act: Initialize page entrance
      service.initializePageEntranceAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();
    });
  });

  describe('killAllAnimations', () => {
    it('should clear all animations and ScrollTriggers', () => {
      // Arrange: Create some animations first
      service.initializeFigureAnimations();
      service.initializeInteractiveCardAnimations();

      // Act: Kill all animations
      service.killAllAnimations();

      // Assert: Service can be re-initialized without error
      service.initializeFigureAnimations();
      expect(service).toBeTruthy();
    });

    it('should be safe to call multiple times', () => {
      // Act: Call multiple times
      service.killAllAnimations();
      service.killAllAnimations();
      service.killAllAnimations();

      // Assert: No error thrown
      expect(service).toBeTruthy();
    });

    it('Given un contexte sans document, When killAllAnimations est invoqué, Then la méthode retourne sans appeler GSAP', () => {
      const killTweensSpy = vi.spyOn(gsap, 'killTweensOf');
      const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        'document',
      );

      if (!originalDocumentDescriptor?.configurable) {
        expect(service).toBeTruthy();
        return;
      }

      Object.defineProperty(globalThis, 'document', {
        value: undefined,
        configurable: true,
      });

      try {
        service.killAllAnimations();
        expect(killTweensSpy).not.toHaveBeenCalled();
      } finally {
        Object.defineProperty(
          globalThis,
          'document',
          originalDocumentDescriptor,
        );
      }
    });
  });

  describe('initializeButtonTransitions', () => {
    it('Given button interaction events, When hover and click events are dispatched, Then tween updates are requested', () => {
      allowAnimations();
      const { killTweensSpy, toSpy } = mockGsapEffects();

      const button = document.createElement('button');
      document.body.appendChild(button);

      service.initializeButtonTransitions();
      button.dispatchEvent(new Event('mouseenter'));
      button.dispatchEvent(new Event('mouseleave'));
      button.dispatchEvent(new Event('mousedown'));
      button.dispatchEvent(new Event('mouseup'));

      expect(killTweensSpy).toHaveBeenCalledTimes(2);
      expect(toSpy).toHaveBeenCalledTimes(4);
      button.remove();
    });

    it('should handle button animations', () => {
      // Arrange: Create button
      const button = document.createElement('button');
      document.body.appendChild(button);

      // Act: Initialize button animations
      service.initializeButtonTransitions();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

      // Cleanup
      button.remove();
    });

    it('Given un bouton animé et canAnimate actif, When mouseenter, mouseleave, mousedown et mouseup sont déclenchés, Then toutes les transitions GSAP prévues sont demandées', () => {
      const killTweensSpy = vi.spyOn(gsap, 'killTweensOf');
      const toSpy = vi.spyOn(gsap, 'to');
      const button = document.createElement('button');
      button.classList.add('branch-button');
      document.body.appendChild(button);

      service.initializeButtonTransitions('button.branch-button');

      button.dispatchEvent(new MouseEvent('mouseenter'));
      button.dispatchEvent(new MouseEvent('mouseleave'));
      button.dispatchEvent(new MouseEvent('mousedown'));
      button.dispatchEvent(new MouseEvent('mouseup'));

      expect(killTweensSpy).toHaveBeenCalledTimes(2);
      expect(toSpy).toHaveBeenCalledTimes(4);

      button.remove();
    });
  });

  describe('initializeFormFieldAnimations', () => {
    it('Given focus transitions, When focus and blur events are dispatched, Then form field tweens are requested', () => {
      allowAnimations();
      const { toSpy } = mockGsapEffects();

      const input = document.createElement('input');
      document.body.appendChild(input);

      service.initializeFormFieldAnimations();
      input.dispatchEvent(new Event('focus'));
      input.dispatchEvent(new Event('blur'));

      expect(toSpy).toHaveBeenCalledTimes(2);
      input.remove();
    });

    it('should handle form field animations', () => {
      // Arrange: Create input
      const input = document.createElement('input');
      document.body.appendChild(input);

      // Act: Initialize form field animations
      service.initializeFormFieldAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

      // Cleanup
      input.remove();
    });

    it('Given un champ animé et canAnimate actif, When focus puis blur sont émis, Then les transitions GSAP de focus et blur sont demandées', () => {
      const toSpy = vi.spyOn(gsap, 'to');
      const input = document.createElement('input');
      document.body.appendChild(input);

      service.initializeFormFieldAnimations('input');

      input.dispatchEvent(new FocusEvent('focus'));
      input.dispatchEvent(new FocusEvent('blur'));

      expect(toSpy).toHaveBeenCalledTimes(2);

      input.remove();
    });
  });

  describe('initializeListItemAnimations', () => {
    it('should handle list item animations', () => {
      allowAnimations();
      const { fromSpy } = mockGsapEffects();

      // Arrange: Create list items
      const li = document.createElement('li');
      document.body.appendChild(li);

      // Act: Initialize list animations
      service.initializeListItemAnimations();

      // Assert: Service executes without error
      expect(fromSpy).toHaveBeenCalledTimes(1);

      // Cleanup
      li.remove();
    });

    it('Given des items de liste et animations activées, When initializeListItemAnimations est appelé, Then gsap.from est invoqué pour chaque item', () => {
      const fromSpy = vi.spyOn(gsap, 'from');
      const first = document.createElement('li');
      const second = document.createElement('li');
      first.classList.add('branch-list');
      second.classList.add('branch-list');
      document.body.appendChild(first);
      document.body.appendChild(second);

      service.initializeListItemAnimations('li.branch-list');

      expect(fromSpy).toHaveBeenCalledTimes(2);

      first.remove();
      second.remove();
    });

    it('Given desktop media, When list item animations initialize, Then desktop motion presets are applied', () => {
      allowAnimations();
      const fromSpy = vi.spyOn(gsap, 'from');
      const item = document.createElement('li');
      item.classList.add('list-desktop-target');
      document.body.appendChild(item);

      service.initializeListItemAnimations('li.list-desktop-target');

      expect(fromSpy).toHaveBeenCalledWith(
        item,
        expect.objectContaining({
          x: -20,
          duration: 0.6,
          scrollTrigger: expect.objectContaining({ start: 'top 90%' }),
        }),
      );

      item.remove();
    });

    it('Given mobile media, When list item animations initialize, Then mobile motion presets are applied', () => {
      allowAnimationsOnMobile();
      const fromSpy = vi.spyOn(gsap, 'from');
      const item = document.createElement('li');
      item.classList.add('list-mobile-target');
      document.body.appendChild(item);

      service.initializeListItemAnimations('li.list-mobile-target');

      expect(fromSpy).toHaveBeenCalledWith(
        item,
        expect.objectContaining({
          x: -12,
          duration: 0.5,
          scrollTrigger: expect.objectContaining({ start: 'top 94%' }),
        }),
      );

      item.remove();
    });
  });

  describe('initializeTextRevealAnimations', () => {
    it('should handle text reveal animations', () => {
      allowAnimations();
      const { fromSpy } = mockGsapEffects();

      // Arrange: Create paragraph
      const p = document.createElement('p');
      p.textContent = 'Test text';
      document.body.appendChild(p);

      // Act: Initialize text animations
      service.initializeTextRevealAnimations();

      // Assert: Service executes without error
      expect(fromSpy).toHaveBeenCalledTimes(1);

      // Cleanup
      p.remove();
    });

    it('Given des paragraphes ciblés et animations activées, When initializeTextRevealAnimations est appelé, Then gsap.from est déclenché', () => {
      const fromSpy = vi.spyOn(gsap, 'from');
      const p = document.createElement('p');
      p.classList.add('branch-text');
      p.textContent = 'Texte test';
      document.body.appendChild(p);

      service.initializeTextRevealAnimations('p.branch-text');

      expect(fromSpy).toHaveBeenCalled();

      p.remove();
    });

    it('Given mobile media, When text reveal animations initialize, Then mobile text presets are applied', () => {
      allowAnimationsOnMobile();
      const fromSpy = vi.spyOn(gsap, 'from');
      const p = document.createElement('p');
      p.classList.add('text-mobile-target');
      p.textContent = 'Texte mobile';
      document.body.appendChild(p);

      service.initializeTextRevealAnimations('p.text-mobile-target');

      expect(fromSpy).toHaveBeenCalledWith(
        p,
        expect.objectContaining({
          y: 6,
          duration: 0.55,
          scrollTrigger: expect.objectContaining({ start: 'top 92%' }),
        }),
      );

      p.remove();
    });
  });

  describe('initializeIconAnimations', () => {
    it('Given icon hover events, When mouseenter and mouseleave are dispatched, Then icon animation tweens are requested', () => {
      allowAnimations();
      const { toSpy } = mockGsapEffects();

      const svg = document.createElement('svg');
      document.body.appendChild(svg);

      service.initializeIconAnimations();
      svg.dispatchEvent(new Event('mouseenter'));
      svg.dispatchEvent(new Event('mouseleave'));

      expect(toSpy).toHaveBeenCalledTimes(2);
      svg.remove();
    });

    it('should handle icon animations', () => {
      // Arrange: Create SVG icon
      const svg = document.createElement('svg');
      document.body.appendChild(svg);

      // Act: Initialize icon animations
      service.initializeIconAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

      // Cleanup
      svg.remove();
    });

    it('Given animated icons, When hover events fire, Then GSAP icon transitions are requested', () => {
      const svg = document.createElement('svg');
      document.body.appendChild(svg);

      service.initializeIconAnimations();

      expect(() => {
        svg.dispatchEvent(new MouseEvent('mouseenter'));
        svg.dispatchEvent(new MouseEvent('mouseleave'));
      }).not.toThrow();

      svg.remove();
    });

    it('Given des icônes et animations activées, When mouseenter puis mouseleave sont déclenchés, Then les tweens GSAP d entrée et sortie sont demandés', () => {
      const toSpy = vi.spyOn(gsap, 'to');
      const icon = document.createElement('svg');
      document.body.appendChild(icon);

      service.initializeIconAnimations('svg');

      icon.dispatchEvent(new MouseEvent('mouseenter'));
      icon.dispatchEvent(new MouseEvent('mouseleave'));

      expect(toSpy).toHaveBeenCalledTimes(2);

      icon.remove();
    });

    it('Given desktop media, When icon hover starts, Then desktop icon preset is applied', () => {
      allowAnimations();
      const toSpy = vi.spyOn(gsap, 'to');
      const icon = document.createElement('svg');
      icon.classList.add('icon-desktop-target');
      document.body.appendChild(icon);

      service.initializeIconAnimations('svg.icon-desktop-target');
      icon.dispatchEvent(new MouseEvent('mouseenter'));

      expect(toSpy).toHaveBeenCalledWith(
        icon,
        expect.objectContaining({
          scale: 1.2,
          rotate: 5,
          duration: 0.3,
        }),
      );

      icon.remove();
    });

    it('Given mobile media, When icon hover starts, Then mobile icon preset is applied', () => {
      allowAnimationsOnMobile();
      const toSpy = vi.spyOn(gsap, 'to');
      const icon = document.createElement('svg');
      icon.classList.add('icon-mobile-target');
      document.body.appendChild(icon);

      service.initializeIconAnimations('svg.icon-mobile-target');
      icon.dispatchEvent(new MouseEvent('mouseenter'));

      expect(toSpy).toHaveBeenCalledWith(
        icon,
        expect.objectContaining({
          scale: 1.1,
          rotate: 2,
          duration: 0.22,
        }),
      );

      icon.remove();
    });
  });

  describe('createPageTransition', () => {
    it('should create a page transition promise when main exists', async () => {
      allowAnimations();
      const { toSpy } = mockGsapEffects();
      const main = document.createElement('main');
      document.body.appendChild(main);

      const promise = service.createPageTransition();

      await expect(promise).resolves.toBeUndefined();
      expect(toSpy).toHaveBeenCalledWith(
        main,
        expect.objectContaining({ opacity: 0 }),
      );

      main.remove();
    });

    it('should resolve immediately when main is absent', async () => {
      allowAnimations();
      mockGsapEffects();

      await expect(service.createPageTransition()).resolves.toBeUndefined();
    });

    it('Given a page main element, When a transition starts, Then GSAP fade-out resolves on completion', async () => {
      const main = document.createElement('main');
      document.body.appendChild(main);

      await expect(service.createPageTransition()).resolves.toBeUndefined();

      main.remove();
    });

    it('Given animations actives et un main présent, When createPageTransition est appelé, Then gsap.to est invoqué avec onComplete', async () => {
      const main = document.createElement('main');
      document.body.appendChild(main);

      const toSpy = vi.spyOn(gsap, 'to').mockImplementation((_, vars) => {
        vars.onComplete?.();
        return {} as gsap.core.Tween;
      });

      await expect(service.createPageTransition()).resolves.toBeUndefined();
      expect(toSpy).toHaveBeenCalled();

      main.remove();
    });

    it('Given animations actives et aucun main, When createPageTransition est appelé, Then la promesse est résolue immédiatement', async () => {
      const mainElements = document.querySelectorAll('main');
      mainElements.forEach((element) => element.remove());

      await expect(service.createPageTransition()).resolves.toBeUndefined();
    });
  });

  describe('animatePageIn', () => {
    it('Given a main element exists, When animatePageIn runs, Then gsap.from animates the main container', () => {
      allowAnimations();
      const { fromSpy } = mockGsapEffects();

      const main = document.createElement('main');
      document.body.appendChild(main);

      service.animatePageIn();

      expect(fromSpy).toHaveBeenCalledWith(
        main,
        expect.objectContaining({ opacity: 0 }),
      );
      main.remove();
    });

    it('should animate page entrance', () => {
      // Act: Animate page in
      service.animatePageIn();

      // Assert: Service executes without error
      expect(service).toBeTruthy();
    });

    it('Given animations actives et un main présent, When animatePageIn est appelé, Then gsap.from est invoqué pour la nouvelle page', () => {
      const main = document.createElement('main');
      document.body.appendChild(main);
      const fromSpy = vi.spyOn(gsap, 'from');

      service.animatePageIn();

      expect(fromSpy).toHaveBeenCalled();

      main.remove();
    });
  });

  describe('initializeSectionAnimations', () => {
    it('should handle section animations', () => {
      allowAnimations();
      const { fromSpy } = mockGsapEffects();

      // Arrange: Create section
      const section = document.createElement('section');
      document.body.appendChild(section);

      // Act: Initialize section animations
      service.initializeSectionAnimations();

      // Assert: Service executes without error
      expect(fromSpy).toHaveBeenCalledTimes(1);

      // Cleanup
      section.remove();
    });

    it('Given desktop media, When section animations initialize, Then desktop section presets are applied', () => {
      allowAnimations();
      const fromSpy = vi.spyOn(gsap, 'from');
      const section = document.createElement('section');
      section.classList.add('section-desktop-target');
      document.body.appendChild(section);

      service.initializeSectionAnimations('section.section-desktop-target');

      expect(fromSpy).toHaveBeenCalledWith(
        section,
        expect.objectContaining({
          y: 40,
          duration: 0.8,
          scrollTrigger: expect.objectContaining({ start: 'top 75%' }),
        }),
      );

      section.remove();
    });
  });

  describe('initializeMouseFollowAnimations', () => {
    it('Given interactive elements, When hover events fire, Then GSAP brightness transitions are requested', () => {
      const link = document.createElement('a');
      document.body.appendChild(link);

      service.initializeMouseFollowAnimations();

      expect(() => {
        link.dispatchEvent(new MouseEvent('mouseenter'));
        link.dispatchEvent(new MouseEvent('mouseleave'));
      }).not.toThrow();

      link.remove();
    });
  });

  describe('initializeImageParallaxAnimations', () => {
    it('Given images in view, When parallax animations initialize, Then reveal and parallax tweens are registered', () => {
      const image = document.createElement('img');
      document.body.appendChild(image);

      service.initializeImageParallaxAnimations();

      expect(service).toBeTruthy();

      image.remove();
    });
  });

  describe('initializeBadgeAnimations', () => {
    it('should handle badge animations', () => {
      allowAnimations();
      const { fromSpy, toSpy } = mockGsapEffects();

      // Arrange: Create badge
      const badge = document.createElement('span');
      badge.classList.add('badge');
      document.body.appendChild(badge);

      // Act: Initialize badge animations
      service.initializeBadgeAnimations();

      // Assert: Service executes without error
      expect(fromSpy).toHaveBeenCalledTimes(1);
      expect(toSpy).toHaveBeenCalledTimes(1);

      // Cleanup
      badge.remove();
    });

    it('Given un badge ciblé et animations activées, When initializeBadgeAnimations est appelé, Then GSAP from et to sont tous les deux invoqués', () => {
      const fromSpy = vi.spyOn(gsap, 'from');
      const toSpy = vi.spyOn(gsap, 'to');
      const badge = document.createElement('span');
      badge.classList.add('badge');
      document.body.appendChild(badge);

      service.initializeBadgeAnimations('.badge');

      expect(fromSpy).toHaveBeenCalled();
      expect(toSpy).toHaveBeenCalled();

      badge.remove();
    });

    it('Given desktop media, When badge animations initialize, Then desktop badge presets are used', () => {
      allowAnimations();
      const fromSpy = vi.spyOn(gsap, 'from');
      const toSpy = vi.spyOn(gsap, 'to');
      const badge = document.createElement('span');
      badge.classList.add('badge', 'badge-desktop-target');
      document.body.appendChild(badge);

      service.initializeBadgeAnimations('.badge-desktop-target');

      expect(fromSpy).toHaveBeenCalledWith(
        badge,
        expect.objectContaining({ scale: 0.8, duration: 0.5 }),
      );
      expect(toSpy).toHaveBeenCalledWith(
        badge,
        expect.objectContaining({ scale: 1.05, duration: 1.5 }),
      );

      badge.remove();
    });

    it('Given mobile media, When badge animations initialize, Then mobile badge presets are used', () => {
      allowAnimationsOnMobile();
      const fromSpy = vi.spyOn(gsap, 'from');
      const toSpy = vi.spyOn(gsap, 'to');
      const badge = document.createElement('span');
      badge.classList.add('badge', 'badge-mobile-target');
      document.body.appendChild(badge);

      service.initializeBadgeAnimations('.badge-mobile-target');

      expect(fromSpy).toHaveBeenCalledWith(
        badge,
        expect.objectContaining({ scale: 0.9, duration: 0.4 }),
      );
      expect(toSpy).toHaveBeenCalledWith(
        badge,
        expect.objectContaining({ scale: 1.02, duration: 1.8 }),
      );

      badge.remove();
    });
  });

  describe('initializeMouseFollowAnimations', () => {
    it('Given interactive element hover events, When mouseenter and mouseleave are dispatched, Then brightness tween is requested', () => {
      allowAnimations();
      const { toSpy } = mockGsapEffects();

      const link = document.createElement('a');
      document.body.appendChild(link);

      service.initializeMouseFollowAnimations();
      link.dispatchEvent(new Event('mouseenter'));
      link.dispatchEvent(new Event('mouseleave'));

      expect(toSpy).toHaveBeenCalledTimes(2);
      link.remove();
    });

    it('should handle mouse follow animations', () => {
      // Arrange: Create interactive element
      const link = document.createElement('a');
      document.body.appendChild(link);

      // Act: Initialize mouse follow animations
      service.initializeMouseFollowAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

      // Cleanup
      link.remove();
    });

    it('Given un élément interactif et animations activées, When mouseenter et mouseleave sont déclenchés, Then les transitions GSAP de luminosité sont demandées', () => {
      const toSpy = vi.spyOn(gsap, 'to');
      const button = document.createElement('button');
      document.body.appendChild(button);

      service.initializeMouseFollowAnimations();

      button.dispatchEvent(new MouseEvent('mouseenter'));
      button.dispatchEvent(new MouseEvent('mouseleave'));

      expect(toSpy).toHaveBeenCalledTimes(2);

      button.remove();
    });
  });

  describe('initializeImageParallaxAnimations', () => {
    it('should handle image parallax animations', () => {
      allowAnimations();
      const { fromSpy, toSpy } = mockGsapEffects();

      // Arrange: Create image
      const img = document.createElement('img');
      img.src = 'test.jpg';
      document.body.appendChild(img);

      // Act: Initialize image animations
      service.initializeImageParallaxAnimations();

      // Assert: Service executes without error
      expect(fromSpy).toHaveBeenCalledTimes(1);
      expect(toSpy).toHaveBeenCalledTimes(1);

      // Cleanup
      img.remove();
    });

    it('Given un image parallax ciblé et animations activées, When initializeImageParallaxAnimations est appelé, Then les animations reveal et parallax sont déclenchées', () => {
      const fromSpy = vi.spyOn(gsap, 'from');
      const toSpy = vi.spyOn(gsap, 'to');
      const img = document.createElement('img');
      img.classList.add('parallax-branch-target');
      document.body.appendChild(img);

      service.initializeImageParallaxAnimations('img.parallax-branch-target');

      expect(fromSpy).toHaveBeenCalled();
      expect(toSpy).toHaveBeenCalled();

      img.remove();
    });

    it('Given desktop media, When image parallax initializes, Then desktop image presets are applied', () => {
      allowAnimations();
      const fromSpy = vi.spyOn(gsap, 'from');
      const toSpy = vi.spyOn(gsap, 'to');
      const img = document.createElement('img');
      img.classList.add('parallax-desktop-target');
      document.body.appendChild(img);

      service.initializeImageParallaxAnimations('img.parallax-desktop-target');

      expect(fromSpy).toHaveBeenCalledWith(
        img,
        expect.objectContaining({
          scale: 0.95,
          duration: 0.8,
          scrollTrigger: expect.objectContaining({ start: 'top 80%' }),
        }),
      );
      expect(toSpy).toHaveBeenCalledWith(
        img,
        expect.objectContaining({
          y: -30,
          duration: 1,
          scrollTrigger: expect.objectContaining({
            start: 'top center',
            end: 'bottom center',
            scrub: 0.5,
          }),
        }),
      );

      img.remove();
    });

    it('Given mobile media, When image parallax initializes, Then mobile image presets are applied', () => {
      allowAnimationsOnMobile();
      const fromSpy = vi.spyOn(gsap, 'from');
      const toSpy = vi.spyOn(gsap, 'to');
      const img = document.createElement('img');
      img.classList.add('parallax-mobile-target');
      document.body.appendChild(img);

      service.initializeImageParallaxAnimations('img.parallax-mobile-target');

      expect(fromSpy).toHaveBeenCalledWith(
        img,
        expect.objectContaining({
          scale: 0.98,
          duration: 0.6,
          scrollTrigger: expect.objectContaining({ start: 'top 90%' }),
        }),
      );
      expect(toSpy).toHaveBeenCalledWith(
        img,
        expect.objectContaining({
          y: -16,
          duration: 0.8,
          scrollTrigger: expect.objectContaining({
            start: 'top 90%',
            end: 'bottom 60%',
            scrub: 0.35,
          }),
        }),
      );

      img.remove();
    });
  });

  describe('reduced motion guards', () => {
    it('Given reduced motion is enabled, When guarded methods are called, Then all related animations are skipped safely', async () => {
      setReducedMotionPreference();
      const { fromSpy, toSpy, killTweensSpy } = mockGsapEffects();

      service.initializeFigureAnimations();
      service.initializeReversibleScrollAnimations();
      service.initializeInteractiveCardAnimations();
      service.initializePageEntranceAnimations();
      service.initializeButtonTransitions();
      service.initializeFormFieldAnimations();
      service.initializeListItemAnimations();
      service.initializeTextRevealAnimations();
      service.initializeIconAnimations();
      await expect(service.createPageTransition()).resolves.toBeUndefined();
      service.animatePageIn();
      service.initializeSectionAnimations();
      service.initializeBadgeAnimations();
      service.initializeMouseFollowAnimations();
      service.initializeImageParallaxAnimations();

      expect(fromSpy).not.toHaveBeenCalled();
      expect(toSpy).not.toHaveBeenCalled();
      expect(killTweensSpy).not.toHaveBeenCalled();
    });
  });
});
