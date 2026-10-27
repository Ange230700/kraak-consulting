---
status: active
owner: platform
last_reviewed: 2026-10-23
source_of_truth: true
---

# Réconciliation des migrations

## Table des matières

- [Réconciliation des migrations](#reconciliation-des-migrations)
  - [Principes](#principes)
  - [Helpers privés](#helpers-prives)
  - [Répétition locale](#repetition-locale)
  - [Vérification distante](#verification-distante)

## Principes

Une version présente dans l’historique distant mais absente du dépôt ne signifie
pas que son SQL doit être annulé ou rejoué. Sauvegarder le schéma et toutes les
colonnes de `supabase_migrations.schema_migrations` avant toute correction.
Comparer les instructions, puis les objets réellement déployés. Les horodatages
et les noms seuls ne prouvent pas l’équivalence.

Quand deux versions correspondent à la même migration, conserver les instructions
et les métadonnées historiques lors de la réconciliation. Restaurer dans Git une
migration perdue qui porte un changement distinct. Ne jamais marquer une migration
manquante comme appliquée sans vérifier ses effets ou documenter explicitement
qu’une migration ultérieure la remplace.

Exécuter les changements sous transaction, avec un historique attendu vérifié et
un verrou sur sa table. Séparer l’ajout d’une valeur d’enum et son utilisation
dans des transactions successives. Refuser toute réexécution inattendue.
Ne pas utiliser `migration repair --status reverted` en masse pour contourner
une divergence. Cette commande ne restaure pas le schéma.

## Helpers privés

La migration `reconcile_private_authorization_helpers` garde les helpers
d’autorisation dans `private`, fixe leurs chemins de recherche, limite leurs
privilèges et conserve le propriétaire existant. Elle accepte les helpers
historiques publics ou déjà déplacés et refuse deux copies concurrentes.
Les policies existantes suivent les fonctions déplacées par leur identité
PostgreSQL ; aucune suppression en cascade n’est nécessaire.

Une ancienne migration de sécurité peut être partiellement remplacée par les
suivantes. Ne pas recréer un helper public uniquement pour rejouer son ancien
changement de propriétaire conditionnel. Ne pas recréer d’anciennes policies
article quand leurs remplacements sont déjà actifs.

## Répétition locale

Le workflow `Supabase Schema Tests` crée une base PostgreSQL 17.6 jetable, prépare
les dépendances Auth minimales, rejoue chaque migration dans sa propre transaction
et exécute les tests d’autorisation. Il ne reçoit aucun secret d’environnement.

Pour une répétition manuelle sur une base locale vide :

```bash
psql -X -v ON_ERROR_STOP=1 --single-transaction \
  --file supabase/tests/bootstrap.sql
for migration in supabase/migrations/*.sql; do
  psql -X -v ON_ERROR_STOP=1 --single-transaction --file "$migration" || exit 1
done
psql -X -v ON_ERROR_STOP=1 --file supabase/tests/authorization_reconciliation.sql
```

Les variables `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE` et `PGPASSWORD` doivent
désigner uniquement la base locale jetable. Les fixtures Auth ne reproduisent
pas le service Supabase Auth. Les tests insèrent des données synthétiques, puis
les annulent ; ils ne doivent pas être lancés sur une base partagée.

## Vérification distante

Après réconciliation, comparer toutes les versions du dépôt avec l’historique
distant, contrôler RLS et les advisors, puis relancer le workflow de migrations
sur le nouveau commit et le parcours Newman strict. Un ancien run rejoué conserve
son ancien checkout : il ne valide pas les nouveaux fichiers.

Préserver la contrainte qui exige `published_at` pour un article publié et son
absence pour les états brouillon et archivé. Avant un déploiement sur un autre
environnement, vérifier la compatibilité des articles existants avec cette règle.
La validation staging ne constitue pas une autorisation de modifier la production.
