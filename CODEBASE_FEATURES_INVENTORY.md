# KRAAK Codebase Feature Inventory (May 9, 2026)

## Executive Summary

This document inventories **all incomplete, WIP, and non-MVP features** currently in the KRAAK codebase that are **NOT part of the MVP public vitrine** (marketing site).

### Key Finding

- **MVP Marketing Site**: 8 pages, all **COMPLETE**
- **Participant Area (V1.1)**: 4 web pages + 13 mobile pages, all **IMPLEMENTED but HIDDEN** behind feature flag
- **API Endpoints**: 18 endpoints total (7 public, 11 authenticated), all **IMPLEMENTED**
- **Feature Flags**: 1 runtime flag (`enableParticipantArea`, defaults false in production)
- **V1.1 Features Referenced in Backlog**: 31 epics/issues, **NONE IMPLEMENTED**

---

## Part 1: Web Pages

### Marketing Vitrine (MVP - Public, No Auth)

| Page             | Route                           | Status      | Location             | Notes                            |
| ---------------- | ------------------------------- | ----------- | -------------------- | -------------------------------- |
| Home             | `/`                             | ✅ Complete | `features/home`      | Landing page with hero and CTAs  |
| About            | `/a-propos`                     | ✅ Complete | `features/about`     | Team, testimonials, impact stats |
| Services         | `/services`                     | ✅ Complete | `features/services`  | Three service poles              |
| Programs         | `/programmes`                   | ✅ Complete | `features/programs`  | Public programs listing          |
| Resources        | `/ressources`                   | ✅ Complete | `features/resources` | Filtered by theme/audience       |
| Contact          | `/contact`                      | ✅ Complete | `features/contact`   | Email submission via Resend      |
| Legal / Mentions | `/mentions-legales`             | ✅ Complete | `features/legal`     | Required disclaimers             |
| Legal / Privacy  | `/politique-de-confidentialite` | ✅ Complete | `features/legal`     | Privacy policy                   |

### Participant Area (V1.1 Feature, NOT MVP)

> ⚠️ **Status**: Implemented but **HIDDEN** behind runtime feature flag `enableParticipantArea`
>
> - Default: `false` (production)
> - Can be enabled: `true` (staging/development)
> - Controlled via env var: `CLIENT_FEATURE_PARTICIPANT_AREA`

| Page           | Route                    | Status         | File                                               | Hidden By                                        |
| -------------- | ------------------------ | -------------- | -------------------------------------------------- | ------------------------------------------------ |
| Sign In        | `/connexion`             | ✅ Implemented | `features/auth/sign-in.page.ts`                    | `enableParticipantArea` guard                    |
| Sign Up        | `/inscription`           | ✅ Implemented | `features/auth/sign-up.page.ts`                    | `enableParticipantArea` guard                    |
| Password Reset | `/mot-de-passe-oublie`   | ✅ Implemented | `features/auth/password-reset.page.ts`             | `enableParticipantArea` guard                    |
| Dashboard      | `/participant/dashboard` | ✅ Implemented | `features/participant/dashboard/dashboard.page.ts` | `participantRoleGuard` + `enableParticipantArea` |

**Evidence of Implementation**:

- Supabase auth integration (sign-in/sign-up/password-reset)
- Dashboard fetches real data from `GET /dashboard` API
- Full form validation and error handling
- Navigation and state management via Angular signals
- Tests: `navbar.spec.ts`, `app.routes.spec.ts`, `runtime-config.spec.ts` all validate feature flag behavior

---

## Part 2: Mobile Pages (All Participant Area)

> 📱 **Scope**: Mobile MVP specified "Indispensable" vs "Souhaitée" classifications
>
> - All **Indispensable** features: ✅ Implemented
> - Some **Souhaitée** features: ⏳ Partially prepared (push notifications, profile page, progress markers)

### Mobile Routes (All Authenticated)

