import { Injectable, NgZone, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

  /**
   * Initialise les animations scroll-triggered pour les blocs visuels (figures)
   * Chaque figure se révèle au scroll avec un effet de fade-in + slide-up
   */
  initializeFigureAnimations(selector = 'figure.reveal-on-scroll'): void {
    // Ensure we're in the browser environment (not SSR)
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const figures = document.querySelectorAll(selector);

      figures.forEach((figure, index) => {
        gsap.from(figure, {
          y: 30,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: figure,
            start: 'top 80%',
            markers: false,
            once: true,
          },
          delay: index * 0.1, // Stagger slight delay for visual flow
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
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const cards = document.querySelectorAll(selector);

      cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -4,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12)',
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            duration: 0.3,
            ease: 'power2.out',
          });
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
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      // Hero section entrance
      gsap.from('section:first-child', {
        duration: 1,
        ease: 'power3.out',
        y: 12,
      });

      // Main headings progressive reveal
      gsap.from('h1, h2', {
        y: 20,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
        },
      });
    });
  }

  /**
   * Anime les boutons et liens avec effet hover fluide
   * Ajoute des transitions sur opacity, scale et couleur
   */
  initializeButtonTransitions(
    selector = 'button, [pButton], a.btn, a.link-btn',
  ): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const buttons = document.querySelectorAll(selector);

      buttons.forEach((button) => {
        // Hover enter
        button.addEventListener('mouseenter', () => {
          gsap.killTweensOf(button);
          gsap.to(button, {
            scale: 1.05,
            duration: 0.25,
            ease: 'power2.out',
          });
        });

        // Hover leave
        button.addEventListener('mouseleave', () => {
          gsap.killTweensOf(button);
          gsap.to(button, {
            scale: 1,
            duration: 0.25,
            ease: 'power2.out',
          });
        });

        // Click feedback
        button.addEventListener('mousedown', () => {
          gsap.to(button, {
            scale: 0.98,
            duration: 0.1,
          });
        });

        button.addEventListener('mouseup', () => {
          gsap.to(button, {
            scale: 1.05,
            duration: 0.15,
            ease: 'elastic.out(1, 0.5)',
          });
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
    if (typeof document === 'undefined') {
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
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const items = document.querySelectorAll(selector);

      items.forEach((item, index) => {
        gsap.from(item, {
          x: -20,
          duration: 0.6,
          ease: 'power3.out',
          delay: index * 0.08,
          scrollTrigger: {
            trigger: item,
            start: 'top 90%',
            once: true,
          },
        });
      });
    });
  }

  /**
   * Anime les éléments textes avec un effet d'apparition progressive
   * Parfait pour les paragraphes, descriptions
   */
  initializeTextRevealAnimations(selector = 'p'): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const texts = document.querySelectorAll(selector);

      texts.forEach((text) => {
        gsap.from(text, {
          y: 10,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: text,
            start: 'top 85%',
            once: true,
          },
        });
      });
    });
  }

  /**
   * Anime les icônes avec un effet de scale et rotation subtile
   */
  initializeIconAnimations(selector = 'svg, i, [icon]'): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const icons = document.querySelectorAll(selector);

      icons.forEach((icon) => {
        // Hover scale
        icon.addEventListener('mouseenter', () => {
          gsap.to(icon, {
            scale: 1.2,
            rotate: 5,
            duration: 0.3,
            ease: 'back.out(1.7)',
          });
        });

        icon.addEventListener('mouseleave', () => {
          gsap.to(icon, {
            scale: 1,
            rotate: 0,
            duration: 0.3,
            ease: 'back.out(1.7)',
          });
        });
      });
    });
  }

  /**
   * Crée une transition de page fluide (fade out -> fade in)
   * À utiliser lors de changements de route
   */
  createPageTransition(): Promise<void> {
    if (typeof document === 'undefined') {
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
    if (typeof document === 'undefined') {
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
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const sections = document.querySelectorAll(selector);

      sections.forEach((section) => {
        gsap.from(section, {
          y: 40,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            once: true,
          },
        });
      });
    });
  }

  /**
   * Anime les badges et étiquettes avec un ping/pulse effect
   * Utile pour les indicateurs, nouveautés
   */
  initializeBadgeAnimations(selector = '.badge, .tag, .label'): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const badges = document.querySelectorAll(selector);

      badges.forEach((badge) => {
        gsap.from(badge, {
          scale: 0.8,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
        });

        // Subtle pulse animation
        gsap.to(badge, {
          scale: 1.05,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });
    });
  }

  /**
   * Crée un curseur souris personnalisé avec animation de suivi
   * Améliore l'interactivité globale
   */
  initializeMouseFollowAnimations(): void {
    if (typeof document === 'undefined') {
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
    if (typeof document === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const images = document.querySelectorAll(selector);

      images.forEach((img) => {
        gsap.from(img, {
          scale: 0.95,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: img,
            start: 'top 80%',
            once: true,
          },
        });

        // Subtle parallax on scroll
        gsap.to(img, {
          y: -30,
          duration: 1,
          scrollTrigger: {
            trigger: img,
            start: 'top center',
            end: 'bottom center',
            scrub: 0.5,
            markers: false,
          },
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
    this.activeAnimations.clear();
  }
}
