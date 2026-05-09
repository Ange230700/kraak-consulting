import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

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
  templateUrl: './testimonials.html',
})
export class Testimonials {
  @Input() items: Testimonial[] = [];
  @Input() placeholder = true;
  readonly fallbackTestimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Robert Fox',
      job: 'Product Designer',
      avatar:
        'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/avatars/circle/avatar-m-16.png',
      comment:
        'Sed adipiscing diam donec adipiscing. Est lorem ipsum dolor sit amet consectetur. Auctor elit sed vulputate mi sit amet mauris commodo quis. Pulvinar neque laoreet suspendisse interdum consectetur.',
    },
    {
      id: 2,
      name: 'Jane Cooper',
      job: 'UI/UX Designer',
      avatar:
        'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/avatars/circle/avatar-f-18.png',
      comment:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc sit amet aliquam lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl sit amet lorem.',
    },
    {
      id: 3,
      name: 'Wade Warren',
      job: 'Software Engineer',
      avatar:
        'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/avatars/circle/avatar-m-1.png',
      comment:
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
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
