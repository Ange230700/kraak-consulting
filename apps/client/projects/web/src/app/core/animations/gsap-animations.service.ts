import { Injectable, NgZone, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MOTION_MEDIA_QUERIES = {
  desktop: '(min-width: 768px)',
  mobile: '(max-width: 767px)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;

const MOTION_DEBUG = {
  queryParam: 'motionDebug',
  localStorageKey: 'kraak:motion-debug',
} as const;

const FIGURE_MOTION_PRESETS = {
  desktop: {
    y: 26,
    duration: 0.75,
    ease: 'power3.out',
    start: 'top 82%',
    staggerDelay: 0.08,
  },
  mobile: {
    y: 16,
    duration: 0.55,
    ease: 'power3.out',
    start: 'top 92%',
    staggerDelay: 0.05,
  },
} as const;

const REVERSIBLE_SCROLL_PRESETS = {
  desktop: {
    y: 18,
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out',
    staggerDelay: 0.06,
    start: 'top 86%',
    end: 'top 60%',
    toggleActions: 'play none none reverse',
  },
  mobile: {
    y: 10,
    opacity: 0,
    duration: 0.45,
    ease: 'power2.out',
    staggerDelay: 0.03,
    start: 'top 93%',
    end: 'top 72%',
    toggleActions: 'play none none none',
  },
} as const;

const LIST_ITEM_MOTION_PRESETS = {
  desktop: {
    x: -20,
    duration: 0.6,
    ease: 'power3.out',
    start: 'top 90%',
    staggerDelay: 0.08,
  },
  mobile: {
    x: -12,
    duration: 0.5,
    ease: 'power3.out',
    start: 'top 94%',
    staggerDelay: 0.05,
  },
} as const;

const TEXT_REVEAL_PRESETS = {
  desktop: {
    y: 10,
    duration: 0.7,
    ease: 'power2.out',
    start: 'top 85%',
  },
  mobile: {
    y: 6,
    duration: 0.55,
    ease: 'power2.out',
    start: 'top 92%',
  },
} as const;

const SECTION_MOTION_PRESETS = {
  desktop: {
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
    start: 'top 75%',
  },
  mobile: {
    y: 24,
    duration: 0.62,
    ease: 'power3.out',
    start: 'top 84%',
  },
} as const;

const ICON_MOTION_PRESETS = {
  desktop: {
    enter: {
      scale: 1.2,
      rotate: 5,
      duration: 0.3,
      ease: 'back.out(1.7)',
    },
    leave: {
      scale: 1,
      rotate: 0,
      duration: 0.3,
      ease: 'back.out(1.7)',
    },
  },
  mobile: {
    enter: {
      scale: 1.1,
      rotate: 2,
      duration: 0.22,
      ease: 'power2.out',
    },
    leave: {
      scale: 1,
      rotate: 0,
      duration: 0.2,
      ease: 'power2.out',
    },
  },
} as const;

const BADGE_MOTION_PRESETS = {
  desktop: {
    intro: {
      scale: 0.8,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    },
    pulse: {
      scale: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    },
  },
  mobile: {
    intro: {
      scale: 0.9,
      duration: 0.4,
      ease: 'power2.out',
    },
    pulse: {
      scale: 1.02,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    },
  },
} as const;

const IMAGE_PARALLAX_PRESETS = {
  desktop: {
    reveal: {
      scale: 0.95,
      duration: 0.8,
      ease: 'power2.out',
      start: 'top 80%',
    },
    parallax: {
      y: -30,
      duration: 1,
      start: 'top center',
      end: 'bottom center',
      scrub: 0.5,
    },
  },
  mobile: {
    reveal: {
      scale: 0.98,
      duration: 0.6,
      ease: 'power2.out',
      start: 'top 90%',
    },
    parallax: {
      y: -16,
      duration: 0.8,
      start: 'top 90%',
      end: 'bottom 60%',
      scrub: 0.35,
    },
  },
} as const;

/**
 * Service centralisant la gestion des animations GSAP
 * Fournit des méthodes réutilisables pour les animations scroll-triggered et les transitions interactives
 * Gère également les transitions de page, les animations de formulaire, et les micro-interactions
 */
@Injectable({
  providedIn: 'root',
})
export class GsapAnimationsService {
  private readonly ngZone = inject(NgZone);
  private readonly activeAnimations = new Map<HTMLElement, gsap.core.Tween>();
  private readonly listenerCleanupCallbacks: (() => void)[] = [];
  private readonly matchMediaContexts: gsap.MatchMedia[] = [];

  private isMotionDebugEnabled(): boolean {
    if (globalThis.window === undefined) {
      return false;
    }

    const fromQuery =
      typeof URLSearchParams !== 'undefined' && globalThis.window.location
        ? new URLSearchParams(globalThis.window.location.search).get(
            MOTION_DEBUG.queryParam,
          )
        : null;

    const fromStorage =
      globalThis.window.localStorage === undefined
        ? null
        : globalThis.window.localStorage.getItem(MOTION_DEBUG.localStorageKey);

    return fromQuery === '1' || fromStorage === '1';
  }

  private motionDebugLog(
    message: string,
    context?: Record<string, unknown>,
  ): void {
    if (!this.isMotionDebugEnabled()) {
      return;
    }

    if (context) {
      console.debug(`[motion] ${message}`, context);
      return;
    }

    console.debug(`[motion] ${message}`);
  }

  private resolveNonOverlappingTargets(selector: string): Element[] {
    if (typeof document === 'undefined') {
      return [];
    }

    const targets = Array.from(document.querySelectorAll(selector));
    const filteredTargets = targets.filter(
      (target) => !target.hasAttribute('kraakRevealOnScroll'),
    );

    const skippedCount = targets.length - filteredTargets.length;
    if (skippedCount > 0) {
      this.motionDebugLog('Skipped overlapping GSAP targets', {
        selector,
        skippedCount,
      });
    }

    return filteredTargets;
  }

  private canAnimate(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    if (
      globalThis.window === undefined ||
      typeof globalThis.matchMedia !== 'function'
    ) {
      return true;
    }

    return !globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private prefersReducedMotion(): boolean {
    if (
      globalThis.window === undefined ||
      typeof globalThis.matchMedia !== 'function'
    ) {
      return false;
    }

    return globalThis.matchMedia(MOTION_MEDIA_QUERIES.reducedMotion).matches;
  }

  private isMobileViewport(): boolean {
    if (
      globalThis.window === undefined ||
      typeof globalThis.matchMedia !== 'function'
    ) {
      return false;
    }

    return globalThis.matchMedia('(max-width: 767px)').matches;
  }

  private supportsHoverInteractions(): boolean {
    if (
      globalThis.window === undefined ||
      typeof globalThis.matchMedia !== 'function'
    ) {
      return true;
    }

    return globalThis.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  /**
   * Initialise les animations scroll-triggered pour les blocs visuels (figures)
   * Chaque figure se révèle au scroll avec un effet de fade-in + slide-up
   */
  initializeFigureAnimations(selector = 'figure.reveal-on-scroll'): void {
    if (!this.canAnimate()) {
      return;
    }

    if (this.prefersReducedMotion()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const figures = document.querySelectorAll(selector);
      if (figures.length === 0) {
        this.motionDebugLog('No figure targets found', { selector });
        return;
      }

      const context = gsap.matchMedia();
      this.matchMediaContexts.push(context);

      context.add(MOTION_MEDIA_QUERIES.desktop, () => {
        figures.forEach((figure, index) => {
          gsap.from(figure, {
            y: FIGURE_MOTION_PRESETS.desktop.y,
            duration: FIGURE_MOTION_PRESETS.desktop.duration,
            ease: FIGURE_MOTION_PRESETS.desktop.ease,
            scrollTrigger: {
              trigger: figure,
              start: FIGURE_MOTION_PRESETS.desktop.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
            delay: index * FIGURE_MOTION_PRESETS.desktop.staggerDelay,
          });
        });
      });

      context.add(MOTION_MEDIA_QUERIES.mobile, () => {
        figures.forEach((figure, index) => {
          gsap.from(figure, {
            y: FIGURE_MOTION_PRESETS.mobile.y,
            duration: FIGURE_MOTION_PRESETS.mobile.duration,
            ease: FIGURE_MOTION_PRESETS.mobile.ease,
            scrollTrigger: {
              trigger: figure,
              start: FIGURE_MOTION_PRESETS.mobile.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
            delay: index * FIGURE_MOTION_PRESETS.mobile.staggerDelay,
          });
        });
      });
    });
  }

  /**
   * Active des reveals pilotés par ScrollTrigger avec reverse au retour scroll (desktop)
   * et lecture simple sans reverse sur mobile.
   */
  initializeReversibleScrollAnimations(
    selector = '[data-motion="reversible"]',
  ): void {
    if (!this.canAnimate()) {
      return;
    }

    if (this.prefersReducedMotion()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const elements = this.resolveNonOverlappingTargets(selector);
      if (elements.length === 0) {
        this.motionDebugLog('No reversible targets found', { selector });
        return;
      }

      this.motionDebugLog('Initialize reversible targets', {
        selector,
        count: elements.length,
      });

      const context = gsap.matchMedia();
      this.matchMediaContexts.push(context);

      context.add(MOTION_MEDIA_QUERIES.desktop, () => {
        elements.forEach((element, index) => {
          gsap.from(element, {
            y: REVERSIBLE_SCROLL_PRESETS.desktop.y,
            opacity: REVERSIBLE_SCROLL_PRESETS.desktop.opacity,
            duration: REVERSIBLE_SCROLL_PRESETS.desktop.duration,
            ease: REVERSIBLE_SCROLL_PRESETS.desktop.ease,
            delay: index * REVERSIBLE_SCROLL_PRESETS.desktop.staggerDelay,
            scrollTrigger: {
              trigger: element,
              start: REVERSIBLE_SCROLL_PRESETS.desktop.start,
              end: REVERSIBLE_SCROLL_PRESETS.desktop.end,
              toggleActions: REVERSIBLE_SCROLL_PRESETS.desktop.toggleActions,
              markers: this.isMotionDebugEnabled(),
            },
          });
        });
      });

      context.add(MOTION_MEDIA_QUERIES.mobile, () => {
        elements.forEach((element, index) => {
          gsap.from(element, {
            y: REVERSIBLE_SCROLL_PRESETS.mobile.y,
            opacity: REVERSIBLE_SCROLL_PRESETS.mobile.opacity,
            duration: REVERSIBLE_SCROLL_PRESETS.mobile.duration,
            ease: REVERSIBLE_SCROLL_PRESETS.mobile.ease,
            delay: index * REVERSIBLE_SCROLL_PRESETS.mobile.staggerDelay,
            scrollTrigger: {
              trigger: element,
              start: REVERSIBLE_SCROLL_PRESETS.mobile.start,
              end: REVERSIBLE_SCROLL_PRESETS.mobile.end,
              toggleActions: REVERSIBLE_SCROLL_PRESETS.mobile.toggleActions,
              markers: this.isMotionDebugEnabled(),
            },
          });
        });
      });
    });
  }

  /**
   * Ajoute des transitions interactives au hover sur les articles et cartes
   * Animation de scale + shadow légère au survol
   */
  initializeInteractiveCardAnimations(selector = 'article'): void {
    // Ensure we're in the browser environment (not SSR)
    if (!this.canAnimate()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const isMobile = this.isMobileViewport();
      const supportsHover = this.supportsHoverInteractions();
      const cards = document.querySelectorAll(selector);

      cards.forEach((card) => {
        const onPointerEnter = () => {
          gsap.to(card, {
            y: isMobile ? -1 : -3,
            boxShadow: isMobile
              ? '0 10px 18px -8px rgba(0, 0, 0, 0.12)'
              : '0 18px 28px -8px rgba(0, 0, 0, 0.14)',
            duration: isMobile ? 0.2 : 0.28,
            ease: 'power2.out',
          });
        };

        const onPointerLeave = () => {
          gsap.to(card, {
            y: 0,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            duration: isMobile ? 0.18 : 0.24,
            ease: 'power2.out',
          });
        };

        card.addEventListener('mouseenter', onPointerEnter);
        card.addEventListener('mouseleave', onPointerLeave);
        card.addEventListener('focusin', onPointerEnter);
        card.addEventListener('focusout', onPointerLeave);

        if (!supportsHover) {
          card.addEventListener('touchstart', onPointerEnter, {
            passive: true,
          });
          card.addEventListener('touchend', onPointerLeave, {
            passive: true,
          });
        }

        this.listenerCleanupCallbacks.push(() => {
          card.removeEventListener('mouseenter', onPointerEnter);
          card.removeEventListener('mouseleave', onPointerLeave);
          card.removeEventListener('focusin', onPointerEnter);
          card.removeEventListener('focusout', onPointerLeave);
          card.removeEventListener('touchstart', onPointerEnter);
          card.removeEventListener('touchend', onPointerLeave);
        });
      });
    });
  }

  /**
   * Anime l'entrée des éléments au chargement initial de la page
   * Effet de fade-in progressif pour les sections principales
   */
  initializePageEntranceAnimations(): void {
    // Ensure we're in the browser environment (not SSR)
    if (!this.canAnimate()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const firstSection = document.querySelector('section:first-child');

      // Hero section entrance
      if (firstSection) {
        gsap.from(firstSection, {
          duration: 1,
          ease: 'power3.out',
          y: 12,
        });
      }

      const headings = document.querySelectorAll('h1, h2');

      // Main headings progressive reveal
      if (headings.length > 0) {
        gsap.from(headings, {
          y: 20,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
          },
        });
      }
    });
  }

  /**
   * Anime les boutons et liens avec effet hover fluide
   * Ajoute des transitions sur opacity, scale et couleur
   */
  initializeButtonTransitions(
    selector = 'button, [pButton], a.btn, a.link-btn',
  ): void {
    if (!this.canAnimate()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const isMobile = this.isMobileViewport();
      const supportsHover = this.supportsHoverInteractions();
      const buttons = document.querySelectorAll(selector);

      buttons.forEach((button) => {
        const onHoverEnter = () => {
          gsap.killTweensOf(button);
          gsap.to(button, {
            scale: isMobile ? 1.015 : 1.03,
            duration: isMobile ? 0.16 : 0.22,
            ease: 'power2.out',
          });
        };

        const onHoverLeave = () => {
          gsap.killTweensOf(button);
          gsap.to(button, {
            scale: 1,
            duration: isMobile ? 0.16 : 0.22,
            ease: 'power2.out',
          });
        };

        const onPressStart = () => {
          gsap.to(button, {
            scale: 0.98,
            duration: 0.1,
          });
        };

        const onPressEnd = () => {
          gsap.to(button, {
            scale: isMobile ? 1.01 : 1.02,
            duration: 0.14,
            ease: 'power2.out',
          });
        };

        button.addEventListener('mouseenter', onHoverEnter);
        button.addEventListener('mouseleave', onHoverLeave);

        button.addEventListener('mousedown', onPressStart);
        button.addEventListener('mouseup', onPressEnd);

        if (!supportsHover) {
          button.addEventListener('touchstart', onPressStart, {
            passive: true,
          });
          button.addEventListener('touchend', onPressEnd, {
            passive: true,
          });
        }

        this.listenerCleanupCallbacks.push(() => {
          button.removeEventListener('mouseenter', onHoverEnter);
          button.removeEventListener('mouseleave', onHoverLeave);
          button.removeEventListener('mousedown', onPressStart);
          button.removeEventListener('mouseup', onPressEnd);
          button.removeEventListener('touchstart', onPressStart);
          button.removeEventListener('touchend', onPressEnd);
        });
      });
    });
  }

  /**
   * Anime les champs de formulaire avec des transitions d'entrée/sortie de focus
   * Focus expand + couleur highlight
   */
  initializeFormFieldAnimations(
    selector = 'input, textarea, [pInputText]',
  ): void {
    if (!this.canAnimate()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const fields = document.querySelectorAll(selector);

      fields.forEach((field) => {
        // Focus in
        field.addEventListener('focus', () => {
          gsap.to(field, {
            boxShadow: '0 0 0 3px rgba(0, 200, 200, 0.1)',
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        // Focus out
        field.addEventListener('blur', () => {
          gsap.to(field, {
            boxShadow: '0 0 0 0px rgba(0, 200, 200, 0)',
            duration: 0.3,
            ease: 'power2.out',
          });
        });
      });
    });
  }

  /**
   * Anime les listes avec un effet stagger (chaque item entre après le précédent)
   * Parfait pour les listes de ressources, programmes, services
   */
  initializeListItemAnimations(selector = 'li, .list-item'): void {
    if (!this.canAnimate()) {
      return;
    }

    if (this.prefersReducedMotion()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const items = document.querySelectorAll(selector);
      if (items.length === 0) {
        this.motionDebugLog('No list item targets found', { selector });
        return;
      }

      const context = gsap.matchMedia();
      this.matchMediaContexts.push(context);

      context.add(MOTION_MEDIA_QUERIES.desktop, () => {
        items.forEach((item, index) => {
          gsap.from(item, {
            x: LIST_ITEM_MOTION_PRESETS.desktop.x,
            duration: LIST_ITEM_MOTION_PRESETS.desktop.duration,
            ease: LIST_ITEM_MOTION_PRESETS.desktop.ease,
            delay: index * LIST_ITEM_MOTION_PRESETS.desktop.staggerDelay,
            scrollTrigger: {
              trigger: item,
              start: LIST_ITEM_MOTION_PRESETS.desktop.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
          });
        });
      });

      context.add(MOTION_MEDIA_QUERIES.mobile, () => {
        items.forEach((item, index) => {
          gsap.from(item, {
            x: LIST_ITEM_MOTION_PRESETS.mobile.x,
            duration: LIST_ITEM_MOTION_PRESETS.mobile.duration,
            ease: LIST_ITEM_MOTION_PRESETS.mobile.ease,
            delay: index * LIST_ITEM_MOTION_PRESETS.mobile.staggerDelay,
            scrollTrigger: {
              trigger: item,
              start: LIST_ITEM_MOTION_PRESETS.mobile.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
          });
        });
      });
    });
  }

  /**
   * Anime les éléments textes avec un effet d'apparition progressive
   * Parfait pour les paragraphes, descriptions
   */
  initializeTextRevealAnimations(selector = 'p'): void {
    if (!this.canAnimate()) {
      return;
    }

    if (this.prefersReducedMotion()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const texts = document.querySelectorAll(selector);
      if (texts.length === 0) {
        this.motionDebugLog('No text targets found', { selector });
        return;
      }

      const context = gsap.matchMedia();
      this.matchMediaContexts.push(context);

      context.add(MOTION_MEDIA_QUERIES.desktop, () => {
        texts.forEach((text) => {
          gsap.from(text, {
            y: TEXT_REVEAL_PRESETS.desktop.y,
            duration: TEXT_REVEAL_PRESETS.desktop.duration,
            ease: TEXT_REVEAL_PRESETS.desktop.ease,
            scrollTrigger: {
              trigger: text,
              start: TEXT_REVEAL_PRESETS.desktop.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
          });
        });
      });

      context.add(MOTION_MEDIA_QUERIES.mobile, () => {
        texts.forEach((text) => {
          gsap.from(text, {
            y: TEXT_REVEAL_PRESETS.mobile.y,
            duration: TEXT_REVEAL_PRESETS.mobile.duration,
            ease: TEXT_REVEAL_PRESETS.mobile.ease,
            scrollTrigger: {
              trigger: text,
              start: TEXT_REVEAL_PRESETS.mobile.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
          });
        });
      });
    });
  }

  /**
   * Anime les icônes avec un effet de scale et rotation subtile
   */
  initializeIconAnimations(selector = 'svg, i, [icon]'): void {
    if (!this.canAnimate()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const preset = this.isMobileViewport()
        ? ICON_MOTION_PRESETS.mobile
        : ICON_MOTION_PRESETS.desktop;
      const icons = document.querySelectorAll(selector);
      if (icons.length === 0) {
        return;
      }

      icons.forEach((icon) => {
        const onMouseEnter = () => {
          gsap.to(icon, preset.enter);
        };

        const onMouseLeave = () => {
          gsap.to(icon, preset.leave);
        };

        icon.addEventListener('mouseenter', onMouseEnter);
        icon.addEventListener('mouseleave', onMouseLeave);

        this.listenerCleanupCallbacks.push(() => {
          icon.removeEventListener('mouseenter', onMouseEnter);
          icon.removeEventListener('mouseleave', onMouseLeave);
        });
      });
    });
  }

  /**
   * Crée une transition de page fluide (fade out -> fade in)
   * À utiliser lors de changements de route
   */
  createPageTransition(): Promise<void> {
    if (!this.canAnimate()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.ngZone.runOutsideAngular(() => {
        const main = document.querySelector('main');
        if (main) {
          gsap.to(main, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: resolve,
          });
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Anime l'entrée d'une nouvelle page (utilisé après la transition)
   */
  animatePageIn(): void {
    if (!this.canAnimate()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const main = document.querySelector('main');
      if (main) {
        gsap.from(main, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    });
  }

  /**
   * Anime les sections de la page avec un effet de reveal au scroll
   * Chaque section se révèle avec un slide subtle
   */
  initializeSectionAnimations(selector = 'section'): void {
    if (!this.canAnimate()) {
      return;
    }

    if (this.prefersReducedMotion()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const sections = document.querySelectorAll(selector);
      if (sections.length === 0) {
        this.motionDebugLog('No section targets found', { selector });
        return;
      }

      const context = gsap.matchMedia();
      this.matchMediaContexts.push(context);

      context.add(MOTION_MEDIA_QUERIES.desktop, () => {
        sections.forEach((section) => {
          gsap.from(section, {
            y: SECTION_MOTION_PRESETS.desktop.y,
            duration: SECTION_MOTION_PRESETS.desktop.duration,
            ease: SECTION_MOTION_PRESETS.desktop.ease,
            scrollTrigger: {
              trigger: section,
              start: SECTION_MOTION_PRESETS.desktop.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
          });
        });
      });

      context.add(MOTION_MEDIA_QUERIES.mobile, () => {
        sections.forEach((section) => {
          gsap.from(section, {
            y: SECTION_MOTION_PRESETS.mobile.y,
            duration: SECTION_MOTION_PRESETS.mobile.duration,
            ease: SECTION_MOTION_PRESETS.mobile.ease,
            scrollTrigger: {
              trigger: section,
              start: SECTION_MOTION_PRESETS.mobile.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
          });
        });
      });
    });
  }

  /**
   * Anime les badges et étiquettes avec un ping/pulse effect
   * Utile pour les indicateurs, nouveautés
   */
  initializeBadgeAnimations(selector = '.badge, .tag, .label'): void {
    if (!this.canAnimate()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const preset = this.isMobileViewport()
        ? BADGE_MOTION_PRESETS.mobile
        : BADGE_MOTION_PRESETS.desktop;
      const badges = document.querySelectorAll(selector);
      if (badges.length === 0) {
        return;
      }

      badges.forEach((badge) => {
        gsap.from(badge, preset.intro);

        // Subtle pulse animation
        gsap.to(badge, preset.pulse);
      });
    });
  }

  /**
   * Crée un curseur souris personnalisé avec animation de suivi
   * Améliore l'interactivité globale
   */
  initializeMouseFollowAnimations(): void {
    if (!this.canAnimate()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const interactiveElements = document.querySelectorAll(
        'a, button, [role="button"], input[type="submit"]',
      );

      interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
          gsap.to(el, {
            filter: 'brightness(1.1)',
            duration: 0.2,
          });
        });

        el.addEventListener('mouseleave', () => {
          gsap.to(el, {
            filter: 'brightness(1)',
            duration: 0.2,
          });
        });
      });
    });
  }

  /**
   * Anime les images avec un effet de zoom au scroll
   * Parallax subtile pour la profondeur
   */
  initializeImageParallaxAnimations(selector = 'img'): void {
    if (!this.canAnimate()) {
      return;
    }

    if (this.prefersReducedMotion()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const images = document.querySelectorAll(selector);
      if (images.length === 0) {
        this.motionDebugLog('No image targets found', { selector });
        return;
      }

      const context = gsap.matchMedia();
      this.matchMediaContexts.push(context);

      context.add(MOTION_MEDIA_QUERIES.desktop, () => {
        images.forEach((img) => {
          gsap.from(img, {
            scale: IMAGE_PARALLAX_PRESETS.desktop.reveal.scale,
            duration: IMAGE_PARALLAX_PRESETS.desktop.reveal.duration,
            ease: IMAGE_PARALLAX_PRESETS.desktop.reveal.ease,
            scrollTrigger: {
              trigger: img,
              start: IMAGE_PARALLAX_PRESETS.desktop.reveal.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
          });

          gsap.to(img, {
            y: IMAGE_PARALLAX_PRESETS.desktop.parallax.y,
            duration: IMAGE_PARALLAX_PRESETS.desktop.parallax.duration,
            scrollTrigger: {
              trigger: img,
              start: IMAGE_PARALLAX_PRESETS.desktop.parallax.start,
              end: IMAGE_PARALLAX_PRESETS.desktop.parallax.end,
              scrub: IMAGE_PARALLAX_PRESETS.desktop.parallax.scrub,
              markers: this.isMotionDebugEnabled(),
            },
          });
        });
      });

      context.add(MOTION_MEDIA_QUERIES.mobile, () => {
        images.forEach((img) => {
          gsap.from(img, {
            scale: IMAGE_PARALLAX_PRESETS.mobile.reveal.scale,
            duration: IMAGE_PARALLAX_PRESETS.mobile.reveal.duration,
            ease: IMAGE_PARALLAX_PRESETS.mobile.reveal.ease,
            scrollTrigger: {
              trigger: img,
              start: IMAGE_PARALLAX_PRESETS.mobile.reveal.start,
              markers: this.isMotionDebugEnabled(),
              once: true,
            },
          });

          gsap.to(img, {
            y: IMAGE_PARALLAX_PRESETS.mobile.parallax.y,
            duration: IMAGE_PARALLAX_PRESETS.mobile.parallax.duration,
            scrollTrigger: {
              trigger: img,
              start: IMAGE_PARALLAX_PRESETS.mobile.parallax.start,
              end: IMAGE_PARALLAX_PRESETS.mobile.parallax.end,
              scrub: IMAGE_PARALLAX_PRESETS.mobile.parallax.scrub,
              markers: this.isMotionDebugEnabled(),
            },
          });
        });
      });
    });
  }

  /**
   * Nettoie les animations GSAP et ScrollTrigger (important pour éviter les memory leaks)
   */
  killAllAnimations(): void {
    // Ensure we're in the browser environment (not SSR)
    if (typeof document === 'undefined') {
      return;
    }

    gsap.killTweensOf('*');
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    this.matchMediaContexts.forEach((context) => context.revert());
    this.matchMediaContexts.length = 0;
    this.listenerCleanupCallbacks.forEach((cleanup) => cleanup());
    this.listenerCleanupCallbacks.length = 0;
    this.activeAnimations.clear();
  }
}
