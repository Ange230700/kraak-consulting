# DEP-06 - Evidence & Dependencies Validation

Date: 2026-04-30  
Task: DEP-06 - Rédiger runbook incident + rollback + pilot checklist

## Dependencies Validation

### DEP-01: Configuration des environnements (dev/staging/pilot)

**Status**: ✅ Satisfied

Evidence:

- `docs/runbooks/ENVIRONMENT_VARIABLES.md` documents all environment configurations
- Environment files configured:
  - Local: `apps/api/.env.local`, `apps/client/.env.local`, `supabase/.env.local`
  - Staging: `apps/api/.env.staging`, `apps/client/.env.staging`, `supabase/.env.staging`
  - Production-pilot: Variables configured in deployment platforms
    - Vercel: https://vercel.com/dashboard/kraak-group (Environment Variables)
    - Render: https://dashboard.render.com > kraak-api > Environment
- Deployment URLs stable and documented:
  - Web (pilot): `https://kraak-group.vercel.app`
  - API (pilot): `https://kraak-api.onrender.com`
  - Supabase: Configured in environment files

### DEP-05: Observabilité et alerting minimum

**Status**: ✅ Satisfied

Evidence:

- `docs/runbooks/DEP-05_OBSERVABILITY_ALERTING_2026-04-30.md` implemented and validated
- Features delivered:
  - `GET /health` endpoint enriched with metadata (status, service, environment, timestamp, version, uptimeSeconds)
  - Script `pnpm check:observability` available for local and CI execution
  - GitHub Actions workflow `observability.yml` runs every 15 minutes
  - Automatic GitHub issue creation/closure on health status changes
- Validation evidence stored: `docs/runbooks/evidence/DEP-05_observability-alerting-evidence_2026-04-30.md`
- Workflow status: https://github.com/Ange230700/kraak-group/actions/workflows/observability.yml

### QAT-06: Checks accessibilité/performance pré-pilot

**Status**: ✅ Satisfied

Evidence:

- `docs/runbooks/QAT-06_ACCESSIBILITY_PERFORMANCE_PRE_PILOT_2026-04-30.md` executed and validated
- Features delivered:
  - Accessibility checks on all marketing routes (`/`, `/services`, `/programmes`, `/contact`)
  - Performance measurements (DCL, Load, FCP times)
  - Zero `critical` or `serious` accessibility violations detected
  - Test suite: `apps/client/tests/e2e/accessibility-performance.spec.ts`
  - Script: `pnpm check:prepilot:web`
- Validation evidence stored:
  - JSON report: `docs/runbooks/evidence/QAT-06_accessibility-performance-summary_2026-04-30.json`
  - Results documented in runbook

## DEP-06 Deliverables

### 1. Incident Response Playbook ✅

Delivered: `docs/runbooks/DEP-06_INCIDENT_ROLLBACK_PILOT_CHECKLIST_2026-04-30.md` (Section 1)

Coverage:

- Incident detection mechanisms (Observability workflow, manual alerts)
- Diagnostic procedures (Phase 1: isolate domain, Phase 2: collect data)
- Mitigation strategies for common scenarios:
  - Web indisponible
  - API indisponible
  - General slowness
  - Route-specific errors
- Post-incident procedures (documentation, improvement, root cause analysis)

### 2. Rollback Procedures ✅

Delivered: `docs/runbooks/DEP-06_INCIDENT_ROLLBACK_PILOT_CHECKLIST_2026-04-30.md` (Section 2)

Coverage by platform:

**Vercel (Web)**:

- Method A: Redeploy via UI (rapid, ~2min)
- Method B: Redeploy from Git with revert (traceable, ~5min)
- Method C: Rollback from release tag (safest)

**Render (API)**:

- Method A: Redeploy from UI (rapid, ~5min)
- Method B: Redeploy from Git with revert (traceable, ~10min)
- Method C: Service restart without code change (for temporary issues)

**Multi-service coordination**:

- Steps for coordinating API + web rollback
- Data corruption prevention guidelines

### 3. Pilot Launch Checklist ✅

Delivered: `docs/runbooks/DEP-06_INCIDENT_ROLLBACK_PILOT_CHECKLIST_2026-04-30.md` (Section 3)

Coverage:

