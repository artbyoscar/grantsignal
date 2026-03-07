# GrantSignal Improvement Roadmap

**Generated:** March 6, 2026
**Scope:** Full codebase audit of 18 routers, 135 components, 12 Inngest functions, 21 Prisma models

---

## Tier 1: Production Blockers (Fix Before Real Users Touch It)

### 1. Remove `ignoreBuildErrors: true` from next.config.ts
**File:** `next.config.ts` lines 10-13
**Risk:** TypeScript errors silently deploy to production. You are flying blind on type safety.
**Fix:** Remove both `ignoreBuildErrors` and `ignoreDuringBuilds`, then fix every error the build surfaces.

### 2. Inngest Cloud Connectivity (Carryover)
**Impact:** Documents stuck at 0%, no deadline reminders, no weekly digests, no compliance alerts, no webhook deliveries.
**Fix:** Verify in Inngest dashboard: app registration, webhook URL, event arrival, env var match.

### 3. Voice Rewriting is Intentionally Disabled
**File:** `src/components/writing/apply-voice-modal.tsx` line 26-41
**Status:** `voice.applyToText` is commented out and replaced with a hardcoded error toast.
**Fix:** The backend (`src/server/routers/voice.ts` `applyToText`) is actually fully implemented. Just wire the modal to call it.

### 4. Fit Score Card Never Loads Real Data
**File:** `src/components/discovery/fit-score-card.tsx` lines 61-79
**Status:** The `getFitScore` query is commented out. `handleRecalculate` is a fake 1-second `setTimeout`. Users see a loading skeleton forever or nothing.
**Fix:** Create a `getFitScore` query in the discovery router and wire it up. The `calculateFitScore` mutation exists but is never called from the component.

### 5. Conflict Detection Finds Problems but Never Tells Anyone
**File:** `src/inngest/functions/detect-conflicts.ts` lines 38-48
**Status:** Nightly cron detects conflicts, counts them, then `alertsSent: 0`. No notifications sent.
**Fix:** After saving conflicts, emit `notification/compliance-alert` events for HIGH/CRITICAL conflicts. The `sendComplianceAlert` Inngest function already exists and is ready to receive them.

---

## Tier 2: Core Feature Gaps (What Users Will Notice Day 1)

### 6. Dashboard Activity Feed is Empty
**Files:** `src/server/routers/dashboard.ts` (line 340-350), `src/components/dashboard/activity-feed-client.tsx`
**Status:** `getRecentActivity` returns `[]`. No ActivityLog model exists. The client component has `hasMore = false` hardcoded.
**Fix:** Create an `ActivityLog` model in Prisma, log key events (grant status changes, document uploads, team actions, AI generations), query recent entries. This is the heartbeat of the dashboard.

### 7. Dashboard AI Insights are Barely There
**File:** `src/server/routers/dashboard.ts` lines 356-391
**Status:** Returns at most 1 insight (upcoming deadlines). Has TODO for Claude API integration.
**Fix:** Query multiple data points (win rate trends, stale grants, capacity warnings, funder deadline clusters, compliance issues) and either generate insights with Claude or compute them deterministically. At least 4-5 insight types.

### 8. Dashboard Sparkline/Trend Data is Mocked
**File:** `src/server/routers/dashboard.ts` lines 162, 167, 169, 178, 182-183
**Status:** `mockSparkline = [65, 70, 68, 75, 72, 78, 80]`, trend hardcoded as `5` and `3`.
**Fix:** Calculate real 7-day or 30-day historical data from grant status changes. Could be derived from `updatedAt` timestamps.

### 9. Pipeline Kanban Has No Drag-and-Drop
**File:** `src/app/(dashboard)/pipeline/page.tsx`
**Status:** Board renders but dragging does not update status. Team member filter is empty (line 151 TODO). Progress bar uses random numbers (line 178).
**Fix:** Wire drag-and-drop to `grants.update` mutation for status changes. Populate team member dropdown from `team.listMembers`. Calculate progress from writing completion (sections filled vs total).

### 10. Reports Page: All 5 Report Types Disabled
**File:** `src/app/(dashboard)/reports/page.tsx` lines 204-209
**Status:** Executive, Pipeline, Historical, Funder, and Compliance report buttons all say "Coming Soon" and are disabled.
**Fix:** Implement at least Executive and Pipeline reports. Generate PDFs with @react-pdf/renderer (already a dependency). The data queries mostly exist in `src/server/routers/reports.ts`.

### 11. Calendar Cannot Create/Edit/Delete Events
**File:** `src/server/routers/calendar.ts` lines 234-267
**Status:** `createEvent`, `updateEvent`, `deleteEvent` all return mock responses. No `CalendarEvent` model exists.
**Fix:** Add CalendarEvent model to Prisma, implement the three mutations.

---

## Tier 3: Polish and Depth (What Makes It Feel Professional)

