<!-- docs\decisions\ARC-16-render-only-web-hosting.md -->

# ARC-16 — Render uniquement pour l'hebergement web

- **Statut** : Acceptee
- **Date** : 2026-07-02
- **Portee** : hebergement web staging + production, workflows CI/CD, docs, tests
- **Remplace** : la partie hebergement web d'ARC-09 et ARC-11

---

## 1 · Decision

Render devient l'unique cible active d'hebergement web pour les environnements
`staging` et `production`.

Le depot ne contient plus de configuration, workflow, variable, URL,
assertion de test ou runbook relies a un autre hebergeur web.

## 2 · Contraintes

- Le deploiement externe legacy deja en ligne est traite comme un fallback
  fige hors depot.
- Cette decision ne prescrit aucune action de suppression cote dashboard.
- Aucun outillage CLI de l'ancien hebergeur n'est necessaire dans le depot.

## 3 · Regles operationnelles

- `render.yaml` est la source de verite pour les services web:
  - `kraak-web-staging` sur `staging`, `autoDeploy: true`
  - `kraak-web-prod` sur `main`, `autoDeploy: false`
- Le workflow de release production deploie:
  - `kraak-api-prod`
  - `kraak-web-prod`
- Les checks d'observabilite web pointent sur les URLs Render.

## 4 · Consequences

- Simplification de l'exploitation: une seule plateforme web active.
- Reduction du risque de divergence de configuration entre fournisseurs.
- Historique conserve via les ADR precedents, mais non normatif pour
  l'hebergement web actif.
