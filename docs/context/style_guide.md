# Point 6 — Guide de style UI allégé (KRAAK)

## 1. Objectif du guide 🎨

Ce guide de style UI allégé fixe les règles visuelles minimales nécessaires pour garantir une interface :

- cohérente ;
- crédible ;
- professionnelle ;
- orientée opportunités ;
- suffisamment flexible pour faire évoluer le site sans casser l’identité visuelle.

---

## 2. Orientation visuelle retenue

### Choix final

**Consulting moderne + autonomisation des jeunes / ambitieuse**, avec une **base institutionnelle crédible**.

### Ce que cela signifie en pratique

- l’interface doit inspirer **confiance** ;
- elle doit aussi transmettre **énergie, ambition, progression et ouverture internationale** ;
- le rendu doit rester **sobre, structuré, lumineux et professionnel** ;
- éviter un style trop administratif, trop rigide ou trop “corporate froid”.

---

## 3. Logo ✅

### Confirmation d’usage

Le **logo principal KRAAK** est l’élément d’identité visuelle de référence.

### Règles d’utilisation

- utiliser en priorité le **logo principal complet** sur fond clair ;
- utiliser une **version inversée** uniquement sur fond bleu marine foncé si elle existe ;
- ne pas modifier les couleurs du logo ;
- ne pas étirer, incliner, recolorer ou ajouter d’effets ;
- conserver un espace de respiration autour du logo.

### Recommandations

- **Header :** version principale horizontale
- **Footer :** version principale ou simplifiée
- **Favicon :** monogramme ou symbole extrait du logo si disponible

> Remarque : si plusieurs variantes du logo existent, il faudra les classer en :
>
> - primaire
> - secondaire
> - icône / favicon

---

## 4. Palette de couleurs confirmée 🌈

### Couleurs de marque

```css
--kr-color-brand-navy: #122b4a;
--kr-color-brand-navy-soft: #1c4e86;
--kr-color-brand-blue: #1673ae;
--kr-color-brand-cyan: #4cc3d9;
--kr-color-brand-gold: #f0c433;
--kr-color-brand-gray: #8b8d92;
--kr-color-brand-white: #ffffff;
--kr-color-brand-page: #f3f3f3;
```

### Couleurs neutres

```css
--kr-color-neutral-0: #ffffff;
--kr-color-neutral-50: #f8f8f8;
--kr-color-neutral-100: #f3f3f3;
--kr-color-neutral-200: #e5e7eb;
--kr-color-neutral-300: #d1d5db;
--kr-color-neutral-400: #9ca3af;
--kr-color-neutral-500: #6b7280;
--kr-color-neutral-600: #4b5563;
--kr-color-neutral-700: #374151;
--kr-color-neutral-800: #1f2937;
--kr-color-neutral-900: #111827;
```

### Rôles des couleurs

#### Couleur primaire

- **Navy** `#122b4a`
- usage : header, footer, CTA principal, titres importants, éléments de structure

#### Couleur secondaire

- **Blue** `#1673ae`
- usage : liens, accents d’interface, icônes, éléments de mise en avant

#### Couleur d’accent positif / dynamique

- **Cyan** `#4cc3d9`
- usage : surlignages, pictogrammes, petits accents, états actifs légers

#### Couleur d’accent premium / confiance

- **Gold** `#f0c433`
- usage : highlights, badges, micro-accents, éléments “impact” ou “opportunité”
- à utiliser avec parcimonie

#### Couleur neutre de fond

- **Page** `#f3f3f3`
- usage : fond général de page ou bandes alternées

#### Couleur texte secondaire

- **Brand Gray** `#8b8d92`
- usage : textes secondaires, légendes, métadonnées

### Règles d’usage couleur

- privilégier des fonds **clairs et respirants** ;
- réserver le **navy** aux éléments structurants ;
- ne pas surcharger l’interface avec plusieurs accents simultanés ;
- le **gold** ne doit pas devenir la couleur dominante ;
- garder un contraste lisible pour tous les textes et boutons.

---

## 5. Typographie confirmée ✍️

### Police principale

```css
--kr-font-family: 'Poppins', 'Avenir Next', 'Segoe UI', sans-serif;
```

### Rôle typographique

- **Poppins** devient la police principale du site ;
- elle soutient bien une image :
  - moderne,
  - accessible,
  - ambitieuse,
  - propre au digital.

### Recommandations d’usage

#### Titres

- Poppins
- poids : **600 à 700**
- tracking normal
- style net, sans effet

#### Corps de texte

- Poppins
- poids : **400 à 500**
- interligne confortable

#### Labels / navigation / boutons

- Poppins
- poids : **500 à 600**

### Hiérarchie conseillée

- **H1 :** 40–56 px
- **H2 :** 30–40 px
- **H3 :** 24–28 px
- **Body large :** 18–20 px
- **Body :** 16 px
- **Small text :** 14 px
- **Caption :** 12–13 px

### Règles éditoriales

- limiter les blocs trop denses ;
- favoriser des titres courts, nets, à forte valeur de sens ;
- garder un bon rythme vertical entre titres, paragraphes et CTA.

---

## 6. Boutons 🔘

### Style général

Les boutons doivent paraître :

- clairs ;
- solides ;
- modernes ;
- fiables ;
- simples à identifier.

### Bouton principal

