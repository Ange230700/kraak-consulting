---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Archive documentaire

Ce dossier conserve les documents historiques. Ils peuvent expliquer une
décision, une migration ou un état antérieur, mais ils ne définissent pas le
processus courant.

## Règle d'utilisation

- Chercher d'abord dans [`../README.md`](../README.md).
- Ne pas citer un document archivé comme source active.
- Si une information historique reste utile, l'extraire vers un document actif
  ou de référence, puis laisser l'archive intacte.
- Ne pas ajouter de métadonnées lourdes aux preuves brutes et snapshots.
- Chaque sous-dossier d'archive doit garder un `README.md` indiquant la raison
  d'archivage, la date d'archivage, les documents actifs de remplacement et la
  règle de suppression ultérieure.

## Sous-dossiers

| Dossier                  | Statut       | Contenu                                               |
| ------------------------ | ------------ | ----------------------------------------------------- |
| `pilot-2026-04/`         | `historical` | Runbooks et preuves du pilote avril 2026              |
| `vitrine-design/`        | `historical` | Wireframes, audits, migration et maquettes vitrine    |
| `historical-planning/`   | `historical` | Backlogs, packs d'issues et anciennes vues de travail |
| `deployment-transition/` | `historical` | Setup et transition staging/prod vers Render          |
