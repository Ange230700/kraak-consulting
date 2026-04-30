# QAT-01 - Matrice de couverture MVP (page, composant, comportement)

Mise a jour: 30 avril 2026
Portee: MVP KRAAK (web public, web participant, mobile participant, API support)

## 1) Objectif

Definir une matrice de couverture de test exploitable par:

- QAT-02 (tests unitaires/composants)
- QAT-03 (tests integration API)
- QAT-04 (tests E2E Given/When/Then)

La matrice impose 3 vues de couverture pour chaque flux critique:

- Page: une preuve de rendu/navigation sur la page cible
- Composant: une preuve unitaire/composant sur les blocs critiques
- Comportement: un scenario orienté utilisateur en Given/When/Then

## 2) Preconditions (dependencies)

QAT-01 depend de SET-04 et SET-05.

Evidence SET-04 (runners unitaires + integration):

- `apps/api/jest.config.ts` actif pour les specs API NestJS
- scripts root disponibles: `test:api`, `test:unit`, `test:workspace`
- specs presentes sur web/mobile/API (fichiers `*.spec.ts`)

Evidence SET-05 (Playwright E2E + smoke):

- `apps/client/playwright.config.ts` configure sur `apps/client/tests/e2e`
- script root `test:e2e` et script client `e2e`
- scenarios smoke/BDD presents dans `apps/client/tests/e2e/*.spec.ts`

## 3) Definition de done coverage (minimum)

Une fonctionnalite est consideree couverte si les 3 conditions sont vraies:

1. Couverture page:
   - 1 test qui valide la route/page principale
   - 1 assertion de contenu visible critique (titre, CTA, etat vide/erreur)
2. Couverture composant:
   - 1 spec pour chaque composant critique de la page
   - assertions sur inputs/outputs (ou interaction UI equivalent)
3. Couverture comportement:
   - 1 scenario Given/When/Then testant le parcours utilisateur principal
   - 1 scenario Given/When/Then sur le cas d'echec prioritaire

## 4) Matrice de couverture cible

| Flux critique MVP                      | Page(s) cible(s)                           | Composants critiques                                    | Comportements critiques (Given/When/Then)                                          | Cible QAT-02 | Cible QAT-03                  | Cible QAT-04 |
| -------------------------------------- | ------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------ | ----------------------------- | ------------ |
| Site vitrine - accueil & conversion    | `/`                                        | Navbar, hero/CTA, footer                                | visiteur voit proposition de valeur et CTA contact                                 | Oui (web)    | Non                           | Oui (web)    |
| Site vitrine - programmes              | `/programmes`                              | cards programme, section parcours, CTA final            | visiteur comprend offres et rejoint contact                                        | Oui (web)    | Non                           | Oui (web)    |
| Site vitrine - contact                 | `/contact`                                 | formulaire contact, feedback succes/erreur              | envoi valide affiche confirmation; erreur affiche message actionnable              | Oui (web)    | Oui (support endpoint)        | Oui (web)    |
| Web participant - protection dashboard | `/participant` et `/participant/dashboard` | guard auth web, shell participant                       | visiteur non authentifie est redirige; utilisateur authentifie accede au dashboard | Oui (web)    | Oui (auth/session)            | Oui (web)    |
| Mobile - authentification              | `sign-in`, `sign-up`, `password-reset`     | pages auth, service auth, guard auth                    | participant se connecte; identifiants invalides affichent une erreur claire        | Oui (mobile) | Oui (auth/session)            | Oui (mobile) |
| Mobile - dashboard                     | `home` participant                         | cards dashboard, section annonces recentes              | participant voit ses informations utiles; session expiree relance flux auth        | Oui (mobile) | Oui (dashboard aggregate)     | Oui (mobile) |
| Mobile - programmes                    | liste + detail programme + detail session  | list item programme, detail session, service programmes | participant ouvre programme puis session; acces non autorise bloque                | Oui (mobile) | Oui (programs endpoints)      | Oui (mobile) |
| Mobile - ressources                    | liste + detail ressource                   | list item ressource, filtres, detail ressource          | participant filtre et ouvre ressource; etat vide explicite si aucune ressource     | Oui (mobile) | Oui (resources endpoints)     | Oui (mobile) |
| Mobile - annonces                      | liste + detail annonce                     | cards annonce, detail annonce, service annonces         | participant lit annonces; marquage lu/non lu coherent                              | Oui (mobile) | Oui (announcements endpoints) | Oui (mobile) |
| Mobile - support                       | support page + support request page        | formulaire support, validation champs, service support  | participant soumet une demande; erreur reseau affiche une alternative claire       | Oui (mobile) | Oui (support endpoint)        | Oui (mobile) |

## 5) Scenarios critiques prioritaires

Liste des scenarios a traiter en priorite (base QAT-04):

1. Given un visiteur non authentifie, When il accede a une route participant, Then il est redirige vers un ecran autorise.
2. Given un participant authentifie, When il ouvre son dashboard, Then ses informations essentielles sont visibles.
3. Given un participant sur la page ressources, When aucune ressource n'est disponible, Then un etat vide lisible est affiche.
4. Given un participant tente une route non autorisee, When la verification d'acces s'applique, Then aucune donnee sensible n'est exposee.
5. Given un utilisateur envoie le formulaire contact/support avec des donnees valides, When l'envoi aboutit, Then un message de confirmation est affiche.
6. Given une session expiree, When l'utilisateur relance une action protegee, Then le flux de reconnexion est declenche de facon controlee.

## 6) Mapping vers les suites existantes (etat au 30/04/2026)

| Surface              | Suites detectees                                                                                                        | Etat     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| E2E web comportement | `apps/client/tests/e2e/*.spec.ts` (analytics, contact-form, design-system, participant-dashboard, programs, seo, smoke) | En place |
| Unit web             | `apps/client/projects/web/src/app/**/*.spec.ts`                                                                         | En place |
| Unit mobile          | `apps/client/projects/mobile/src/app/**/*.spec.ts`                                                                      | En place |
| Unit/integration API | `apps/api/src/**/*.spec.ts` via Jest                                                                                    | En place |

## 7) Evidence de validation QAT-01

Checks executes le 30/04/2026:

1. `pnpm test:workspace` -> 11/11 tests pass.
2. `pnpm --filter @kraak/client exec playwright test --list` -> 16 scenarios detectes dans 7 fichiers, avec titres Given/When/Then.

Resultat:

- Scope QAT-01 implemente: Oui (matrice page/composant/comportement definie)
- Dependencies SET-04/SET-05 satisfaites: Oui (runners et suites verifies)
- Validation evidence ajoutee: Oui (checks listes ci-dessus)

## 8) Utilisation operationnelle pour les prochaines taches

- QAT-02: couvrir les composants critiques listes en colonne "Composants critiques".
- QAT-03: couvrir les endpoints associes pour auth, dashboard, programs, resources, announcements, support.
- QAT-04: aligner les scenarios E2E sur les 6 scenarios critiques prioritaires.
