# ARC-11 — Consolidation des projets Vercel en un seul projet

- **Statut** : Acceptée
- **Date** : 2026-05-03
- **Remplace** : aspect "deux projets Vercel" d'ARC-08 et ARC-09
- **Lié** : ARC-07 (release prod tag-based), ARC-10 (feature flag espace participant)

---

## 1 · Contexte

Jusqu'ici, deux projets Vercel coexistaient pour ce dépôt :

| Projet                     | Branche prod | Rôle                         |
| -------------------------- | ------------ | ---------------------------- |
| `kraak-consulting`         | `main`       | Production (déploy CLI prod) |
| `kraak-consulting-staging` | `staging`    | Staging auto-deploy sur push |

Cette duplication a été motivée historiquement par le besoin d'environnements
strictement isolés. À l'usage, elle apporte plus de coût opérationnel que de
valeur :

- duplication des variables d'environnement (rebascule manuelle à chaque ajout) ;
- deux dashboards à surveiller pour un site vitrine MVP ;
- deux URLs `*.vercel.app` à maintenir et documenter ;
- deux check GitHub à câbler dans les protections de branche ;
- aucun besoin réel d'isolation totale (pas de cron, pas d'ISR avancée, pas de
  quota séparé requis pour un MVP).

Le modèle natif Vercel **un projet = un repo, plusieurs environnements**
suffit largement pour notre cible. Les variables d'environnement Vercel
supportent un override **par branche Git** (champ `gitBranch`), ce qui permet
d'injecter des valeurs propres au déploiement Preview de la branche `staging`
sans dupliquer le projet.

---

## 2 · Décision

### 2.1 Modèle cible

- **Un seul projet Vercel** : `kraak-consulting`.
- Branche de production : `main`. Aucune auto-deploy : la prod passe
  exclusivement par `release-prod.yml` (`vercel deploy --prebuilt --prod`),
  conformément à ARC-07.
- Branche `staging` : auto-déploiement Preview à chaque push. C'est l'URL de
  référence pour la recette interne.
- Toutes les autres branches (PR, `feat/*`, etc.) : **pas** d'auto-deploy
  (économie de quota et de bruit). Géré via `ignoreCommand` dans `vercel.json`.

### 2.2 Variables d'environnement

Pour chaque variable nécessitant une valeur différente entre prod et staging,
on crée trois entrées sur le projet `kraak-consulting` :

| Cible (`target`) | `gitBranch` | Rôle                             |
| ---------------- | ----------- | -------------------------------- |
| `production`     | (vide)      | Valeur prod                      |
| `preview`        | `staging`   | Valeur staging (override branch) |
| `preview`        | (vide)      | Valeur fallback PR / branches    |
| `development`    | (vide)      | Valeur `vercel dev` local        |

Exemple `CLIENT_FEATURE_PARTICIPANT_AREA` :

| Cible         | `gitBranch` | Valeur  |
| ------------- | ----------- | ------- |
| `production`  | —           | `false` |
| `preview`     | `staging`   | `true`  |
| `preview`     | —           | `false` |
| `development` | —           | `true`  |

### 2.3 `ignoreCommand`

```jsonc
"ignoreCommand": "case \"$VERCEL_GIT_COMMIT_REF\" in staging) exit 1 ;; *) exit 0 ;; esac"
```

- Sur push `staging` → `exit 1` → Vercel construit (Preview).
- Sur push `main` → `exit 0` → Vercel ignore. La prod est déclenchée par CI
  via `vercel deploy --prebuilt --prod`.
- Sur toute autre ref → `exit 0` → Vercel ignore.

### 2.4 Check GitHub

- Le check `Vercel – kraak-consulting-staging` n'existe plus.
- Le check requis sur les PR vers `staging` devient `Vercel – kraak-consulting`
  (Preview de la branche source de la PR).
- Aucun check Vercel n'est requis sur les PR vers `main` (ARC-07 / ARC-09).

### 2.5 Domaines

- `kraak-consulting.vercel.app` : URL prod historique conservée.
- `kraak-consulting-git-staging-<scope>.vercel.app` : URL stable auto-générée
  par Vercel pour la branche `staging`. Remplace
  `kraak-consulting-staging.vercel.app`.
- Domaines custom à venir : associés au projet unique, par environnement.

---

## 3 · Conséquences

### 3.1 Positives

- Une seule source de vérité Vercel pour les variables d'environnement.
- Suppression de la duplication des dashboards, secrets et configurations.
- Modèle natif Vercel respecté → meilleure compatibilité avec les évolutions
  futures (Analytics, Speed Insights, Image Optimization).
- Réduction du nombre de projets soumis à quota gratuit.

### 3.2 Négatives / dette

- L'URL stable de staging change : passage de `kraak-consulting-staging.vercel.app`
  à `kraak-consulting-git-staging-*.vercel.app`. Documenter et mettre à jour
  les références (runbooks, e2e, communications internes).
- Le check GitHub change de nom : nécessite mise à jour des règles de
  protection de branche `staging` (manuelle dans GitHub Settings ou via
  `scripts/github/update-branch-protection.mjs`).

### 3.3 Sortie

- Cette décision est définitive tant que le MVP reste un site vitrine
  Angular sans besoin d'environnements totalement isolés (cron, quotas
  séparés, comptes facturation distincts). En cas de bascule vers une
  plateforme nécessitant cette isolation, créer un nouvel ADR.

---

## 4 · Alternatives écartées

- **Statu quo (deux projets)** : duplication permanente et sources d'erreur
  pour un gain d'isolation que le MVP n'exploite pas.
- **Trois projets ou plus (par feature env)** : sur-ingénierie, hors périmètre
  MVP.
- **Un projet sans `ignoreCommand`** : Vercel auto-déployerait toutes les
  branches → coût et bruit inutiles, et créerait une race condition possible
  avec le déploiement prod CLI sur `main`.

---

## 5 · Migration appliquée

1. Variables `CLIENT_FEATURE_PARTICIPANT_AREA` reconfigurées sur
   `kraak-consulting` selon le tableau §2.2.
2. `vercel.json` : `ignoreCommand` mis à jour (§2.3).
3. ARC-09 (§2.3 staging) et ARC-10 (§2.3 configuration par environnement) mis
   à jour pour refléter le projet unique.
4. `scripts/github/update-branch-protection.mjs` : check
   `Vercel – kraak-consulting-staging` retiré, remplacé par
   `Vercel – kraak-consulting`.
5. Projet `kraak-consulting-staging` supprimé via API Vercel.
