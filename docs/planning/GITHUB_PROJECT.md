---
status: active
owner: platform
last_reviewed: 2026-10-27
source_of_truth: true
---

# Pilotage GitHub Project

## Table des matières

- [Pilotage GitHub Project](#pilotage-github-project)
  - [Board Actif](#board-actif)
  - [Boards Retirés](#boards-retires)
  - [Champs](#champs)
  - [Règles De Remplissage](#regles-de-remplissage)
  - [Vues Recommandées](#vues-recommandees)
  - [Cycle De Vie](#cycle-de-vie)
  - [Mises À Jour Du Statut Du Projet](#mises-a-jour-du-statut-du-projet)
  - [Outillage Et Snapshots](#outillage-et-snapshots)

## Board Actif

- GitHub Project unique : `#8 - KRAAK — Pilotage unifié (main)`
- URL : <https://github.com/users/Ange230700/projects/8>
- Propriétaire : `Ange230700`
- Dépôt lié : `Ange230700/kraak-consulting`
- Créé le : 27 octobre 2026 (issue #738)

Le Project #8 est la seule source opérationnelle de vérité pour le suivi des
tâches. Il reflète la cible production-only : `main` est la branche permanente
de travail et les workflows actifs n'utilisent pas staging. Le retrait des
ressources staging existantes reste bloqué et l'issue #733 demeure en cours
(voir `docs/operations/PRODUCTION_ONLY_TRANSITION.md`).

Contenu initial :

- les 29 issues ouvertes du Project #6 et l'issue #733, avec leur priorité,
  leur effort, leur `Launch blocker` et leur statut repris ;
- les brouillons encore valides du Project #5, consolidés en issues #739
  (recette production), #740 (rollback production) et #741 (contenus et
  données de démo) ;
- #738 (remplacement des boards) et #742 (réalignement de l'audit outillé).

L'issue #733 reste ouverte avec `Status: In Progress`. Les brouillons « Compléter
tous les secrets production » et « Valider un déploiement complet production »
lui sont rattachés ; ils ne valent pas preuve de déploiement ou de retrait.

Les items `Done` et les issues fermées des anciens boards ne sont pas repris :
l'historique reste dans les issues GitHub.

## Boards Retirés

| Board                          | État  | Raison                                                                            |
| ------------------------------ | ----- | --------------------------------------------------------------------------------- |
| Project #5 - MVP Roadmap       | Fermé | Brouillons non suivis, dont plusieurs liés à `staging`, désormais obsolètes       |
| Project #6 - Audit Remediation | Fermé | Champs et vagues d'audit obsolètes, champ `Statut` absent, références à `staging` |

Brouillons du Project #5 rendus obsolètes par l'abandon du modèle de workflow
staging : environnement hébergé, URL, secrets et déploiement staging. Cela ne
signifie pas que les ressources staging préexistantes ont été supprimées ; leur
retrait est suivi séparément dans #733 et reste bloqué. Les brouillons Node
`22 LTS` relèvent de #683, la vérification `pnpm dev` sous Windows de #682.

Ne pas rouvrir ni réalimenter ces boards. Ils peuvent être supprimés
définitivement (`gh project delete 5 --owner Ange230700`, idem pour `6`) une
fois le Project #8 jugé suffisant.

## Champs

| Champ            | Type          | Valeurs                                                             |
| ---------------- | ------------- | ------------------------------------------------------------------- |
| `Status`         | natif         | `Todo`, `In Progress`, `Done`                                       |
| `Priority`       | single select | `critical`, `high`, `medium`, `low`                                 |
| `Track`          | single select | voir la liste ci-dessous                                            |
| `Surface`        | single select | `docs`, `shared`, `api`, `web`, `mobile`, `data`, `ci`, `qa`, `ops` |
| `Horizon`        | single select | `1 - Maintenant`, `2 - Ensuite`, `3 - Plus tard`                    |
| `Effort`         | nombre        | `1`, `2`, `3`, `5`, `8` (XS à XL)                                   |
| `Launch blocker` | single select | `Yes`, `No`                                                         |

Valeurs de `Track` : `Transition production`, `Sécurité`,
`Identité & données`, `Livraison & ops`, `Qualité & maintenabilité`,
`Produit & contenu`.

Sens de `Priority` :

| Priorité   | Sens opérationnel                                            |
| ---------- | ------------------------------------------------------------ |
| `critical` | bloque la production, la sécurité ou un workflow obligatoire |
| `high`     | requis dans l'horizon `1 - Maintenant` ou `2 - Ensuite`      |
| `medium`   | engagé mais non bloquant pour la prochaine release           |
| `low`      | optionnel, exploratoire ou reportable                        |

`Horizon` remplace les anciennes vagues : `1 - Maintenant` = travail en cours
ou à démarrer immédiatement, `2 - Ensuite` = prochain lot après la transition,
`3 - Plus tard` = durcissement et dette.

## Règles De Remplissage

| Catégorie d'item | Champs requis                                                   |
| ---------------- | --------------------------------------------------------------- |
| `In Progress`    | tous les champs ci-dessus + `Assignees`                         |
| `Todo`           | tous les champs ci-dessus                                       |
| `Done`           | `Status` ; conserver les autres valeurs sans backfill            |
| Pull request     | ne pas ajouter comme carte de planification                     |

Labels : signaux de type ou de domaine uniquement (`type: *`, `area: *`,
`security`, `documentation`, `audit-remediation`). Pas de labels `status: *`
ni `priority: *`.

## Vues Recommandées

Le CLI `gh` ne permet pas de créer les vues d'un Project ; elles se
configurent dans l'interface GitHub :

1. `Board` : layout Board, colonnes `Status`, swimlanes `Horizon`, tri
   `Priority`, somme `Effort`.
2. `Backlog` : layout Table, tous les items, groupés par `Track`, tri
   `Horizon` puis `Priority`.
3. `Maintenant` : filtre `horizon:"1 - Maintenant" -status:Done`.
4. `Launch blockers` : filtre `launch-blocker:Yes -status:Done`, tri
   `Priority`.

## Cycle De Vie

- `Status` : `Todo -> In Progress -> Done`
- issue : `Open -> Closed`
- board : passer en `Done` le jour de la fusion vers `main`, ou après la
  release de production par tag SemVer lorsque la tâche la concerne
- travail partiel ou bloqué : rester en `In Progress` avec la raison en
  commentaire d'issue

## Mises À Jour Du Statut Du Projet

Publier les status updates directement dans le Project #8 :

- chaque semaine pendant une phase de livraison active ;
- avant toute décision de release ;
- après la clôture d'un horizon.

## Outillage Et Snapshots

`scripts/github-project-awareness.sh` cible le Project #8 par défaut, mais son
contrat de champs (`Lane`, `Coupling`, vagues `Wave 0` à `Wave 8`) et le
snapshot `docs/generated/planning/github_project_planning_current.csv`
proviennent encore du Project #6. Leur réalignement est suivi dans #742 ;
d'ici là, ne pas activer de contrôle de dérive bloquant sur ce snapshot.

Les anciens artefacts de planification restent dans
`docs/archive/historical-planning/`.
