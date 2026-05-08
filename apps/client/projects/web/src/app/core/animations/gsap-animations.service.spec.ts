import { TestBed } from '@angular/core/testing';
import { GsapAnimationsService } from './gsap-animations.service';
import { afterEach } from 'vitest';

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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeFigureAnimations', () => {
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
      document.body.removeChild(div);
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
      document.body.removeChild(div);
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
});
