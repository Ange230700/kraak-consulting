---
status: reference
owner: platform
last_reviewed: 2026-10-27
source_of_truth: false
---

# Inventaire de transition production-only — 27 octobre 2026

## Table des matières

- [Inventaire de transition production-only — 27 octobre 2026](#inventaire-de-transition-production-only-27-octobre-2026)
  - [État et conditions de retrait](#etat-et-conditions-de-retrait)
  - [Git, GitHub et SonarCloud](#git-github-et-sonarcloud)
  - [Inventaire des ressources](#inventaire-des-ressources)
  - [Données et récupération](#donnees-et-recuperation)
  - [Production et contrôles observés](#production-et-controles-observes)
  - [Coûts et prochaine étape](#couts-et-prochaine-etape)

## État et conditions de retrait

Suivi : [issue #733](https://github.com/Ange230700/kraak-consulting/issues/733).
Décision : [ARC-22](../decisions/ARC-22-production-only-main.md).
Procédure active : [registre de transition](../operations/PRODUCTION_ONLY_TRANSITION.md).
Ce document est un relevé de preuves daté, pas une recommandation de réutiliser
un hébergeur historique.

**Le retrait des ressources est bloqué.** La branche par défaut GitHub est
désormais `main`, mais cela ne démontre ni une livraison en production ni
l'absence de dépendances aux anciennes ressources. Aucun service, projet de
données, environnement GitHub ou branche `staging` n'a été supprimé.

Les contrôles suivants doivent tous réussir avant une suppression :

1. Réconciliation du code et fusion d'une PR validée vers `main`.
2. Sauvegardes externes complètes, lisibles et restauration vérifiée.
3. Décision documentée sur la conservation des données uniques et leur transfert.
4. Production identifiée par son commit, parcours et intégrations validés.
5. Propriété et absence de dépendances partagées vérifiées pour chaque ressource.

Ne pas considérer la synchronisation d'un Blueprint comme une preuve de
suppression : vérifier ensuite l'état de chaque ressource chez son fournisseur.

## Git, GitHub et SonarCloud

État observé le 27 octobre 2026 :

- `main` : `02fbfa1249fd518882ff878777f6df5e5990e76a`.
- `staging` : `551704b4073647d7c63363c9fd9eaf4c24c1a975`.
- Divergence initiale : un commit propre à `main` et deux propres à `staging`.
- Les deux changements Sonar propres à `staging` ont été repris sur la branche
  `chore/production-only` ; avant les adaptations de configuration, son arbre
  était identique à celui de `staging`. Aucun changement fonctionnel n'a été exclu.
- Aucune PR ouverte ne nécessitait de changement de base lors de l'inventaire.
- La branche par défaut GitHub est `main`, vérifiée par l'API.
- La protection classique de `main` impose les PR, les contrôles stricts liés
  à leurs applications, les discussions résolues et un historique linéaire.
  Elle s'applique aux administrateurs et interdit suppression et force-push.
- Le ruleset `16501507` reste actif et sans contournement.
- L'environnement `Production` conserve son approbateur et son délai ; ses
  politiques autorisent `main` et les tags `v*`. Aucun secret n'est donné aux PR.
- SonarCloud conserve son analyse principale et son historique, renommés de
  `staging` vers `main`. Vérification : branche `LONG`, `isMain: true`,
  quality gate `OK`, dernier SHA `551704b4…`.
  L'ancienne analyse courte `main` a été retirée après archivage de ses
  métadonnées et mesures. L'API ne permettait pas d'exporter son historique
  d'analyse, réservé aux branches longues.
- Le workflow nocturne distant `Nightly Regression`, ID `276505106`, a été
  désactivé et son état `disabled_manually` vérifié pour arrêter ses écritures
  récurrentes contre staging. Aucun contrôle de production n'a été désactivé.

La configuration cible supprime les profils et déploiements staging, mais
conserve la validation des PR, les tests locaux et les releases approuvées.
Les modifications locales ne constituent pas une livraison tant que la PR
n'est pas fusionnée.

## Inventaire des ressources

Les identifiants ci-dessous ne sont pas des secrets. Les valeurs de configuration,
jetons, comptes, sessions et exports de données restent hors du dépôt.

| Fournisseur | Ressource et identifiant                                                                   | Classement et décision                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Render      | `kraak-web-prod` — `srv-d8aj9e0jo6nc73ep1hm0`                                              | Production ; préserver                                                                                   |
| Render      | `kraak-api-prod` — `srv-d7r81hv7f7vs73cqcnmg`                                              | Production ; préserver                                                                                   |
| Render      | `kraak-web-staging` — `srv-d8aj943eo5us739nobeg`                                           | Candidate staging ; ne pas supprimer avant les contrôles                                                 |
| Render      | `kraak-api-staging` — `srv-d7putr0k1i2s738d4410`                                           | Candidate staging ; ne pas supprimer avant les contrôles                                                 |
| Render      | Blueprint `exs-d7r7j01kh4rs73em7mm0`                                                       | Partagé par les API ; ne pas supprimer globalement                                                       |
| Render      | Workspace `tea-cspqc2d6l47c73c4alu0`                                                       | Partagé ; préserver l'abonnement et les autres applications                                              |
| Render      | `alex-career-api-staging` — `srv-d79cfm4hg0os7390npg0`                                     | Autre application ; hors périmètre                                                                       |
| Supabase    | `kraak-prod` — `pwuivkqnmjpxxpppmnvu`, `eu-west-1`                                         | Production ; préserver                                                                                   |
| Supabase    | `kraak` — `qgttdsnupelohowwkkwb`, `eu-west-3`                                              | Candidate staging ; contient des données uniques                                                         |
| Supabase    | Métadonnée de branche `12be592f-2804-42de-b54f-c7b87c2aff59`                               | Ancienne branche par défaut ; retirée par désactivation du branching, projet racine et données préservés |
| Supabase    | Preview PR #735 — `e2ceb604-887d-4c48-aa1c-ca49c1934100`, référence `bougahdeywjzdjlkaaub` | Preview vide créée automatiquement ; exportée puis supprimée, absence vérifiée ; parent préservé         |
| Supabase    | Organisation `omoaplqfkowknstamhty`                                                        | Partagée ; ne pas supprimer                                                                              |
| Supabase    | `alex-career-app-staging` — `arlwinwurrbssunnwkrc`                                         | Autre application ; hors périmètre                                                                       |
| Supabase    | Référence d'assets `fqjltiegiezfetthbags`                                                  | Propriété non établie ; préserver                                                                        |
| Vercel      | `kraak-consulting.vercel.app`                                                              | Ancien site public encore accessible ; dépendances à établir                                             |
| GitHub      | Environnement `staging` — `16165118557`                                                    | Conserver jusqu'à la fin des vérifications                                                               |
| GitHub      | `Production` — `13987506363`                                                               | Production ; conserver approbation, secrets et politiques                                                |
| GitHub      | `Preview`, `copilot`, `main - kraak-api-prod`                                              | Usages non entièrement établis ; ne pas supprimer sur leur seul nom                                      |

Les paramètres des quatre services Render ont été consultés : ils référencent
explicitement `Ange230700/kraak-consulting`. Les deux services production suivent
`main`, les deux candidats staging suivent `staging`. Le web staging utilise
encore `build:web:staging` ; le web production utilise `build:web`. Les deux API
utilisent `apps/api/Dockerfile` et `/health`. Cette association confirme leur
origine, pas l'absence de dépendances entre environnements.

Render affiche cinq services actifs et neuf suspendus. La facturation cite
également `05_recursivity`, `abyss_back`, `cleared_back`, `mobile_surf_back`,
`nihil_post_service`, `nihil_user_service`, `shaka_backend`, `spree_back` et
`void_null_back` ; ne pas les attribuer à KRAAK sans vérifier leurs dépôts.
L'inventaire des disques, bases, workers, cron, groupes d'environnement,
domaines et ressources suspendues doit encore être conclu.

La création automatique d'une preview Supabase n'a pas été demandée. La branche
était rattachée au projet staging et à `chore/production-only`, pas au projet
production. Le dashboard demande une connexion et les installations GitHub
ne sont pas administrables avec la session CLI actuelle (HTTP 403).
Une autre voie documentée a permis de désactiver le branching du seul projet :
`DELETE /v1/projects/{ref}/branches`, après retrait de la preview vide.
La réponse HTTP 200 puis la liste vide des branches ont été vérifiées.
Les deux projets racines restent `ACTIVE_HEALTHY` et leurs comptages Auth,
Storage, tables publiques, politiques RLS et migrations sont inchangés.
Aucun autre projet ni dépôt n'a été déconnecté.

Un contrôle PostgreSQL en lecture seule de la preview a confirmé zéro ligne
dans les 30 tables publiques, zéro utilisateur/identité/session Auth et aucun
bucket/objet Storage. Son rattachement à la PR #735 et ses 25 migrations ont été
archivés en privé. Le contrôle final couvre 66 tables public/Auth/Storage/Vault,
vides hors métadonnées de migration ; les 25 versions correspondent au dépôt.
La connexion directe ne résout pas son DNS ; le pooler IPv4 session a permis
un dump complet de 548 432 octets, table des matières lisible de 1 018 lignes.
SHA-256 : `9E24E2BEBD4E46A00DF6F86EB5C06EDEE5C02A4B8D195CB830823786C2D3A05B`.
La première tentative transactionnelle a expiré et reste marquée `.partial`.
La restauration PostgreSQL 18 isolée a été tentée mais l'extension fournisseur
`supabase_vault` est absente ; aucune restauration complète n'est revendiquée.
Seule cette preview vide créée par la tâche a été supprimée : liste fournisseur
sans son ID/réf et GET détail 404. Le serveur de test local a été arrêté.

Les secrets sont inventoriés par **nom uniquement**. Le secret
`RENDER_PROD_WEB_SERVICE_ID` a été configuré avec l'identifiant de service
production vérifié et sa présence revérifiée par API. Il manque encore
`SUPABASE_DB_URL_PRODUCTION_READONLY` dans `Production`.
Le secret historique d'accès Render est présent côté GitHub, mais l'authentification
CLI locale est expirée ; le dashboard authentifié reste utilisable.
Les deux services production ont l'auto-déploiement désactivé et les previews
Render désactivées. Le Blueprint partagé suit `main` et son Auto Sync est passé
de `Yes` à `No`, état revérifié après rechargement : une fusion ne doit pas
modifier implicitement l'infrastructure ni déployer avant la recette.
Ne pas réinitialiser de mot de passe ni copier les identifiants de staging.

Les webhooks du dépôt étaient vides lors du contrôle API. La propriété des DNS,
les intégrations Vercel, Resend, analytics et leurs éventuels coûts restent à
établir ; l'absence de webhook GitHub ne prouve pas l'absence d'intégration externe.

## Données et récupération

Le projet staging contient 30 tables publiques, 25 migrations enregistrées et
120 politiques RLS, contre 10 tables publiques, 7 migrations et 27 politiques
dans la production. Vingt tables publiques manquent donc en production.
Ce constat ne permet pas de rejouer aveuglément l'historique.

Données staging observées :

- 15 utilisateurs Auth et leurs identités, ainsi que des sessions et jetons ;
- 2 utilisateurs applicatifs, 1 participant et 8 demandes de support ;
- 5 articles, 5 catégories d'articles, 5 tags d'articles, 2 auteurs,
  7 catégories et 7 tags ;
- bucket public `article-covers` contenant 6 objets.

La production n'avait aucun utilisateur Auth ni objet Storage.
La qualification métier de ces données uniques n'est pas résolue.
Aucune donnée, migration ni entrée d'historique de production n'a été modifiée.
Les deux listes de fonctions Edge étaient vides.

Sauvegardes privées hors des ressources candidates au retrait :
`C:\Users\USER\kraak-recovery\production-only-20261027`.
Ce répertoire local est limité au compte Windows courant et à SYSTEM ; il n'est
ni versionné ni un artefact public. Il faut encore le répliquer vers un
emplacement privé indépendant du poste avant de considérer la reprise durable.

- `repository-before-transition.bundle` contient les références Git, dont
  staging et le stash des changements locaux. `git bundle verify` a réussi.
  SHA-256 :
  `08DB87F46043DC941C6F06850EF5EDC688C16F079B51DA9E538BC83DEB363B52`.
- `staging-final.bundle` contient la référence distante finale `staging`.
  SHA-256 :
  `BE7EA5BF4E1A0430080D542D659B5AFCC214A16A1AE11A58568D6F26C8220A7B`.
  Le bundle complet a été cloné dans `git-restore-verification` :
  `git fsck --full` a réussi et `origin/staging` correspond au SHA final.
- Les sous-répertoires portant les références Supabase contiennent les tables
  exportées, catalogues de schéma, historiques SQL, configurations Auth,
  métadonnées et manifestes de contrôle.
- Les fichiers JSON ont été relus et leurs nombres de lignes comparés aux
  comptages SQL. Les six objets Storage staging ont été téléchargés et
  disposent d'un manifeste avec tailles et empreintes.
- Les sauvegardes physiques quotidiennes du fournisseur ont été inventoriées ;
  elles ne constituent pas une sauvegarde externe survivant à sa suppression.

**Limites bloquantes :** les exports Management API sont des lectures
successives, pas un `pg_dump` transactionnel. Une restauration complète n'a pas
été testée. Les racines de chiffrement, mots de passe fournisseur et certains
internes de plateforme ne sont pas exportés. Les sessions Auth ne doivent pas
être réinjectées comme moyen de reprise. Aucun export complet indépendant ne
justifie à ce stade la suppression d'un projet.

Récupération Git : vérifier le bundle, le cloner dans un **nouveau** répertoire,
vérifier le SHA de `staging`, puis créer une branche de récupération sans modifier
le répertoire de travail d'origine. Ne jamais publier le stash sans inspection.
Pour Supabase, restaurer d'abord dans un environnement isolé, recréer et valider
schéma/RLS, puis effectuer un transfert ciblé approuvé des données et objets.
Ne pas importer les historiques ou écraser la production pour les faire coïncider.

## Production et contrôles observés

- API Render production : `/health` répond HTTP 200, environnement `production`,
  version `v1.1.6`. Le dashboard indique le dernier déploiement
  `0c084cbfaa35957fbdbd1a1b886d3b9674918ba4` ; l'API ne publie pas elle-même
  son SHA pour une attestation indépendante.
- Site Render production : `/fr/`, `/en/` et `/assets/runtime-config.js`
  répondaient HTTP 404. La validation des parcours sur cet hôte échoue.
  Le dashboard indique `fc46d62600510685b8930e1ddbf2b85f9fc9ad61` et confirme
  `https://kraak-web-prod.onrender.com` comme URL publique du service.
- Le site historique Vercel affiche une page française ; sa configuration active,
  son commit et sa relation avec Render ne sont pas encore établis.
- La configuration locale historique de production autorise l'origine Vercel
  en CORS ; ce n'est pas une preuve de la configuration active de Render.
- Supabase production indique `site_url=http://localhost:3000`, sans liste de
  redirections ni SMTP configuré. Ne pas recopier les callbacks staging.
- Les parcours FR/EN, connexion, persistance, autorisations, participant,
  administration, Storage et email ne sont donc pas validés en production.
- Aucun email non sollicité ni changement de compte réel n'a été effectué.

Le déploiement GitHub `7350980701` du SHA `02fbfa12…` correspond à une tentative
de migration **échouée**, pas à une livraison applicative réussie.
Les échecs historiques du contrôle de migration et de l'observabilité ne sont
pas masqués par le changement de modèle.

Validation locale de la transition :

- Cycle RED puis GREEN sur les contrats production-only, Blueprint et scripts ;
  refactor concret des protections et de la sélection des profils.
- Le premier `pnpm check` a détecté des erreurs ESLint propres aux nouveaux
  tests, corrigées, puis une branche devenue inaccessible dans le générateur
  runtime, supprimée sans abaisser le seuil de couverture.
- Un échec du test d'aide Bash a été reproduit sans modification sur `staging`.
  Les utilitaires Git Bash manquaient dans `PATH` ; avec
  `C:\Program Files\Git\usr\bin` ajouté au processus, les trois tests passent.
  Aucun contrôle n'a été désactivé.
- Un passage complet a ensuite rencontré des échecs de mocks des notifications
  mobiles. Le comportement a également été observé sur le `staging` inchangé.
  Après `ng cache clean`, `pnpm test:client:coverage` réussit avec la couverture
  complète ; aucun test n'a été exclu ni code mobile hors périmètre modifié.
- Smoke Playwright Chromium sur un serveur local isolé, port `4219` :
  trois scénarios réussis (navigation participant, présentation et redirection
  vers la connexion). Ce succès local ne remplace pas les contrôles production.
- La même recette a d'abord échoué avec le participant désactivé : accès direct
  au dashboard affichant la connexion plutôt que la 404. Le guard existant
  n'était pas attaché aux routes. Après test RED puis ajout du `canMatch` aux
  routes d'authentification et au parent participant : 38 tests ciblés réussis,
  smoke local activé 3/3, local désactivé 3/3 et production désactivé 3/3.
  La CI Chromium exécute aussi ce dernier comportement désactivé.
- `pnpm check` réussit après nettoyage du cache Angular et correction du `PATH`,
  avec format, lint, types et couverture stricte inchangés : 299 tests workspace,
  1 146 tests API, 924 tests web et 276 tests mobile, ainsi que les packages.
  Ces checks ne remplacent pas une validation des parcours réellement déployés.
- `pnpm build` réussit pour web, mobile et API ; le build web signale un
  avertissement de budget initial sans dépasser le seuil d'erreur.
- `pnpm test:integration` réussit : 31 scénarios API. Les dépendances métier
  sont simulées ; ce n'est pas une validation des données/RLS de production.

## Coûts et prochaine étape

**Aucune économie réalisée n'est confirmée.** La preview vide créée par la tâche
a été supprimée et le branching désactivé, mais leur facturation reste à vérifier.
Aucune ressource staging préexistante avec données n'a été supprimée.

Facturation Render observée le 27 octobre :

- `kraak-api-staging` : offre Free, taux `$0.0000/h`, coût courant `$0.00`.
- `kraak-web-staging` : Static, taux `$0.0000/h`, coût courant `$0.00`.
- API production et API de l'autre application : Starter, `$0.0094/h` chacune ;
  coût courant `$5.96` chacune.
- Workspace partagé Pro : `$25/mois`, coût courant proratisé `$21.30`.
- Total du mois à date `$33.22`, projection d'octobre `$39.00`.

La suppression des deux services staging n'établirait donc **aucune économie
de compute Render** sur ces offres. Ne pas résilier le forfait partagé ou une
autre application pour afficher une économie. Les frais Supabase, Vercel,
domaines et autres intégrations ne sont pas encore attestés.
Les frais déjà accumulés restent distincts des économies futures.

Prochaine étape : fusionner uniquement la configuration validée, établir le
vrai site de production et le commit livré, obtenir une sauvegarde restaurable
et la décision de conservation des données, puis reprendre la liste de retrait.
Garder l'issue et le Project en cours tant que ces barrières restent ouvertes.
