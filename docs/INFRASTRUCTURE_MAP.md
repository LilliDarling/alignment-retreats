# Infrastructure Map

> **Last updated:** 2026-03-13

---

## Overview

Alignment Retreats runs on two primary cloud providers with no traditional VPCs or load balancers — both Cloudflare and Supabase are fully managed, serverless platforms.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INTERNET / USER                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       CLOUDFLARE (Edge Network)                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Cloudflare Workers                              │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────┐    ┌──────────────────────────────┐  │  │
│  │  │   OpenNext Adapter      │    │   Static Assets (ASSETS)     │  │  │
│  │  │   (.open-next/worker.js)│    │   (.open-next/assets/)       │  │  │
│  │  │                         │    │                              │  │  │
│  │  │  • Middleware            │    │  • JS bundles               │  │  │
│  │  │  • Server Components    │    │  • CSS                      │  │  │
│  │  │  • Server Actions       │    │  • Images                   │  │  │
│  │  │  • API Routes           │    │  • Fonts                    │  │  │
│  │  └────────────┬────────────┘    └──────────────────────────────┘  │  │
│  │               │                                                   │  │
│  └───────────────┼───────────────────────────────────────────────────┘  │
│                  │                                                       │
│  ┌───────────────┴───────────────────────────────────────────────────┐  │
│  │                    Cloudflare R2 (Object Storage)                  │  │
│  │                                                                   │  │
│  │  pub-fb209cd67e9a4a668e7d182d022f613a.r2.dev                      │  │
│  │  (Supplementary media storage)                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Observability: Logs enabled (100% sampling rate)                       │
│  Compatibility: nodejs_compat flag (Node.js APIs on Workers)            │
│  Compatibility date: 2026-01-29                                         │
│                                                                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ HTTPS (Supabase client SDK)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE (Backend-as-a-Service)                   │
│                       Project: zuonunnxuwdthkmvqfhg                     │
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │     Supabase Auth    │  │           PostgreSQL                     │ │
│  │                      │  │                                          │ │
│  │  • Email/password    │  │  27 tables, 9 enums, 2 views            │ │
│  │  • OAuth providers   │  │  Row-Level Security on all tables       │ │
│  │  • JWT sessions      │  │  Custom RPC functions                   │ │
│  │  • Cookie-based SSR  │  │  Database triggers (new user setup)     │ │
│  │                      │  │                                          │ │
│  └──────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │   Supabase Storage   │  │        Edge Functions (Deno)             │ │
│  │                      │  │                                          │ │
│  │  Buckets:            │  │  15+ functions:                          │ │
│  │  • retreat-photos    │  │  • Email notifications (Resend)          │ │
│  │  • venue-photos      │  │  • Stripe webhooks & payments            │ │
│  │  • profile-photos    │  │  • Stripe Connect onboarding             │ │
│  │  • portfolio-media   │  │  • Scheduled payout processing           │ │
│  │                      │  │  • Account deletion                      │ │
│  │  All public buckets  │  │  • Mailchimp subscription                │ │
│  │                      │  │  • Donation processing                   │ │
│  └──────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┼──────────────┐
                    │             │              │
                    ▼             ▼              ▼
            ┌────────────┐ ┌──────────┐  ┌─────────────┐
            │   Stripe   │ │  Resend  │  │  Mailchimp  │
            │            │ │          │  │             │
            │ • Connect  │ │ • Welcome│  │ • Newsletter│
            │ • Payments │ │ • Notifs │  │   signups   │
            │ • Webhooks │ │ • Verify │  │             │
            │ • Payouts  │ │          │  │             │
            └────────────┘ └──────────┘  └─────────────┘