| Page                | Route                                             | Status  | File                                                 | Classification |
| ------------------- | ------------------------------------------------- | ------- | ---------------------------------------------------- | -------------- |
| Welcome             | `/welcome`                                        | ✅ Done | `features/onboarding/welcome.page.ts`                | Indispensable  |
| Sign In             | `/sign-in`                                        | ✅ Done | `features/auth/sign-in.page.ts`                      | Indispensable  |
| Sign Up             | `/sign-up`                                        | ✅ Done | `features/auth/sign-up.page.ts`                      | Indispensable  |
| Password Reset      | `/password-reset`                                 | ✅ Done | `features/auth/password-reset.page.ts`               | Indispensable  |
| Home / Accueil      | `/tabs/accueil`                                   | ✅ Done | `features/dashboard/home.page.ts`                    | Indispensable  |
| Programs List       | `/tabs/programmes`                                | ✅ Done | `features/programs/program-list.page.ts`             | Indispensable  |
| Program Detail      | `/tabs/programmes/:programId`                     | ✅ Done | `features/programs/program-detail.page.ts`           | Indispensable  |
| Sessions            | `/tabs/programmes/:programId/sessions/:sessionId` | ✅ Done | `features/programs/session-detail.page.ts`           | Indispensable  |
| Resources List      | `/tabs/programmes/ressources`                     | ✅ Done | `features/resources/resource-list.page.ts`           | Indispensable  |
| Resource Detail     | `/tabs/programmes/ressources/:resourceId`         | ✅ Done | `features/resources/resource-detail.page.ts`         | Indispensable  |
| Announcements       | `/tabs/annonces`                                  | ✅ Done | `features/announcements/announcement-list.page.ts`   | Indispensable  |
| Announcement Detail | `/tabs/annonces/:announcementId`                  | ✅ Done | `features/announcements/announcement-detail.page.ts` | Indispensable  |
| Support             | `/tabs/support`                                   | ✅ Done | `features/support/support.page.ts`                   | Indispensable  |

**Partially Prepared (Souhaitée)**:

- Push notifications: `mobile-push-notifications.service.ts` exists (Firebase setup started)
- Profile page: Not yet visible (blocked by Souhaitée classification)
- Progress markers: Session completion tracking exists but UI not fully realized

---

## Part 3: API Endpoints

### Public Endpoints (No Auth Required)

```bash
POST   /support/contact          - Submit contact form
POST   /contact                  - Alias for /support/contact
GET    /resources                - List public resources
POST   /auth/sign-in             - Email + password → access token
POST   /auth/sign-up             - Create participant account
POST   /auth/password-reset      - Reset password flow
POST   /auth/refresh-session     - Refresh access token
```

### Authenticated Endpoints (Bearer Token Required)

#### Dashboard & Overview

```bash
GET    /dashboard                - Aggregate: programs, sessions, announcements
```

#### Programs

```bash
GET    /programs                 - List enrolled programs with progress
GET    /programs/:id             - Program detail with sessions & announcements
POST   /programs/:id/sessions/:id/progress - Mark session as completed
```

#### Announcements

```bash
GET    /announcements            - Paginated list of accessible announcements
GET    /announcements/:id        - Single announcement detail
```

#### Support (Tracking)

```bash
GET    /support/requests         - List participant's own support requests
PATCH  /support/requests/:id/status - Update support request status
```

#### Profile

```bash
GET    /auth/profile             - Current authenticated user + participant data
```

**All endpoints**: ✅ Fully implemented with Swagger documentation, validation, error handling

---

## Part 4: Feature Flags

### `enableParticipantArea`

**Type**: Boolean  
**Environment Variable**: `CLIENT_FEATURE_PARTICIPANT_AREA`  
**Defaults**: `false`

#### Configuration by Environment

| Environment | Value   | Source                                    | Intent                                        |
| ----------- | ------- | ----------------------------------------- | --------------------------------------------- |
| Production  | `false` | Vercel project env var (kraak-consulting) | Hide participant area until post-MVP approval |
| Staging     | `true`  | Vercel preview override on staging branch | Enable for testing                            |
| Development | `true`  | `.env` or `.env.staging`                  | Enable for local dev                          |

#### Behavior

**When `false` (default production)**:

- Routes `/connexion`, `/inscription`, `/participant/**` are **not registered** in Router
- Navbar "Espace participant" link is **hidden** (`@if` condition)
- Accessing `/connexion` → redirects to `/` (wildcard route)
- API endpoints are unchanged (no data protection)

**When `true` (staging/dev)**:

- Participant routes are **registered** and matched by `participantAreaCanMatch` guard
- Navbar shows "Espace participant" link
- Auth guards validate session before allowing access

#### Implementation Details

- **Runtime Configuration File**: `apps/client/projects/web/src/app/core/runtime/runtime-config.ts`
- **Route Builder**: `apps/client/projects/web/src/app/app.routes.ts` uses `buildRoutes()`
- **Navbar Conditional**: `apps/client/projects/web/src/app/layouts/navbar/navbar.ts` has `@if (participantAreaEnabled)`
- **Tests**: `navbar.spec.ts`, `app.routes.spec.ts`, `runtime-config.spec.ts`

