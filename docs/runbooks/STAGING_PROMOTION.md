# STAGING_PROMOTION — Procédure de promotion vers l'environnement staging

> Document de référence pour exposer un commit de `main` à l'environnement
> staging (Render `kraak-api-staging`, Render `kraak-web-staging`, projet
> Supabase `kraak-staging`).

Voir aussi : [`ARC-08-staging-environment`](../decisions/ARC-08-staging-environment.md),
[`ARC-07-prod-release-tag-based`](../decisions/ARC-07-prod-release-tag-based.md),
[`RELEASE_PROD`](RELEASE_PROD.md), [`ENVIRONMENT_VARIABLES`](ENVIRONMENT_VARIABLES.md),
[`RENDER_WEB_TRANSITION`](RENDER_WEB_TRANSITION.md).

---

## 1 · Principes

- **`staging` = branche de déploiement, pas de développement.** Aucun commit
  n'y est créé directement, aucune PR ne la cible.
- **`staging` n'avance que par fast-forward** depuis un commit de `main`. Si
  le fast-forward échoue, c'est un incident.
- **Pousser sur `staging` déclenche un déploiement complet** : API Render +
  Web Render + (si nécessaire) migrations Supabase staging.
- **Aucune promotion vers prod** ne dépend de `staging` : la prod est
  déclenchée exclusivement par tag SemVer (ARC-07).

---

## 2 · Pré-requis (à provisionner une seule fois)

### 2.1 Branche `staging`

Créée depuis `main` :

```bash
git checkout main
git pull --rebase
git checkout -b staging
git push -u origin staging
```

### 2.2 Protection GitHub de `staging`

`Settings → Branches → Add branch protection rule` :

- Branch name pattern : `staging`
- Require linear history : ✅
- Restrict who can push : mainteneurs uniquement
- Allow force pushes : restreint aux mainteneurs (nécessaire pour rollback)
- Required status checks : identiques à `main` (CI verte sur le commit promu)

### 2.3 Render — service `kraak-api-staging`

Configuré par [`render.yaml`](../../render.yaml) :

- `branch: staging`
- `autoDeploy: true`
- `healthCheckPath: /health`
- Variables d'env staging renseignées dans l'UI Render (`SUPABASE_URL`,
  `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, etc. — cf.
  [`ENVIRONMENT_VARIABLES`](ENVIRONMENT_VARIABLES.md)).

### 2.4 Render — service `kraak-web-staging`

Configuré par [`render.yaml`](../../render.yaml) :

- `branch: staging`
- `autoDeploy: true`
- URL stable de prévalidation : `https://kraak-web-staging.onrender.com`
- Variables d'env web staging renseignées dans l'UI Render, en particulier
  `CLIENT_SITE_URL=https://kraak-web-staging.onrender.com`.

Vercel peut rester disponible en rollback court terme pendant la transition
web, mais ne constitue plus la cible primaire de validation staging.

### 2.5 Supabase — projet `kraak-staging`

- Projet Supabase **distinct** de `kraak-prod`.
- `SUPABASE_PROJECT_REF` staging connu de l'équipe (jamais commité).
- CLI Supabase configurée localement par les mainteneurs autorisés à pousser
  des migrations staging.

---

## 3 · Procédure de promotion `main → staging`

### Étape 1 — Vérifier la santé de `main`

- CI verte sur le commit cible.
- Aucun item GitHub Project en `In Progress` lié à un changement non encore
  mergé que l'on attendait dans cette vague.
- Pas de migration Supabase non documentée dans le diff entre le commit
  staging actuel et le commit cible.

### Étape 2 — Migrations Supabase staging (si nécessaire)

Si le diff contient des migrations dans `supabase/migrations/`, les appliquer
sur le projet staging **avant** le fast-forward :

```bash
pnpm supabase link --project-ref "$SUPABASE_STAGING_PROJECT_REF"
pnpm supabase db push
```

> Règle stricte : **migrations d'abord, code ensuite**. Sinon le code déployé
> peut interroger un schéma qui n'existe pas encore.

### Étape 3 — Fast-forward `staging`

```bash
git fetch origin
git checkout staging
git pull --ff-only
git merge --ff-only origin/main
git push origin staging
```

Si `git merge --ff-only` échoue :

- Cause probable : un commit a été créé directement sur `staging` (interdit
  par ARC-08). Voir [§ 5 Rollback / réalignement](#5--rollback--réalignement-staging).

### Étape 4 — Vérifier les déploiements

- **Render** : `https://kraak-api-staging.onrender.com/health` retourne
  `status: ok` et le `version` attendu.
- **Web staging actif** : `https://kraak-web-staging.onrender.com` répond HTTP
  200, la marque KRAAK est visible, pas d'erreur console bloquante.
- **Supabase** : aucune migration en attente
  (`pnpm supabase db diff --linked` doit être vide).

### Étape 5 — Validation pré-prod

- Exécuter les E2E Playwright critiques contre l'URL staging (au minimum
  smoke des parcours MVP — cf. exigences AGENTS.md).
- Vérifier les logs Render staging (API + web) ; consulter Vercel seulement si
  le rollback temporaire est encore maintenu.
- Si tout est vert, le commit pointé par `staging` est candidat à un tag prod
  (procédure : [`RELEASE_PROD`](RELEASE_PROD.md)).

### Étape 6 — Mise à jour des items de suivi

- Mettre à jour les items GitHub Project concernés en commentant la
  promotion staging (commit, URL de validation).
- Ne **pas** clore les issues sur la base d'un déploiement staging seul : la
  clôture se fait après merge sur `main` (déjà fait) et release prod
  (procédure RELEASE_PROD).

---

## 4 · Cadence et fenêtres de promotion

- **Cadence par défaut** : promotion à la demande, dès qu'une vague de
  changements de `main` est jugée prête à être validée.
- **Fenêtre interdite** : pendant qu'une release prod est en cours
  d'approbation GitHub Environment (éviter de bouger staging tant que la
  validation pré-prod du tag est en jeu).
