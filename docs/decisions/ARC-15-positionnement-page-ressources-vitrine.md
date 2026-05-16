# ARC-15 - Positionnement de la page `/ressources` dans la vitrine

| Champ          | Valeur                              |
| -------------- | ----------------------------------- |
| **Statut**     | Acceptée                            |
| **Date**       | 2026-05-15                          |
| **Auteurs**    | Équipe KRAAK                        |
| **Dépendance** | ARC-05, ARC-10, ARC-14              |
| **Liée à**     | surface vitrine MVP, route publique |

---

## 1 · Contexte

La route publique `/ressources` existe déjà dans la surface vitrine gelée
(ARC-14). En pratique, son contenu joue aujourd'hui un rôle simple :
**aider un visiteur à s'orienter** entre les grands points d'entrée KRAAK
(formation, projet, mobilité internationale, solution entreprise).

Le risque identifié est de laisser croire que cette route serait déjà :

- un hub éditorial public ;
- une bibliothèque de contenus à volume ;
- ou une déclinaison simplifiée des futures ressources côté participant.

Cela réouvrirait le périmètre public sans décision explicite.

---

## 2 · Décision

### 2.1 Nature de la route

Pour le MVP vitrine, `/ressources` est **officiellement une page d'orientation
statique**.

Son rôle est de :

- clarifier le besoin d'un visiteur ;
- présenter les grands points d'entrée KRAAK ;
- orienter vers `/services`, `/programmes` ou `/contact` ;
- servir de repère éditorial léger, et non de bibliothèque de contenu.

### 2.2 Ce que `/ressources` n'est pas

Pour le MVP vitrine, `/ressources` n'est **pas** :

- un blog ;
- un média d'actualités ;
- une bibliothèque publique d'articles ou de téléchargements ;
- une surface data-driven de listing public de ressources ;
- un substitut à la future bibliothèque de ressources côté participant.

### 2.3 Conséquence de périmètre

Si KRAAK souhaite plus tard un véritable hub de contenu public
(actualités, articles, guides, bibliothèque documentaire, SEO éditorial,
etc.), ce besoin devra être traité comme un **chantier public-content
distinct** avec :

- un cadrage explicite ;
- un item de suivi dédié ;
- une priorisation propre ;
- une décision documentaire si la frontière MVP/V1.1 change.

Ce chantier ne doit pas être rattaché implicitement :

- au travail sur les routes protégées ;
- au backlog participant ;
- à la simple maintenance de la page vitrine `/ressources`.

---

## 3 · Justification

### 3.1 Clarté produit

La vitrine a besoin d'une page de triage simple, pas d'un faux hub éditorial
sans gouvernance de contenu, sans workflow de publication et sans backlog
assumé.

### 3.2 Anti-scope-creep

Cette décision protège le gel de la vitrine (ARC-14) en empêchant l'ajout
progressif de fonctionnalités éditoriales publiques sous couvert de
"ressources".

### 3.3 Séparation avec le produit participant

Le dépôt contient déjà une vraie logique `resources` côté produit participant
(API, taxonomie, consultation filtrée, mobile). Cette logique ne doit pas être
confondue avec la page publique `/ressources`, qui reste un repère marketing
d'orientation.

---

## 4 · Implémentation

La mise en oeuvre attendue côté vitrine est :

- un contenu explicite de type orientation / triage ;
- une métadonnée SEO cohérente avec ce rôle ;
- aucune promesse implicite de catalogue public ou de flux éditorial ;
- un CTA principal orienté vers la prise de contact.

La source de vérité documentaire devient :

- ce présent ADR ;
- ARC-14 pour le gel de surface ;
- la page `/ressources` elle-même pour le message visible.

---

## 5 · Conséquences

### 5.1 Positives

- positionnement public plus honnête ;
- moins d'ambiguïté entre vitrine et produit participant ;
- protection contre un glissement vers un hub éditorial non cadré.

### 5.2 Contraintes

- tout projet de contenu public récurrent devra être planifié séparément ;
- la page `/ressources` restera volontairement légère tant qu'aucun chantier
  public-content n'est ouvert.

---

## 6 · Alternatives écartées

- **Transformer `/ressources` en blog léger sans décision formelle** : rejeté,
  car cela ouvre un nouveau produit éditorial sans gouvernance.
- **Supprimer `/ressources` de la vitrine** : rejeté, car la page garde une
  utilité réelle de triage et d'orientation.
- **Faire évoluer `/ressources` au fil de l'eau jusqu'à devenir une
  bibliothèque publique** : rejeté, car cela brouille la séparation avec les
  surfaces participant et réouvre le scope vitrine.
