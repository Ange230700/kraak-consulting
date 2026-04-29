## Summary

Implemente SUP-05: suivi et statut basique des demandes support.

## Changes

- API support:
  - persistance d'une demande `support_request` lors de la soumission authentifiee
  - extension de la reponse `POST /support/contact` avec metadata de suivi (`requestId`, `requestStatus`)
  - nouvel endpoint `GET /support/requests` pour consultation des statuts
  - nouvel endpoint `PATCH /support/requests/:id/status` pour transitions de statut minimales
  - transitions minimales appliquees: `open -> in_progress|closed`, `in_progress -> resolved|closed`, `resolved -> closed`
  - restriction role: mise a jour de statut reservee aux roles non participant (coherent AUT-05)

- Contrats partages:
  - `ContactSubmissionResultDto` enrichi avec champs optionnels de suivi
  - ajout `UpdateSupportRequestStatusDto`
  - client API etendu (`contact.listMine`, `contact.updateStatus`)

- Mobile:
  - `MobileSupportService.listMyRequests()`
  - page Support affiche maintenant la liste des demandes et leur statut

- Tests:
  - nouveaux tests controller/service/DTO sur API support
  - nouveaux tests mobile service + page support
  - tests contrats DTO mis a jour

## Dependencies

- SUP-01: satisfait (endpoint support existant et reutilise)
- AUT-05: satisfait (controle minimal par role pour transitions de statut)

## Validation Evidence

- `pnpm --filter @kraak/api test -- src/support/support.dto.spec.ts src/support/support.controller.spec.ts src/support/support-requests.controller.spec.ts src/support/support.service.spec.ts`
- `pnpm --filter @kraak/contracts test -- src/dto.spec.ts`
- `pnpm --dir apps/client test:mobile --include=projects/mobile/src/app/features/support/**/*.spec.ts`
- hooks git executes ont aussi valide:
  - lint + format workspace
  - tests mobile complets
  - e2e web (14/14)

## Related

Closes #111