### 12. Settings > Integrations Page is Entirely Fake
**File:** `src/app/(dashboard)/settings/integrations/page.tsx`
**Status:** API keys are hardcoded masked strings. Integration statuses are static. "Contact administrator" message instead of management UI.
**Fix:** Wire to the existing `webhooks` and API key routers. The `ApiKey` model and `generator.ts`/`validator.ts` services already exist.

### 13. REST API Framework Exists But Has No Endpoints
**Files:** `src/server/api/rest/handler.ts`, `src/app/api/v1/grants/route.ts`
**Status:** Full middleware stack (auth, rate limiting, scope checking) is built. OpenAPI spec generator exists. But there are no actual REST routes consuming it.
**Fix:** Implement at least `GET /api/v1/grants`, `GET /api/v1/grants/:id`, and `POST /api/v1/grants`. The tRPC procedures already have the business logic.

### 14. Onboarding Document Upload Does Not Work
**File:** `src/app/(dashboard)/onboarding/documents/page.tsx` lines 46, 81
**Status:** Cloud storage OAuth is TODO. File upload logic is TODO.
**Fix:** Reuse the existing document upload flow from the main documents page (presigned URL to S3).

### 15. No Product Tour / Guided Onboarding
**File:** `src/app/(dashboard)/onboarding/complete/page.tsx` line 179
**Status:** `tour-overlay.tsx` component exists but the product tour trigger is TODO.
**Fix:** Wire the overlay to fire on first dashboard load after onboarding completes.

### 16. Console Logging in Production
**File:** `src/server/routers/dashboard.ts` (throughout)
**Status:** Heavy `console.log` statements in production-facing routes.
**Fix:** Replace with structured logging (or remove). These will clutter Vercel logs.

### 17. Test Coverage is Thin
**Status:** 9 test files covering trust architecture and a smoke test. No integration tests for tRPC routers. No tests for Inngest functions. No e2e tests despite Playwright being installed.
**Fix:** Prioritize integration tests for the critical paths: document upload/processing, grant creation, compliance extraction, voice analysis.

---

## Tier 4: Competitive Differentiators (What Makes It Worth Paying For)

### 18. Grant Writer AI Assistant
**Exists:** Writer components (`writing-assistant.tsx`, `section-editor.tsx`, `source-attribution-panel.tsx`), tRPC `writing` router, AI generation with RAG.
**Gap:** No section-by-section guided writing flow. The section definitions exist but the UX to walk users through a complete proposal is missing.
**Opportunity:** Build a "wizard" mode that walks through each RFP section, pulls relevant org memory via RAG, drafts with Claude, shows sources, and lets users refine. This is the killer feature.

### 19. Funder Intelligence / 990 Sync
**Exists:** `syncFunder990` Inngest function, ProPublica service, PastGrantee model, funder detail page.
**Gap:** The funder page "Set Alert" and "Add to Pipeline" buttons are TODO (lines 282, 304). No automatic funder matching.
**Opportunity:** Auto-match new funders to org profile. Alert when a funder's giving patterns change. Show peer grantee analysis.

### 20. Compliance Engine Deepening
**Exists:** Commitment extraction, conflict detection, severity scoring, resolution workflow.
**Gap:** Only runs as a nightly cron. No real-time detection on document upload. No compliance dashboard rollup.
**Opportunity:** Trigger conflict detection immediately when a new award letter is processed. Build a compliance score per grant and per org.

### 21. Webhook / Extension Ecosystem
**Exists:** Full webhook delivery system with retries, API key management, scope-based auth.
**Gap:** No actual webhook consumers or documented integration patterns.
**Opportunity:** Document the webhook events, build a Chrome extension for grant researchers, create Zapier/Make integration guides.

---

## Suggested Implementation Order

**Week 1 (Stabilize):**
1. Remove `ignoreBuildErrors`, fix type errors
2. Wire voice modal to existing backend
3. Wire fit score card to existing mutation
4. Connect conflict detection to compliance alerts
5. Fix Inngest connectivity

**Week 2 (Dashboard & Core UX):**
6. Build ActivityLog model + activity feed
7. Implement AI insights with real data
8. Real sparkline/trend calculations
9. Pipeline drag-and-drop + team members
10. Calendar event CRUD

**Week 3 (Features):**
11. Report generation (Executive + Pipeline PDFs)
12. Integration settings wired to real API keys
13. Onboarding document upload
14. Product tour overlay

**Week 4 (Differentiation):**
15. Grant writer wizard flow
16. Real-time compliance detection on upload
17. REST API endpoints
18. Test coverage for critical paths

---

## Architecture Notes

- **Rate limiter** (`src/server/api/middleware/rate-limit.ts`) uses in-memory Map. Fine for single-instance but will not work behind a load balancer. TODO comment says "Redis" and that is correct for production scale.
- **Prisma connection pooling** should use PgBouncer or Prisma Accelerate for Vercel serverless. The `DIRECT_URL` in `.env.example` suggests this is planned but verify it is configured.
- **Vector search costs**: Pinecone queries on every AI generation. Monitor usage and consider caching frequent queries.
- **Claude model versions**: Codebase references `claude-sonnet-4-20250514` in multiple services. Pin versions and test before upgrading.
