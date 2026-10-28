---
status: active
owner: platform
last_reviewed: 2026-10-28
source_of_truth: true
---

# Transition vers une production unique

## Table des matières

- [Transition vers une production unique](#transition-vers-une-production-unique)
  - [Avancement vérifié](#avancement-verifie)
  - [GitHub et automatisations](#github-et-automatisations)
  - [Fournisseurs et production](#fournisseurs-et-production)
  - [Sauvegardes et récupération](#sauvegardes-et-recuperation)
  - [Coûts et limites](#couts-et-limites)

## Avancement vérifié

La configuration de la cible production-only a été fusionnée le 27 octobre 2026,
mais le retrait opérationnel des ressources staging préexistantes reste bloqué.
La branche distante `staging`, les services Render staging et le projet Supabase
staging sont conservés. Ne supprimer aucune ressource sur la seule base de la
configuration versionnée ou des exports disponibles.

Suivi : [issue #733](https://github.com/Ange230700/kraak-consulting/issues/733).
PR de configuration : [#735](https://github.com/Ange230700/kraak-consulting/pull/735).
Décision : [ARC-22](../decisions/ARC-22-production-only-main.md).
L'[inventaire daté](../generated/PRODUCTION_ONLY_INVENTORY_2026-10-27.md)
consigne les observations et les limites de vérification. L'issue reste ouverte
et l'item du Project #8 en `In Progress`.

## GitHub et automatisations

- La PR #735 a fusionné par rebase ; le commit de configuration sur `main` est
  `dc64c354f22d1f521b4ca2a7dd8b3bbce570ffe3`. Cette fusion ne constitue pas un
  déploiement. Les protections de `main`
  conservent les 14 checks requis, l'application aux administrateurs, la
  résolution des conversations, l'historique linéaire et l'interdiction de
  suppression et de force-push.
- La branche distante `staging` existe toujours au commit
  `551704b4073647d7c63363c9fd9eaf4c24c1a975`. Aucun environnement GitHub,
  service ou projet staging préexistant n'a été supprimé. Seule la preview
  Supabase vide créée automatiquement pour la PR #735 a été supprimée après
  vérification de son absence de données métier.
- Les workflows actifs, Changesets et scripts de diagnostic utilisent `main`
  et ne déclarent pas de service staging. La régression nocturne staging est
  désactivée ; le branching Supabase et l'intégration GitHub ont été désactivés
  uniquement pour le projet staging d'origine. Les tests locaux et PostgreSQL
  éphémères restent disponibles.
- La variable de dépôt non secrète inutilisée `SONAR_TOKEN` a été retirée après
  vérification que le workflow utilise le secret protégé de même nom. Le secret
  SonarCloud reste présent. Les trois secrets `VERCEL_*` de l'environnement
  Production sont conservés : leur propriété et leur usage historique ne sont
  pas suffisamment établis pour les révoquer sans risque.
- La page d'accueil GitHub du dépôt pointe vers
  `https://kraak-web-prod.onrender.com`.

## Fournisseurs et production

- Les services Render staging `kraak-web-staging` (`srv-d8aj943eo5us739nobeg`)
  et `kraak-api-staging` (`srv-d7putr0k1i2s738d4410`) restent présents. Les
  services production restent préservés ; l'auto-déploiement des services est
  désactivé et l'Auto Sync du Blueprint partagé est suspendu.
- Les projets Supabase de production et de staging restent présents. Le projet
  staging `qgttdsnupelohowwkkwb` n'a pas été supprimé ; le branching et
  l'intégration GitHub ont été désactivés sur ce seul projet. La preview vide
  de la PR #735 ne doit pas être confondue avec le projet staging racine.
- Le contrôle protégé strictement en lecture seule de l'historique des migrations
  de production réussit sur le commit `dc64c354`
  ([run 40555666291](https://github.com/Ange230700/kraak-consulting/actions/runs/40555666291)).
- Le Blueprint versionné ne déclare que les deux services production, sur
  `main`, avec l'auto-déploiement désactivé. Cela ne supprime pas les services
  déjà créés chez Render.
- Au contrôle public du 27 octobre, le web Render de production répondait HTTP
  404 sur `/`, `/fr/`, `/en/` et la configuration runtime. L'API répondait HTTP
  200 sur `/health` en version `v1.1.6`, ce qui ne valide pas les parcours web,
  Auth ou les données. Les déploiements Render observés n'étaient pas la PR #735.
- Auth production pointe encore vers `localhost:3000` ; les redirections et le
  SMTP personnalisé ne sont pas prêts. Les DNS, le site public faisant autorité
  et une partie de l'inventaire fournisseur restent à établir.

## Sauvegardes et récupération

- Les bundles Git privés ont été clonés et vérifiés avec `git fsck --full` ; le
  bundle final complet et les exports privés DB/Auth/Storage ont été contrôlés.
  Aucun export sensible n'est joint au dépôt ou à l'issue.
- Les exports Management API sont des lectures séquentielles, pas une sauvegarde
  transactionnelle complète. Une restauration isolée complète n'est pas
  démontrée : la tentative native a été bloquée par l'extension fournisseur
  `supabase_vault` absente. Ne pas supprimer le projet staging sur cette base.
- Le staging contient des comptes Auth, des contenus métier et six objets
  Storage uniques. Leur conservation ou transfert n'est pas décidé ; aucune
  donnée, migration ou historique de production n'a été modifié.
- Préserver les sauvegardes et l'environnement de restauration hors du dépôt ;
  ne jamais publier de secrets, jetons, exports sensibles ou valeurs de
  configuration.

## Coûts et limites

**Aucune économie réalisée n'est confirmée.** Render staging reste Free/Static
avec 0,00 $ de compute observé. Supabase indiquait 683 heures Micro staging
pendant le cycle en cours, mais la facture finale et les ajustements après
retrait de la preview ne sont pas attestés ; le Branching est partagé et ne peut
pas être attribué avec certitude. Le forfait Render et l'abonnement Supabase
partagés, la production et les autres applications/projets sont préservés.

Le retrait reste bloqué par l'échec du web production, l'absence de sauvegarde
DB cohérente restaurée, la décision métier sur les données uniques, les réglages
Auth incomplets, les accès manquants et les inventaires DNS/facturation incomplets.
Garder l'issue #733 et l'item du Project #8 en cours. Ne retirer une ressource
qu'après vérification privée de ses prérequis, de sa propriété et de ses coûts.
