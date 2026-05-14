import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  KRAAK_SOCIAL_LINKS,
  type SocialLink,
} from '../../shared/brand/brand-constants';

interface FooterLink {
  label: string;
  path: string;
}

@Component({
  selector: 'kraak-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
})
export class Footer {
  protected readonly currentYear = new Date().getFullYear();

  protected readonly navigationLinks: FooterLink[] = [
    { label: '\u00C0 propos', path: '/a-propos' },
    { label: 'Actualit\u00E9s', path: '/ressources' },
    { label: 'Services', path: '/services' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Programmes', path: '/programmes' },
    { label: 'Contact', path: '/contact' },
  ];

  protected readonly socialLinks: readonly SocialLink[] = KRAAK_SOCIAL_LINKS;

  protected readonly policyLinks: FooterLink[] = [
    { label: 'Mentions l\u00E9gales', path: '/mentions-legales' },
    {
      label: 'Politique de confidentialit\u00E9',
      path: '/politique-de-confidentialite',
    },
  ];
}
