# Team Application Flow — Implementation Plan

This document describes the public-facing team application system that allows users to browse retreat opportunities, apply for roles, and get confirmed by hosts or admins.

## Current State (What Exists)

### Database
- `retreat_team` table with: retreat_id, user_id, role, fee_type, fee_amount, description, agreed, agreed_at, stripe_account_id
- `team_member_role` enum: host, cohost, venue, chef, staff, other
- RLS policies for team member inserts (applications) and deletes (withdrawals)
- `looking_for` JSONB column on retreats: `{ needs: ["cohost", "chef", ...], notes: { cohost: "...", chef: "..." } }`

### Admin Side (Implemented)
- Admin can manually add/remove team costs per retreat in the Approved tab
- Admin can confirm pending team members (toggle agreed status)
- Pricing calculator shows all costs and calculates ticket price

### Missing (To Build)
Everything on the user-facing side.

---

## Phase 1: Browse Opportunities

### Page: `/opportunities`

A public page (or authenticated-only) that lists approved retreats with unfilled roles.

**Query: `getOpenOpportunities()`**
```ts
// lib/queries/team.ts
// Fetch retreats with status "approved" that have unfilled looking_for roles
// Join with profiles for host info
// Filter out roles that already have an agreed team member
// Return: retreat title, dates, location, host name, open roles with notes
```

**UI:**
- Card grid showing each retreat with open roles
- Filter by role type (chef, cohost, etc.)
- Each card shows: retreat name, dates, location, host, list of open roles
- Click a role to open the application dialog

---

## Phase 2: Apply for a Role

### Component: `TeamApplyDialog`

A modal/dialog that lets a user apply for a specific role on a retreat.

**Fields:**
- Role (pre-selected from the card they clicked)
- Fee type: flat, per_person, per_night, per_person_per_night, percentage
- Fee amount: what they want to charge
- Description: brief pitch / relevant experience
- (Optional) Link to portfolio / past work

**Server Action: `applyForRole()`**
```ts
// lib/actions/team.ts
export async function applyForRole(data: {
  retreatId: string;
  role: string;
  feeType: string;
  feeAmount: number;
  description?: string;
}): Promise<{ error: string | null }> {
  // 1. Verify user is authenticated
  // 2. Check retreat exists and is in "approved" status
  // 3. Check role is in retreat's looking_for.needs
  // 4. Check no existing application from this user for this role
  // 5. Insert into retreat_team with agreed=false
  // 6. (Optional) Send notification to host
}
```

**RLS Note:** The migration `20260215_retreat_team_applications.sql` already has INSERT policy for authenticated users with agreed=false.

---

## Phase 3: Host Reviews Applications

### Dashboard Tab: Host's "My Retreats" → Team tab

When a host views their approved retreat, they should see:
- List of applications per role
- Each application shows: applicant name, fee proposal, description
- Actions: Accept / Reject

**Server Actions:**
```ts
// lib/actions/team.ts
export async function acceptApplication(teamMemberId: string) {
  // Set agreed=true, agreed_at=now()
  // Reject other applications for the same role (optional)
}

export async function rejectApplication(teamMemberId: string) {
  // Delete the row from retreat_team
}
```

**Host can also counter-offer:** Update the fee_amount/fee_type before accepting, then the applicant confirms.

---

## Phase 4: Applicant Dashboard

### Dashboard Tab: "My Applications" (StaffTab)

Replace the current placeholder StaffTab with real data.

**Query: `getMyApplications()`**
```ts
// Fetch retreat_team rows where user_id = current user
// Join with retreats for title, dates, status
// Show: role, fee, status (pending/agreed/rejected), retreat info
```

**UI:**
- List of applications with status badges
- Withdraw button for pending applications
- Upcoming confirmed roles
- Earnings summary (once payouts exist)

---

## Phase 5: Notifications

- Email host when someone applies for a role
- Email applicant when accepted/rejected
- Email admin when all roles are filled (ready to publish)

---

## Database Changes Needed

### New columns (optional)
- `retreat_team.applicant_message` — text field for the applicant's pitch
- `retreat_team.rejected_at` — timestamp, or just delete rejected rows

### New RLS policies
- Allow users to read their own applications
- Allow hosts to read all applications for their retreats
- Already exists: users can INSERT (apply) and DELETE (withdraw)

---

## File Structure

```
lib/
  queries/
    team.ts           — getOpenOpportunities, getMyApplications, getRetreatApplicants
  actions/
    team.ts           — applyForRole, acceptApplication, rejectApplication, withdrawApplication

components/
  retreats/
    TeamApplyDialog.tsx   — Application form modal
  dashboard/
    StaffTab.tsx          — Replace placeholder with real applications list

app/
  (main)/
    opportunities/
      page.tsx            — Browse open roles page
```

---

## Priority Order

1. **`/opportunities` page + applyForRole action** — users can discover and apply
2. **Host review UI** — hosts see and accept/reject applications
3. **StaffTab real data** — applicants track their applications
4. **Notifications** — email alerts for applications and decisions
5. **Counter-offers / negotiation** — fee negotiation between host and applicant
