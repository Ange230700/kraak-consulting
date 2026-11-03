---
status: reference
owner: platform
last_reviewed: 2026-11-03
source_of_truth: false
lang: fr-CI
---

# Dossier de référence — partenariat Odoo

## Table des matières

- [Dossier de référence — partenariat Odoo](#dossier-de-reference-partenariat-odoo)
  - [Documents](#documents)
  - [Origine et niveaux de preuve](#origine-et-niveaux-de-preuve)
  - [Frontières avec les documents actifs](#frontieres-avec-les-documents-actifs)

Ce dossier prépare l'échange de KRAAK Consulting avec Odoo prévu le
**4 novembre 2026, de 11 h à 12 h (Abidjan)**. Il documente les besoins
exprimés pendant la réunion interne du 3 novembre, les pistes d'adoption
interne et les questions techniques et commerciales à instruire.

**Statut : note préparatoire, non contractuelle.** Aucun partenariat,
abonnement, transfert de domaine, déploiement Odoo ou changement
d'architecture n'est approuvé par ces documents.

## Documents

- [Briefing stratégique et sélection des applications](BRIEFING_PARTENARIAT_2026-11-04.md) :
  objectifs, trois axes de collaboration, priorités fonctionnelles et offres
  commerciales possibles.
- [Évaluation technique et réglementaire](EVALUATION_TECHNIQUE.md) :
  architecture KRAAK, hébergement, API, domaine, sécurité, conformité et tests.
- [Guide de négociation et projet pilote](NEGOCIATION_ET_PILOTE.md) :
  questions, déroulé, responsabilités, conditions de décision et suites.

## Origine et niveaux de preuve

- **Réunion interne du 3 novembre 2026 :** compte rendu de travail fondé sur
  la transcription fournie à l'équipe, non publiée dans ce dépôt public.
  Les intentions et constats attribués à la réunion ne constituent pas
  des engagements pris par Odoo.
- **Recommandations KRAAK :** scénarios de travail proposés dans ce dossier,
  sans validation formelle à ce stade.
- **Informations fournisseur et règles locales :** liens officiels indiqués
  dans les documents ; disponibilité, tarifs, éligibilité, conformité et
  conditions contractuelles doivent être reconfirmés par écrit.

La transcription brute, les invitations, coordonnées personnelles et
propositions commerciales non publiques ne sont pas reproduites ici.

## Frontières avec les documents actifs

Les décisions d'architecture et d'exploitation déjà prises prévalent
sur ce dossier de référence :

- [Architecture active](../../../ARCHITECTURE.md) et
  [ADR de production unique](../../decisions/ARC-22-production-only-main.md).
- [Plan des outils numériques](../../operations/DIGITAL_TOOLS.md).
- [Transition vers une production unique](../../operations/PRODUCTION_ONLY_TRANSITION.md).
- [Exports documentaires](../../engineering/DOCUMENT_EXPORTS.md).

KRAAK conserve sa plateforme Angular/NestJS, sa production Render/Supabase
et son système de domaine/DNS existant jusqu'à décision distincte et
documentée. L'examen d'Odoo ne justifie aucune migration automatique.
