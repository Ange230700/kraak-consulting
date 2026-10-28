---
status: active
owner: platform
last_reviewed: 2026-10-28
source_of_truth: true
---

# Plan des outils numériques

## Table des matières

- [Plan des outils numériques](#plan-des-outils-numeriques)
  - [Objectif et portée](#objectif-et-portee)
  - [Outils retenus](#outils-retenus)
  - [Budget indicatif](#budget-indicatif)
  - [Mise en place](#mise-en-place)
  - [Gouvernance](#gouvernance)
  - [Usages combinés](#usages-combines)
  - [Sources](#sources)

Ce plan traduit le document interne « KRAAK Consulting — Plan minimum des
outils numériques », mis à jour le 21 juillet 2026, en repères opérationnels
pour l'équipe. Il complète l'architecture et les runbooks existants ; il ne
remplace pas les décisions d'architecture ni la configuration réelle des
comptes.

## Objectif et portée

Le socle vise à couvrir l'identité numérique, la communication d'équipe, la
production de contenu et les services techniques en limitant les doublons. Les
prix ci-dessous sont des estimations de pilotage, et non des tarifs garantis ou
des confirmations d'abonnement.

La production KRAAK dispose déjà de services Render et Supabase. Ne pas créer de
nouveau projet ou service pour appliquer ce plan : vérifier les cibles actives
dans [`DEPLOYMENT.md`](DEPLOYMENT.md), [`RELEASE_PROD.md`](RELEASE_PROD.md) et
[`PRODUCTION_ONLY_TRANSITION.md`](PRODUCTION_ONLY_TRANSITION.md), puis réutiliser
les ressources existantes conformément à leurs règles.

## Outils retenus

| Besoin                | Outil et dimensionnement de départ                               | Rôle prévu                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Domaine et DNS        | Porkbun pour le `.com` ; Cloudflare Free                         | Posséder l'adresse officielle et gérer les enregistrements DNS. Vérifier d'abord le domaine et le registrar déjà en service.               |
| Courriel et fichiers  | Google Workspace Business Starter, 6 utilisateurs                | Courriels professionnels, espace partagé, calendrier et réunions.                                                                          |
| IA et productivité    | ChatGPT Business, 2 sièges                                       | Préparer et réviser des contenus, documents et travaux de productivité ; un humain valide les livrables importants.                        |
| Design et marque      | Canva Teams, 3 sièges                                            | Maintenir le kit de marque et produire des supports cohérents.                                                                             |
| Vidéo                 | CapCut Standard, 1 siège                                         | Monter les formats vidéo courts ; confirmer le prix et les fonctions sur l'appareil utilisé.                                               |
| Hébergement           | Render Starter pour un service web dans l'estimation initiale    | Héberger les services KRAAK. La production actuelle et son coût effectif restent gouvernés par les documents de déploiement et de release. |
| Données et accès      | Supabase Pro avant une mise en production, selon le plan initial | Base PostgreSQL, authentification et stockage ; suivre le projet de production déjà documenté et ses règles d'accès.                       |
| Code et collaboration | GitHub Team, 2 sièges techniques                                 | Héberger le code, contrôler les changements et organiser la collaboration.                                                                 |

Les adresses comme `contact@kraakconsulting.com` et le domaine
`kraakconsulting.com` sont des exemples issus du plan, pas une preuve de
propriété ou de configuration. Vérifier le domaine et les adresses réellement
actifs avant toute création ou communication.

## Budget indicatif

| Outil                             | Hypothèse du plan         | Estimation mensuelle |
| --------------------------------- | ------------------------- | -------------------- |
| Google Workspace Business Starter | 6 utilisateurs            | 24 500 XOF           |
| ChatGPT Business                  | 2 sièges                  | 29 000 XOF           |
| Canva Teams                       | 3 sièges                  | 17 500 XOF           |
| CapCut Standard                   | 1 siège                   | 6 000 XOF            |
| Render Starter                    | 1 service web             | 4 000 XOF            |
| Supabase Pro                      | 1 projet de production    | 14 500 XOF           |
| GitHub Team                       | 2 utilisateurs techniques | 4 500 XOF            |
| **Total de pilotage**             | **7 abonnements**         | **100 000 XOF/mois** |

Prévoir séparément environ 7 000 XOF/an pour le domaine `.com` (estimation
source : environ 6 500 XOF/an) et Cloudflare Free à 0 XOF/mois. Les prix de
Canva et CapCut notamment peuvent varier selon le pays, les sièges et la
plateforme. Le plan source utilise un taux de conversion de référence de
1 USD = 578 XOF, avec arrondi au palier de 500 XOF.

Avant chaque achat ou renouvellement, confirmer le tarif affiché, la devise, les
taxes, les frais de paiement et les sièges nécessaires. Le budget de 100 000 XOF
est un repère initial, hors domaine, taxes et frais de carte ou de change ; il ne
constitue ni une dépense constatée, ni le coût réel actuel des services de
production.

## Mise en place

1. **Identité numérique** — vérifier la propriété du domaine existant, les
   paramètres DNS, le renouvellement et la récupération du compte administrateur.
2. **Courriel et fichiers** — créer les comptes nécessaires, les espaces
   partagés par fonction et le calendrier d'équipe.
3. **Productivité et contenu** — attribuer les sièges utiles, valider les règles
   d'usage de l'IA et créer le kit de marque et les modèles réutilisables.
4. **Vidéo** — confirmer le prix régional, préparer les formats de montage et
   stocker les sources dans l'espace partagé.
5. **Technique** — conserver le dépôt GitHub et les services Render/Supabase
   déjà en production ; documenter les propriétaires et contrôler les accès.
6. **Revue mensuelle** — pendant les trois premiers mois, vérifier les coûts,
   les sièges réellement utilisés, les accès et les besoins d'ajustement.

## Gouvernance

- Chaque service a un propriétaire interne chargé du paiement, de la
  configuration, de la formation et de la revue périodique.
- Les comptes critiques sont détenus par KRAAK et disposent d'un accès
  administrateur principal, d'un moyen de récupération et d'un accès de secours.
- Activer l'authentification multifacteur pour les comptes importants ; accorder
  uniquement les droits nécessaires et retirer rapidement les accès devenus
  inutiles.
- Consigner le coût, la date de paiement et le moyen de paiement des
  abonnements, ainsi que la date de renouvellement annuel du domaine.
- Les documents, créations, vidéos et dépôts de code appartiennent à KRAAK et
  ne doivent pas rester dans des comptes personnels isolés.
- Ne pas soumettre de secrets, de mots de passe, de données personnelles ou de
  dossiers sensibles dans un outil d'IA. Faire relire par une personne les
  contenus importants avant diffusion.
- Avant tout nouvel abonnement, préciser le problème résolu, sa fréquence,
  l'absence de solution dans un outil déjà payé, les utilisateurs réguliers et
  le coût supplémentaire. Sans propriétaire, budget validé et usage récurrent,
  garder l'outil à l'étude.

## Usages combinés

| Activité                            | Outils et circulation                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lancer une formation                | ChatGPT aide à structurer le contenu, Canva prépare le visuel, CapCut monte une courte vidéo et Google Drive conserve les fichiers.                  |
| Préparer une proposition partenaire | ChatGPT prépare un brouillon, Google Docs permet la validation et Canva met en forme la présentation.                                                |
| Publier le site                     | Le code est versionné dans GitHub, le site et l'API sont déployés sur Render, et le domaine dirige les visiteurs vers le site.                       |
| Recevoir une demande web            | Le formulaire et son traitement suivent les runbooks de contact et d'environnement ; ne pas créer un stockage parallèle à l'architecture documentée. |
| Produire un témoignage vidéo        | Google Drive conserve les sources, CapCut réalise le montage et Canva fournit les éléments de marque. Vérifier les droits d'utilisation des médias.  |

## Sources

- Document interne « KRAAK Consulting — Plan minimum des outils numériques »,
  version mise à jour le 21 juillet 2026.
- [Architecture active](../architecture/OVERVIEW.md) et [architecture de
  déploiement](../architecture/DEPLOYMENT.md).
- [Déploiement Render](DEPLOYMENT.md), [release de production](RELEASE_PROD.md)
  et [transition production-only](PRODUCTION_ONLY_TRANSITION.md).
- Tarifs officiels à vérifier avant achat : [Google Workspace](https://workspace.google.com/pricing),
  [OpenAI](https://openai.com/business/chatgpt-pricing/),
  [Canva](https://www.canva.com/pricing/),
  [CapCut](https://www.capcut.com/),
  [Render](https://render.com/pricing),
  [Supabase](https://supabase.com/pricing),
  [GitHub](https://github.com/pricing),
  [Porkbun](https://porkbun.com/products/domains/pricing) et
  [Cloudflare](https://www.cloudflare.com/plans/).
