# Service Map — Module Communication

> **Last updated:** 2026-03-13

This document describes how the application's modules communicate. Alignment Retreats is a monolithic Next.js application — there are no microservices. Communication flows through well-defined layers within the app and out to external services.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        BROWSER                           │
│                                                          │
│  React Client Components ←→ AuthContext (session state)  │
│         │                                                │
│         │ form submissions / navigations                 │
└─────────┼────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKERS (Edge)                    │
│                                                          │
│  OpenNext Adapter → Next.js Runtime                      │
│         │                                                │
│         ▼                                                │
│  ┌─────────────┐                                         │
│  │ Middleware   │  Session refresh + role-based routing   │
│  └──────┬──────┘                                         │
│         ▼                                                │
│  ┌─────────────────────────────────────────────┐         │
│  │         Next.js App Router                   │         │
│  │                                              │         │
│  │  Server Components ──→ lib/queries/*         │         │
│  │  Server Actions    ──→ lib/actions/*         │         │
│  │                              │               │         │
│  └──────────────────────────────┼───────────────┘         │
│                                 │                         │
│  Static Assets ← Cloudflare ASSETS binding               │
└─────────────────────────────────┼─────────────────────────┘
                                  │
          ┌───────────────────────┼──────────────────────┐
          ▼                       ▼                      ▼
┌──────────────┐    ┌──────────────────┐    ┌────────────────┐
│  Supabase    │    │  Supabase Edge   │    │  External      │
│  PostgreSQL  │    │  Functions       │    │  Services      │
│  + Auth      │    │  (Deno runtime)  │    │                │
│  + Storage   │    │                  │    │  • Stripe      │
│              │    │  • Webhooks      │    │  • Resend      │
│              │    │  • Email notify  │    │  • Mailchimp   │
│              │    │  • Payments      │    │                │
└──────────────┘    └──────────────────┘    └────────────────┘
```

---

## Module Breakdown

### 1. Middleware Layer

**Files:** `src/middleware.ts` → `src/lib/supabase/middleware.ts`

Every request passes through middleware which:
1. Refreshes the Supabase session (cookie-based)
2. Enforces route protection:
   - `/host/*` → requires `host` or `admin` role
   - `/admin/*` → requires `admin` role
   - `/dashboard`, `/account/*` → requires authentication
3. Redirects unauthenticated users to `/login?redirect=<original_path>`
4. Redirects authenticated users away from `/login`, `/signup`

### 2. Server Actions (Mutations)

All mutations go through server actions (`"use server"` directive). Each action:
- Authenticates via `supabase.auth.getUser()`
- Re-verifies authorization (never trusts the client)
- Validates input
- Writes to Supabase
- Calls `revalidatePath()` to bust the Next.js cache

| Module | File | Key Functions |
|--------|------|---------------|
| **Retreats** | `lib/actions/retreat.ts` | `createRetreat`, `updateRetreat`, `submitRetreatForReview`, `deleteRetreat` |
| **Venues** | `lib/actions/venue.ts` | `createProperty`, `updateProperty`, `submitPropertyForReview`, `deleteProperty` |
| **Profiles** | `lib/actions/profile.ts` | `updateBasicInfo`, `updateProfessional`, `updateSocialLinks`, `updateAbout`, `updateRates`, `updatePortfolio`, `markProfileComplete` |
| **Admin** | `lib/actions/admin.ts` | `approveRetreat`, `rejectRetreat`, `publishRetreat`, `approveProperty`, `addTeamCost`, `updateTeamCost`, `toggleHostVerification`, `exportMembersCSV` |
| **Messages** | `lib/actions/messages.ts` | `sendMessage`, `markMessagesRead`, `deleteMessage`, `deleteConversationForMe`, `deleteConversationForEveryone` |
| **Contact** | `lib/actions/contact.ts` | `submitContactForm`, `submitSupportRequest`, `markContactSubmissionRead`, `markContactSubmissionResolved` |

### 3. Server Queries (Reads)

Server Components call query functions to fetch data. Parallel fetching (`Promise.all`) is used for dashboards.

| Module | File | Key Functions |
|--------|------|---------------|
| **Retreats & Venues** | `lib/queries/retreats.ts` | `getFeaturedRetreats`, `getRetreats`, `getRetreatBySlug`, `getVenues`, `getVenueById`, `getOwnProperty`, `getHeroSearchData`, `getMapRetreats`, `getRetreatTeamMembers` |
| **Dashboard** | `lib/queries/dashboard.ts` | `getDashboardData` (parallel: profile + roles + retreats + properties + bookings) |
| **Profile** | `lib/queries/profile.ts` | `getPublicProfile`, `getPublicProfileBySlug` |
| **Admin** | `lib/queries/admin.ts` | `getAdminDashboardData` (parallel: 8 queries — members, pending/approved/published retreats, pending/published properties, contact submissions, revenue metrics) |

### 4. Auth Context (Client-Side)

**File:** `src/contexts/AuthContext.tsx`

- Wraps the app with auth state (user, session, roles)
- Listens to `supabase.auth.onAuthStateChange()` for real-time session updates
- Fetches user roles from `user_roles` table on auth change
- Provides `signUp`, `signIn`, `signOut` methods to client components

### 5. Supabase Client Creation

| Context | File | Method |
|---------|------|--------|
| **Browser** | `lib/supabase/client.ts` | `createBrowserClient()` — uses `NEXT_PUBLIC_*` env vars |
| **Server** | `lib/supabase/server.ts` | `createClient()` — cookie-aware, used in Server Components and Actions |
| **Middleware** | `lib/supabase/middleware.ts` | `createServerClient()` — reads/writes cookies on request/response |

### 6. Supabase Edge Functions

Deno-based serverless functions running on Supabase infrastructure. These handle async/background work that doesn't belong in the request cycle.

| Function | Trigger | Purpose |
|----------|---------|---------|
| `send-welcome-email` | Internal (DB trigger) | Welcome email via Resend |
| `notify-new-member` | Internal | New member notification |
| `notify-retreat-submission` | Internal | Retreat submitted for review |
| `notify-profile-completed` | Internal | Profile completion notification |
| `notify-attendee-wish` | Internal | Attendee wish notification |
| `resend-verification-email` | Internal | Re-send email verification |
| `send-reengagement-email` | Internal | Re-engagement campaigns |
| `stripe-connect-onboard` | Authenticated API call | Stripe Connect onboarding flow |
| `process-booking-payment` | Webhook | Process booking payments |
| `stripe-webhook` | Stripe webhook | Handle Stripe events |
| `process-scheduled-payouts` | Scheduled (cron) | Execute scheduled payouts |
| `admin-process-payouts` | Authenticated API call | Admin-triggered payouts |
| `admin-list-payouts` | Authenticated API call | List payouts for admin |
| `delete-account` | Authenticated API call | Full account deletion |
| `mailchimp-subscribe` | Internal | Mailchimp list subscription |
| `process-donation` | API call | Process donations |

### 7. Supabase RPC Functions

Custom Postgres functions called via `supabase.rpc()`:

| Function | Called By | Purpose |
|----------|-----------|---------|
| `get_public_profile(id)` | Profile pages | Public profile data |
| `get_public_profile_by_slug(slug)` | Profile pages | Profile by vanity URL |
| `get_public_profiles(ids[])` | Retreat detail | Batch profile fetch |
| `get_all_profiles_admin()` | Admin dashboard | All profiles + roles + emails |
| `get_profile_email_admin(id)` | Admin member detail | Member email lookup |
| `has_role(user_id, role)` | RLS policies | Role check in SQL |
| `is_retreat_host(retreat_id, user_id)` | RLS policies | Host ownership check |
| `calculate_retreat_team_fees(...)` | Admin pricing | Fee calculations |
| `get_payout_breakdown(booking_id)` | Admin payouts | Payout distribution |
| `get_retreat_availability(ids[])` | Retreat browse | Booking availability |

---

## Data Flow Patterns

### Pattern A: Page Load
```
Browser → Cloudflare Worker → Middleware (auth check)
    → Server Component → Query Function → Supabase PostgreSQL
    → Render HTML → Browser
```

### Pattern B: Form Submission
```
Client Component (form) → Server Action → Auth check → Validate
    → Supabase Insert/Update → revalidatePath() → Re-render
```

### Pattern C: Background Processing
```
DB Trigger / Cron / Webhook → Supabase Edge Function
    → External Service (Resend, Stripe, Mailchimp)
```

### Pattern D: File Upload
```
Client Component → Supabase Storage (direct upload via signed URL)
    → URL stored in DB via Server Action
```

---

## Key Architectural Patterns

1. **Defense-in-depth authorization**: Middleware checks roles for routes, server actions re-check for mutations, RLS policies enforce at the database level
2. **Status workflows**: Retreats and venues follow `draft → pending_review → approved → published` with auto-downgrade on edit
3. **Parallel data fetching**: Dashboards use `Promise.all()` to load multiple queries concurrently
4. **Soft delete for messages**: `deleted_for_sender` / `deleted_for_recipient` flags; retreats and venues are hard-deleted
5. **Audit trail**: `admin_audit_log` tracks admin actions; no general-purpose change log
