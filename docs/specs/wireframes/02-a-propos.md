# Wireframe — À propos `/a-propos`

**Objectif :** établir la crédibilité de KRAAK, ancrer l'identité, donner envie
de travailler avec l'organisation.  
**Route Angular :** `AboutComponent` → `apps/client/projects/web/src/app/features/about/`

---

## Sections (ordre desktop et mobile identique)

---

### 1. HEADER (composant partagé)

Voir [README.md](README.md#header--présent-sur-toutes-les-pages).

---

### 2. PAGE HERO — bannière interne

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   < Fond : dégradé navy → blue ou image overlay >           ║
║                                                              ║
║   Former une génération prête à agir                         ║
║                                                              ║
║   KRAAK — Accueil > À propos                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : navy → blue, ou image avec overlay 75 %
- Titre : Poppins 700, blanc, 40 px desktop / 28 px mobile
- Fil d'Ariane : Poppins 400, blanc 70 %, 13 px
- Hauteur : 280 px desktop, 200 px mobile

---

### 3. HISTOIRE / CONTEXTE

```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Notre histoire

  < Image ou illustration (gauche, 45 %) >

  KRAAK est née d'un constat simple : les jeunes
  professionnels manquent souvent de ponts concrets
  entre leur potentiel et les opportunités
  qu'offre le marché, local ou international.

  Fondée avec la conviction que le talent se
  développe quand il est bien accompagné, KRAAK
  s'est donné pour mission de combler ce fossé.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : blanc
- Disposition : 2 colonnes desktop (image gauche 45 %, texte droite 55 %)
- Mobile : image pleine largeur → texte dessous
- Titre : Poppins 700, navy, 28 px
- Trait cyan sous titre : 4 px, 48 px de large
- Corps : Poppins 400, gris foncé `#374151`, 16 px, line-height 1.7

---

### 4. MISSION + VISION — deux colonnes côte à côte

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  ┌───────────────────────────┐ ┌───────────────────────────┐ ║
║  │  < Icône mission >        │ │  < Icône vision >         │ ║
║  │  Notre mission            │ │  Notre vision             │ ║
║  │                           │ │                           │ ║
║  │  Accompagner les jeunes   │ │  Construire une           │ ║
║  │  dans le développement    │ │  génération de leaders    │ ║
║  │  de compétences solides   │ │  africains capables de    │ ║
║  │  et d'un positionnement   │ │  créer un impact durable. │ ║
║  │  professionnel clair.     │ │                           │ ║
║  └───────────────────────────┘ └───────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : page `#f3f3f3`
- Cards : fond blanc, border-radius 8 px, ombre légère
- Icône : cyan `#4cc3d9`, 36 px
- Titre card : Poppins 700, navy, 20 px
- Corps : Poppins 400, 15 px, gris foncé
- Mobile : 1 colonne, empilé

---

### 5. VALEURS — grille 3 × 3 (max 7 valeurs)

```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Nos valeurs

  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │  Humanisme │  │Responsabi- │  │ Leadership │
  │  < icône > │  │ lité       │  │  < icône > │
  └────────────┘  └────────────┘  └────────────┘

  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │ Solidarité │  │ Résilience │  │  Ouverture │
  │  < icône > │  │  < icône > │  │  < icône > │
  └────────────┘  └────────────┘  └────────────┘

  ┌────────────┐
  │   Impact   │
  │  < icône > │
  └────────────┘
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : blanc
- Grille : 3 colonnes desktop, 2 colonnes tablette, 1 colonne mobile
- Card valeur : fond page `#f3f3f3`, border-radius 6 px, centré
- Icône : outline navy ou cyan, 28 px
- Label : Poppins 600, navy, 14 px, centré

---

### 6. LEADERSHIP / ÉQUIPE — fondateur

```
╔══════════════════════════════════════════════════════════════╗
║   L'équipe KRAAK                                             ║
║                                                              ║
║   ┌──────────────────────────────────────────────────────┐   ║
║   │  < Photo fondateur ou avatar >                       │   ║
║   │                                                      │   ║
║   │  Prénom Nom                                          │   ║
║   │  Fondateur & Directeur général                       │   ║
║   │                                                      │   ║
║   │  Bio courte 2–3 lignes : parcours, vision,           │   ║
║   │  engagement envers la mission KRAAK.                 │   ║
║   │                                                      │   ║
║   │  [LinkedIn]  [Email]                                 │   ║
║   └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : page `#f3f3f3`
- Photo : cercle, 120 px de diamètre, border 3 px cyan
- Nom : Poppins 700, navy, 20 px
- Titre : Poppins 500, blue `#1673ae`, 14 px
- Bio : Poppins 400, gris foncé, 15 px
- Icônes sociales : navy, 20 px
- MVP : 1 profil ; prévoir extension à équipe si besoin

---

### 7. PREUVES / RÉALISATIONS

```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Notre engagement en chiffres

  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │  500+    │    │   3      │    │  10+     │
  │ Talents  │    │  Pôles   │    │  Pays    │
  │ formés   │    │          │    │          │
  └──────────┘    └──────────┘    └──────────┘
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : navy `#122b4a`
- Chiffres : cyan `#4cc3d9`, Poppins 700, 44 px
- Labels : blanc, Poppins 400, 14 px
- Note : mêmes données que l'accueil pour cohérence

---

### 8. CTA

```
╔══════════════════════════════════════════════════════════════╗
║   Vous souhaitez collaborer avec KRAAK ?                     ║
║                                                              ║
║   [Nous contacter]                                           ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : blue `#1673ae`
- Titre : Poppins 700, blanc, 26 px, centré
- Bouton : fond blanc, texte blue, hover navy
- Padding vertical : 56 px

---

### 9. FOOTER (composant partagé)

Voir [README.md](README.md#footer--présent-sur-toutes-les-pages).

---

## Points d'attention implémentation

| Point         | Détail                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Accessibilité | H1 = titre hero, H2 par section, alt sur photos équipe                 |
| SEO           | `<title>` "À propos — KRAAK", description unique à la page             |
| Responsive    | Colonnes histoire / mission → 1 col mobile                             |
| Contenu       | Photos et bio fondateur = placeholder ; connecter à `content_draft.md` |
