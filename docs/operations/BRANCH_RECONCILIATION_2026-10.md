---
status: active
owner: platform
last_reviewed: 2026-10-23
source_of_truth: true
---

# Réconciliation ponctuelle de main et staging

## Table des matières

- [Réconciliation ponctuelle de main et staging](#reconciliation-ponctuelle-de-main-et-staging)
  - [Décision et périmètre](#decision-et-perimetre)
  - [Arbitrages de contenu](#arbitrages-de-contenu)
  - [Séquence d'intégration](#sequence-dintegration)
  - [Vérification reproductible](#verification-reproductible)

## Décision et périmètre

Le 23 octobre 2026, le mainteneur a autorisé une exception ponctuelle à la
fusion par rebase et à l'historique linéaire afin de conserver les deux
historiques. Suivi : issue #652 et PR de release #698.

La branche temporaire `chore/reconcile-main-staging` part de `staging` et
fusionne `main`. Les deux parents sont conservés, sans reset ni force-push :

| Référence initiale | SHA                                      |
| ------------------ | ---------------------------------------- |
| staging            | ba62390df8975191f8350902ef41d8673ade4ee8 |
| main               | fc46d62600510685b8930e1ddbf2b85f9fc9ad61 |
| Ancêtre commun     | 71e06904a12de4f22597da3577c4d275df3feb29 |

Les contrôles de qualité, revues et protections contre la suppression et le
force-push restent requis. L'exception ne permet ni déploiement de production,
ni application de migration, ni suppression de staging.

## Arbitrages de contenu

La simulation initiale produit 36 chemins en conflit. Les décisions sont
prises par domaine ; aucune stratégie globale `ours` ou `theirs` n'est utilisée.

| Domaine                     | Décision et justification                                                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages publiques et routes   | Conserver les pages bilingues, les redirections historiques et les routes localisées de staging. Les anciens fonds de héros, textes français en dur et prévisualisations fictives de main sont remplacés par cette implémentation. |
| SEO                         | Conserver les tests localisés et le catalogue actuel ; les images Open Graph JPG corrigées dans main y sont déjà présentes. Les différences Unicode échappé/UTF-8 ne changent pas le texte.                                        |
| Animations et configuration | Conserver les gardes reduced-motion, les interactions tactiles et le flag explicite de l'espace participant.                                                                                                                       |
| API                         | Conserver la pagination, les erreurs localisées et les tests CRUD administrateur actuels.                                                                                                                                          |
| Tests mobiles               | Conserver la protection contre les réponses obsolètes ; les tests des événements sans cible de main existent déjà dans staging.                                                                                                    |
| Composants partagés         | Conserver les versions normalisées `.component.*`. Ne pas réintroduire les 12 anciens fichiers des composants fading-partners, impact-stats, scroll-to-top et team-grid.                                                           |
| Tests layout et FAQ         | Conserver les tests navbar/footer actifs et les entrées localisées de la FAQ.                                                                                                                                                      |
| Tests E2E                   | Conserver les scénarios bilingues et conditionnés par les flags ; restaurer dans CI l'exécution réelle de Playwright issue de main.                                                                                                |
| Dépendances                 | Conserver les manifestes actuels et leur lockfile, notamment la bibliothèque de traduction et le finaliseur de prerender ; vérifier par installation figée.                                                                        |
| Observabilité               | Les modifications entrantes automatiques ne concernent que les guillemets YAML ; conserver le format courant.                                                                                                                      |
| À propos                    | Ne pas réintroduire le test de faux profils d'équipe (`Savannah Nguyen`) dans la page actuelle.                                                                                                                                    |

Le job requis `Tests E2E` de staging ne lançait qu'un `echo`. Il est remplacé
par une matrice exécutant les cinq projets Playwright (trois navigateurs
desktop et deux profils mobiles), avec un serveur local et les variables
explicites attendues par les configurations. L'image officielle
`mcr.microsoft.com/playwright:v1.59.1-noble`, alignée sur le lockfile, fournit
les navigateurs et dépendances Linux préinstallés : aucun téléchargement APT
n'est nécessaire au lancement. Un test vérifie cet alignement de version.
Chaque projet dispose d'un budget global de 20 minutes, de logs de progression
et d'un rapport HTML distinct. Le contrôle requis `Tests E2E` échoue si un
projet échoue, est annulé ou n'est pas exécuté.
Un test de régression échoue sur l'ancien job et passe sur le job réel.

La validation web a également révélé une boucle GSAP encore active après la
destruction du DOM de test (`requestAnimationFrame is not defined`). Le setup
Vitest annule désormais ses timers restants en fin de suite ; les 762 tests
web passent sans erreur non interceptée après cette correction.

Les 15 migrations supplémentaires de staging sont conservées. Les migrations
communes aux deux branches sont identiques. Cela ne prouve pas leur application
ni la compatibilité des données en production : la validation distante reste
une étape de release distincte.

## Séquence d'intégration

1. Valider le candidat temporaire et ses deux ascendances.
2. Publier une PR du candidat vers staging et obtenir les contrôles requis.
3. Autoriser temporairement la méthode merge uniquement pour cette opération,
   en conservant les contrôles requis et les revues. Ajuster seulement les
   exigences d'historique incompatibles qui s'appliquent aux branches visées.
4. Fusionner la PR de réconciliation par merge, jamais par squash/rebase :
   les parents de main doivent rester accessibles depuis staging.
5. Revalider la PR #698 et son contrôle strict Branch Lineage.
6. Après validation de tous les contrôles, fusionner la release par merge.
7. Restaurer les réglages temporaires et consigner les SHA résultants.
8. Vérifier séparément les données, le déploiement et la production avant
   toute décision de retrait de staging.

Une fusion GitHub de release crée un nouveau commit sur main. Si staging doit
continuer à être utilisée après cette opération, ce nouveau tip doit être
réconcilié explicitement avant une autre promotion ; ne pas prétendre que la
politique actuelle garantit automatiquement une lignée durable. La politique
future fait partie du chantier de retrait de staging.

## Vérification reproductible

```bash
git merge-base --is-ancestor ba62390df8975191f8350902ef41d8673ade4ee8 HEAD
git merge-base --is-ancestor fc46d62600510685b8930e1ddbf2b85f9fc9ad61 HEAD
node scripts/github/check-branch-lineage.mjs --require-main-ancestor HEAD origin/main
node --test scripts/github/check-branch-lineage.test.mjs scripts/ci-e2e.test.mjs
pnpm install --frozen-lockfile
pnpm test:workspace
pnpm typecheck
pnpm test:api
pnpm test:libs
pnpm --filter @kraak/client test:web
pnpm --filter @kraak/client test:mobile
pnpm build
pnpm test:e2e:all
```

Les résultats effectivement obtenus et les éventuels blocages sont consignés
dans la PR. Un contrôle non exécuté n'est jamais déclaré réussi.