```

---

## Component Details

### Cloudflare Workers

The application runtime. Next.js is compiled for Cloudflare Workers using the OpenNext adapter (`@opennextjs/cloudflare`).

| Setting | Value |
|---------|-------|
| **Project name** | `alignment-retreats` |
| **Entry point** | `.open-next/worker.js` |
| **Static assets** | `.open-next/assets/` via `ASSETS` binding |
| **Compatibility date** | 2026-01-29 |
| **Compatibility flags** | `nodejs_compat` |
| **Observability** | Logs at 100% sampling |

**Build pipeline:**
```
pnpm build:worker  →  opennextjs-cloudflare build  →  .open-next/
pnpm deploy        →  opennextjs-cloudflare deploy  →  Cloudflare Workers
pnpm preview       →  opennextjs-cloudflare preview →  Local preview
```

**No CI/CD pipeline** — deployment is manual via CLI.

### Cloudflare R2

Object storage used as a supplementary CDN for media. Referenced in the Content-Security-Policy media-src directive.

- Endpoint: `pub-fb209cd67e9a4a668e7d182d022f613a.r2.dev`

### Supabase

All backend services are consolidated in a single Supabase project.

| Service | Role |
|---------|------|
| **Auth** | User authentication (email/password, OAuth), JWT issuance, session management via `@supabase/ssr` |
| **PostgreSQL** | Primary database — 27 tables, RLS on all, custom functions, triggers |
| **Storage** | File uploads — 4 public buckets (retreat-photos, venue-photos, profile-photos, portfolio-media) |
| **Edge Functions** | Background processing — Deno-based serverless functions for webhooks, email, payments, scheduled jobs |
| **Realtime** | Available but not actively used (no subscriptions in codebase) |

### External Services

| Service | Purpose | Integration Point |
|---------|---------|-------------------|
| **Stripe** | Payments, Connect accounts, payouts | Edge Functions (`stripe-webhook`, `stripe-connect-onboard`, `process-booking-payment`, `process-scheduled-payouts`) |
| **Resend** | Transactional email | Edge Functions (`send-welcome-email`, `resend-verification-email`, notification functions) |
| **Mailchimp** | Newsletter / mailing list | Edge Function (`mailchimp-subscribe`) |

---

## Request Flow

### Page Load (Server-Rendered)
```
1. User requests page
2. Cloudflare edge routes to Workers
3. OpenNext adapter invokes Next.js runtime
4. Middleware refreshes Supabase session (cookie read/write)
5. Middleware checks auth + roles for protected routes
6. Server Component calls query function
7. Query function calls Supabase PostgreSQL via SDK
8. HTML rendered on Workers, sent to browser
9. Static assets served from ASSETS binding (Cloudflare edge-cached)
```

### Server Action (Mutation)
```
1. User submits form in browser
2. Next.js serializes form data, POSTs to Workers
3. Server Action authenticates via Supabase Auth
4. Action validates input, writes to PostgreSQL
5. revalidatePath() busts Next.js cache
6. Updated page re-renders and streams to browser
```

### Webhook (Stripe → Supabase)
```
1. Stripe event fires (payment, account update)
2. Stripe POSTs to Supabase Edge Function endpoint
3. Edge Function verifies webhook signature
4. Edge Function writes to PostgreSQL
5. Deduplication via processed_webhook_events table
```

### Scheduled Job (Payouts)
```
1. Cron triggers Supabase Edge Function (process-scheduled-payouts)
2. Edge Function queries scheduled_payouts table
3. Processes payouts via Stripe API
4. Updates payout status in PostgreSQL
```

---

## Security

### Network Security
- **No VPC / private networking** — both platforms are fully managed with built-in isolation
- **All traffic over HTTPS** — enforced by both Cloudflare and Supabase
- **Cloudflare DDoS protection** — automatic at the edge
- **Supabase connection pooling** — managed by Supabase (no direct DB exposure)

### Application Security
- **Content-Security-Policy** headers configured in `next.config.ts`
  - Script sources: `self`, `unsafe-inline`, Stripe JS
  - Media sources: R2 and Supabase Storage
  - Frame options: DENY
- **HSTS** with 2-year max-age
- **X-Content-Type-Options**: nosniff
- **Permissions-Policy**: camera, microphone, geolocation all disabled

### Auth Security
- **Row-Level Security (RLS)** on all database tables
- **Defense-in-depth**: Middleware → Server Actions → RLS (three layers)
- **Session cookies** managed by `@supabase/ssr` (httpOnly, secure)
- **Role-based access**: `user_roles` table checked at middleware and action level
- **Edge Function JWT verification**: Configurable per function (enabled for user-facing, disabled for webhooks)

### Secrets Management
- **Cloudflare**: Environment variables set via Wrangler / dashboard
- **Supabase**: Edge Function secrets set via CLI / dashboard
- **No `.env.example`** in repo (noted as a gap)

---

## Scaling Characteristics

| Layer | Scaling Model |
|-------|---------------|
| **Cloudflare Workers** | Auto-scaling at edge, 0 to millions of requests, no cold starts |
| **Supabase PostgreSQL** | Vertical scaling (upgrade plan), connection pooling via PgBouncer |
| **Supabase Storage** | Managed, scales with plan tier |
| **Supabase Edge Functions** | Auto-scaling Deno isolates, cold starts possible |
| **Stripe / Resend / Mailchimp** | External SaaS, scales independently |

---

## Known Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| No CI/CD pipeline | Manual deploys risk human error | Medium |
| No `.env.example` | New developers have to guess required vars | Low |
| No staging environment | Changes go directly to production | Medium |
| No database backups config documented | Relying on Supabase default backups | Low |
| Supabase Realtime unused | Messaging is request-based, no live updates | Low (future feature) |
