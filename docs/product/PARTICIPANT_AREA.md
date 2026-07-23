---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Espace participant

L'espace participant est une surface applicative protégée. Il n'appartient pas à
la vitrine publique gelée et ne doit pas rouvrir le périmètre public sans ADR
explicite.

## Contrat produit

- Public cible : participants inscrits ou accompagnés par KRAAK.
- Usage principal : consulter le tableau de bord, les programmes, les sessions,
  les ressources, les annonces et le support.
- Activation web : contrôlée par le feature flag
  `CLIENT_FEATURE_PARTICIPANT_AREA`.
- Production : désactivée tant que la décision de release participant n'est pas
  validée.
- Staging et local : activable pour validation fonctionnelle et technique.

## Hors périmètre MVP vitrine

- portail participant complet ouvert au public ;
- back-office avancé ;
- paiement, abonnements ou tunnel commercial complexe ;
- LMS complet ou certification riche.

## Sources liées

- [`MVP_SCOPE.md`](MVP_SCOPE.md) pour le périmètre MVP vitrine.
- [`MOBILE_MVP.md`](MOBILE_MVP.md) pour le périmètre mobile participant.
- [`USER_JOURNEYS.md`](USER_JOURNEYS.md) pour les parcours.
- [`../decisions/ARC-10-feature-flag-participant-area.md`](../decisions/ARC-10-feature-flag-participant-area.md)
  pour le feature flag.
- [`../decisions/ARC-14-freeze-surface-vitrine-publique.md`](../decisions/ARC-14-freeze-surface-vitrine-publique.md)
  pour le gel de la vitrine publique.
