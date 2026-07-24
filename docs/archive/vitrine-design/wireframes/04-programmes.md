---
status: reference
owner: platform
last_reviewed: 2026-07-23
source_of_truth: false
---

# Wireframe — Programmes `/programmes`

**Objectif :** présenter les programmes concrets, déclencher une inscription ou
une demande d'information, rassurer sur les résultats attendus.  
**Route Angular :** `ProgrammesComponent` →
`apps/client/projects/web/src/app/features/programmes/`

---

## Sections

---

### 1. HEADER (composant partagé)

Voir [README.md](README.md#header--présent-sur-toutes-les-pages).

---

### 2. PAGE HERO — bannière interne

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   < Fond : dégradé navy ou image overlay >                  ║
║                                                              ║
║   Des programmes conçus pour avancer                         ║
║                                                              ║
║   KRAAK — Accueil > Programmes                               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : navy `#122b4a` ou image overlay 75 %
- Titre : Poppins 700, blanc, 40 px / 28 px mobile
- Fil d'Ariane : blanc 70 %, 13 px
- Hauteur : 280 px desktop, 200 px mobile

---

### 3. INTRODUCTION PROGRAMMES

```text
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Nos programmes

  KRAAK propose des parcours structurés adaptés aux
  besoins des étudiants, jeunes professionnels, et
  organisations.

  Chaque programme est conçu pour produire des
  résultats concrets et mesurables.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : blanc
- Texte centré, max-width 720 px
- Accent : trait cyan sous titre

---

### 4. LISTE DES PROGRAMMES — cartes

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  ┌───────────────────────────────────┐                       ║
║  │  < Badge pôle : Formation >       │                       ║
║  │                                   │                       ║
║  │  Nom du programme                 │                       ║
║  │                                   │                       ║
║  │  Description courte 2–3 lignes.   │                       ║
║  │                                   │                       ║
║  │  Public cible :                   │                       ║
║  │  Étudiants / Jeunes pros          │                       ║
║  │                                   │                       ║
║  │  Bénéfices :                      │                       ║
║  │  ✓ Bénéfice 1                     │                       ║
║  │  ✓ Bénéfice 2                     │                       ║
║  │  ✓ Bénéfice 3                     │                       ║
║  │                                   │                       ║
║  │  [Je m'inscris →]                 │                       ║
║  └───────────────────────────────────┘                       ║
║                                                              ║
║  ┌─────────────────┐ ┌─────────────────┐ ← grille 2 col     ║
║  │ Programme 2     │ │ Programme 3     │                     ║
║  └─────────────────┘ └─────────────────┘                     ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : page `#f3f3f3`
- Grille : 2 colonnes desktop, 1 colonne mobile
- Card : fond blanc, border-radius 8 px, ombre légère
- Badge pôle : pill navy (Formation), blue (Gestion de projet), cyan
  (Immigration), Poppins 600, 12 px, blanc
- Titre programme : Poppins 700, navy, 18 px
- Description : Poppins 400, gris foncé, 14 px
- Public cible : label Poppins 500, 13 px, gris
- Coches bénéfices : cyan `#4cc3d9`
- CTA card : bouton blue pleine largeur

---

### 5. PROCESSUS D'INSCRIPTION — étapes

```text
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Comment s'inscrire ?

  ┌───────────────────────────────────────────────────┐
  │                                                   │
  │  1                2                3              │
  │  Choisir          Remplir          Être           │
  │  un programme     le formulaire    contacté       │
  │                   de contact       sous 48 h      │
  │                                                   │
  └───────────────────────────────────────────────────┘

  [Commencer maintenant →]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : blanc
- Numéros : cercles gold `#f0c433`, Poppins 700, blanc, 40 px
- Labels : Poppins 600, navy, 14 px
- Sous-label : Poppins 400, gris, 13 px
- Connecteurs : ligne pointillée cyan
- CTA : bouton blue, centré

---

### 6. RÉSULTATS ATTENDUS

```text
╔══════════════════════════════════════════════════════════════╗
║   Ce que vous obtenez                                        ║
║                                                              ║
║  ┌────────────┐  ┌────────────┐  ┌────────────┐             ║
║  │ < Icône >  │  │ < Icône >  │  │ < Icône >  │             ║
║  │ Compétence │  │ Réseau     │  │ Confiance  │             ║
║  │ reconnue   │  │ profes-    │  │ et clarté  │             ║
║  │            │  │ sionnel    │  │ de parcours│             ║
║  └────────────┘  └────────────┘  └────────────┘             ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : navy `#122b4a`
- Icônes : cyan `#4cc3d9`, 36 px
- Titre résultat : Poppins 700, blanc, 16 px
- Description : Poppins 400, blanc 80 %, 14 px
- Grille : 3 colonnes desktop, 1 col mobile

---

### 7. TÉMOIGNAGES — section réassurance (placeholder)

```text
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Ils ont suivi nos programmes

  ┌──────────────────────────────────────────────────┐
  │  « Le programme KRAAK m'a donné les outils       │
  │    pour décrocher mon premier poste à            │
  │    l'international. »                            │
  │                                                  │
  │  < Avatar >  Prénom N. — Programme Formation     │
  └──────────────────────────────────────────────────┘

  ◀  [ • ○ ○ ]  ▶
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : page `#f3f3f3`
- Card : fond blanc, border-radius 8 px
- Guillemets : gold `#f0c433`, 48 px
- Nom : Poppins 600, navy
- Programme : Poppins 400, gris, 13 px

---

### 8. FAQ PROGRAMMES (optionnel MVP)

```text
╔══════════════════════════════════════════════════════════════╗
║   Questions sur nos programmes                               ║
║                                                              ║
║   ▼  Les programmes sont-ils en présentiel ou               ║
║      en ligne ?                                              ║
║      Les deux formats sont disponibles selon le programme.   ║
║                                                              ║
║   ▶  Y a-t-il un prérequis pour s'inscrire ?               ║
║                                                              ║
║   ▶  Puis-je suivre plusieurs programmes ?                  ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : blanc
- Accordéon : identique à la page Services

---

### 9. CTA PRINCIPAL

```text
╔══════════════════════════════════════════════════════════════╗
║   Trouvez le programme qui vous correspond                   ║
║                                                              ║
║   [Nous contacter pour être orienté]                         ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : blue `#1673ae`
- Titre : blanc, Poppins 700, 26 px, centré
- Bouton : fond blanc, texte blue, hover navy
- Padding vertical : 56 px

---

### 10. FOOTER (composant partagé)

Voir [README.md](README.md#footer--présent-sur-toutes-les-pages).

---

## Points d'attention implémentation

| Point           | Détail                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Accessibilité   | Alt sur illustrations, coches accessibles (pas seulement couleur)                                            |
| SEO             | `<title>` "Programmes — KRAAK", `<meta description>` unique                                                  |
| Contenu         | Données programme = placeholder ; alimenter depuis [`CONTENT_DRAFT.md`](../../../reference/CONTENT_DRAFT.md) |
| Responsive      | Grille 2 col → 1 col mobile, étapes processus empilées verticalement                                         |
| CTA inscription | Pointe vers `/contact` avec query param `?sujet=inscription` (MVP)                                           |
