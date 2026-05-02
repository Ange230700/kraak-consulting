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
    { label: 'À propos', path: '/a-propos' },
    { label: 'Actualités', path: '/ressources' },
    { label: 'Services', path: '/services' },
    { label: 'Programmes', path: '/programmes' },
    { label: 'Contact', path: '/contact' },
  ];

  protected readonly socialLinks: FooterSocialLink[] = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/',
      icon: 'pi-facebook',
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/',
      icon: 'pi-instagram',
    },
    {
      label: 'WhatsApp',
      href: 'https://wa.me/',
      icon: 'pi-whatsapp',
    },
    {
      label: 'TikTok',
      href: 'https://www.tiktok.com/',
      icon: 'pi-tiktok',
    },
  ];

  protected readonly policyLinks: FooterLink[] = [
    { label: 'Politique de confidentialité', path: '/confidentialite' },
    { label: 'Conditions d’utilisation', path: '/conditions' },
  ];
}
