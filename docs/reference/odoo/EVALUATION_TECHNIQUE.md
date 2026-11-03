---
status: reference
owner: platform
last_reviewed: 2026-11-03
source_of_truth: false
lang: fr-CI
---

# Odoo — évaluation technique et conditions d'intégration

## Table des matières

- [Odoo — évaluation technique et conditions d'intégration](#odoo-evaluation-technique-et-conditions-dintegration)
  - [1. Architecture existante à préserver](#1-architecture-existante-a-preserver)
  - [2. Options de déploiement à comparer](#2-options-de-deploiement-a-comparer)
  - [3. API, sécurité et gouvernance des données](#3-api-securite-et-gouvernance-des-donnees)
  - [4. Domaine, DNS et continuité des services](#4-domaine-dns-et-continuite-des-services)
  - [5. Conformité et exigences en Côte d'Ivoire](#5-conformite-et-exigences-en-cote-divoire)
  - [6. Parcours technique de formation](#6-parcours-technique-de-formation)
  - [7. Preuves attendues avant tout déploiement](#7-preuves-attendues-avant-tout-deploiement)
  - [8. Références officielles](#8-references-officielles)

**Statut :** hypothèses d'évaluation avant démonstration ; aucune
modification technique n'est autorisée par ce document.

## 1. Architecture existante à préserver

KRAAK dispose déjà d'une application Angular, d'une API NestJS et de
services Render/Supabase documentés dans le dépôt. Odoo est étudié comme
**outil de gestion complémentaire**, et non comme remplacement de la
vitrine publique ou de l'application participant.

| Domaine | Socle KRAAK | Écosystème Odoo à évaluer |
| --- | --- | --- |
| Interface | Angular / PrimeNG | Interface Odoo et composants Owl |
| Backend | NestJS / Fastify | Framework Odoo en Python |
| Données | PostgreSQL via Supabase | PostgreSQL géré par Odoo |
| Exécution | Render et services existants | Odoo Online, Odoo.sh ou autohébergement |
| Personnalisation | Modules NestJS et Angular | Configuration, Studio, modules Odoo |
| Échanges | API HTTP contrôlées | Interfaces d'intégration selon l'offre |

L'usage du même moteur PostgreSQL ne donne **aucune compatibilité directe**
entre schémas ni droit d'interroger la base Odoo depuis Supabase.

## 2. Options de déploiement à comparer

- **Odoo Online :** service hébergé par l'éditeur, généralement plus
  simple à administrer, mais avec des restrictions de personnalisation.
- **Odoo.sh :** plateforme Odoo destinée aux projets nécessitant des
  développements, avec ses propres conditions d'abonnement et de support.
- **On-premise / autohébergé :** plus de contrôle opérationnel, mais
  responsabilité accrue pour sécurité, mises à jour, sauvegardes
  et infrastructure.

Demander une démonstration des limites **réellement applicables**
à l'offre proposée, et non déduire les droits de personnalisation de la
seule mention « open source ».

L'édition Community est ouverte et gratuite sous sa licence ; Enterprise
est sous licence commerciale. Ni l'hébergement, ni les services, ni les
développements ne sont automatiquement gratuits.

## 3. API, sécurité et gouvernance des données

Une intégration éventuelle Angular/NestJS ↔ Odoo doit rester un chantier
distinct, soumis à une décision d'architecture et à un besoin démontré.

Principe recommandé : **le navigateur Angular ne détient aucun secret Odoo**.
L'API NestJS contrôle l'authentification, les autorisations, la validation
des données, le débit, les journaux et les échanges avec Odoo.

Questions obligatoires :

1. Quelle API externe est disponible pour le plan proposé, à quel coût
   et avec quelles limites de version, quotas et support ?
2. Quels objets sont exposés (contacts, prospects, devis, factures,
   formations, utilisateurs) et quelles autorisations sont requises ?
3. Où se trouve la source de vérité pour un contact, un participant,
   une inscription, un paiement ou une facture ?
4. Comment empêcher doubles créations, erreurs de synchronisation,
   conflits de modification et envoi de données excessives ?
5. Quelles modalités d'authentification, rotation des identifiants
   techniques, restriction des droits et journalisation sont disponibles ?
6. Quel est le mécanisme d'export complet (données, pièces jointes,
   documents, configurations) et de réversibilité ?
7. Quelles sauvegardes, RPO/RTO, garanties de disponibilité et
   responsabilités en cas d'incident sont prévues ?

**Règle de minimisation :** aucune copie massive de la base KRAAK vers
une instance Odoo de démonstration. Employer des données fictives ou
anonymisées ; aucune clé API ni information client dans le dépôt.

## 4. Domaine, DNS et continuité des services

La réunion interne souligne la nécessité de conserver le contrôle du
nom de domaine. Les propositions Odoo relatives au domaine doivent
être distinguées de l'enregistrement et de la propriété effective.

- Conserver le registraire et le DNS retenus dans le
  [plan des outils numériques](../../operations/DIGITAL_TOOLS.md),
  sauf décision explicite distincte.
- Un domaine Odoo tel que `exemple.odoo.com` est un sous-domaine
  de la plateforme : ce n'est pas un domaine indépendant enregistré
  au nom de KRAAK.
- Un domaine personnalisé peut être raccordé par DNS à un site Odoo
  sans qu'il soit nécessaire de transférer son enregistrement.
- L'offre promotionnelle de domaine personnalisé gratuit pendant
  une première année, lorsqu'éligible, ne supprime ni les renouvellements
  ni l'obligation de vérifier le titulaire, le registrar et le droit
  de transfert.
- Vérifier par écrit la titularité, les identifiants de gestion,
  les coûts de renouvellement, les DNS, les conditions de sortie et
  les enregistrements de messagerie (MX, SPF, DKIM, DMARC).

Le document ne présume **pas** que KRAAK possède déjà un nom de
domaine particulier ou qu'un domaine est actuellement chez Odoo.
Ne pas modifier le DNS, la production Render ni la messagerie
à l'occasion du pilote.

## 5. Conformité et exigences en Côte d'Ivoire

**Facturation et comptabilité.** Faire vérifier par un professionnel
qualifié l'adéquation de l'instance proposée à la comptabilité
SYSCOHADA/OHADA, aux règles fiscales ivoiriennes et à la
Facture Normalisée Électronique (FNE). Une fonctionnalité
« Invoicing », une localisation comptable ou un PDF ne constituent
pas une preuve suffisante de conformité.

**Données personnelles.** Vérifier les obligations applicables au
regard de la loi ivoirienne n° 2013-450, notamment accès,
sécurité, hébergement, transferts et relations contractuelles.
Préciser les rôles des parties et les sous-traitants. Ne pas
interpréter ce document comme un avis juridique.

**Paiements locaux.** Demander quels moyens sont réellement pris en
charge en XOF, par quels prestataires, avec quelles intégrations,
commission, délais de reversement et contraintes réglementaires.
Ne pas présumer de l'intégration du mobile money.

**Connectivité.** Tester les parcours avec une connexion dégradée :
les applications web ne garantissent pas un fonctionnement hors ligne.
Ne pas promettre la saisie hors connexion sans preuve sur le module visé.

## 6. Parcours technique de formation

**Niveau fonctionnel :** CRM, Ventes, Facturation, Projet, rôles utilisateurs,
tableaux de bord et démonstrations.

**Niveau implémentation :** ateliers de cadrage, paramétrage, reprise
de données, tests d'acceptation, formation des utilisateurs et support.

**Niveau développement :** Python, modèles et ORM Odoo, vues,
sécurité, modules, API, intégration et suivi des mises à jour.

**Niveau validation :** environnement de démonstration, exercice
d'installation reproductible, revue des écarts, puis certification
si le programme partenaire le demande.

La certification, le matériel de formation et l'assistance technique
sont à demander : leur gratuité ou inclusion n'est pas acquise.

## 7. Preuves attendues avant tout déploiement

- Capture des limites d'offre et des fonctionnalités démontrées.
- Matrice des utilisateurs, rôles et licences nécessaires.
- Test d'export et de suppression des données de démonstration.
- Réponses écrites sur API, personnalisation et support.
- Évaluation locale sur FNE, SYSCOHADA, XOF et paiements.
- Chiffrage du coût complet et de la réversibilité.
- Décision explicite avant toute intégration à la production.

## 8. Références officielles

- [Documentation Odoo](https://www.odoo.com/documentation).
- [Éditions Community et Enterprise](https://www.odoo.com/page/editions).
- [Tarification Odoo](https://www.odoo.com/pricing).
- [Documentation sur les domaines](https://www.odoo.com/documentation/19.0/applications/websites/website/configuration/domain_names.html).
- [Documentation développeur Odoo](https://www.odoo.com/documentation/19.0/developer.html).
- [Portail FNE de la Direction générale des impôts](https://www.fne.dgi.gouv.ci/facturation.php).

Les fonctionnalités et références de version évoluent : vérifier
leur validité au moment de la proposition contractuelle.