- **Latence acceptable** : `staging` peut être en retard de plusieurs commits
  sur `main` ; c'est attendu et conforme à ARC-08.

---

## 5 · Rollback / réalignement staging

### 5.1 Rollback simple sur un commit antérieur de `main`

Quand un bug est détecté en staging et que l'on veut revenir à un état stable
sans attendre un revert sur `main` :

```bash
git checkout staging
git fetch origin
git reset --hard <sha-commit-main-stable>
git push --force-with-lease origin staging
```

Les services Render staging redéploient automatiquement le commit pointé.

### 5.2 Réalignement après commit accidentel sur `staging`

Si quelqu'un a poussé un commit directement sur `staging` (interdit) :

```bash
git checkout staging
git fetch origin
git reset --hard origin/main
git push --force-with-lease origin staging
```

Documenter l'incident (qui, quand, quoi) et renforcer la protection GitHub si
nécessaire.

### 5.3 Rollback Supabase staging

Les migrations Supabase **ne se rollbackent pas** par défaut : elles se
**compensent** par une nouvelle migration `down`. Si une migration staging
casse le schéma :

1. Créer une migration corrective sur une branche courte (`fix/<sujet>`).
2. Merger la PR sur `main`.
3. Re-promouvoir `main → staging` (procédure normale).
4. Appliquer `pnpm supabase db push` staging.

Ne **jamais** restaurer un dump staging par-dessus un schéma existant sans
synchroniser l'historique des migrations versionnées.

---

## 6 · Anti-patterns interdits

- ❌ Créer un commit directement sur `staging`.
- ❌ Cibler une PR vers `staging` au lieu de `main`.
- ❌ `git push --force` sur `staging` hors procédure de rollback documentée.
- ❌ Déployer un commit en staging avant que ses migrations Supabase
  associées soient appliquées sur le projet `kraak-staging`.
- ❌ Promouvoir vers prod un commit qui n'a pas été d'abord exposé en
  staging et validé manuellement (sauf hotfix exceptionnel documenté dans
  [`DEP-06`](DEP-06_INCIDENT_ROLLBACK_PILOT_CHECKLIST_2026-04-30.md)).
- ❌ Supprimer la branche `staging` (elle est permanente — ARC-08).
- ❌ Réutiliser le projet Supabase staging pour des données réelles
  d'utilisateurs prod.

---

## 7 · Tableau de synthèse des environnements

| Environnement | Branche déclencheuse | Déploiement Render          | Déploiement Vercel                     | Projet Supabase | Décision |
| ------------- | -------------------- | --------------------------- | -------------------------------------- | --------------- | -------- |
| Local         | —                    | —                           | —                                      | local / partagé | —        |
| Staging       | `staging` (push)     | `kraak-api-staging` (auto)  | projet staging (Production: `staging`) | `kraak-staging` | ARC-08   |
| Prod          | tag `v*.*.*`         | `kraak-api-prod` (workflow) | projet prod (par CLI sur tag)          | `kraak-prod`    | ARC-07   |

---

## 8 · Checklist rapide (à copier dans la PR ou l'item Project)

- [ ] CI verte sur le commit cible de `main`
- [ ] Migrations Supabase staging appliquées (si applicable)
- [ ] Fast-forward `staging` réussi
- [ ] `/health` API staging vert avec bonne version
- [ ] Home web staging vérifiée (HTTP 200, marque visible)
- [ ] Smoke E2E Playwright staging vert
- [ ] Item GitHub Project annoté (commit + URL staging)

---

## 9 · Addendum cloture vitrine publique (PR-06)

Cet addendum verrouille la fin de phase vitrine publique et sert de garde-fou
avant bascule vers les routes protegees.

### Definition of Done vitrine fermee

- [ ] Toutes les routes vitrine gelees ont au moins un test E2E de presence
      et un test SEO head.
- [ ] Les pages de support `401`, `403`, `404`, `500` ont une couverture E2E
      complete (rendu, SEO, CTA).
- [ ] Les checks accessibilite/performance publics sont verts et stables sur 3
      executions CI consecutives.
- [ ] Promotion staging executee et tracee (preuves datees et reproductibles).
- [ ] Dry-run release prod execute et documente.
- [ ] Documentation alignee sans contradiction sur le perimetre vitrine final.

### Regle de gouvernance post-cloture

- Toute nouvelle route publique est interdite sans decision ARC explicite.
- Le backlog actif doit prioriser les routes protegees et les parcours
  participants.