#### Temporary Status

This flag is **TEMPORARY** (see `docs/decisions/ARC-10-feature-flag-participant-area.md`).

**Post-MVP Removal Plan**:

1. Remove flag from runtime-config once participant area passes security review
2. Collapse `buildRoutes()` to static `routes` constant
3. Remove `participantAreaCanMatch` guard
4. Remove `@if (participantAreaEnabled)` from navbar
5. Clean up `.env*` files
6. Delete Vercel environment variable

---

## Part 5: Runtime Configuration

### Config Object Structure

```typescript
interface KraakRuntimeConfig {
  apiBaseUrl?: string; // API base URL (runtime override)
  supabaseUrl?: string; // Supabase project URL
  supabasePublishableKey?: string; // Supabase public key
  enableParticipantArea?: boolean; // Feature flag
}
```

### Loading Mechanism

- **Generated by**: `scripts/generate-client-runtime-config.mjs`
- **Injected at**: `globalThis.__KRAAK_RUNTIME_CONFIG__`
- **Accessed via**: `getRuntimeConfig()` helper in `runtime-config.ts`
- **SSR Hydration**: `main.server.ts` hydrates from `process.env` before client boots

### Environment Files

| Env        | File           | Example                                 |
| ---------- | -------------- | --------------------------------------- |
| Local      | `.env`         | `CLIENT_FEATURE_PARTICIPANT_AREA=true`  |
| Staging    | `.env.staging` | `CLIENT_FEATURE_PARTICIPANT_AREA=true`  |
| Production | `.env.prod`    | `CLIENT_FEATURE_PARTICIPANT_AREA=false` |

---

## Part 6: V1.1 Features (Planned, Not Implemented)

These are listed in the backlog but have **no code implementation** yet.

### Payment (M8)

- **Epic**: `PAY - Paiement en ligne`
- **Issues**: PAY-01 through PAY-06
- **Scope**: Stripe integration (checkout, subscriptions, invoices, receipts)
- **Status**: ❌ Not in codebase

### Learning Management System (M9)

- **Epic**: `LMS - Apprentissage et certification`
- **Issues**: LMS-01 through LMS-06
- **Scope**: Courses, modules, lessons, quizzes, progress, PDF certification
- **Status**: ❌ Not in codebase (stub contracts exist only)

### Participant Documents (M9)

- **Epic**: `DOC - Documents participants`
- **Issues**: DOC-01 through DOC-04
- **Scope**: Secure upload/download via Supabase Storage with RLS
- **Status**: ❌ Not in codebase

### CMS Admin (M9)

- **Epic**: `CMS - Gestion de contenu admin`
- **Issues**: CMS-01 through CMS-04
- **Scope**: Editorial workflows, publishing roles, multi-version content
- **Status**: ❌ Not in codebase (no admin UI; draft/published/archived enums exist for data models)

### CRM & Marketing (M10)

- **Epic**: `CRM - Relation client et marketing`
- **Issues**: CRM-01 through CRM-04
- **Scope**: Profile enrichment, participant view, scoring, email sequences
- **Status**: ❌ Not in codebase

### Advanced Push Notifications

- **Status**: ⏳ Partially prepared (Firebase setup started, labeled "Souhaitée")
- **File**: `apps/client/projects/mobile/src/app/core/mobile-push-notifications.service.ts`
- **Note**: Basic infrastructure ready; production rollout deferred to V1.1+

---

## Part 7: Code Patterns & Observations

### Data Modeling

1. **Status Enums** (Draft/Published/Archived)
   - Used in: Programs, Resources, Announcements, Cohorts
   - Pattern: `draft` → `published` → `archived` transitions
   - Admin UI: None (no CMS yet)
   - Implication: Data supports drafts, but no UI to manage them

2. **Audience Types**
   - Announcements support: `all_participants`, `program`, `cohort` (MVP only)
   - Future: `custom` audience type reserved for V1.1+ (enum defines it, but MVP validation rejects it)
   - Evidence: `validateAnnouncementPublicationForMvp()` in `packages/domain`

3. **Partial Update DTOs**
   - Pattern: `UpdateXxxDto = Partial<CreateXxxDto>`
   - Example: `UpdateProgramDto = Partial<CreateProgramDto>`
   - Implication: PATCH endpoints are prepared (via contracts) but not yet implemented in controllers

### Authentication & Access Control

