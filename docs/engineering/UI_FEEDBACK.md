---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Règle d'usage PrimeNG Messages et Toasts (Web)

Cette règle s'applique à tout le site web dans apps/client/projects/web.

## Principe

- Utiliser `p-message` pour un retour **contextuel et persistant** lié à une zone précise de la page.
- Utiliser `p-toast` pour une notification **globale et transitoire** après une action utilisateur.

## Quand utiliser `p-message`

- Erreur de validation ou de saisie à corriger dans un formulaire.
- Erreur bloquante d'une section (ex: dashboard impossible à charger) avec action locale de correction (ex: bouton Réessayer).
- Confirmation qui doit rester visible dans la zone de travail courante (ex: message d'état sous un formulaire).

## Quand utiliser `p-toast`

- Confirmation de fin d'action asynchrone (ex: connexion, inscription, demande envoyée, rechargement réussi).
- Alerte globale non bloquante.
- Retour rapide qui n'a pas besoin d'occuper durablement l'espace principal de la page.

## Convention technique

- Canal de toast unique: `key="app-feedback"`.
- Le composant global est déclaré dans `app.html` avec `p-toast`.
- Les messages contextuels restent rendus dans les templates des pages concernées.

## Application sur le MVP web

- Auth (`connexion`, `inscription`, `mot-de-passe-oublie`):
  - `p-message` pour erreurs et confirmations locales.
  - toast global pour confirmer la fin d'action.
- Contact:
  - `p-message` pour erreurs API contextualisées.
  - toast global pour succès d'envoi et erreur générique.
- Dashboard participant:
  - `p-message` pour erreurs de chargement de section.
  - toast global pour échec de chargement et succès après reprise.
