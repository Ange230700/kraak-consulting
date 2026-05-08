# Wireframe — Accueil `/`

**Objectif :** comprendre KRAAK en 5 secondes, orienter vers l'action.  
**Route Angular :** `HomeComponent` → `apps/client/projects/web/src/app/features/home/`

---

## Sections (ordre desktop et mobile identique)

---

### 1. HEADER (composant partagé)

```
╔══════════════════════════════════════════════════════════════╗
║ [Logo KRAAK]  Accueil  À propos  Services  Programmes        ║
║                                            [Nous contacter]  ║
╚══════════════════════════════════════════════════════════════╝
```

Fond navy. Sticky au scroll.

---

### 2. HERO — section pleine largeur

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   < Image / illustration de fond (overlay navy sombre) >    ║
║                                                              ║
║   Développez votre potentiel.                                ║
║   Construisez votre impact.                                  ║
║                                                              ║
║   KRAAK accompagne les jeunes professionnels et les          ║
║   organisations vers des opportunités concrètes,             ║
║   locales et internationales.                                ║
║                                                              ║
║   [Demander une consultation]   [Découvrir nos services]     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : navy `#122b4a` ou image overlay 80 % opacité
- Titre : Poppins 700, blanc, 48 px desktop / 32 px mobile
- Sous-titre : Poppins 400, blanc 85 %, 18 px / 16 px
- CTA primaire : fond blue `#1673ae`, blanc, 16 px, border-radius 6 px
- CTA secondaire : contour blanc, texte blanc
- Hauteur : 100 vh desktop, auto mobile (min 480 px)

---

### 3. RÉSUMÉ MISSION — bande alternée

```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Qui sommes-nous ?

  Nous identifions, formons et accompagnons des talents
  pour leur permettre de s'intégrer stratégiquement dans
  des environnements professionnels exigeants.

  [ En savoir plus sur KRAAK → ]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : blanc `#ffffff`
- Texte centré, max-width 760 px
- Accent : trait cyan `#4cc3d9` sous le titre (4 px, 48 px de large)
- Lien texte : blue `#1673ae`

---

### 4. DOMAINES D'EXPERTISE — grille 3 colonnes

```
╔══════════════════════════════════════════════════════════════╗
║   Nos domaines d'intervention                                ║
║                                                              ║
║  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  ║
║  │ < Icône >       │ │ < Icône >       │ │ < Icône >     │  ║
║  │ Formation       │ │ Gestion de      │ │ Conseil en    │  ║
║  │                 │ │ projet          │ │ immigration   │  ║
║  │ Développement   │ │ Accompagnement  │ │ Orientation   │  ║
║  │ de compétences  │ │ stratégique     │ │ internationale│  ║
║  │ techniques et   │ │ des             │ │               │  ║
║  │ linguistiques.  │ │ organisations.  │ │               │  ║
║  │                 │ │                 │ │               │  ║
║  │ [En savoir +]   │ │ [En savoir +]   │ │ [En savoir +] │  ║
║  └─────────────────┘ └─────────────────┘ └───────────────┘  ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : page `#f3f3f3`
- Cards : fond blanc, border-radius 8 px, ombre légère
- Icône : cyan `#4cc3d9`, 40 px
- Titre card : Poppins 600, navy, 18 px
- Corps : Poppins 400, gris foncé, 15 px
- Lien card : blue `#1673ae`
- Mobile : 1 colonne, cards pleine largeur

---

### 5. POURQUOI KRAAK — bande alternée

```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Pourquoi choisir KRAAK ?

  ✓  Approche humaine et personnalisée
  ✓  Réseau international d'opportunités
  ✓  Expertise terrain en formation et mobilité
  ✓  Accompagnement de bout en bout
  ✓  Engagement pour l'impact durable

  < Illustration ou photo équipe (à droite sur desktop) >
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : blanc
- Disposition : 2 colonnes desktop (texte gauche 55 %, visuel droit 45 %)
- Mobile : empilé, visuel sous le texte
- Coches : icônes cyan `#4cc3d9`
- Titre : Poppins 700, navy, 32 px

---

### 6. IMPACT — bande chiffres clés

```
╔══════════════════════════════════════════════════════════════╗
║         Notre impact en chiffres                             ║
║                                                              ║
║   [ 500+ ]          [ 3 ]           [ 10+ ]                  ║
║  Talents formés   Pôles de        Pays d'opportunités        ║
║                   service                                    ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : navy `#122b4a`
- Chiffres : Poppins 700, cyan `#4cc3d9`, 48 px
- Labels : Poppins 400, blanc, 15 px
- Note : placeholders à remplacer par données réelles avant lancement

---

### 7. TÉMOIGNAGES — carrousel (placeholder)

```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Ce que disent nos bénéficiaires

  ┌──────────────────────────────────────────────────┐
  │  « Grâce à KRAAK, j'ai obtenu mon visa d'études  │
  │    et une formation ciblée en 3 mois. »           │
  │                                                  │
  │  < Avatar >  Prénom N. — Programme Immigration   │
  └──────────────────────────────────────────────────┘

  ◀  [ • • ○ ○ ]  ▶
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Fond : page `#f3f3f3`
- Card témoignage : fond blanc, ombre légère
- Guillemets décoratifs : gold `#f0c433`, 48 px
- Nom : Poppins 600, navy
- Rôle : Poppins 400, gris `#8b8d92`
- Pagination : points navy / cyan actif
- MVP : 2–3 témoignages statiques (placeholder copy si besoin)

---

### 8. CTA PRINCIPAL — bande de conversion

```
╔══════════════════════════════════════════════════════════════╗
║   Prêt à construire votre avenir avec KRAAK ?                ║
║                                                              ║
║   [Demander une consultation]                                ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : blue `#1673ae`
- Titre : Poppins 700, blanc, 28 px, centré
- Bouton : fond blanc, texte blue, hover fond navy / texte blanc
- Padding vertical : 64 px

---

### 9. FOOTER (composant partagé)

Voir [README.md](README.md#footer--présent-sur-toutes-les-pages).

---

## Points d'attention implémentation

| Point         | Détail                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| Accessibilité | H1 unique sur la page (titre hero), H2 par section                       |
| SEO           | `<title>`, `<meta description>`, OG image définis dans `SeoService`      |
| Performance   | Image hero : WebP, lazy-load pour témoignages et photos                  |
| Responsive    | Grille 3 col → 1 col sous 768 px, hero min 480 px mobile                 |
| Animation     | Fade-in au scroll sur sections 3 et 4 (Intersection Observer, optionnel) |