1. **Session Management**
   - Supabase Auth (JWTs)
   - Access token + refresh token pattern
   - Profile context attached to session

2. **Route Guards**
   - `participantRoleGuard` - Checks if user is a participant (not admin/trainer)
   - `participantAreaCanMatch` - Feature flag guard (runtime)
   - These are **AND**-ed together

3. **Data Isolation**
   - Supabase RLS policies ensure participants see only their own data
   - Dashboard filters by authenticated user
   - Support requests filtered by participant ID

### Partially Realized Features

| Feature            | Status     | Location                               | Notes                                                                     |
| ------------------ | ---------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Push Notifications | ⏳ Prep    | `mobile-push-notifications.service.ts` | Firebase setup exists; feature labeled "Souhaitée" (nice-to-have for MVP) |
| Profile Page       | ⏳ TODO    | N/A                                    | Defined in mobile MVP spec as "Souhaitée"; not yet visible                |
| Progress Markers   | ⏳ Partial | Session completion API exists          | UI not fully realized                                                     |

---

## Part 8: Testing Coverage

### Test Results (QAT-05 - Full Regression)

**Total**: 88 suites, 1060 tests, **ALL PASSING**

| Layer      | Tests | Status     |
| ---------- | ----- | ---------- |
| API        | 292   | ✅ Passing |
| Web        | 163   | ✅ Passing |
| Mobile     | 183   | ✅ Passing |
| Tokens     | 27    | ✅ Passing |
| Contracts  | 151   | ✅ Passing |
| Domain     | 189   | ✅ Passing |
| API Client | 55    | ✅ Passing |

### E2E Coverage (QAT-04 - Participant Flows)

- `participant-core-journey.spec.ts` - ✅ 2/2 passed
- `participant-dashboard.spec.ts` - ✅ 4/4 passed
- `programs.spec.ts` - ✅ 2/2 passed
- `resources.spec.ts` - ✅ 2/2 passed

---

## Part 9: Decision Documents

Key ADRs defining scope boundaries:

| Doc                                       | Key Decision                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ARC-05-criteres-anti-scope-creep.md`     | Explicitly lists 9 features excluded from MVP (participant portal, LMS, payment, CRM, etc.)       |
| `ARC-10-feature-flag-participant-area.md` | Runtime flag to hide participant area until post-MVP review                                       |
| `mobile_mvp.md`                           | "Indispensable" vs "Souhaitée" classifications; Indispensable = implemented, Souhaitée = deferred |

---

## Part 10: Cleanup & Migration Path

### Post-MVP Actions (When Participant Area Goes Live)

1. **Feature Flag Removal**
   - Remove `enableParticipantArea` from `runtime-config.ts`
   - Collapse `buildRoutes()` to static `routes` in `app.routes.ts`
   - Remove `participantAreaCanMatch` guard

2. **UI Updates**
   - Remove `@if (participantAreaEnabled)` condition from navbar
   - Navbar always shows "Espace participant" link

3. **Environment Cleanup**
   - Delete `CLIENT_FEATURE_PARTICIPANT_AREA` from `.env*` files
   - Remove Vercel project environment variable

4. **Documentation**
   - Remove ARC-10 flag decision document (flag no longer needed)
   - Update README and architecture docs

---

## Deliverable Files

This inventory is provided as:

1. **JSON Structure** (`CODEBASE_FEATURES_INVENTORY.json`)
   - Machine-readable comprehensive catalog
   - Includes metadata, evidence, cross-references

2. **Markdown Summary** (this file)
   - Human-readable overview
   - Tables and narrative structure
   - Easy navigation by section

---

## Summary Statistics

| Category                        | Count | Status                  |
| ------------------------------- | ----- | ----------------------- |
| MVP Marketing Pages             | 8     | ✅ Complete             |
| Participant Area Pages (Web)    | 4     | ✅ Implemented (Hidden) |
| Participant Area Pages (Mobile) | 13    | ✅ Implemented          |
| Public API Endpoints            | 7     | ✅ Complete             |
| Authenticated Endpoints         | 11    | ✅ Complete             |
| Feature Flags                   | 1     | ✅ Active               |
| V1.1 Epics (Planned)            | 7     | ❌ Not started          |
| V1.1 Issues (Planned)           | 31    | ❌ Not started          |
| Tests Passing                   | 1,060 | ✅ All passing          |

---

**Generated**: May 9, 2026  
**Scope**: KRAAK MVP + Participant Area Implementation Status  
**For**: Technical review, MVP validation, V1.1 planning
