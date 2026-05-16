# ARC-14 - Gel de la surface vitrine publique

| Champ          | Valeur                      |
| -------------- | --------------------------- |
| **Statut**     | Acceptée                    |
| **Date**       | 2026-05-15                  |
| **Auteurs**    | Équipe KRAAK                |
| **Dépendance** | ARC-05, ARC-10, ARC-13      |
| **Liée à**     | ARC-01, ARC-03 ; issue #421 |

---

## 1 · Contexte

Le dépôt dispose désormais :

- d'une surface web publique stable ;
- d'un gating explicite des routes non vitrines côté web ;
- d'un retrait des sections de prévisualisation du bundle production.

Avant de concentrer le travail sur les routes protégées et les flux
participant, l'équipe veut **geler explicitement le périmètre vitrine** afin de
ne plus rouvrir le scope public par glissement progressif.

Le besoin n'est plus de découvrir quelles pages publiques existent, mais de
déclarer formellement quelles routes constituent la vitrine terminée du MVP.

---

## 2 · Décision

### 2.1 Surface vitrine publique déclarée complète

La surface vitrine publique du MVP est déclarée complète avec les routes
suivantes :

- `/`
- `/a-propos`
- `/services`
- `/faq`
- `/programmes`
- `/ressources`
- `/contact`
- `/mentions-legales`
- `/politique-de-confidentialite`
- la page `404` servie via la wildcard `**`

### 2.2 Règle de gel

À partir de cette décision :

- aucune nouvelle route publique vitrine ne doit être ajoutée par défaut ;
- aucune extension de périmètre éditorial ou fonctionnel côté vitrine ne doit
  être considérée comme implicite ;
- tout ajout de surface publique supplémentaire doit faire l'objet :
  - d'une demande explicite ;
  - d'un item de suivi dédié ;
  - d'une décision documentaire si la frontière MVP/V1.1 change.

### 2.3 Ce qui n'appartient pas à cette surface

Les routes et flux suivants ne font **pas** partie de la surface vitrine
déclarée complète :

- `/connexion`
- `/inscription`
- `/mot-de-passe-oublie`
- `/participant/**`
- tout flux authentifié, dashboard, apprentissage, paiement, CMS, CRM ou
  autre extension V1.1+

---

## 3 · Justification

### 3.1 Clarté produit

Le site vitrine n'est plus une zone ouverte où ajouter des pages ou variantes
au fil de l'eau. Il devient un **périmètre public figé**, lisible par tous les
contributeurs.

### 3.2 Priorisation

Le gel évite de détourner l'effort vers des raffinements publics sans fin alors
que la prochaine concentration de travail doit porter sur les routes protégées
et les parcours participant.

### 3.3 Cohérence avec les décisions existantes

- ARC-10 distingue déjà vitrine publique et espace participant.
- ARC-13 retire les routes non vitrines du build web de production.
- Cette décision complète ces deux ADR en déclarant **quelle surface publique
  reste effectivement en jeu**.

---

## 4 · Implémentation

La source de vérité technique de la surface vitrine reste :

- [`apps/client/projects/web/src/app/app.routes.ts`](../../apps/client/projects/web/src/app/app.routes.ts)
  pour les routes marketing publiques et la wildcard `404` ;
- [`apps/client/projects/web/src/app/participant-area.prod.routes.ts`](../../apps/client/projects/web/src/app/participant-area.prod.routes.ts)
  pour l'absence des routes participant en production ;
- [`apps/client/angular.json`](../../apps/client/angular.json) pour les
  `fileReplacements` production qui retirent les surfaces non vitrines du
  bundle public.

La source de vérité documentaire devient :

- ce présent ADR ;
- le `README.md` racine pour la vue d'ensemble du dépôt.

---

## 5 · Conséquences

### 5.1 Positives

- frontière publique explicite et stable ;
- réduction du risque de scope creep sur le web public ;
- meilleure séparation entre travail vitrine et travail routes protégées.

### 5.2 Contraintes

- un besoin de nouvelle page publique ne peut plus être traité comme une simple
  “petite extension” ;
- toute évolution de la surface vitrine devra repasser par une validation de
  périmètre.

---

## 6 · Alternatives écartées

- **Laisser la frontière implicite dans le code** : rejeté, trop fragile pour
  le pilotage.
- **Documenter seulement dans le backlog** : rejeté, car le backlog change plus
  souvent qu'une frontière de périmètre.
- **Geler uniquement en production sans décision écrite** : rejeté, car cela ne
  protège pas les futures priorisations.
