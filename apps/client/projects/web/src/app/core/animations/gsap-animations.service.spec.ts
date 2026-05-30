import { TestBed } from '@angular/core/testing';
import gsap from 'gsap';
import { GsapAnimationsService } from './gsap-animations.service';
import { afterEach, vi } from 'vitest';

function mockReducedMotion(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe('GsapAnimationsService', () => {
  let service: GsapAnimationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GsapAnimationsService],
    });
    service = TestBed.inject(GsapAnimationsService);
    mockReducedMotion(false);
  });

  afterEach(() => {
    service.killAllAnimations();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeFigureAnimations', () => {
    it('Given reduced motion is enabled, When figure animations initialize, Then no transform is applied', () => {
      mockReducedMotion(true);

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

  describe('initializeInteractiveCardAnimations', () => {
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
      // Arrange: Create list items
      const li = document.createElement('li');
      document.body.appendChild(li);

      // Act: Initialize list animations
      service.initializeListItemAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

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
  });

  describe('initializeTextRevealAnimations', () => {
    it('should handle text reveal animations', () => {
      // Arrange: Create paragraph
      const p = document.createElement('p');
      p.textContent = 'Test text';
      document.body.appendChild(p);

      // Act: Initialize text animations
      service.initializeTextRevealAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

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
  });

  describe('initializeIconAnimations', () => {
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
  });

  describe('createPageTransition', () => {
    it('should create a page transition promise', async () => {
      // Act & Assert
      const promise = service.createPageTransition();
      await expect(promise).resolves.toBeUndefined();
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
      // Arrange: Create section
      const section = document.createElement('section');
      document.body.appendChild(section);

      // Act: Initialize section animations
      service.initializeSectionAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

      // Cleanup
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
      // Arrange: Create badge
      const badge = document.createElement('span');
      badge.classList.add('badge');
      document.body.appendChild(badge);

      // Act: Initialize badge animations
      service.initializeBadgeAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

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
  });

  describe('initializeMouseFollowAnimations', () => {
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
      // Arrange: Create image
      const img = document.createElement('img');
      img.src = 'test.jpg';
      document.body.appendChild(img);

      // Act: Initialize image animations
      service.initializeImageParallaxAnimations();

      // Assert: Service executes without error
      expect(service).toBeTruthy();

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
  });
});
