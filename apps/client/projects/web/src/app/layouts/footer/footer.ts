import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink {
  label: string;
  path: string;
}

interface FooterSocialLink {
  label: string;
  href: string;
  icon: string;
}

@Component({
  selector: 'kraak-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly currentYear = new Date().getFullYear();

  protected readonly navigationLinks: FooterLink[] = [
    { label: '\u00C0 propos', path: '/a-propos' },
    { label: 'Actualit\u00E9s', path: '/ressources' },
    { label: 'Services', path: '/services' },
    { label: 'Programmes', path: '/programmes' },
    { label: 'Contact', path: '/contact' },
  ];

  protected readonly socialLinks: FooterSocialLink[] = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/kraakconsulting/',
      icon: 'pi-facebook',
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/kraakconsulting/',
      icon: 'pi-instagram',
    },
    {
      label: 'WhatsApp',
      href: 'https://wa.me/2250502741818',
      icon: 'pi-whatsapp',
    },
  ];

  protected readonly policyLinks: FooterLink[] = [
    { label: 'Mentions l\u00E9gales', path: '/mentions-legales' },
    {
      label: 'Politique de confidentialit\u00E9',
      path: '/politique-de-confidentialite',
    },
  ];
}
