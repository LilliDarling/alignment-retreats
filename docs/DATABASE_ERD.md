# Database ERD — Entity Relationship Diagram

> **Last updated:** 2026-03-13
> **Source of truth:** `src/lib/supabase/types.ts` (auto-generated) + `supabase/migrations/`

---

## Visual Entity Relationships

```
                                    ┌──────────────┐
                                    │  auth.users   │
                                    │  (Supabase)   │
                                    └──────┬───────┘
                                           │ id
                    ┌──────────────────────┬┼──────────────────────────┐
                    │                      ││                          │
                    ▼                      ▼│                          ▼
             ┌────────────┐        ┌───────┴──────┐           ┌──────────────┐
             │ user_roles │        │   profiles   │           │    hosts     │
             │            │        │              │           │  cohosts     │
             │ user_id    │        │ id (=user)   │           │  staff_prof  │
             │ role (enum)│        │ name, bio    │           └──────────────┘
             └────────────┘        │ user_roles[] │
                                   └──────────────┘

         ┌─────────────────────────────────────────────────────────┐
         │                                                         │
         ▼                                                         ▼
  ┌──────────────┐                                         ┌──────────────┐
  │   retreats   │◄────────────────────────────────────────│  properties  │
  │              │  property_id (optional venue link)       │              │
  │ host_user_id │                                         │ owner_user_id│
  │ title, dates │                                         │ name, type   │
  │ status (enum)│                                         │ status       │
  └──────┬───────┘                                         └──────┬───────┘
         │                                                        │
    ┌────┼──────────┬──────────────┬──────────────┐               │
    │    │          │              │              │               │
    ▼    ▼          ▼              ▼              ▼               ▼
┌────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐  ┌─────────────────┐
│bookings│ │retreat_team│ │retreat_    │ │ messages │  │venue_inquiries  │
│        │ │            │ │waitlist    │ │          │  │                 │
│attendee│ │user_id     │ │user_id     │ │sender_id │  │inquirer_user_id │
│_user_id│ │role (enum) │ │position    │ │recipient │  │property_id      │
│retreat │ │fee_amount  │ │            │ │retreat_id│  │message, status  │
│_id     │ │fee_type    │ └────────────┘ └──────────┘  └─────────────────┘
└───┬────┘ │agreed      │
    │      └────────────┘
    │            │
    ▼            │
┌──────────────┐ │
│booking_      │ │
│payments      │ │
│              │ │
│stripe_*      │ │
│payment_status│ │
└───┬──────────┘ │
    │            │
    ▼            ▼
┌──────────────────┐
│ escrow_accounts  │
│                  │◄──────┐
│ total_amount     │       │
│ held/released    │  ┌────┴──────────┐
│ status (enum)    │  │scheduled_     │
└──────────────────┘  │payouts        │
                      │               │
                      │retreat_team_id│
                      │amount, date   │
                      │payout_status  │
                      └───────────────┘

  ┌───────────────────────────────────────────────────────┐
  │                     CHAT SYSTEM                       │
  │                                                       │
  │  ┌──────────────┐    ┌──────────────┐                 │
  │  │ chat_servers  │───▶│chat_channels │                 │
  │  │              │    │              │                 │
  │  │ retreat_id   │    │ server_id    │                 │
  │  │ created_by   │    │ name         │                 │
  │  └──────┬───────┘    └──────┬───────┘                 │
  │         │                   │                         │
  │         ▼                   ▼                         │
  │  ┌──────────────┐    ┌──────────────────┐             │
  │  │server_members│    │channel_messages  │             │
  │  │              │    │                  │             │
  │  │ server_id    │    │ channel_id       │             │
  │  │ user_id      │    │ user_id          │             │
  │  │ role (enum)  │    │ content          │             │
  │  └──────────────┘    └──────────────────┘             │
  └───────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────┐
  │                   STANDALONE TABLES                    │
  │                                                       │
  │  retreat_wishes        — attendee wishlist/matching    │
  │  contact_submissions   — public contact form entries   │
  │  admin_audit_log       — admin action tracking         │
  │  admin_notifications   — admin notification queue      │
  │  analytics_events      — page view / event tracking    │
  │  waitlist              — pre-launch email waitlist     │
  │  processed_webhook_    — Stripe webhook dedup          │
  │    events                                              │
  │  stripe_connected_     — Stripe Connect accounts       │
  │    accounts                                            │
  └───────────────────────────────────────────────────────┘
```

---

## Enums

