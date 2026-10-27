---
status: reference
owner: platform
last_reviewed: 2026-10-26
source_of_truth: false
---

# Réconciliation ponctuelle de main et staging

## Table des matières

- [Réconciliation ponctuelle de main et staging](#reconciliation-ponctuelle-de-main-et-staging)
  - [Décision et périmètre](#decision-et-perimetre)
  - [Arbitrages de contenu](#arbitrages-de-contenu)
  - [Séquence d'intégration](#sequence-dintegration)
  - [Vérification reproductible](#verification-reproductible)

> Compte rendu historique. Le modèle courant est défini par
> [ARC-22](../decisions/ARC-22-production-only-main.md) ; l'état vérifié et les
> barrières de retrait figurent dans [le registre](PRODUCTION_ONLY_TRANSITION.md).

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

Le 26 octobre, le candidat est réconcilié avec le staging courant
`254956ac6f879c0081be12ffc7d02e0bfe573c1a`, en conservant aussi le candidat
`12fe1f9ed81f43d340f13cf035c754cc0db7f704` dans son ascendance.
Les deux conflits restants sont résolus en conservant le workflow CI et le
manifeste de staging : ils incluent déjà la vraie matrice Playwright, ses
correctifs Firefox, les contrôles de couverture et les exports documentaires.
Le nouveau test `scripts/ci-e2e.test.mjs` reste découvert par le glob de
`test:workspace`. Les configurations Playwright et le setup Vitest restent
identiques à staging, dont les suites complètes passent déjà. Les ajouts de
diagnostic et le contournement RAF du candidat initial ne sont plus nécessaires.
Le candidat `b9573b5` les conservait encore : malgré les cinq suites E2E réussies,
Sonar signalait une couverture nulle sur ce nouveau code de configuration.
La résolution conserve donc les fichiers validés de staging plutôt que
d'assouplir les seuils ou les exclusions de couverture.

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

Lors de la préparation initiale du 23 octobre, le job requis `Tests E2E` de
staging ne lançait qu'un `echo`. Le candidat proposait de le remplacer
par une matrice exécutant les cinq projets Playwright (trois navigateurs
desktop et deux profils mobiles), avec un serveur local et les variables
explicites attendues par les configurations. L'image officielle
`mcr.microsoft.com/playwright:v1.59.1-noble`, alignée sur le lockfile, fournit
les navigateurs et dépendances Linux préinstallés : aucun téléchargement APT
n'est nécessaire au lancement. Un test vérifie cet alignement de version.
Chaque projet dispose d'un budget global de 20 minutes et d'artefacts de
résultats distincts. Le contrôle requis `Tests E2E` échoue si un
projet échoue, est annulé ou n'est pas exécuté.
Un test de régression échoue sur l'ancien job et passe sur le job réel.

La validation web initiale avait également révélé une boucle GSAP active après la
destruction du DOM de test (`requestAnimationFrame is not defined`). Le setup
Vitest du candidat annulait ses timers restants en fin de suite ; les 762 tests
web passaient alors sans erreur non interceptée. Le staging du 26 octobre
valide désormais 903 tests web sans cette modification ; son setup est conservé.

Les 15 migrations supplémentaires de staging sont conservées. Les migrations
communes aux deux branches sont identiques. Cela ne prouve pas leur application
ni la compatibilité des données en production : la validation distante reste
une étape de release distincte.

La revue de release #698 impose aussi la vérification d'une mise à niveau avec
des données existantes : la migration de contrainte des articles remet la date
des articles archivés à `NULL` avant de recréer la contrainte. Le scénario SQL
`supabase/tests/article_archive_upgrade.sql`, exécuté en CI, reconstruit l'ancien
état et vérifie que les articles publiés et les brouillons restent inchangés.
Les tests analytics ne transforment plus un crash navigateur ou une navigation
CTA échouée en succès : les erreurs remontent au runner Playwright.
Les redirections SSR refusent les URL externes et les chemins ambigus.

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

Si Sonar bloque la promotion, les annotations GitHub peuvent être limitées
à 50 résultats et ne pas afficher toutes les anomalies de fiabilité ou de
sécurité. Après un échec du scan, l'étape
`Identifier les anomalies Sonar bloquantes` interroge le contexte exact de la
PR ou de la branche avec le secret Sonar déjà configuré. Les logs ne contiennent
que les identifiants, règles, sévérités, chemins et lignes, sans code source,
messages d'anomalie ni token. Le diagnostic signale explicitement un résultat
qui dépasserait sa limite de 500 anomalies ; il ne remplace ni n'assouplit
la quality gate.
