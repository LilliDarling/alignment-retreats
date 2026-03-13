# Engineering Roadmap — Alignment Retreats

> **Last updated:** 2026-03-13
> **Canonical version:** ClickUp (this file is the dev reference copy)

---

## Vision

Build a two-sided marketplace that connects retreat hosts with venue owners and service providers (chefs, cohosts, staff), handling the full lifecycle from listing through booking, team assembly, and payments.

---

## What We've Shipped (Foundation)

These are live and functional today:

| Area | What's Built |
|------|-------------|
| **Auth & Profiles** | Supabase Auth, multi-role profiles (host, landowner, cohost, staff, attendee, admin), profile slugs, public profile pages |
| **Retreat CRUD** | Create, edit, draft/submit-for-review flow, retreat slugs, gallery, main image, looking_for roles |
| **Venue CRUD** | Create, edit, draft/submit-for-review flow, property types, amenities, features, photo/video uploads |
| **Admin Panel** | Approve/reject retreats and venues, manage team costs, pricing calculator, contact submission management |
| **Dashboard** | Multi-role dashboard with Host, Venue (landowner), Cohost, Staff, and Attendee tabs |
| **Public Pages** | Retreat browse + detail, venue browse + detail, host profiles, about, contact, legal pages |
| **Messaging** | Direct messaging system with message deletion |
| **Storage** | Supabase buckets for retreat-photos, venue-photos, profile-photos, portfolio-media |
| **Email** | Resend integration via Supabase Edge Functions — welcome email, booking confirmation, retreat submission notification, profile completion, verification resend, re-engagement |
| **Contact** | Public contact form with status tracking |
| **Payments & Booking** | Stripe Checkout integration (BookingSidebar), Stripe Connect onboarding for hosts, webhook handler (checkout.session.completed, account.updated, transfer events), escrow accounts, scheduled payouts (50% deposit / 50% final), payout calculation RPC (`get_payout_breakdown`), capacity enforcement with row-level locking, donation support, admin payout management edge functions, booking confirmation emails |
| **Search & Discovery** | HeroSearchBar, RetreatFilters (category, location, dates), CategoryBrowse, WorldMap with geocoding, retreat SEO metadata (generateMetadata) |
| **Infra** | Next.js 15 App Router, Supabase (Postgres + Auth + Storage), Tailwind CSS 4, Cloudflare Workers deployment |

---

## Q1/Q2 2026 Priorities (Current)

These are the highest-impact items we're focused on right now. Ordered by priority.

### 1. Team Application Flow
**Why it matters:** This is the core marketplace mechanic — without it, hosts can't find team members and service providers can't find gigs.

- [ ] `/opportunities` page — browse approved retreats with open roles
- [ ] `TeamApplyDialog` — apply for a role with fee proposal + pitch
- [ ] Host review UI — accept/reject applications from dashboard
- [ ] `StaffTab` real data — applicants can track their applications
- [ ] Counter-offer / fee negotiation between host and applicant

> See [TEAM_APPLICATION_FLOW.md](./TEAM_APPLICATION_FLOW.md) for the full implementation plan.

### 2. Payments — Remaining UI & Activation
**Why it matters:** The backend payment infrastructure is fully built (Stripe Checkout, webhooks, escrow, Connect, scheduled payouts, donations). What's left is wiring up the UI and going live.

- [ ] Stripe Connect onboarding UI in host dashboard (edge function exists, no button/page)
- [ ] Payout status display for hosts (data exists, no component)
- [ ] Admin payout management dashboard (edge functions exist, no UI)
- [ ] Payment history view for attendees
- [ ] Refund / cancellation handling (schema supports it, no endpoint or UI)
- [ ] Donation page (edge function exists, no public UI)
- [ ] Alternative payment methods — Klarna (buy now/pay later), Apple Pay, Google Pay via Stripe Checkout payment method configuration

### 3. Email Notifications — Remaining
**Why it matters:** Users need to know when things happen without checking the dashboard constantly. Resend is already integrated for transactional emails, and Mailchimp is integrated for marketing. The `mailchimp-subscribe` edge function + `newsletter_opt_in` field already exist.

**Transactional (Resend)** — triggered by user actions, one-to-one:
- [ ] Application submitted → notify host (needs edge function)
- [ ] Application accepted/rejected → notify applicant (needs edge function)
- [ ] Retreat approved by admin → notify host (needs edge function)
- [ ] Email template design / branding pass across all existing transactional emails

**Marketing (Mailchimp)** — campaigns, newsletters, bulk sends:
- [ ] Newsletter campaigns for subscribers (newsletter_opt_in users)
- [ ] New retreat announcements / featured retreats
- [ ] Re-engagement campaigns (Mailchimp automations, replacing current Resend edge function)
- [ ] Audience segmentation (hosts vs. attendees vs. service providers)

### 4. Search & Discovery — Remaining
**Why it matters:** Core search is built (HeroSearchBar, RetreatFilters, CategoryBrowse, WorldMap with geocoding, retreat SEO metadata). What's left is venue-side search and refinements.

- [ ] Venue search with filters (property type, capacity, amenities)
- [ ] Venue SEO metadata (generateMetadata on venue pages)

---

## Q3 2026 Initiatives (Next Quarter)

These are planned but not yet in active development. Scope may shift based on Q2 learnings.

### Reviews & Trust
- Host and venue reviews from attendees
- Service provider ratings from hosts
- Verified profile badges

### Advanced Hosting Tools
- Retreat duplication / templates
- Multi-session retreat support
- Waitlist management for sold-out retreats
- Automated pricing suggestions based on costs

### Attendee Experience
- Attendee profiles and preferences
- Past retreat history
- Recommended retreats based on interests

### Analytics & Reporting
- Host dashboard analytics (views, bookings, revenue)
- Venue owner analytics (inquiries, bookings)
- Admin reporting (platform-wide metrics)

---

## Icebox

Ideas we've discussed or are thought of but aren't planning to build soon. These live here so we don't lose them and can promote them when the time is right.

| Idea | Notes |
|------|-------|
| **Mobile app** | Evaluate after web is stable and user patterns are clear |
| **Calendar sync** | iCal/Google Calendar integration for retreat dates |
| **Vendor marketplace** | Expand beyond retreat team roles to general vendor services |
| **Community features** | Forums, groups, post-retreat alumni connections |
| **Multi-language support** | i18n — depends on target market expansion |
| **Affiliate / referral program** | Incentivize hosts and attendees to bring others to the platform |
| **Insurance integration** | Partner with travel/event insurance providers |
| **API for partners** | Public API for third-party integrations |

---

## How to Read This Document

- **Q1/Q2 Priorities** = what engineers are actively building. If you're picking up work, start here.
- **Q3 Initiatives** = what we're designing and scoping. Input welcome.
- **Icebox** = ideas with potential but no timeline. Promote to a quarter when there's a business case.

This document is reviewed and updated at the start of each quarter. Day-to-day task tracking lives in ClickUp.