| Enum | Values |
|------|--------|
| `app_role` | `host`, `cohost`, `landowner`, `staff`, `attendee`, `admin` |
| `property_type` | `land`, `retreat_center`, `venue` |
| `retreat_status` | `draft`, `pending_review`, `approved`, `published`, `full`, `completed`, `cancelled` |
| `team_member_role` | `host`, `cohost`, `venue`, `chef`, `staff`, `other` |
| `payment_status` | `pending`, `completed`, `refunded` |
| `payout_status` | `pending`, `scheduled`, `processing`, `completed`, `failed`, `cancelled` |
| `escrow_status` | `holding`, `partial_released`, `fully_released`, `refunded`, `disputed` |
| `server_role` | `owner`, `admin`, `member` |
| `stripe_account_status` | `pending`, `onboarding`, `active`, `restricted`, `disabled` |

---

## Table Details

### Core Identity

#### profiles
The central user record. One-to-one with `auth.users`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | FK → auth.users.id |
| `name` | text | |
| `bio` | text | Short bio |
| `about_me_html` | text | Rich text about section |
| `profile_photo` | text | Storage URL |
| `cover_photo` | text | Storage URL |
| `profile_completed` | boolean | |
| `user_roles` | text[] | Denormalized role list |
| `expertise_areas` | text[] | |
| `what_i_offer` | text | |
| `what_im_looking_for` | text | |
| `portfolio_photos` | text[] | Storage URLs |
| `portfolio_videos` | text[] | Storage URLs |
| `years_experience` | integer | |
| `location` | text | |
| `availability_status` | text | |
| `hourly_rate` / `daily_rate` | numeric | |
| `rate_currency` | text | Default 'CAD' |
| `instagram_handle` | text | |
| `tiktok_handle` | text | |
| `website_url` | text | |
| `verified` | boolean | |
| `certifications` | text[] | |
| `languages` | text[] | |
| `travel_willing` | boolean | |
| `theme_color` | text | Profile customization |
| `layout_style` | text | Profile customization |
| `show_in_directory` | boolean | |
| `newsletter_opt_in` | boolean | |
| `is_coop_member` | boolean | |
| `onboarding_completed` | json | Step tracking |

#### user_roles
Many-to-many: users can have multiple roles.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `user_id` | UUID | FK → auth.users.id |
| `role` | app_role | Enum |
| | | Unique: (user_id, role) |

#### Role-Specific Tables

**hosts**, **cohosts**, **staff_profiles** — each has `user_id` (unique FK → auth.users), plus role-specific fields (expertise, rates, availability, verification status). Created automatically on signup via `handle_new_user()` trigger.

---

### Retreats Domain

#### retreats

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `host_user_id` | UUID | FK → auth.users.id |
| `title` | text | |
| `description` | text | |
| `retreat_type` | text | e.g., yoga, meditation |
| `location` | text | Free text |
| `property_id` | UUID | FK → properties.id (optional) |
| `custom_venue_name` | text | If no linked property |
| `start_date` / `end_date` | text | |
| `max_attendees` | integer | |
| `price_per_person` | numeric | |
| `status` | retreat_status | Enum |
| `looking_for` | json | `{ needs: [...], notes: {...} }` |
| `main_image` | text | Storage URL |
| `gallery_images` / `gallery_videos` | text[] | Storage URLs |
| `slug` | text (unique) | URL-friendly identifier |
| `allow_donations` | boolean | |
| `admin_notes` | text | Internal notes |
| `reviewed_at` | timestamptz | |
| `reviewed_by` | UUID | |

#### retreat_team

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `retreat_id` | UUID | FK → retreats.id |
| `user_id` | UUID | |
| `role` | team_member_role | Enum |
| `fee_amount` | numeric | |
| `fee_type` | text | flat, per_person, per_night, per_person_per_night, percentage |
| `description` | text | |
| `stripe_account_id` | text | |
| `agreed` | boolean | Default false |
| `agreed_at` | timestamptz | |

#### retreat_waitlist

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `retreat_id` | UUID | FK → retreats.id |
| `user_id` | UUID | |
| `position` | integer | Queue position |
| `notified` | boolean | |

#### retreat_wishes
Attendee wishlists — what kind of retreat they're looking for. Can be matched to a retreat.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `user_id` | UUID | |
| `retreat_types` | text[] | |
| `budget_min` / `budget_max` | numeric | |
| `group_size` | integer | |
| `location_preferences` | text[] | |
| `desired_experiences` | text[] | |
| `matched_retreat_id` | UUID | FK → retreats.id (nullable) |
| `status` | text | |

