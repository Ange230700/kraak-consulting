import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { buildAvatarCircleUrl } from '../brand/brand-constants';

export interface Testimonial {
  id: number;
  name: string;
  job: string;
  avatar: string;
  comment: string;
}

@Component({
  selector: 'kraak-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
})
export class Testimonials {
  @Input() items: Testimonial[] = [];
  @Input() placeholder = true;
  readonly fallbackTestimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Aïcha K.',
      job: 'Jeune professionnelle',
      avatar: buildAvatarCircleUrl('avatar-m-16.png'),
      comment:
        "Grâce à KRAAK, j'ai clarifié mon objectif de mobilité et identifié les étapes concrètes pour renforcer mon profil avant de lancer mes démarches.",
    },
    {
      id: 2,
      name: 'Moussa T.',
      job: 'Entrepreneur',
      avatar: buildAvatarCircleUrl('avatar-f-18.png'),
      comment:
        "L'accompagnement projet nous a permis de transformer une idée floue en feuille de route structurée, avec des priorités lisibles et des actions réalistes.",
    },
    {
      id: 3,
      name: 'Clarisse N.',
      job: 'Responsable RH',
      avatar: buildAvatarCircleUrl('avatar-m-1.png'),
      comment:
        'Le format entreprise est sobre, utile et orienté terrain. Il aide vraiment à travailler la cohésion, le leadership et la montée en compétences.',
    },
  ];

  readonly currentIndex = signal(0);
  readonly isAnimating = signal(false);
  readonly animationDirection = signal<'next' | 'prev' | null>(null);

  readonly testimonials = computed(() => {
    if (this.items.length > 0) {
      return this.items;
    }

    if (!this.placeholder) {
      return [];
    }

    return this.fallbackTestimonials;
  });

  readonly isPreviewMode = computed(
    () => this.items.length === 0 && this.placeholder,
  );

  readonly visibleCards = computed(() => {
    const source = this.testimonials();
    const total = source.length;

    if (total === 0) {
      return [];
    }

    if (total === 1) {
      return [source[0]];
    }

    if (total === 2) {
      const first = source[this.currentIndex() % total];
      const second = source[(this.currentIndex() + 1) % total];
      return [first, second];
    }

    if (this.animationDirection() === 'prev') {
      const newCurrentIndex = (this.currentIndex() - 1 + total) % total;
      return [
        source[newCurrentIndex],
        source[this.currentIndex()],
        source[(this.currentIndex() + 1) % total],
      ];
    }

    return [
      source[this.currentIndex()],
      source[(this.currentIndex() + 1) % total],
      source[(this.currentIndex() + 2) % total],
    ];
  });

  getCardClasses(index: number): string {
    switch (index) {
      case 0:
        return 'z-30';
      case 1:
        return 'z-20';
      case 2:
        return 'z-10';
      default:
        return '';
    }
  }

  getCardStyles(index: number): Record<string, string> {
    const source = this.testimonials();
    if (source.length <= 2) {
      return {
        transform: 'rotate(0deg) scale(1)',
        opacity: '1',
      };
    }

    if (this.isAnimating()) {
      if (this.animationDirection() === 'next') {
        switch (index) {
          case 0:
            return {
              transform:
                'translateX(120px) translateY(60px) rotate(15deg) scale(0.85)',
              opacity: '0.6',
              zIndex: '5',
            };
          case 1:
            return { transform: 'rotate(0deg) scale(1)', opacity: '1' };
          case 2:
            return { transform: 'rotate(5.6deg) scale(0.95)', opacity: '0.9' };
          default:
            return { transform: 'rotate(0deg) scale(1)', opacity: '1' };
        }
      }

      if (this.animationDirection() === 'prev') {
        switch (index) {
          case 0:
            return { transform: 'rotate(0deg) scale(1)', opacity: '1' };
          case 1:
            return {
              transform:
                'translateX(-120px) translateY(60px) rotate(-15deg) scale(0.85)',
              opacity: '0.6',
              zIndex: '5',
            };
          case 2:
            return { transform: 'rotate(5.6deg) scale(0.95)', opacity: '0.9' };
          default:
            return { transform: 'rotate(0deg) scale(1)', opacity: '1' };
        }
      }
    }

    switch (index) {
      case 0:
        return { transform: 'rotate(0deg) scale(1)', opacity: '1' };
      case 1:
        return { transform: 'rotate(5.6deg) scale(0.95)', opacity: '0.9' };
      case 2:
        return { transform: 'rotate(-5deg) scale(0.85)', opacity: '0.8' };
      default:
        return { transform: 'rotate(0deg) scale(1)', opacity: '1' };
    }
  }

  nextCard(): void {
    if (this.isAnimating() || this.testimonials().length <= 2) {
      return;
    }

    this.isAnimating.set(true);
    this.animationDirection.set('next');

    setTimeout(() => {
      this.currentIndex.set(
        (this.currentIndex() + 1) % this.testimonials().length,
      );
      this.isAnimating.set(false);
      this.animationDirection.set(null);
    }, 250);
  }

  prevCard(): void {
    if (this.isAnimating() || this.testimonials().length <= 2) {
      return;
    }

    this.isAnimating.set(true);
    this.animationDirection.set('prev');

    setTimeout(() => {
      this.currentIndex.set(
        (this.currentIndex() - 1 + this.testimonials().length) %
          this.testimonials().length,
      );
      this.isAnimating.set(false);
      this.animationDirection.set(null);
    }, 250);
  }
}
