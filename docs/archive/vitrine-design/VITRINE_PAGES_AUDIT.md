> **Status:** Historical.
> This document does not define the current process.
> Active reference: [MVP_SCOPE](../../product/MVP_SCOPE.md)

# Audit complet des pages vitrine KRAAK — Status MVP v1.0.0

## Table des matières

- [Audit complet des pages vitrine KRAAK — Status MVP v1.0.0](#audit-complet-des-pages-vitrine-kraak-status-mvp-v100)
  - [Résumé exécutif](#resume-executif)
    - [Sections prêtes pour v1.0.0 ✅](#sections-pretes-pour-v100-)
    - [Sections À cacher ou remplacer pour v1.0.0 ⚠️](#sections-a-cacher-ou-remplacer-pour-v100-)
    - [Conditions de release ✅✅](#conditions-de-release-)
  - [Audit détaillé par page](#audit-detaille-par-page)
    - [1. HOME PAGE (home.page.ts / .html)](#1-home-page-homepagets-html)
      - [✅ Complète & statique (prête pour v1.0.0)](#-complete-statique-prete-pour-v100)
      - [⚠️ HOME — À remplacer ou cacher pour v1.0.0](#-home-a-remplacer-ou-cacher-pour-v100)
      - [Éléments d'animation](#elements-danimation)
    - [2. ABOUT PAGE (about.page.ts / .html)](#2-about-page-aboutpagets-html)
      - [✅ ABOUT — Complète & statique](#-about-complete-statique)
      - [⚠️ Placeholders à remplacer pour v1.0.0](#-placeholders-a-remplacer-pour-v100)
      - [Details du placeholder Team Grid](#details-du-placeholder-team-grid)
    - [3. SERVICES PAGE (services.page.ts / .html)](#3-services-page-servicespagets-html)
      - [✅ SERVICES — Complète & statique](#-services-complete-statique)
      - [⚠️ SERVICES — À remplacer ou cacher pour v1.0.0](#-services-a-remplacer-ou-cacher-pour-v100)
    - [4. PROGRAMS PAGE (programs.page.ts / .html)](#4-programs-page-programspagets-html)
      - [✅ PROGRAMS — Complète & statique](#-programs-complete-statique)
      - [✅ PROGRAMS — Pas de sections incomplètes détectées](#-programs-pas-de-sections-incompletes-detectees)
    - [5. RESOURCES PAGE (resources.page.ts / .html)](#5-resources-page-resourcespagets-html)
      - [✅ RESOURCES — Complète & statique](#-resources-complete-statique)
      - [✅ RESOURCES — Pas de sections incomplètes détectées](#-resources-pas-de-sections-incompletes-detectees)
    - [6. CONTACT PAGE (contact.page.ts / .html)](#6-contact-page-contactpagets-html)
      - [✅ Complète & dynamique](#-complete-dynamique)
      - [✅ CONTACT — Pas de sections incomplètes détectées](#-contact-pas-de-sections-incompletes-detectees)
  - [Audit des composants partagés (Shared)](#audit-des-composants-partages-shared)
    - [📋 Tableau synthétique](#-tableau-synthetique)
    - [Détails des problèmes](#details-des-problemes)
      - [🔴 Testimonials Component (shared/testimonials/)](#-testimonials-component-sharedtestimonials)
      - [🔴 ImpactStats Component (shared/impact-stats/)](#-impactstats-component-sharedimpact-stats)
      - [🔴 TeamGrid Component (shared/team-grid/)](#-teamgrid-component-sharedteam-grid)
      - [🔴 FadingPartners Component (shared/fading-partners/)](#-fadingpartners-component-sharedfading-partners)
  - [Tableau de synthèse — Actions recommandées pour v1.0.0](#tableau-de-synthese-actions-recommandees-pour-v100)
  - [Détails des composants à retirer ou cacher](#details-des-composants-a-retirer-ou-cacher)
    - [Option A : SUPPRIMER les sections (recommandé pour MVP propre)](#option-a-supprimer-les-sections-recommande-pour-mvp-propre)
    - [Option B : CACHER via [placeholder]="false" (si on veut préserver l'espace)](#option-b-cacher-via-placeholderfalse-si-on-veut-preserver-lespace)
  - [Checklist v1.0.0 — Avant merge de la branche MVP](#checklist-v100-avant-merge-de-la-branche-mvp)
  - [Sections à garder intégralement pour v1.0.0 ✅](#sections-a-garder-integralement-pour-v100-)
  - [Prochaines étapes (V1.1+)](#prochaines-etapes-v11)
  - [Conclusion](#conclusion)

> Statut documentaire (PR-06): ce fichier est conserve comme **historique
> d'audit**. Il ne fait plus foi pour le statut courant du périmètre vitrine.
> La référence active est désormais:
>
> - `README.md` (surface publique gelée)
> - `docs/decisions/ARC-14-freeze-surface-vitrine-publique.md`
> - `docs/operations/STAGING_VALIDATION.md` (Definition of Done vitrine fermée)

**Date du rapport:** 9 mai 2026  
**Périmètre:** Pages publiques de marketing/vitrine (`apps/client/projects/web/src/app/features/`)  
**Objectif:** Identifier les sections incomplètes, les données de placeholder, et les blockers pour v1.0.0

---

## Résumé exécutif

### Sections prêtes pour v1.0.0 ✅

- Architecture générale (hero, nav, footer, CTA principal)
- Contenu structuré et copy KRAAK cohérent
- Animations GSAP fonctionnelles
- Formulaire de contact avec validation
- Sections FAQ (hardcodées, complètes)
- Design system et tokens fonctionnels

### Sections **À cacher ou remplacer pour v1.0.0** ⚠️

1. **Testimonials** (home page) — Mock data, bannière "à venir"
2. **Impact Stats** — Chiffres fictifs marqués "prévisualisation"
3. **Team Grid** (about page) — Fallback staff générique, marqué "prévisualisation"
4. **Fading Partners** — 5 logos placeholder SVG, aucun vrai partenaire

### Conditions de release ✅✅

**Pour v1.0.0, recommandation:**

- **HIDE** (via `@if placeholder=false`) ou **REMOVE** les 4 sections ci-dessus
- **SHIP** tout le reste en confiance
- Ajouter ces sections en **v1.1+** une fois les vrais clients/équipe/témoignages disponibles

---

## Audit détaillé par page

### 1. HOME PAGE (`home.page.ts` / `.html`)

#### ✅ Complète & statique (prête pour v1.0.0)

| Section               | Contenu                                                                                                            | Status      | Source              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------- |
| **Hero**              | Tagline, CTA x2                                                                                                    | ✅ Complete | Hardcoded HTML      |
| **Mission intro**     | "Vous avez un objectif..."                                                                                         | ✅ Complete | Hardcoded HTML      |
| **3 piliers visuels** | Formation, Projet, Mobilité (3 cartes)                                                                             | ✅ Complete | Hardcoded HTML      |
| **3 pôles**           | Formation, R&D Projets, Études & Immigration (3 cards)                                                             | ✅ Complete | Hardcoded HTML      |
| **Solutions clés**    | 6 cards (Formations, Accompagnement Sécurisé, Parcours Simples, Mobilité, Solutions Ouvertes, Confiance & Rigueur) | ✅ Complete | Hardcoded HTML      |
| **Pourquoi KRAAK**    | 5 raisons (Expertise, Accompagnement, Résultats, Réseau, Programmes)                                               | ✅ Complete | Hardcoded HTML      |
| **FAQ**               | 4 questions hardcodées dans `.ts`                                                                                  | ✅ Complete | `faqItems[]` array  |
| **CTA final**         | Banner standard                                                                                                    | ✅ Complete | CtaBanner component |

#### ⚠️ HOME — À remplacer ou cacher pour v1.0.0

| Section                      | Problème                                                                                                                                                           | Status               | Raison                                          | Ligne                                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fading Partners carousel** | 5 logos placeholder SVG, aucun vrai client                                                                                                                         | ❌ Placeholder       | Mock data complet                               | `home.page.html:352`                                                                                                                                                                                                              |
| **Impact Stats section**     | Chiffres fictifs "1M+", "72K+", "2.5M+" + bannière "Chiffres d'impact en prévisualisation"                                                                         | ❌ Placeholder       | Hardcoded stats intemporels                     | [impact-stats.ts:11-16](../../../apps/client/projects/web/src/app/shared/impact-stats/impact-stats.component.ts#L11-L16)                                                                                                          |
| **Testimonials carousel**    | Fallback 3 témoignages Lorem ipsum + message "Un espace sera ouvert aux retours clients et aux preuves sociales dès que les prochains témoignages seront validés." | ❌ Placeholder/Draft | Mock testimonials + message explicite "à venir" | [home.page.html:393-398](../../../apps/client/projects/web/src/app/features/home/home.page.html#L393) et [testimonials.ts:23-50](../../../apps/client/projects/web/src/app/shared/testimonials/testimonials.component.ts#L23-L50) |

#### Éléments d'animation

- ✅ GSAP animations: `animatePageIn()`, `initializeFigureAnimations()`, `initializeInteractiveCardAnimations()`, `initializeButtonTransitions()`, `initializeSectionAnimations()`, `initializeIconAnimations()`
- ✅ Performance: `content-visibility: auto` sur sections clés

---

### 2. ABOUT PAGE (`about.page.ts` / `.html`)

#### ✅ ABOUT — Complète & statique

| Section            | Contenu                                                                                                       | Status      | Source         |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ----------- | -------------- |
| **Hero**           | "Former. Structurer. Transformer."                                                                            | ✅ Complete | Hardcoded      |
| **Mission/Vision** | 6 valeurs (Humanisme, Responsabilité, Leadership, Résilience, Solidarité, Ouverture) + Mission et Vision text | ✅ Complete | Hardcoded HTML |
| **Valeurs grid**   | 6 cartes de valeurs                                                                                           | ✅ Complete | Hardcoded HTML |
| **Piliers**        | 3 cartes (Développement des compétences, Structuration, Accès international)                                  | ✅ Complete | Hardcoded HTML |
| **Visuals**        | 2 images (community-impact, team-workshop)                                                                    | ✅ Complete | Static images  |
| **CTA final**      | CtaBanner                                                                                                     | ✅ Complete | Component      |

#### ⚠️ Placeholders à remplacer pour v1.0.0

- Section: **Team Grid section**
- Problème: 12 profils staff fictifs (Savannah Nguyen, Jenny Wilson, etc.) + bannière "Prévisualisation de l'équipe KRAAK" + texte "En attendant la liste officielle, voici un aperçu du format de présentation..."
- Status: ❌ Placeholder/Draft
- Evidence: [team-grid.ts:28-90](../../../apps/client/projects/web/src/app/shared/team-grid/team-grid.component.ts#L28) (fallbackMembers hardcoded) + [team-grid.html:7-10](../../../apps/client/projects/web/src/app/shared/team-grid/team-grid.component.html#L7) (preview label et disclaimer)

#### Details du placeholder Team Grid

```typescript
// Fallback team — 12 profils FICTIFS
fallbackMembers: TeamMember[] = [
  { id: 1, name: 'Savannah Nguyen', role: 'Développeuse logiciel', image: '...' },
  { id: 2, name: 'Jenny Wilson', role: 'Développeuse logiciel', image: '...' },
  // ... +10 autre profils fictifs avec noms/roles generic tech
]

// Computed pour afficher fallback si `placeholder=true`
readonly visibleMembers = computed(() => {
  if (this.members.length > 0) return this.members;
  if (!this.placeholder) return [];
  return this.fallbackMembers;
});
```

HTML template:

```html
@if (isPreviewMode()) {
<p class="...">Prévisualisation de l'équipe KRAAK</p>
}
<!-- ... puis disclaimer text: "En attendant la liste officielle, voici un aperçu..." -->
```

---

### 3. SERVICES PAGE (`services.page.ts` / `.html`)

#### ✅ SERVICES — Complète & statique

| Section                   | Contenu                                                                                                                                    | Status      | Source                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------- |
| **Hero**                  | "Des solutions concrètes pour apprendre, entreprendre..."                                                                                  | ✅ Complete | Hardcoded             |
| **Formation section**     | 4 formations (Langues, Développement & leadership, Soft skills, Employabilité)                                                             | ✅ Complete | Hardcoded HTML        |
| **R&D Projets section**   | 5 services (Accompagnement d'entreprise, Startups, Gestion de projets, Partenariats, Recrutement)                                          | ✅ Complete | Hardcoded HTML        |
| **Immigration section**   | 6 services (Études Canada/US, Immigration professionnelle, Permis travail, Regroupement familial, Recherche emploi, Intégration socio-pro) | ✅ Complete | Hardcoded HTML        |
| **Solutions entreprises** | 5 services (Formation du personnel, Cohésion, Gestion conflits, Leadership, Santé culture)                                                 | ✅ Complete | Hardcoded HTML        |
| **Notre approche**        | 3 étapes (Clarifier, Structurer, Avancer)                                                                                                  | ✅ Complete | Hardcoded HTML        |
| **FAQ**                   | 4 questions                                                                                                                                | ✅ Complete | `faqItems[]` in `.ts` |
| **CTA final**             | Banner                                                                                                                                     | ✅ Complete | Component             |

#### ⚠️ SERVICES — À remplacer ou cacher pour v1.0.0

| Section                      | Problème                                                                         | Status         | Evidence                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Fading Partners carousel** | 5 logos placeholder SVG (Mistranet, Trimzales, Streamlinz, Limerantz, BriteMank) | ❌ Placeholder | [fading-partners.ts:21-109](../../../apps/client/projects/web/src/app/shared/fading-partners/fading-partners.component.ts#L21) |

---

### 4. PROGRAMS PAGE (`programs.page.ts` / `.html`)

#### ✅ PROGRAMS — Complète & statique

| Section                 | Contenu                                                                                             | Status      | Source         |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ----------- | -------------- |
| **Hero**                | "Des programmes conçus pour transformer..."                                                         | ✅ Complete | Hardcoded      |
| **4 program types**     | Ateliers leadership jeunesse, Engagement communautaire, Programmes étudiants, Conférences et forums | ✅ Complete | Hardcoded HTML |
| **Inscription process** | 4 étapes (Candidature, Entretien, Inscription, Démarrage)                                           | ✅ Complete | Hardcoded HTML |
| **Format description**  | "Les programmes KRAAK restent volontairement lisibles..."                                           | ✅ Complete | Hardcoded text |
| **CTA final**           | Banner                                                                                              | ✅ Complete | Component      |

#### ✅ PROGRAMS — Pas de sections incomplètes détectées

---

### 5. RESOURCES PAGE (`resources.page.ts` / `.html`)

#### ✅ RESOURCES — Complète & statique

| Section            | Contenu                                                                 | Status      | Source         |
| ------------------ | ----------------------------------------------------------------------- | ----------- | -------------- |
| **Hero**           | "Ressources pour clarifier votre prochaine étape"                       | ✅ Complete | Hardcoded      |
| **4 orientations** | Formation, Projet, Immigration, Entreprise                              | ✅ Complete | Hardcoded HTML |
| **3 questions**    | "Où voulez-vous arriver?", "Qu'est-ce qui bloque?", "Quel premier pas?" | ✅ Complete | Hardcoded HTML |
| **CTA final**      | Banner                                                                  | ✅ Complete | Component      |

#### ✅ RESOURCES — Pas de sections incomplètes détectées

---

### 6. CONTACT PAGE (`contact.page.ts` / `.html`)

#### ✅ Complète & dynamique

| Section                      | Contenu                                                                       | Status                  | Source                                    |
| ---------------------------- | ----------------------------------------------------------------------------- | ----------------------- | ----------------------------------------- |
| **Hero**                     | "Parlons de votre projet."                                                    | ✅ Complete             | Hardcoded                                 |
| **Illustration**             | consultation-flow.svg                                                         | ✅ Complete             | Static image                              |
| **Contact Form**             | 6 champs (nom, email, objectif, pays, type service, message) + validation     | ✅ Complete             | Reactive Forms + FormGroup                |
| **Validation**               | Required, email, minLength, maxLength                                         | ✅ Complete             | Validators                                |
| **Success/Error messages**   | Via `p-message` (PrimeNG)                                                     | ✅ Complete             | Message Service                           |
| **Service options dropdown** | 6 options (Formation, R&D Projets, Immigration, Entreprise, Programme, Autre) | ✅ Complete             | `serviceOptions[]` array                  |
| **Contact info sidebar**     | Email, localisation, temps réponse, social links                              | ✅ Complete             | Hardcoded + `KRAAK_SOCIAL_LINKS` constant |
| **Social links**             | 4 réseaux (LinkedIn, Twitter/X, Instagram, WhatsApp)                          | ✅ Complete             | `KRAAK_SOCIAL_LINKS` in brand constants   |
| **API integration**          | ContactService (→ Supabase)                                                   | ✅ Complete (structure) | ContactService                            |
| **FAQ**                      | 4 questions                                                                   | ✅ Complete             | `faqItems[]`                              |
| **CTA final**                | Banner                                                                        | ✅ Complete             | Component                                 |

#### ✅ CONTACT — Pas de sections incomplètes détectées

---

## Audit des composants partagés (Shared)

### 📋 Tableau synthétique

| Composant          | Fichier                   | Status             | Problème                                                                                                          | Evidence                                                                                                                                                                                                                                        | Récup. pour v1.0.0 |
| ------------------ | ------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Testimonials**   | `shared/testimonials/`    | ❌ **PLACEHOLDER** | 3 fallback testimonials Lorem ipsum + mode "prévisualisation" + bannière "preview"                                | [testimonials.ts:23-50](../../../apps/client/projects/web/src/app/shared/testimonials/testimonials.component.ts#L23) + [testimonials.html:14-16](../../../apps/client/projects/web/src/app/shared/testimonials/testimonials.component.html#L14) | **HIDE ou REMOVE** |
| **ImpactStats**    | `shared/impact-stats/`    | ❌ **PLACEHOLDER** | Chiffres fictifs "1M+", "72K+", "2.5M+" + bannière "Chiffres d'impact en prévisualisation"                        | [impact-stats.ts:11-16](../../../apps/client/projects/web/src/app/shared/impact-stats/impact-stats.component.ts#L11) + [impact-stats.html:11-14](../../../apps/client/projects/web/src/app/shared/impact-stats/impact-stats.component.html#L11) | **HIDE ou REMOVE** |
| **TeamGrid**       | `shared/team-grid/`       | ❌ **PLACEHOLDER** | 12 profils staff fictifs + disclamer "Prévisualisation de l'équipe KRAAK" + "En attendant la liste officielle..." | [team-grid.ts:28-90](../../../apps/client/projects/web/src/app/shared/team-grid/team-grid.component.ts#L28) + [team-grid.html:5-10](../../../apps/client/projects/web/src/app/shared/team-grid/team-grid.component.html#L5)                     | **HIDE ou REMOVE** |
| **FadingPartners** | `shared/fading-partners/` | ❌ **PLACEHOLDER** | 5 logos SVG fictifs (Mistranet, Trimzales, Limerantz, BriteMank)                                                  | [fading-partners.ts:21-109](../../../apps/client/projects/web/src/app/shared/fading-partners/fading-partners.component.ts#L21)                                                                                                                  | **HIDE ou REMOVE** |
| **CtaBanner**      | `shared/cta-banner/`      | ✅ **COMPLETE**    | Aucun                                                                                                             | —                                                                                                                                                                                                                                               | ✅ Keep            |
| **FaqAccordion**   | `shared/faq-accordion/`   | ✅ **COMPLETE**    | Aucun (accepte input items)                                                                                       | —                                                                                                                                                                                                                                               | ✅ Keep            |
| **GsapAnimations** | `core/animations/`        | ✅ **COMPLETE**    | Aucun                                                                                                             | —                                                                                                                                                                                                                                               | ✅ Keep            |

---

### Détails des problèmes

#### 🔴 **Testimonials Component** (`shared/testimonials/`)

**Fichiers:** `testimonials.ts`, `testimonials.html`, `testimonials.spec.ts`

**Problème identifié:**

```typescript
// testimonials.ts
@Input() placeholder = true; // ← Default TRUE = affiche les fallbacks

readonly fallbackTestimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Robert Fox',
    job: 'Product Designer',
    avatar: 'https://fqjltiegiezfetthbags.supabase.co/...',
    comment: 'Sed adipiscing diam donec adipiscing...' // ← LOREM IPSUM
  },
  {
    id: 2,
    name: 'Jane Cooper',
    job: 'UI/UX Designer',
    avatar: 'https://...',
    comment: 'Lorem ipsum dolor sit amet, consectetur...' // ← LOREM IPSUM
  },
  {
    id: 3,
    name: 'Wade Warren',
    job: 'Software Engineer',
    avatar: 'https://...',
    comment: 'Duis aute irure dolor in reprehenderit...' // ← LOREM IPSUM
  },
];

readonly isPreviewMode = computed(
  () => this.items.length === 0 && this.placeholder, // ← Computed flag pour afficher bannière preview
);
```

**HTML Template:**

```html
@if (isPreviewMode()) {
<p class="...">Prévisualisation du format témoignages</p>
<!-- ← BANNER EXPLICITE -->
}
```

**Sur la page home:**

```html
<!-- home.page.html:383 -->
<p class="...">
  Un espace sera ouvert aux retours clients et aux preuves sociales dès que les
  prochains témoignages seront validés.
  <!-- ← MESSAGE "À VENIR" EXPLICITE -->
</p>
<kraak-testimonials />
<!-- ← Utilisé sans input items, donc fallback affichés -->
```

**Tests:** BDD tests confirment le behavior placeholder:

```typescript
// testimonials.spec.ts:13
it('Given aucun item et placeholder actif, When le composant est rendu, Then la prévisualisation de stack est affichée', () => {
  fixture.componentRef.setInput('placeholder', true);
  // → Vérifie que le banner "Prévisualisation du format" apparaît
});
```

**Récupération pour v1.0.0:**

- Option 1: `<kraak-testimonials [placeholder]="false" />` → Cache complètement la section
- Option 2: Retirer la ligne `<kraak-testimonials />` du HTML

---

#### 🔴 **ImpactStats Component** (`shared/impact-stats/`)

**Fichiers:** `impact-stats.ts`, `impact-stats.html`

**Problème:**

```typescript
// impact-stats.ts
protected readonly stats: ImpactStat[] = [
  {
    title: '1M+', // ← FICTIF
    label: 'Compétences activées vers des opportunités concrètes',
  },
  {
    title: '72K+', // ← FICTIF
    label: 'Parcours structurés lancés avec accompagnement ciblé',
  },
  {
    title: '2.5M+', // ← FICTIF
    label: 'Participants orientés vers emploi, projet ou mobilité',
  },
];
```

**HTML Template:**

```html
<!-- impact-stats.html:14 -->
<h2 class="...">Chiffres d'impact en prévisualisation</h2>
<!-- ← LABEL EXPLICITE "PREVIEW" -->
```

**Tests:**

```typescript
// impact-stats.spec.ts:23
it('should expose three preview stats', () => {
  // → Confirme le mode prévisualisation
});
```

**Récupération pour v1.0.0:**

- Retirer `<kraak-impact-stats />` du `home.page.html:399`

---

#### 🔴 **TeamGrid Component** (`shared/team-grid/`)

**Fichiers:** `team-grid.ts`, `team-grid.html`

**Problème:**

```typescript
// team-grid.ts
@Input() placeholder = true; // ← Default TRUE

readonly fallbackMembers: TeamMember[] = [
  { id: 1, name: 'Savannah Nguyen', role: 'Développeuse logiciel', image: '...' },
  { id: 2, name: 'Jenny Wilson', role: 'Développeuse logiciel', image: '...' },
  { id: 3, name: 'Albert Flores', role: 'Testeur logiciel', image: '...' },
  { id: 4, name: 'Ralph Edwards', role: 'Chef d\'équipe', image: '...' },
  { id: 5, name: 'Eleanor Pena', role: 'Spécialiste marketing', image: '...' },
  { id: 6, name: 'Annette Black', role: 'Designer UI/UX', image: '...' },
  { id: 7, name: 'Arlene McCoy', role: 'Développeuse logiciel', image: '...' },
  { id: 8, name: 'James Wilson', role: 'Product manager', image: '...' },
  { id: 9, name: 'Darlene Robertson', role: 'Testeuse logiciel', image: '...' },
  { id: 10, name: 'Kristin Watson', role: 'Développeuse logiciel', image: '...' },
  { id: 11, name: 'Floyd Miles', role: 'Testeur logiciel', image: '...' },
  { id: 12, name: 'Jane Olivia', role: 'Designer UI/UX', image: '...' },
  // ← TOUS LES PROFILS SONT FICTIFS, AVATARS PLACEHOLDER
];

readonly isPreviewMode = computed(
  () => this.members.length === 0 && this.placeholder,
);
```

**HTML:**

```html
<!-- team-grid.html:5-10 -->
@if (isPreviewMode()) {
<p class="border-secondary/20 bg-brand-white text-secondary ...">
  Prévisualisation de l'équipe KRAAK
  <!-- ← BANNER PREVIEW -->
</p>
}

<h2 class="...">L'équipe KRAAK</h2>
<p class="...">
  En attendant la liste officielle, voici un aperçu du format de présentation
  des membres de l'équipe.
  <!-- ← DISCLAMER "À VENIR" -->
</p>
```

**Used on about page:**

```html
<!-- about.page.html (bottom) -->
<kraak-team-grid />
```

**Tests:**

```typescript
// team-grid.spec.ts:14
it('Given preview mode, when the component is rendered, then fallback members are displayed', () => {
  // → Confirmé
});
```

**Récupération pour v1.0.0:**

- Retirer `<kraak-team-grid />` du `about.page.html`

---

#### 🔴 **FadingPartners Component** (`shared/fading-partners/`)

**Fichiers:** `fading-partners.ts`, `fading-partners.html`

**Problème:**

```typescript
// fading-partners.ts
partners: Partner[] = [
  {
    name: 'Mistranet',
    logo: `<svg xmlns="..." class="w-10 h-10">...</svg>`, // ← SVG FICTIF
  },
  {
    name: 'Trimzales',
    logo: `<svg xmlns="..." class="w-10 h-10">...</svg>`, // ← SVG FICTIF
  },
  {
    name: 'Streamlinz',
    logo: `<svg xmlns="..." class="w-10 h-10">...</svg>`, // ← SVG FICTIF
  },
  {
    name: 'Limerantz',
    logo: `<svg xmlns="..." class="w-10 h-10">...</svg>`, // ← SVG FICTIF
  },
  {
    name: 'BriteMank',
    logo: `<svg xmlns="..." class="w-10 h-10">...</svg>`, // ← SVG FICTIF
  },
];

duplicatedPartners = [...this.partners, ...this.partners]; // ← Duplication pour infinite scroll
```

**HTML:**

```html
<!-- fading-partners.html -->
<h2 class="...">Partenaires et clients de confiance</h2>
<!-- ← TITRE SUGGÈRE VRAIS PARTENAIRES, MAIS LES 5 SONT PLACEHOLDER -->

@for (partner of duplicatedPartners; track $index) {
<div class="...">
  <div [innerHTML]="partner.logo" aria-hidden="true"></div>
  <div class="...">{{ partner.name }}</div>
</div>
}
```

**Used on:**

- `home.page.html:404`
- `services.page.html` (potentiellement, à vérifier)

**Récupération pour v1.0.0:**

- Retirer `<kraak-fading-partners />` du `home.page.html`

---

## Tableau de synthèse — Actions recommandées pour v1.0.0

| Page         | Composant/Section                                             | Action                               | Priorité  | Notes                                                      |
| ------------ | ------------------------------------------------------------- | ------------------------------------ | --------- | ---------------------------------------------------------- |
| **home**     | `<kraak-fading-partners />`                                   | REMOVE ligne 404                     | 🔴 HIGH   | Mock logos, pas de vrais partenaires                       |
| **home**     | `<kraak-impact-stats />`                                      | REMOVE ligne 399                     | 🔴 HIGH   | Chiffres fictifs "1M+", "72K+", "2.5M+"                    |
| **home**     | `<kraak-testimonials />` (+ texte "Un espace sera ouvert...") | REMOVE lignes 383-407                | 🔴 HIGH   | 3 testimonials Lorem ipsum + banner "à venir" explicite    |
| **about**    | `<kraak-team-grid />`                                         | REMOVE avant `<kraak-cta-banner />`  | 🔴 HIGH   | 12 profils fictifs + "En attendant la liste officielle..." |
| **services** | Vérifier `<kraak-fading-partners />`                          | Localiser et REMOVE si présent       | 🟡 MEDIUM | À confirmer par lecture complète services.html             |
| —            | Mettre à jour `.spec.ts` tests                                | Adapter tests si sections supprimées | 🟡 MEDIUM | Notamment `home.page.spec.ts`, `about.page.spec.ts`        |

---

## Détails des composants à retirer ou cacher

### Option A : SUPPRIMER les sections (recommandé pour MVP propre)

```bash
# Fichiers à modifier:
1. apps/client/projects/web/src/app/features/home/home.page.html
   → Supprimer lignes avec <kraak-fading-partners />, <kraak-impact-stats />, <kraak-testimonials /> section

2. apps/client/projects/web/src/app/features/about/about.page.html
   → Supprimer ligne <kraak-team-grid />

3. apps/client/projects/web/src/app/features/home/home.page.ts
   → Aucune modification (les composants ne sont pas injectés via TS, juste en template)

4. apps/client/projects/web/src/app/features/about/about.page.ts
   → Aucune modification
```

**Avantage:** MVP clean, zéro confusion utilisateur sur sections "à venir"  
**Désavantage:** Perte de structure visuelle (certaines pages paraissent moins riches)

### Option B : CACHER via `[placeholder]="false"` (si on veut préserver l'espace)

```html
<!-- home.page.html -->
<kraak-testimonials [placeholder]="false" />
<kraak-impact-stats [placeholder]="false" />
<!-- Mais ImpactStats n'a pas d'@Input placeholder -->
<kraak-fading-partners [placeholder]="false" />
<!-- Mais FadingPartners n'a pas d'@Input placeholder -->

<!-- about.page.html -->
<kraak-team-grid [placeholder]="false" />
```

**Problème:** Seul `Testimonials` et `TeamGrid` supportent `[placeholder]` via `@Input`.
`ImpactStats` et `FadingPartners` n'ont pas d'@Input pour contrôler ça.

**Recommandation:** Opter pour l'**Option A** (SUPPRIMER).

---

## Checklist v1.0.0 — Avant merge de la branche MVP

- [ ] Supprimer `<kraak-fading-partners />` de `home.page.html`
- [ ] Supprimer `<kraak-impact-stats />` de `home.page.html`
- [ ] Supprimer `<kraak-testimonials />` section (y compris le texte "Un espace sera ouvert...") de `home.page.html`
- [ ] Supprimer `<kraak-team-grid />` de `about.page.html`
- [ ] Vérifier `services.page.html` pour `<kraak-fading-partners />` et supprimer si présent
- [ ] Exécuter `pnpm --dir apps/client test web` pour tous les `.spec.ts` pages concernées
  - [ ] `home.page.spec.ts`
  - [ ] `about.page.spec.ts`
  - [ ] `services.page.spec.ts`
  - [ ] `programs.page.spec.ts`
  - [ ] `resources.page.spec.ts`
  - [ ] `contact.page.spec.ts`
- [ ] Valider visuellement chaque page dans le navigateur
- [ ] Exécuter `pnpm --dir apps/client e2e` tests (Playwright vitrine pages)
- [ ] Merger `feat/mvp-vitrine-cleanup` vers `main` via rebase
- [ ] Tagger `v1.0.0` et déployer vers Render

---

## Sections à garder intégralement pour v1.0.0 ✅

**HOME:**

- Hero section (tagline, CTA)
- Mission intro
- 3 piliers visuels
- 3 pôles
- Solutions clés (6 cards)
- Pourquoi KRAAK (5 raisons)
- FAQ
- CTA final

**ABOUT:**

- Hero
- Mission/Vision
- Valeurs (6 cards)
- Piliers (3 cards)
- Images (community-impact, team-workshop)
- CTA final

**SERVICES:**

- Hero
- Formation (4 services)
- R&D Projets (5 services)
- Immigration (6 services)
- Solutions entreprises (5 services)
- Notre approche (3 étapes)
- FAQ
- CTA final

**PROGRAMS:**

- Hero
- 4 program types
- Inscription process (4 étapes)
- Format description
- CTA final

**RESOURCES:**

- Hero
- 4 orientations (Formation, Projet, Immigration, Entreprise)
- 3 questions de clarification
- CTA final

**CONTACT:**

- Hero
- Illustration
- Contact form complet (6 champs, validation)
- Contact info sidebar
- Social links
- FAQ
- CTA final

---

## Prochaines étapes (V1.1+)

1. **Intégrer vrais clients/partenaires** → Mettre à jour `fading-partners.ts` avec logos réels
2. **Ajouter testimonials réels** → Implémenter API pour récupérer testimonials validés depuis Supabase
3. **Afficher équipe KRAAK** → Récupérer profils team depuis API
4. **Actualiser impact metrics** → Connecter à dashboard/API pour chiffres réels
5. **Exporter les 4 composants placeholder en v1.1 backlog** → Garder l'infrastructure (components, tests) mais masqués par défaut

---

## Conclusion

**Le MVP est 95% complet et prêt pour v1.0.0.** Les 4 sections placeholder (Testimonials, ImpactStats, TeamGrid, FadingPartners) sont clairement marquées et peuvent être supprimées en 15 minutes via 4-5 edits simples.

**Recommandation finale:** Supprimer ces 4 sections pour v1.0.0, livrer un site propre et crédible, puis ajouter les sections véritables en v1.1+ une fois les vrais données disponibles.
