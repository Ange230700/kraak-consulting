---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# KRAAK — Site web (`projects/web`)

Projet Angular standalone constituant le site vitrine de KRAAK.

## Stack

- **Angular** avec SSR (`@angular/ssr`)
- **PrimeNG** pour les composants UI
- **PrimeIcons** pour toutes les icônes
- **Tailwind CSS** pour les utilitaires de style

## Icônes

Les icônes utilisées dans ce projet sont exclusivement des **PrimeIcons**.

- Classe de base : `<i class="pi pi-<nom>"></i>`
- Pour les icônes purement décoratives, ajouter `aria-hidden="true"`.
- Pour les icônes porteuses de sens sans texte adjacent, ajouter un `aria-label`.
- Référence complète des icônes disponibles : <https://primeng.org/icons>

**Les emojis ne doivent pas être utilisés comme icônes UI.**  
Ils peuvent rester dans le contenu éditorial légitime (ex. témoignages), mais
toute icône fonctionnelle ou décorative doit utiliser PrimeIcons.

### Exemples de mapping courants

| Usage             | Classe PrimeIcons      |
| ----------------- | ---------------------- |
| Formation         | `pi pi-graduation-cap` |
| Gestion de projet | `pi pi-briefcase`      |
| International     | `pi pi-globe`          |
| Contact e-mail    | `pi pi-envelope`       |
| Localisation      | `pi pi-map-marker`     |
| Lien / réseau     | `pi pi-link`           |
| Leadership        | `pi pi-bolt`           |
| Statistiques      | `pi pi-chart-bar`      |
| Liste / plan      | `pi pi-list`           |
| Validation        | `pi pi-check`          |

## Lancer le projet

```bash
# depuis apps/client
npx ng serve web
```

## Build de production

```bash
npx ng build web
```