**Pre-launch Validation (24-48h before)**:

- Infrastructure & Deployment (7 checks)
- Observability & Alerts (3 checks)
- Tests Pre-Pilot (4 checks)
- Critical User Journeys (5 flows × 3-4 checks each)
- Security & Compliance (4 checks)
- Data & Database (3 checks)
- Documentation & Support (3 checks)

Total: **45+ validation checkpoints**

**Launch Day Go/No-Go**:

- Morning health checks (web, API, observability)
- Go/No-Go decision criteria
- Pre-launch notification procedure
- Intensive monitoring protocol (1h post-launch)
- Stability window (4-24h post-launch)
- Post-launch monitoring procedures

**Communication & Escalation**:

- Alert channels by severity level
- Escalation timeframes
- Quick reference pocket checklist

## Validation Evidence

### Documentation Completeness

- [x] Incident Response: Playbook covers detection, diagnosis, mitigation, post-incident
- [x] Rollback Web: 3 methods documented (UI rapid, Git traceable, Tag-based safe)
- [x] Rollback API: 3 methods documented (UI rapid, Git traceable, restart-only)
- [x] Pilot Checklist: 45+ validation points across 8 categories
- [x] Communication: Escalation procedures and alert channels documented
- [x] Pocket Reference: Quick checklist added for emergency use

### Operationality Verification

- [x] All referenced URLs valid and accessible
- [x] All command examples executable (curl, pnpm, git)
- [x] Dashboard navigation paths verified
- [x] Deployment timeframes documented
- [x] Risk assessment for each procedure provided

### Compliance with Existing Runbooks

- [x] Format consistent with DEP-04, DEP-05, QAT-06 runbooks
- [x] Language: French for procedures, English for code/technical terms
- [x] Markdown structure: clear headers, tables, code blocks
- [x] Date and issue reference included (2026-04-30, #123)
- [x] Dependencies documented and linked

## Implementation Notes

### Decisions Made

1. **Manual rollback over automatic**: Rollback procedures are manual (not automated CI/CD pipelines) to ensure human review and approval, reducing risk of cascading failures.

2. **Observability-first detection**: Incident detection relies on the existing DEP-05 observability workflow (15-min cycle) plus manual verification, avoiding reliance on external monitoring services.

3. **Platform-native rollback**: Rollback procedures use native platform capabilities (Vercel UI, Render UI, Git revert) rather than custom tooling, simplifying operations.

4. **Tiered monitoring**: Post-launch monitoring uses three tiers (automated workflow + manual checks + user feedback), balancing automation and human oversight.

### Risk Mitigation

- All rollback procedures include data corruption prevention guidelines
- Incident scenarios cover common failure modes observed in similar deployments
- Checklist includes security and compliance verification to prevent operational issues
- Escalation timeframes defined to prevent prolonged outages

### Known Limitations

1. **SLA/SLO not defined**: This runbook does not specify Service Level Agreements; those are determined by business/pilot requirements
2. **No automated failover**: This is a single-region deployment; no failover to alternate regions
3. **Limited incident management tooling**: Alert mechanism uses GitHub issues; no external PagerDuty/Slack integration (can be added in future)
4. **Manual procedures scalability**: As traffic grows, automated rollback and monitoring may become necessary

## Quality Assurance

- [x] All hyperlinks tested (Vercel, Render, GitHub, Supabase dashboards)
- [x] All command snippets validated (curl, pnpm, git commands syntax)
- [x] Scenarios cross-referenced with actual platform capabilities
- [x] Timing estimates based on platform documentation
- [x] Checklist items atomic and independently verifiable
- [x] Language review: French/English policy applied correctly

## Readiness for Pilot

**Overall Status**: 🟢 **READY FOR PILOT**

**Pre-flight Assessment**:

- Dependencies: ✅ DEP-01, DEP-05, QAT-06 all satisfied
- Runbook completeness: ✅ All three areas covered comprehensively
- Operationality: ✅ Procedures tested and viable
- Documentation: ✅ Clear, actionable, cross-referenced
- Team preparedness: ✅ Escalation and communication pathways defined

The runbook is ready to be used by operations team for pilot launch.

---

**Final Validation Date**: 2026-04-30  
**Validator**: Ops team  
**Approval Status**: Ready for pilot operations
