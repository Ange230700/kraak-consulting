---
status: reference
owner: platform
last_reviewed: 2026-07-23
source_of_truth: false
---

# Wireframe — Services `/services`

**Objectif :** expliquer clairement les trois pôles d'activité, lever les
questions, orienter vers la prise de contact.  
**Route Angular :** `ServicesComponent` → `apps/client/projects/web/src/app/features/services/`

---

## Sections

---

### 1. HEADER (composant partagé)

Voir [`README.md`](README.md) pour les composants de layout partagés.

---

### 2. PAGE HERO — bannière interne

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   < Fond : image ou dégradé navy → blue >                   ║
║                                                              ║
║   Des services pensés pour votre progression                 ║
║                                                              ║
║   KRAAK — Accueil > Services                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : navy → blue, ou image avec overlay 75 %
- Titre : Poppins 700, blanc, 40 px / 28 px mobile
- Fil d'Ariane : blanc 70 %, 13 px
- Hauteur : 280 px desktop, 200 px mobile

---

### 3. INTRODUCTION SERVICES

```text
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Ce que nous faisons

  KRAAK intervient sur trois axes complémentaires pour
  accompagner les individus et les organisations dans
  leur développement et leur rayonnement.

  ─────────────────────────────────────────────────────
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : blanc
- Texte centré, max-width 720 px
- Trait cyan sous titre : 4 px, 48 px

---

### 4. PÔLE 1 — FORMATION

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  < Illustration ou photo formation (droite 45 %) >          ║
║                                                              ║
║  < Icône Formation >                                         ║
║  Formation                                                   ║
║                                                              ║
║  Développement de compétences techniques et                  ║
║  linguistiques.                                              ║
║                                                              ║
║  Programmes de formation en développement                    ║
║  personnel, communication professionnelle et                 ║
║  langues (anglais/français), adaptés aux                     ║
║  exigences du marché.                                        ║
║                                                              ║
║  Public cible :                                              ║
║  ✓ Étudiants                                                 ║
║  ✓ Jeunes professionnels (0–5 ans d'expérience)              ║
║  ✓ Organisations en développement RH                         ║
║                                                              ║
║  [Demander une formation →]                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : page `#f3f3f3`
- Disposition : 2 colonnes desktop (texte gauche, illustration droite)
- Mobile : illustration → texte → CTA empilés
- Icône : cyan, 40 px
- Titre : Poppins 700, navy, 28 px
- Corps : Poppins 400, gris foncé, 15 px, line-height 1.7
- Coches : cyan
- CTA : bouton blue, texte blanc

---

### 5. PÔLE 2 — GESTION DE PROJET

```text
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  < Icône Gestion de projet >
  Gestion de projet

  Accompagnement stratégique des organisations.

  Support en structuration de projets, identification
  de talents, recrutement et développement de
  partenariats.

  Public cible :
  ✓ ONG et associations
  ✓ PME en croissance
  ✓ Porteurs de projets

  < Illustration (gauche 45 %) >

  [Demander un accompagnement →]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : blanc (alternance avec section précédente)
- Disposition : illustration gauche, texte droite (inverse de la section 4)
- Mobile : même empilement que section 4
- Mêmes règles typographiques

---

### 6. PÔLE 3 — CONSEIL EN IMMIGRATION

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  < Illustration voyage / international (droite 45 %) >      ║
║                                                              ║
║  < Icône Immigration >                                       ║
║  Conseil en immigration                                      ║
║                                                              ║
║  Orientation vers des opportunités internationales.          ║
║                                                              ║
║  Conseil stratégique pour études, travail et                 ║
║  mobilité internationale.                                    ║
║                                                              ║
║  Public cible :                                              ║
║  ✓ Étudiants souhaitant étudier à l'étranger                 ║
║  ✓ Professionnels en mobilité internationale                 ║
║  ✓ Familles en projet d'installation                         ║
║                                                              ║
║  [Demander un conseil →]                                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : page `#f3f3f3`
- Même disposition alternée : texte gauche, illustration droite

---

### 7. COMMENT ÇA MARCHE — processus en 4 étapes

```text
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Notre processus d'accompagnement

  ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
  │  1   │ ──▶  │  2   │ ──▶  │  3   │ ──▶  │  4   │
  │Prise │      │Diag- │      │Accom-│      │Suivi │
  │de    │      │nostic│      │pagne-│      │&     │
  │contact     │      │      │ment  │      │résul-│
  │      │      │      │      │      │      │tats  │
  └──────┘      └──────┘      └──────┘      └──────┘
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : blanc
- Étapes : cercles navy `#122b4a`, chiffre blanc, 56 px
- Connecteurs : ligne pointillée cyan
- Label : Poppins 600, navy, 14 px, centré
- Mobile : étapes empilées verticalement avec flèche bas

---

### 8. FAQ (optionnel MVP)

```text
╔══════════════════════════════════════════════════════════════╗
║   Questions fréquentes                                       ║
║                                                              ║
║   ▼  Qui peut bénéficier des services KRAAK ?               ║
║      Étudiants, jeunes professionnels et organisations.      ║
║                                                              ║
║   ▶  Les formations sont-elles en ligne ?                   ║
║                                                              ║
║   ▶  Comment démarrer ?                                     ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : page `#f3f3f3`
- Accordéon : ouvert = fond blanc, border-left 3 px cyan
- Titre question : Poppins 600, navy, 15 px
- Réponse : Poppins 400, gris foncé, 14 px

---

### 9. CTA PRINCIPAL

```text
╔══════════════════════════════════════════════════════════════╗
║   Vous avez un projet ou un besoin spécifique ?              ║
║                                                              ║
║   [Demander une consultation]                                ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : blue `#1673ae`
- Titre : blanc, Poppins 700, 26 px, centré
- Bouton : fond blanc, texte blue, hover navy
- Padding vertical : 56 px

---

### 10. FOOTER (composant partagé)

Voir [`README.md`](README.md) pour les composants de layout partagés.

---

## Points d'attention implémentation

| Point         | Détail                                                             |
| ------------- | ------------------------------------------------------------------ |
| Accessibilité | Alt sur illustrations, contraste des coches (cyan sur fond coloré) |
| SEO           | `<title>` "Services — KRAAK", `<meta description>` unique          |
| Responsive    | Alternance gauche/droite supprimée en mobile (toujours empilé)     |
| FAQ           | Composant accordéon PrimeNG `p-accordion` ou natif `<details>`     |
| Illustrations | Utiliser des assets SVG ou images WebP dans `assets/images/`       |
