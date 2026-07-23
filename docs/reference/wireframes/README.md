---
status: reference
owner: platform
last_reviewed: 2026-07-23
source_of_truth: false
---

# Wireframes MVP — Site vitrine KRAAK

Wireframes textuels (lo-fi) du site vitrine KRAAK, structurés par page.  
Chaque fichier décrit les blocs, leur ordre, leur contenu minimal et les points
d'interaction clés. Ces wireframes servent de référence pour l'implémentation
Angular dans `apps/client/projects/web/`.

---

## Pages couvertes

| Fichier                              | Page                     | Priorité |
| ------------------------------------ | ------------------------ | -------- |
| [01-accueil.md](01-accueil.md)       | Accueil `/`              | P0       |
| [02-a-propos.md](02-a-propos.md)     | À propos `/a-propos`     | P0       |
| [03-services.md](03-services.md)     | Services `/services`     | P0       |
| [04-programmes.md](04-programmes.md) | Programmes `/programmes` | P0       |
| [05-contact.md](05-contact.md)       | Contact `/contact`       | P0       |

---

## Conventions de lecture

```text
╔══════════════════════════════════════════════╗
║  NOM DU BLOC                                 ║
║  Contenu / description                       ║
║  [CTA — libellé]                             ║
╚══════════════════════════════════════════════╝
```

- `[ ]` = élément interactif (bouton, lien, champ)
- `< >` = image ou asset visuel (placeholder)
- `…` = texte éditorial (voir `docs/reference/CONTENT_DRAFT.md`)
- `~~~` = séparateur de section / bande de fond alternée
- Largeur de référence : **1 280 px** desktop, **375 px** mobile

---

## Palette et tokens de référence

Voir `docs/reference/STYLE_GUIDE.md` et `packages/tokens/`.

| Rôle         | Couleur        | Token                   |
| ------------ | -------------- | ----------------------- |
| Structure    | Navy `#122b4a` | `--kr-color-brand-navy` |
| Accent       | Blue `#1673ae` | `--kr-color-brand-blue` |
| Dynamisme    | Cyan `#4cc3d9` | `--kr-color-brand-cyan` |
| Impact       | Gold `#f0c433` | `--kr-color-brand-gold` |
| Fond de page | `#f3f3f3`      | `--kr-color-brand-page` |

Police : **Poppins** — titres 600–700, corps 400–500.

---

## Composants partagés (header / footer)

### Header — présent sur toutes les pages

```text
╔══════════════════════════════════════════════════════════╗
║ [Logo KRAAK]   Accueil  À propos  Services  Programmes  ║
║                                          [Nous contacter]║
╚══════════════════════════════════════════════════════════╝
```

- Fond : navy `#122b4a`
- Logo : blanc, aligné gauche
- Liens : blanc, Poppins 500
- CTA header : bouton contour blanc → hover fond blanc / texte navy
- Mobile : burger menu → drawer latéral

### Footer — présent sur toutes les pages

```text
╔══════════════════════════════════════════════════════════╗
║ [Logo KRAAK]                                             ║
║ Slogan court                                             ║
║                                                          ║
║ Formation | Gestion de projet | Immigration              ║
║                                                          ║
║ [LinkedIn] [Facebook] [Instagram] [WhatsApp]             ║
║                                                          ║
║ © 2026 KRAAK — Tous droits réservés                     ║
╚══════════════════════════════════════════════════════════╝
```

- Fond : navy `#122b4a`
- Textes : blanc / gris clair
- Liens sociaux : icônes blanches, 24 px
