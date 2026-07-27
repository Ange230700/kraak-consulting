---
status: active
owner: platform
last_reviewed: 2026-07-27
source_of_truth: true
---

# ARC-19 - Stratégie d'internationalisation français / anglais

## Table des matières

- [ARC-19 - Stratégie d'internationalisation français / anglais](#arc-19-strategie-dinternationalisation-francais-anglais)
  - [1. Statut et métadonnées](#1-statut-et-metadonnees)
  - [2. Contexte](#2-contexte)
  - [3. Décision](#3-decision)
  - [4. Locales source, supportées et de repli](#4-locales-source-supportees-et-de-repli)
  - [5. Stratégie d'URL web publique](#5-strategie-durl-web-publique)
  - [6. Politique des routes privées, admin et mobile](#6-politique-des-routes-privees-admin-et-mobile)
  - [7. Architecture d'adaptateur runtime web/mobile](#7-architecture-dadaptateur-runtime-webmobile)
  - [8. Propriété des catalogues de traduction](#8-propriete-des-catalogues-de-traduction)
  - [9. Nommage des clés de traduction](#9-nommage-des-cles-de-traduction)
  - [10. Interpolation nommée et ICU](#10-interpolation-nommee-et-icu)
  - [11. Frontière d'intégration PrimeNG](#11-frontiere-dintegration-primeng)
  - [12. Frontière d'intégration Ionic](#12-frontiere-dintegration-ionic)
  - [13. Stratégie des codes d'erreur API](#13-strategie-des-codes-derreur-api)
  - [14. E-mails et notifications](#14-e-mails-et-notifications)
  - [15. Contenus CMS dynamiques](#15-contenus-cms-dynamiques)
  - [16. Détection et persistance de la locale](#16-detection-et-persistance-de-la-locale)
  - [17. SEO, prerender, canonicals, hreflang et sitemap](#17-seo-prerender-canonicals-hreflang-et-sitemap)
  - [18. Modèle de sortie Render](#18-modele-de-sortie-render)
  - [19. Tests et CI](#19-tests-et-ci)
  - [20. Traductions manquantes](#20-traductions-manquantes)
  - [21. Revue humaine des traductions](#21-revue-humaine-des-traductions)
  - [22. Conséquences et risques](#22-consequences-et-risques)
  - [23. Déploiement progressif](#23-deploiement-progressif)
  - [24. Stratégie de rollback](#24-strategie-de-rollback)
  - [25. Décisions différées](#25-decisions-differees)

## 1. Statut et métadonnées

| Champ          | Valeur                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Statut**     | Acceptée                                                                                                                         |
| **Date**       | 2026-07-27                                                                                                                       |
| **Auteurs**    | Équipe KRAAK                                                                                                                     |
| **Portée**     | Web Angular, mobile Ionic Angular, API NestJS, packages partagés, SEO, e-mails, notifications, contenu CMS et déploiement Render |
| **Dépendance** | ARC-01, ARC-03, ARC-04, ARC-14, ARC-16                                                                                           |

Cette décision définit l'architecture cible d'internationalisation. Elle ne
signifie pas que les traductions, les routes localisées, les catalogues, les
migrations ou la configuration Render sont déjà implémentés.

## 2. Contexte

KRAAK est aujourd'hui français-first. Les contenus publics, les libellés UI, les
messages API, les e-mails Supabase, les métadonnées SEO et les routes publiques
sont majoritairement écrits en français. Le dépôt doit préparer une diffusion en
français et en anglais sans rouvrir le périmètre MVP ni dupliquer les
architectures entre le web, le mobile et l'API.

L'audit de préparation i18n a montré qu'il n'existe pas encore de bibliothèque
de traduction active, de catalogues, de sélecteur de langue, de configuration
Angular i18n, de sitemap localisé ou de stratégie de persistance de locale.

## 3. Décision

KRAAK adopte une architecture d'internationalisation runtime partagée entre le
web et le mobile, protégée par un petit adaptateur applicatif KRAAK.

Le site web public utilisera plus tard des routes canoniques préfixées par la
locale pour préserver le SEO et le prerender. Le mobile changera de langue au
runtime sans dépendre des routes. L'API exposera des codes d'erreur
machine-readable stables, et les clients traduiront les messages visibles.

La sélection exacte de la bibliothèque runtime de traduction appartient à la PR 2. Cette ADR fixe les exigences et les frontières, sans installer ni nommer une
dépendance comme choix final dans la PR 1.

## 4. Locales source, supportées et de repli

- Locale source : `fr-CI`.
- Locale de repli : `fr-CI`.
- Locales supportées au lancement bilingue : `fr-CI` et `en-GB`.

Les identifiants de locale applicatifs utiliseront des tags BCP 47 explicites.
Les formats imposés par des plateformes tierces pourront adapter la syntaxe si
nécessaire, par exemple `fr_CI` pour certains champs Open Graph.

## 5. Stratégie d'URL web publique

Les routes publiques canoniques utiliseront à terme :

- `/fr/...` pour le français ;
- `/en/...` pour l'anglais.

La racine `/` redirigera durablement vers `/fr/`. Les chemins publics français
existants redirigeront plus tard vers leurs équivalents `/fr/...` afin de
préserver les liens, favoris, indexations et campagnes existants.

Cette PR ne modifiera aucune route.

## 6. Politique des routes privées, admin et mobile

Les routes privées web, les routes admin et les routes mobiles resteront stables
par défaut. Leur contenu visible sera traduit par le runtime i18n, mais les
chemins ne seront pas localisés tant qu'une décision produit explicite ne le
demande pas.

Les routes techniques d'authentification, notamment les callbacks et les liens
de réinitialisation, devront être traitées avec prudence pour ne pas casser les
URLs configurées côté Supabase Auth.

## 7. Architecture d'adaptateur runtime web/mobile

Le dépôt introduira plus tard un adaptateur i18n applicatif unique qui masquera
la bibliothèque de traduction choisie. Cet adaptateur devra rester compatible
avec :

- Angular web avec SSR/prerender ;
- Ionic Angular mobile ;
- le chargement différé des catalogues ;
- la mise à jour dynamique de langue ;
- les tests unitaires et E2E ;
- les garde-fous de clés manquantes.

La PR 1 introduit uniquement un contrat de locale framework-free dans
`@kraak/domain`.

## 8. Propriété des catalogues de traduction

Les catalogues seront organisés par surface et par domaine fonctionnel :

- web : pages publiques, auth web, participant web, admin web, SEO ;
- mobile : shell mobile, auth mobile, programmes, ressources, annonces,
  support ;
- partagé : libellés transverses réellement communs ;
- API client : messages dérivés de codes d'erreur ;
- serveur : e-mails et notifications rendus côté API ;
- CMS : contenus éditoriaux et métiers écrits par l'équipe KRAAK.

La PR 1 ne créera aucun catalogue.

## 9. Nommage des clés de traduction

Les clés utiliseront des identifiants techniques anglais, stables et lisibles,
séparés par des points.

Exemples de forme attendue :

- `web.home.hero.title`
- `web.seo.home.description`
- `mobile.tabs.home.label`
- `apiErrors.auth.invalidCredentials`
- `email.auth.confirmation.subject`

Les clés ne devront pas encoder la phrase complète ni dépendre de l'ordre visuel
du composant.

## 10. Interpolation nommée et ICU

Les interpolations utiliseront des variables nommées. Les phrases visibles ne
devront pas être construites par concaténation de fragments traduits.

La solution retenue devra prendre en charge les pluriels et les variantes via
ICU plural/select ou une capacité équivalente validée. Les cas de date, nombre,
devise et durée passeront par des helpers de formatage locale-aware.

## 11. Frontière d'intégration PrimeNG

PrimeNG restera une bibliothèque UI web. L'adaptateur i18n configurera plus tard
les traductions PrimeNG au bootstrap et après tout changement de langue.

Les libellés internes PrimeNG à couvrir incluront notamment les textes
d'accessibilité, messages vides, filtres, paginations, confirmations, uploads,
tables et contrôles de date lorsqu'ils seront utilisés.

Les textes visibles propres à KRAAK resteront dans les catalogues KRAAK, pas
dans la configuration PrimeNG.

## 12. Frontière d'intégration Ionic

Ionic restera la couche UI mobile. Les routes mobiles resteront stables et la
langue changera au runtime.

Les libellés d'onglets, boutons, formulaires, états de chargement, erreurs,
toasts, overlays, titres de page et textes d'accessibilité appartiendront aux
catalogues mobiles KRAAK. La locale de l'appareil sera seulement une entrée de
détection, pas la source de vérité unique.

## 13. Stratégie des codes d'erreur API

L'API exposera progressivement des codes d'erreur machine-readable stables,
associés aux statuts HTTP. Les clients web et mobile traduiront ces codes en
messages visibles.

Les messages de debug resteront séparés, courts et sans données sensibles. Les
réponses API ne devront pas dépendre de la langue d'affichage du client, sauf
pour les flux explicitement rendus côté serveur comme les e-mails ou les
notifications.

Toute modification future d'un contrôleur, d'une route ou d'un DTO continuera à
mettre à jour Swagger/OpenAPI dans le même changement.

## 14. E-mails et notifications

Les e-mails et notifications rendus côté serveur posséderont leurs propres
templates localisés. La locale sera choisie à partir de la demande explicite, du
profil utilisateur ou de l'appareil enregistré, puis de `Accept-Language` si le
flux le permet, et enfin de `fr-CI`.

Les templates Supabase Auth actuels resteront inchangés tant qu'un chemin
technique vérifié de localisation par destinataire n'aura pas été retenu.

## 15. Contenus CMS dynamiques

Les contenus rédigés dans le CMS utiliseront plus tard des tables enfants de
traduction par entité. Cette approche s'appliquera aux contenus tels que
programmes, ressources, annonces, articles, catégories, tags et contenus de page
d'accueil.

Les valeurs techniques d'enum resteront language-neutral. Les libellés visibles
des enums seront traduits côté client ou côté template serveur selon le canal.

Cette PR ne créera aucune migration et ne modifiera aucun schéma.

## 16. Détection et persistance de la locale

La précédence cible sera :

1. locale explicite dans l'URL publique web ;
2. choix explicite sauvegardé par l'utilisateur ;
3. locale du profil authentifié quand elle existera ;
4. locale navigateur, appareil ou `Accept-Language` selon le canal ;
5. repli `fr-CI`.

Les valeurs non supportées, vides ou absentes retomberont sur `fr-CI`. Les
préférences pourront être synchronisées plus tard entre appareils via le profil,
mais cette synchronisation ne fait pas partie de la PR 1.

## 17. SEO, prerender, canonicals, hreflang et sitemap

Les pages publiques localisées devront produire :

- un titre et une description localisés ;
- un attribut `<html lang>` localisé ;
- une canonical locale-specific ;
- des liens `hreflang` pour `fr-CI`, `en-GB` et `x-default` ;
- des métadonnées Open Graph et Twitter localisées ;
- des entrées sitemap localisées avec alternates ;
- des routes prerender explicites pour chaque locale supportée.

Les pages privées, admin, auth sensibles et erreurs devront conserver leurs
directives d'indexation adaptées.

## 18. Modèle de sortie Render

Le modèle cible gardera un service Render static par environnement. La sortie
web pourra plus tard être organisée sous un seul dossier publié, avec des
sous-arbres localisés tels que :

```text
public/
  fr/
  en/
  assets/
  sitemap.xml
  robots.txt
  404.html
```

Cette PR ne modifiera ni `render.yaml`, ni les commandes de build, ni les
variables Render.

## 19. Tests et CI

Les PRs d'implémentation ajouteront progressivement :

- tests unitaires du contrat locale ;
- tests d'adaptateur i18n ;
- validation des clés manquantes ;
- tests SEO localisés ;
- E2E des routes publiques localisées ;
- tests de changement de langue et persistance ;
- tests des codes d'erreur API ;
- snapshots d'e-mails localisés ;
- tests de formatage date, nombre, devise et durée ;
- contrôles d'accessibilité et de textes longs.

Les descriptions de tests continueront à suivre la formulation Given/When/Then.

## 20. Traductions manquantes

En CI, une clé manquante pour une locale supportée fera échouer la validation.

En développement, l'interface pourra afficher une indication exploitable de clé
manquante. En production, l'application retombera sur `fr-CI` et journalisera un
avertissement court et sans donnée sensible.

## 21. Revue humaine des traductions

Le français restera la langue source et devra être relu pour l'orthographe et la
cohérence éditoriale KRAAK. L'anglais devra faire l'objet d'une revue humaine,
en particulier pour les pages légales, les messages de conversion, les e-mails
et les contenus à impact juridique ou réputationnel.

Les PRs de traduction devront inclure une preuve de validation visuelle ou E2E
sur les parcours concernés.

## 22. Conséquences et risques

Conséquences positives :

- un seul contrat de locales pour les surfaces partagées ;
- une stratégie SEO compatible avec le prerender ;
- une expérience mobile compatible avec le changement de langue au runtime ;
- une frontière claire entre codes API, catalogues clients, templates serveur et
  contenus CMS.

Risques :

- migration des URLs publiques existantes ;
- compatibilité SSR/prerender de la bibliothèque choisie en PR 2 ;
- casse possible des callbacks d'authentification si les routes techniques sont
  localisées sans précaution ;
- expansion de texte en anglais sur les écrans responsive ;
- complexité RLS et indexation des futures tables de traduction.

## 23. Déploiement progressif

Le déploiement se fera par étapes courtes :

1. contrat locale et ADR ;
2. adaptateur runtime et choix de bibliothèque ;
3. scaffold web SEO et routes localisées ;
4. extraction des contenus publics web ;
5. localisation mobile ;
6. codes d'erreur API ;
7. e-mails et notifications ;
8. contenus CMS dynamiques ;
9. durcissement CI.

Chaque étape devra rester réversible et validée avant de passer à la suivante.

## 24. Stratégie de rollback

Le rollback d'une étape d'implémentation devra supprimer la couche ajoutée par
cette étape sans retirer l'ADR si la décision reste valide.

Si une étape de routes localisées échoue, les routes publiques actuelles devront
continuer à fonctionner jusqu'à correction. Si une étape de catalogues échoue,
le repli `fr-CI` devra rester disponible pour garder l'expérience française
fonctionnelle.

## 25. Décisions différées

Sont différés :

- choix exact de la bibliothèque runtime de traduction, prévu en PR 2 ;
- stratégie technique de localisation fine des e-mails Supabase Auth ;
- synchronisation de préférence de langue dans le profil utilisateur ;
- workflow éditorial complet des traductions CMS ;
- éventuelle localisation des routes privées, admin ou mobiles ;
- éventuel ajout futur de `en-US` ou d'autres locales.
