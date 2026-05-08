import { Injectable, NgZone, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Service centralisant la gestion des animations GSAP
 * Fournit des méthodes réutilisables pour les animations scroll-triggered et les transitions interactives
 */
@Injectable({
  providedIn: 'root',
})
export class GsapAnimationsService {
  private readonly ngZone = inject(NgZone);

  /**
   * Initialise les animations scroll-triggered pour les blocs visuels (figures)
   * Chaque figure se révèle au scroll avec un effet de fade-in + slide-up
   */
  initializeFigureAnimations(selector = 'figure.reveal-on-scroll'): void {
    this.ngZone.runOutsideAngular(() => {
      const figures = document.querySelectorAll(selector);

      figures.forEach((figure, index) => {
        gsap.from(figure, {
          opacity: 0,
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
    this.ngZone.runOutsideAngular(() => {
      // Hero section entrance
      gsap.from('section:first-child', {
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // Main headings progressive reveal
      gsap.from('h1, h2', {
        opacity: 0,
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
   * Nettoie les animations GSAP et ScrollTrigger (important pour eviter les memory leaks)
   */
  killAllAnimations(): void {
    gsap.killTweensOf('*');
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
}
