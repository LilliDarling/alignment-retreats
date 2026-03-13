# Alignment Retreats

A two-sided marketplace connecting retreat hosts with venue owners and service providers (chefs, cohosts, staff). Handles the full lifecycle from listing through booking, team assembly, and payments.

---

## Table of Contents

- [Setup Guide](#setup-guide)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Working with the Database](#working-with-the-database)
- [Deployment](#deployment)
- [Communication Norms](#communication-norms)
- [Further Reading](#further-reading)

---

## Setup Guide

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| **pnpm** | 9+ | `corepack enable && corepack prepare pnpm@latest --activate` |
| **Supabase CLI** | Latest | `pnpm add -g supabase` |
| **Wrangler** | 4+ | Included as a dev dependency |

### 1. Clone and Install

```bash
git clone git@github.com:LilliDarling/alignment-retreats.git
cd alignment-retreats
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root. Ask a team member for the current values.

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://zuonunnxuwdthkmvqfhg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ask-team>

# Used by Supabase CLI for local dev (optional)
VITE_SUPABASE_PROJECT_ID=zuonunnxuwdthkmvqfhg
```

**Do not commit `.env.local`.** It is already in `.gitignore`.

### 3. Run the Dev Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### 4. Supabase Local Development (Optional)

If you need to work on migrations or edge functions locally:

```bash
supabase start          # Starts local Supabase (requires Docker)
supabase db reset       # Applies all migrations from scratch
supabase functions serve # Runs edge functions locally
```

When using local Supabase, update your `.env.local` to point to `http://127.0.0.1:54321`.

### 5. Preview Cloudflare Workers Build

To test the production build locally (as it runs on Cloudflare):

```bash
pnpm build:worker    # Compiles Next.js for Cloudflare Workers
pnpm preview         # Runs the worker locally
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, signup, password reset
│   ├── (admin)/          # Admin panel (admin role required)
│   └── (main)/           # All public and authenticated routes
│       ├── dashboard/    # Multi-role dashboard
│       ├── host/         # Host retreat management
│       ├── venues/       # Venue browse, create, edit
│       ├── retreats/     # Retreat browse + detail
│       ├── profile/      # Public profile pages
│       ├── account/      # Account settings
│       ├── contact/      # Contact form
│       └── ...           # About, terms, privacy, etc.
│
├── components/           # All React components
│   ├── admin/            # Admin panel components
│   ├── dashboard/        # Dashboard tab components
│   ├── retreats/         # Retreat-related components
│   ├── venues/           # Venue-related components
│   ├── ui/               # Shared UI primitives (shadcn)
│   └── layout/           # Header, footer, navigation
│
├── lib/
│   ├── actions/          # Server Actions (mutations)
│   ├── queries/          # Server-side data fetching
│   ├── constants/        # Form options, enums, types
│   └── supabase/         # Supabase client setup (browser, server, middleware)
│
├── contexts/             # React context providers (AuthContext)
├── types/                # Shared TypeScript interfaces
└── middleware.ts          # Auth + role-based route protection

supabase/
├── config.toml           # Project config + edge function settings
├── migrations/           # SQL migrations (ordered by timestamp)
└── functions/            # Supabase Edge Functions (Deno)

docs/                     # Architecture and planning docs
```

### Key Conventions

- **`@/` path alias** maps to `./src/` (configured in `tsconfig.json`)
- **Route groups** use Next.js `(folder)` convention — `(main)`, `(auth)`, `(admin)` share different layouts
- **Server Actions** live in `lib/actions/`, not in component files
- **Queries** live in `lib/queries/` and are called from Server Components
- **Host and Venue are separate domains** — venue management is under `/venues/`, not `/host/venues/`

---

## Coding Standards

### TypeScript

- **Strict mode** is enabled (`"strict": true` in `tsconfig.json`)
- Use TypeScript for all new files — no plain `.js` files in `src/`
- Prefer explicit types for function parameters and return values in `lib/` files
- Use the generated Supabase types from `lib/supabase/types.ts` — don't manually define database types

### Linting

ESLint is configured with `eslint-config-next` (core web vitals + TypeScript rules).

```bash
pnpm lint              # Run ESLint
```

Fix all lint errors before opening a PR. The config lives in `eslint.config.mjs`.

### Styling

- **Tailwind CSS 4** for all styling
- Use `cn()` utility (from `lib/utils.ts`) for conditional class merging
- Component variants use `class-variance-authority` (CVA)
- UI primitives are shadcn-based — check `components/ui/` before building new components

### File and Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `VenueForm.tsx` |
| Server Actions | camelCase functions | `createRetreat()` |
| Query functions | camelCase with `get` prefix | `getRetreatBySlug()` |
| Route files | `page.tsx`, `layout.tsx` | Next.js convention |
| Constants | UPPER_SNAKE_CASE | `PROPERTY_TYPES` |
| Types/interfaces | PascalCase | `RetreatFormData` |

### Pull Requests

Follow this structure in your PR description:

```
## What

Brief description of the change.

## Why

Context / ticket link / motivation.

## How to Test

Steps to verify the change works.

## Screenshots

If there are UI changes, include before/after screenshots.
```

**PR expectations:**
- One logical change per PR — don't bundle unrelated fixes
- All lint checks must pass
- Self-review your diff before requesting review
- Tag the relevant person for review

### Testing

There is no automated test framework configured yet (see the [Engineering Roadmap](docs/ENGINEERING_ROADMAP.md)).

For now, manually verify before opening a PR:
- Test both authenticated and unauthenticated states for page changes
- Test role-specific behavior (host vs. landowner vs. admin) when applicable
- Test the Cloudflare Workers build (`pnpm build:worker && pnpm preview`) for changes that touch middleware or server-side logic

---

## Working with the Database

### Migrations

All schema changes go through migration files in `supabase/migrations/`. Never modify the production database directly.

```bash
# Create a new migration
supabase migration new <descriptive_name>

# Apply migrations locally
supabase db reset

# Push migrations to production (requires access)
supabase db push
```

**Migration naming:** `YYYYMMDDHHMMSS_descriptive_name.sql`

### Generated Types

After changing the database schema, regenerate the TypeScript types:

```bash
supabase gen types typescript --project-id zuonunnxuwdthkmvqfhg > src/lib/supabase/types.ts
```

### Row-Level Security

Every table has RLS enabled. When adding a new table:
1. Enable RLS: `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;`
2. Add appropriate policies (see existing migrations for patterns)
3. Test that unauthenticated users cannot access protected data

See [DATABASE_ERD.md](docs/DATABASE_ERD.md) for the full schema reference.

---

## Deployment

Deployment is manual via the Cloudflare CLI. There is no CI/CD pipeline yet.

```bash
pnpm build:worker    # Build for Cloudflare Workers
pnpm deploy          # Deploy to production
```

**Before deploying:**
- Ensure `pnpm lint` passes
- Test the worker build locally with `pnpm preview`
- If there are new migrations, run `supabase db push` first
- Coordinate with the team — there is no staging environment

See [INFRASTRUCTURE_MAP.md](docs/INFRASTRUCTURE_MAP.md) for the full infrastructure reference.

---

## Communication Norms

### When to Use Chat (WhatsApp/ClickUp)

- Quick questions that can be answered in a sentence or two
- Heads-up messages ("deploying in 10 minutes", "working on the venue form today")
- Debugging help — "has anyone seen this error before?"
- Social, team bonding, casual conversation
- Anything time-sensitive that needs a response within the hour

### When to Open a Ticket (ClickUp)

- Bug reports — include steps to reproduce, expected vs. actual behavior, screenshots
- Feature requests — describe the user problem, not just the solution
- Technical debt / refactoring proposals
- Anything that needs to be tracked, assigned, or prioritized
- Work that will take more than a quick fix (if it needs a branch, it needs a ticket)

### When to Write a Doc

- **ClickUp** for docs the whole company needs to see (roadmaps, processes, onboarding)
- **GitHub (`docs/`)** for technical docs that live with the code (architecture, ERDs, implementation plans)
- If you find yourself explaining the same thing in chat more than twice, write it down

### Code Review

- Tag the relevant reviewer when your PR is ready
- Reviewers should respond within one business day
- Use "Request Changes" for blocking issues, "Comment" for suggestions
- Approve and merge when satisfied — don't let PRs sit

---

## Further Reading

| Document | Location | Description |
|----------|----------|-------------|
| [Engineering Roadmap](docs/ENGINEERING_ROADMAP.md) | GitHub | Current quarter priorities + future initiatives |
| [Service Map](docs/SERVICE_MAP.md) | GitHub | How modules communicate |
| [Database ERD](docs/DATABASE_ERD.md) | GitHub | Full database schema + relationships |
| [Infrastructure Map](docs/INFRASTRUCTURE_MAP.md) | GitHub | Cloud architecture + deployment |
| [Team Application Flow](docs/TEAM_APPLICATION_FLOW.md) | GitHub | Implementation plan for team applications feature |