---

### Venues Domain

#### properties

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `owner_user_id` | UUID | FK → auth.users.id |
| `name` | text | |
| `property_type` | property_type | Enum |
| `location` | text | |
| `capacity` | integer | |
| `amenities` | text[] | |
| `property_features` | text[] | |
| `description` | text | |
| `photos` / `videos` | text[] | Storage URLs |
| `contact_name` / `contact_email` | text | |
| `instagram_handle` / `tiktok_handle` | text | |
| `status` | text | draft, pending_review, published |
| `interested_in_residency` | boolean | |

#### venue_inquiries

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `property_id` | UUID | FK → properties.id |
| `inquirer_user_id` | UUID | FK → auth.users.id |
| `message` | text | |
| `preferred_dates` | text | |
| `guest_count` | integer | |
| `status` | text | Default 'pending' |

---

### Payments Domain

#### bookings

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `retreat_id` | UUID | FK → retreats.id |
| `attendee_user_id` | UUID | FK → auth.users.id |
| `booking_date` | timestamptz | |

#### booking_payments

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `booking_id` | UUID | FK → bookings.id (unique) |
| `amount_paid` | numeric | |
| `payment_status` | payment_status | Enum |
| `stripe_customer_id` | text | |
| `stripe_payment_id` | text | |
| `escrow_id` | UUID | FK → escrow_accounts.id |

#### escrow_accounts

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `booking_id` | UUID | FK → bookings.id (unique) |
| `total_amount` | numeric | |
| `held_amount` / `released_amount` / `refunded_amount` | numeric | |
| `platform_fee` | numeric | |
| `status` | escrow_status | Enum |
| `stripe_payment_intent_id` | text | |

#### scheduled_payouts

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `escrow_id` | UUID | FK → escrow_accounts.id |
| `recipient_user_id` | UUID | |
| `retreat_team_id` | UUID | FK → retreat_team.id (nullable) |
| `amount` | numeric | |
| `payout_type` | text | |
| `scheduled_date` | text | |
| `status` | payout_status | Enum |
| `stripe_transfer_id` | text | |

#### stripe_connected_accounts

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `user_id` | UUID | |
| `stripe_account_id` | text | |
| `account_status` | stripe_account_status | Enum |
| `charges_enabled` / `payouts_enabled` / `onboarding_complete` | boolean | |

---

### Communication

#### messages
Direct messages between users, optionally linked to a retreat.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `sender_id` / `recipient_id` | UUID | |
| `retreat_id` | UUID | FK → retreats.id (nullable) |
| `subject` / `body` | text | |
| `message_type` | text | |
| `read` | boolean | |
| `deleted_for_sender` / `deleted_for_recipient` | boolean | Soft delete |

#### Chat System (chat_servers → chat_channels → channel_messages + server_members)
Discord-like chat tied to retreats. Each retreat can have a chat server with channels and members.

---

### Admin & Platform

| Table | Purpose |
|-------|---------|
| `admin_audit_log` | Tracks admin actions (exports, approvals) |
| `admin_notifications` | Admin notification queue |
| `analytics_events` | Page views and custom events |
| `contact_submissions` | Public contact form entries |
| `waitlist` | Pre-launch email collection |
| `processed_webhook_events` | Stripe webhook deduplication |

---

## Database Views

| View | Purpose | Filter |
|------|---------|--------|
| `properties_public` | Public venue listings | `status = 'published'` |
| `retreats_public` | Public retreat listings | `status = 'published'` |

---

## Key Database Functions

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Trigger: creates profile + role + role-specific table on signup |
| `has_role(user_id, role)` | Check if user has a specific role (used in RLS) |
| `is_retreat_host(retreat_id, user_id)` | Ownership check (used in RLS) |
| `get_public_profile(id)` / `get_public_profiles(ids[])` | Public profile data via RPC |
| `calculate_retreat_team_fees(...)` | Compute team costs for pricing |
| `get_payout_breakdown(booking_id)` | Payout distribution calculation |
| `get_retreat_availability(ids[])` | Booking availability check |

---

## Row-Level Security (RLS)

All tables have RLS enabled. Key patterns:

- **Own data**: Users can read/update their own profiles, retreats, properties, bookings
- **Public data**: Published retreats and venues are readable by everyone (via views)
- **Host access**: Hosts can manage their retreat's team members and see applications
- **Admin override**: Admin role bypasses most restrictions
- **Team applications**: Authenticated users can INSERT into `retreat_team` with `agreed=false` (apply) and DELETE their own rows (withdraw)
