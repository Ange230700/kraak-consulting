---
status: active
owner: platform
last_reviewed: 2026-10-27
source_of_truth: true
---

# Release production

## Table des matières

- [Release production](#release-production)
  - [Principes](#principes)
  - [Prévol obligatoire](#prevol-obligatoire)
  - [Déploiement](#deploiement)
  - [Rollback et retrait de ressources](#rollback-et-retrait-de-ressources)

## Principes

- `main`, protégée, reçoit les PR de travail validées par rebase.
- Un push sur `main` ne déploie pas automatiquement Render.
- Un tag SemVer accessible depuis `main` déclenche le workflow
  [Release Prod](../../.github/workflows/release-prod.yml).
- L’environnement GitHub `production` conserve approbation et délai d’attente.
- Aucun environnement distant permanent de préproduction n’est requis.

## Prévol obligatoire

1. Tous les contrôles requis de la PR doivent être verts, notamment qualité,
   tests, builds, E2E et SonarCloud.
2. Identifier les deux services Render de production et leur commit réellement
   déployé. Vérifier branche `main`, URLs, CORS et projet Supabase.
3. Comparer l’historique distant et les migrations versionnées. Une divergence
   exige une réconciliation ciblée et une répétition locale ; ne jamais lancer
   `migration repair`, `db reset` ou `db push --include-all` à l’aveugle.
4. Vérifier les sauvegardes et la possibilité de restauration avant une
   migration destructive.
5. Vérifier tous les [secrets requis](ENVIRONMENTS.md), notamment les deux
   identifiants Render. Leur absence bloque la release.

Le [garde de migrations](../../.github/workflows/supabase-migrations-guard.yml)
est désormais en lecture seule. Les écritures de schéma sont réservées à la
release approuvée ; une fusion ne doit pas appliquer automatiquement des
migrations à une base dont l’historique n’est pas réconcilié.

## Déploiement

1. Synchroniser `main` par avance rapide.
2. Créer un nouveau tag SemVer sur le commit validé, sans déplacer un tag existant.
3. Pousser le tag sans contourner les hooks.
4. Vérifier les contrôles du tag, puis approuver les jobs de production.
5. Vérifier les migrations ciblées, le déploiement API, puis le déploiement web.
6. Contrôler le commit Render effectif, `/health` (environnement et version),
   les pages FR/EN, le runtime client, Auth, session, autorisations, Storage,
   callbacks, e-mails et CORS, avec des comptes de test autorisés.

Un HTTP 200 sur `/health` n’est pas une validation complète. Les limitations
observées doivent être inscrites dans le compte rendu, pas masquées.

## Rollback et retrait de ressources

Redéployer un tag antérieur déjà validé et conservé. Ne jamais forcer `main`
ni réécrire l’historique de migrations. Un rollback applicatif ne restaure pas
les données modifiées par une migration.

Le retrait de ressources suit les barrières du
[registre de transition](PRODUCTION_ONLY_TRANSITION.md), indépendamment du
changement de branche par défaut. Ne pas déclarer une économie avant confirmation
de suppression et vérification de facturation auprès du fournisseur.
