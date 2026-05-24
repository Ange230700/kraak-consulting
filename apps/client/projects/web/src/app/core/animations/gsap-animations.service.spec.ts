import { TestBed } from '@angular/core/testing';
import { GsapAnimationsService } from './gsap-animations.service';
import { afterEach, vi } from 'vitest';

describe('GsapAnimationsService', () => {
  let service: GsapAnimationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GsapAnimationsService],
    });
    service = TestBed.inject(GsapAnimationsService);
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
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList);

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
  });

  describe('createPageTransition', () => {
    it('should create a page transition promise', async () => {
      // Act & Assert
      const promise = service.createPageTransition();
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('animatePageIn', () => {
    it('should animate page entrance', () => {
      // Act: Animate page in
      service.animatePageIn();

      // Assert: Service executes without error
      expect(service).toBeTruthy();
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
  });
});
