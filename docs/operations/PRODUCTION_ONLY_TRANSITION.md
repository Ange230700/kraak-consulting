---
status: active
owner: platform
last_reviewed: 2026-10-29
source_of_truth: true
---

# Transition vers une production unique

## Table des matières

- [Transition vers une production unique](#transition-vers-une-production-unique)
  - [État final vérifié](#etat-final-verifie)
  - [GitHub et automatisations](#github-et-automatisations)
  - [Fournisseurs et production](#fournisseurs-et-production)
  - [Sauvegardes et récupération](#sauvegardes-et-recuperation)
  - [Coûts et limites](#couts-et-limites)

## État final vérifié

La transition a été exécutée le 27 octobre 2026. `main` est la branche par
défaut et la seule branche distante permanente. Les contrôles de production
restent obligatoires ; aucun environnement de remplacement n'a été créé.

Suivi : [issue #733](https://github.com/Ange230700/kraak-consulting/issues/733).
PR de configuration : [#735](https://github.com/Ange230700/kraak-consulting/pull/735).
Décision : [ARC-22](../decisions/ARC-22-production-only-main.md).
L'[inventaire daté](../generated/PRODUCTION_ONLY_INVENTORY_2026-10-27.md)
sépare les observations initiales des vérifications finales.

Recontrôle public du 28 octobre 2026 : les routes `/`, `/fr/` et `/en/` du web
production et `/health` de l’API répondent HTTP 200. La branche distante
`staging` et l’environnement GitHub de même nom sont absents ; le tag d’archive
est conservé. Ce contrôle confirme la disponibilité des routes, sans constituer
une nouvelle recette des parcours, d’Auth ou des données.

L’issue #733 reste ouverte pour le suivi des limites de facturation ci-dessous.
Une correction documentaire ne doit pas la fermer automatiquement ni présenter
les anciennes barrières de retrait comme l’état opérationnel courant.

## GitHub et automatisations

- La PR #735 a fusionné par rebase ; le commit de configuration déployé est
  `dc64c354f22d1f521b4ca2a7dd8b3bbce570ffe3`. Les protections de `main`
  conservent les 14 checks requis, l'application aux administrateurs, la
  résolution des conversations, l'historique linéaire et l'interdiction de
  suppression et de force-push.
- Le commit staging final `551704b4073647d7c63363c9fd9eaf4c24c1a975` est
  récupérable via le tag `archive/staging-2026-10-27`.
- La branche distante `staging` et l'environnement GitHub `staging` ont été
  supprimés. La protection classique de la branche était déjà absente lors du
  dernier contrôle avant suppression. Les trois secrets de cet environnement
  (`KRAAK_JOURNEY_EMAIL`, `KRAAK_JOURNEY_PASSWORD`,
  `SUPABASE_DB_URL_STAGING`) et le secret de dépôt
  `SUPABASE_STAGING_PROJECT_REF` ont également été supprimés.
- Aucun PR ouvert ne ciblait `staging`. Les 23 enregistrements historiques de
  déploiement GitHub ont été conservés comme preuves ; ils ne sont pas actifs.
- Les workflows actifs, Changesets et scripts de diagnostic utilisent `main`
  et les ressources de production. Les tests locaux et PostgreSQL éphémères
  restent disponibles ; aucun job actif ne dépend de staging.
- La variable de dépôt non secrète inutilisée `SONAR_TOKEN` a été retirée après
  vérification que le workflow utilise le secret protégé de même nom. Le secret
  SonarCloud reste présent.
- Le 29 octobre 2026, les secrets GitHub Production `VERCEL_ORG_ID`,
  `VERCEL_PROD_PROJECT_ID` et `VERCEL_TOKEN` ont été supprimés après vérification
  de l'absence de références dans les fichiers suivis. Ce retrait de GitHub ne
  constitue pas une révocation du token chez son fournisseur ni une suppression de projet.
  Les secrets d'URL inutilisés `PROD_WEB_URL` et `PROD_API_HEALTH_URL` ont aussi
  été supprimés ; les sept secrets Render et Supabase ont été conservés.
- Les profils `local` et `production` de
  [`production-endpoints.json`](../../apps/client/projects/shared/production-endpoints.json)
  sont la source des endpoints consommés par la release et l'observabilité.
  Les trois tests du résolveur passent ; le profil `staging` est refusé,
  conformément à ARC-22. Le workflow d'observabilité réussit sur `main`
  ([run 40836206704](https://github.com/Ange230700/kraak-consulting/actions/runs/40836206704))
  et les routes `/`, `/fr/`, `/en/` et `/health` répondent HTTP 200.
- La page d'accueil GitHub du dépôt pointe vers
  `https://kraak-web-prod.onrender.com`.

## Fournisseurs et production

- L'inventaire Render en lecture seule (run GitHub
  [40555390264](https://github.com/Ange230700/kraak-consulting/actions/runs/40555390264))
  ne trouve pour ce dépôt que `kraak-web-prod`
  (`srv-d8aj9e0jo6nc73ep1hm0`) et `kraak-api-prod`
  (`srv-d7r81hv7f7vs73cqcnmg`). Les deux suivent `main`, sont actifs, ont
  l'auto-déploiement désactivé et leur déploiement courant correspond à
  `dc64c354f22d1f521b4ca2a7dd8b3bbce570ffe3`. Aucune ressource Render Postgres,
  Key Value, disque ou groupe d'environnement n'est présente dans l'espace.
  Aucun service staging n'est présent et ses hôtes répondent HTTP 404.
- Le projet Supabase staging `qgttdsnupelohowwkkwb` a été supprimé par le
  propriétaire et son endpoint Management API répond HTTP 404. Le projet
  `kraak-prod` (`pwuivkqnmjpxxpppmnvu`, `eu-west-1`) répond
  `ACTIVE_HEALTHY`. Aucun compte ou contenu staging n'a été importé en production.
- Le contrôle protégé strictement en lecture seule de l'historique des migrations
  de production réussit sur le commit `dc64c354`
  ([run 40555666291](https://github.com/Ange230700/kraak-consulting/actions/runs/40555666291)).
- La configuration versionnée du Blueprint ne déclare que les deux services
  production, sur `main`, avec l'auto-déploiement désactivé. Les autres projets
  et forfaits partagés n'ont pas été supprimés.
- Au contrôle final, les routes `/`, `/fr/` et `/en/` du site production et
  `/health` de l'API répondent HTTP 200. Le propriétaire confirme aussi avoir
  testé le formulaire de contact et l'envoi d'email ; aucun email supplémentaire
  n'a été envoyé pendant cette vérification.

## Sauvegardes et récupération

- Les sauvegardes locales et OneDrive datées du 27 octobre sont conservées hors
  du dépôt. Les 13 fichiers et les six objets Storage des deux copies ont des
  empreintes identiques ; le dump PostgreSQL (SHA-256
  `A1CECC828CA5EB216928CA0B27288060CA8D68D0E6C7BF420705FAE013A2057A`) et
  l'export des rôles correspondent au manifeste de checksums.
- Les bases isolées `kraak_restore` et `kraak_restore_permissions` dans le
  conteneur conservé répondent : 15 comptes Auth, 25 migrations applicatives,
  un bucket, six objets Storage et zéro secret Vault. Le propriétaire confirme
  aussi la restauration des rôles et permissions après création du rôle
  technique manquant. Ces comptes fictifs et contenus restent en sauvegarde ;
  aucun transfert vers la production n'a été demandé.
- Le bundle Git et le tag d'archive préservent l'historique final de staging.
  Ne pas supprimer les deux copies de sauvegarde ni le conteneur de restauration.

## Coûts et limites

La suppression des ressources confirme leur retrait, pas le montant d'une
économie nette. Avant la suppression, Supabase affichait 683 heures Micro
staging pour le mois ; la facture finale et l'arrêt des frais récurrents ne sont
pas encore attestés. Les deux services Render staging étaient Free/Static à
0,00 $ au relevé précédent. Le forfait Render partagé, l'abonnement Supabase
partagé et les autres projets restent préservés.

Ne pas reprendre la synchronisation automatique du Blueprint avant d'avoir
vérifié son état réel chez Render. Garder les anciennes décisions et procédures
staging en archives historiques ; elles ne décrivent plus le fonctionnement actif.
