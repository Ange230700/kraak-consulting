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
      label: 'Politique de confidentialité',
      path: '/politique-de-confidentialite',
    },
  ];

  ngAfterViewInit(): void {
    if (globalThis.window === undefined || this.footerRoot === undefined) {
      return;
    }

    globalThis.window.addEventListener('scroll', this.handleScroll, {
      passive: true,
    });
    this.handleScroll();
  }

  private readonly handleScroll = (): void => {
    if (
      globalThis.window === undefined ||
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
    if (globalThis.window !== undefined) {
      globalThis.window.removeEventListener('scroll', this.handleScroll);
    }
  }
}
