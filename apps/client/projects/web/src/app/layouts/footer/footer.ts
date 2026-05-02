import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLinkGroup {
  title: string;
  links: { label: string; path: string }[];
}

@Component({
  selector: 'kraak-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly currentYear = new Date().getFullYear();

  protected readonly linkGroups: FooterLinkGroup[] = [
    {
      title: 'Navigation',
      links: [
        { label: 'Accueil', path: '/' },
        { label: 'À propos', path: '/a-propos' },
        { label: 'Services', path: '/services' },
        { label: 'Programmes', path: '/programmes' },
        { label: 'Contact', path: '/contact' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Formation', path: '/services' },
        { label: 'Gestion de projet', path: '/services' },
        { label: 'Conseil en immigration', path: '/services' },
      ],
    },
    {
      title: 'Réseaux sociaux',
      links: [
        { label: 'Nous écrire', path: '/contact' },
        { label: 'Ressources', path: '/ressources' },
      ],
    },
  ];
}
