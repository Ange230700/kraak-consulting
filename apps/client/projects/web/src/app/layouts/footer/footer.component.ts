import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  KRAAK_SOCIAL_LINKS,
  type SocialLink,
} from '../../shared/brand/brand-constants';
import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';

interface FooterLink {
  label: string;
  path: string;
}

interface FooterOfficeItem {
  icon: string;
  label: string;
  href?: string;
}

@Component({
  selector: 'kraak-footer',
  standalone: true,
  imports: [RouterLink, PublicConversionTrackingDirective],
  templateUrl: './footer.component.html',
  styles: [
    `
      .kr-footer-fade-right,
      .kr-footer-fade-left {
        opacity: 0;
        will-change: transform, opacity;
      }

      .kr-footer-fade-right {
        transform: translate3d(-28px, 0, 0);
      }

      .kr-footer-fade-left {
        transform: translate3d(28px, 0, 0);
      }

      .kr-footer-fade-right-visible {
        animation: kr-footer-fade-right 800ms ease-out both;
      }

      .kr-footer-fade-left-visible {
        animation: kr-footer-fade-left 800ms ease-out both;
      }

      @keyframes kr-footer-fade-right {
        from {
          opacity: 0;
          transform: translate3d(-28px, 0, 0);
        }

        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }

      @keyframes kr-footer-fade-left {
        from {
          opacity: 0;
          transform: translate3d(28px, 0, 0);
        }

        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .kr-footer-fade-right,
        .kr-footer-fade-left,
        .kr-footer-fade-right-visible,
        .kr-footer-fade-left-visible {
          animation: none;
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class Footer implements AfterViewInit, OnDestroy {
  @ViewChild('footerRoot')
  private readonly footerRoot?: ElementRef<HTMLElement>;

  private hasActivatedAnimations = false;

  protected readonly currentYear = new Date().getFullYear();

  protected readonly navigationLinks: FooterLink[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Programmes', path: '/programmes' },
    { label: '\u00C0 propos', path: '/a-propos' },
    { label: 'Contact', path: '/contact' },
  ];

  protected readonly expertiseItems: readonly string[] = [
    'Formation professionnelle',
    'Pilotage de projets',
    'Mobilité internationale',
  ];

  protected readonly officeItems: readonly FooterOfficeItem[] = [
    {
      icon: 'pi-envelope',
      label: 'kraakconsulting@gmail.com',
      href: 'mailto:kraakconsulting@gmail.com',
    },
    {
      icon: 'pi-map-marker',
      label: "Abidjan, C\u00f4te d'Ivoire",
    },
    {
      icon: 'pi-phone',
      label: '+225 05 02 74 18 18',
      href: 'tel:+2250502741818',
    },
  ];

  protected readonly socialLinks: readonly SocialLink[] = KRAAK_SOCIAL_LINKS;

  protected readonly policyLinks: FooterLink[] = [
    { label: 'Mentions l\u00E9gales', path: '/mentions-legales' },
    { label: 'FAQ', path: '/faq' },
    {
      label: 'Politique de confidentialit\u00E9',
      path: '/politique-de-confidentialite',
    },
  ];

  ngAfterViewInit(): void {
    if (
      typeof globalThis.window === 'undefined' ||
      this.footerRoot === undefined
    ) {
      return;
    }

    globalThis.window.addEventListener('scroll', this.handleScroll, {
      passive: true,
    });
    this.handleScroll();
  }

  private readonly handleScroll = (): void => {
    if (
      typeof globalThis.window === 'undefined' ||
      this.footerRoot === undefined ||
      this.hasActivatedAnimations
    ) {
      return;
    }

    const footerBounds = this.footerRoot.nativeElement.getBoundingClientRect();
    const viewportTrigger = globalThis.window.innerHeight * 0.92;

    if (footerBounds.top <= viewportTrigger) {
      this.activateFooterAnimations();
      this.hasActivatedAnimations = true;
      globalThis.window.removeEventListener('scroll', this.handleScroll);
    }
  };

  private activateFooterAnimations(): void {
    if (this.footerRoot === undefined) {
      return;
    }

    const rootElement = this.footerRoot.nativeElement;
    const fadeRightElement = rootElement.querySelector('.kr-footer-fade-right');
    const fadeLeftElement = rootElement.querySelector('.kr-footer-fade-left');

    fadeRightElement?.classList.add('kr-footer-fade-right-visible');
    fadeLeftElement?.classList.add('kr-footer-fade-left-visible');
  }

  ngOnDestroy(): void {
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.removeEventListener('scroll', this.handleScroll);
    }
  }
}
