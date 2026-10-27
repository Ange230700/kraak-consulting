---
status: active
owner: platform
last_reviewed: 2026-10-27
source_of_truth: true
---

# Transition vers une production unique

## Table des matières

- [Transition vers une production unique](#transition-vers-une-production-unique)
  - [Suivi et preuves](#suivi-et-preuves)
  - [Barrières obligatoires](#barrieres-obligatoires)
  - [Blocages actuels](#blocages-actuels)
  - [Exécution après levée des blocages](#execution-apres-levee-des-blocages)

## Suivi et preuves

Suivi : [issue #733](https://github.com/Ange230700/kraak-consulting/issues/733).
PR : [#735](https://github.com/Ange230700/kraak-consulting/pull/735), vers `main`.
Décision : [ARC-22](../decisions/ARC-22-production-only-main.md).

L'[inventaire daté](../generated/PRODUCTION_ONLY_INVENTORY_2026-10-27.md)
conserve les identifiants, preuves de propriété, références effectives,
résultats des contrôles, emplacements de sauvegarde et limites de récupération.
Il distingue les ressources de production, staging, partagées et non résolues,
y compris les intégrations historiques encore accessibles.

## Barrières obligatoires

Le défaut GitHub `main` et les protections ne constituent pas une preuve
de livraison ou de retrait. Garder l'issue et le Project en cours tant que
les étapes suivantes ne sont pas toutes vérifiées :

1. Réconcilier le code par PR vers `main`, sans contourner les contrôles requis.
2. Identifier le commit réellement déployé et valider les parcours production,
   y compris les flags désactivés, Auth, session, autorisations, API et callbacks.
3. Comparer schémas, migrations, données, Auth et Storage ; ne jamais réparer
   l'historique ou écraser la production pour les faire coïncider.
4. Conserver les données uniques et les sauvegardes complètes hors des ressources
   supprimées, vérifier leur intégrité et tester une restauration isolée.
5. Établir la propriété et l'absence de dépendances pour chaque ressource avant
   de la supprimer ; préserver comptes, forfaits et ressources partagés.
6. Vérifier la suppression auprès du fournisseur et la facturation effective.

## Blocages actuels

- Site Render production indisponible sur les chemins contrôlés.
- Smoke avec participant désactivé non validé.
- Données uniques staging à conserver ou transférer selon décision métier.
- Sauvegarde DB cohérente et restauration complète non démontrées.
- Configuration Auth, secrets de release, DNS et certaines intégrations incomplets.
- Branching automatique de l'intégration Supabase à désactiver pour ce dépôt.

Aucun de ces points ne doit être masqué par un HTTP 200 sur `/health`, un check
de preview vert ou la suppression d'une branche Git. Aucune économie réalisée
n'est confirmée tant que les ressources et leur facturation ne sont pas vérifiées.

## Exécution après levée des blocages

Fusionner la PR validée par rebase, effectuer une release approuvée selon
[RELEASE_PROD](RELEASE_PROD.md), puis vérifier la production sans trafic staging.
Retirer seulement les ressources dont le classement staging est démontré.
Supprimer ensuite protections, environnement, secrets et branche staging
obsolètes, nettoyer les références locales sans toucher aux changements en attente,
et conserver les preuves de reprise et de facturation.

L'ancien job nocturne distant staging est désactivé. Les contrôles production
restent actifs ; la CI locale et éphémère remplace la recette hébergée permanente.
Ne pas activer un environnement payant de remplacement ni recréer staging.