- fond : `#122b4a`
- texte : blanc
- hover : `#1c4e86`
- rayon : 12 px
- poids typo : 600
- padding : 12 px vertical / 20 px horizontal

**Usage :**

- Demander une consultation
- Nous contacter
- S’inscrire

### Bouton secondaire

- fond : blanc
- texte : `#122b4a`
- bordure : `#122b4a`
- hover : fond très clair bleu/gris

**Usage :**

- En savoir plus
- Découvrir les services

### Bouton tertiaire / lien d’action

- pas de fond
- texte bleu ou navy
- soulignement au hover

### Règles des boutons

- un seul **CTA principal** par zone critique ;
- ne pas multiplier plusieurs boutons primaires côte à côte sans raison ;
- maintenir des libellés d’action clairs et orientés résultat.

---

## 7. Cartes 🪪

### Usage des cartes

Les cartes serviront pour :

- domaines d’expertise ;
- services ;
- programmes ;
- témoignages ;
- partenaires ;
- bénéfices / résultats.

### Style recommandé

- fond : blanc
- bordure légère ou ombre douce
- rayon : **16 à 20 px**
- padding : **20 à 28 px**
- ombre légère uniquement, jamais agressive

### Contenu type d’une carte

1. icône ou chiffre
2. titre
3. texte court
4. CTA ou lien optionnel

### Règles des cartes

- privilégier des cartes simples et aérées ;
- éviter les cartes trop textuelles ;
- garder une structure répétable.

---

## 8. Espacement 📐

### Principe

L’interface doit respirer.  
KRAAK doit transmettre une impression de **clarté, de méthode et de maîtrise**.

### Échelle recommandée

- **4 px**
- **8 px**
- **12 px**
- **16 px**
- **24 px**
- **32 px**
- **48 px**
- **64 px**
- **96 px**

### Usage des espacements

- espacement interne composant : 12–24 px
- espacement entre blocs : 24–32 px
- espacement entre sections : 64–96 px

### Règle générale

- mieux vaut **plus d’espace** que trop peu ;
- éviter les interfaces compactes ou étouffées.

---

## 9. Modèles de sections 🧱

### 1) Hero

Contient :

- titre fort
- sous-titre
- CTA principal
- CTA secondaire éventuel
- visuel ou illustration

### 2) Section d’introduction

Contient :

- petit label
- titre
- texte d’accompagnement

### 3) Section cartes

Contient :

- titre
- sous-texte
- grille de cartes

### 4) Section preuve / impact

Contient :

- chiffres, bénéfices, résultats, promesses crédibles

### 5) Section témoignages

Contient :

- titre
- espace réservé pour citations
- structure simple et lisible

### 6) Section CTA finale

Contient :

- message d’encouragement
- action principale
- action secondaire éventuelle

### 7) Footer

Contient :

- logo
- navigation secondaire
- coordonnées
- réseaux sociaux
- mentions légales

---

## 10. Style des photos et illustrations 🖼️

### Direction visuelle recommandée

Les images doivent exprimer :

- progression ;
- ambition ;
- accompagnement ;
- professionnalisation ;
- ouverture au monde ;
- confiance.

### Style photo

- visuels lumineux ;
- scènes naturelles ou semi-professionnelles ;
- jeunes en apprentissage, collaboration, mentorat, mobilité, travail, présentation ;
- éviter les banques d’images trop artificielles ;
- privilégier des expressions confiantes, concentrées, positives.

### Style illustration

- illustrations simples, modernes, propres ;
- usage limité ;
- plutôt comme support secondaire que comme identité principale.

### Règles des visuels

- éviter les visuels trop institutionnels, figés ou vieillissants ;
- éviter les compositions trop “startup gadget” ;
- garder une cohérence de cadrage, de lumière et d’intention.

---

## 11. Ton visuel global

L’interface doit donner l’impression que KRAAK est :

- sérieuse ;
- structurée ;
- tournée vers l’avenir ;
- proche des jeunes ;
- capable d’ouvrir des opportunités concrètes.

En un mot, l’UI doit apparaître comme :
**professionnelle, ambitieuse, accessible et internationale.**

---

## 12. Recommandations pratiques pour l’implémentation

### Radius

- boutons : **12 px**
- inputs : **12 px**
- cartes : **16 à 20 px**
- sections visuelles importantes : **24 px** si nécessaire

### Ombres

- discrètes ;
- douces ;
- jamais très lourdes.

### Bordures

- fines ;
- neutres ;
- utilisées pour structurer plutôt que décorer.

### Icônes

- style simple, moderne, outline ou semi-filled cohérent ;
- éviter de mélanger plusieurs styles d’icônes.

---

## 13. Synthèse des choix validés ✅

### Logo

- logo principal confirmé
- favicon à dériver du symbole si disponible

### Couleurs

- navy comme ancrage principal
- blue et cyan comme accents digitaux
- gold comme accent de valeur
- neutres clairs pour la respiration

### Typographie

- Poppins comme police principale du site

### Composants

- boutons nets, lisibles, arrondis
- cartes claires, blanches, aérées
- espacement généreux
- sections répétables et structurées

### Direction créative

- **consulting moderne**
- **autonomisation des jeunes / ambitieuse**
- **crédibilité institutionnelle en soutien**

---

## 14. Résultat attendu

Ce guide de style UI allégé fournit une base suffisamment claire pour :

- créer les wireframes ;
- construire le design system initial ;
- commencer l’implémentation front-end avec cohérence.
