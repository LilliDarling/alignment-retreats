"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const userRoles = (roles || []).map((r) => (r as Record<string, unknown>).role as string);
  if (!userRoles.includes("admin")) return null;

  return user.id;
}

// ─── Retreat Actions ─────────────────────────────────────────────────

export async function approveRetreat(
  retreatId: string,
  adminNotes?: string
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("retreats")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      admin_notes: adminNotes || null,
    } as never)
    .eq("id", retreatId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

export async function rejectRetreat(
  retreatId: string,
  adminNotes?: string
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("retreats")
    .update({
      status: "cancelled",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      admin_notes: adminNotes || null,
    } as never)
    .eq("id", retreatId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

export async function publishRetreat(
  retreatId: string,
  pricing?: { ticketPrice: number; expectedAttendees: number }
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const updates: Record<string, unknown> = { status: "published" };
  if (pricing) {
    updates.ticket_price = pricing.ticketPrice;
    updates.expected_attendees = pricing.expectedAttendees;
  }
  const { error } = await supabase
    .from("retreats")
    .update(updates as never)
    .eq("id", retreatId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

export async function sendBackToPending(
  retreatId: string,
  adminNotes?: string
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("retreats")
    .update({
      status: "pending_review",
      admin_notes: adminNotes || null,
    } as never)
    .eq("id", retreatId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

export async function unpublishRetreat(
  retreatId: string
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("retreats")
    .update({ status: "pending_review" } as never)
    .eq("id", retreatId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

// ─── Property Actions ────────────────────────────────────────────────

export async function approveProperty(
  propertyId: string
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ status: "published" })
    .eq("id", propertyId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

export async function rejectProperty(
  propertyId: string,
  adminNotes?: string
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ status: "rejected", admin_notes: adminNotes || null } as never)
    .eq("id", propertyId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

export async function unpublishProperty(
  propertyId: string
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ status: "pending_review" } as never)
    .eq("id", propertyId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/venues");
  return { error: null };
}

// ─── Member Actions ──────────────────────────────────────────────────

export async function toggleHostVerification(
  userId: string,
  verified: boolean
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("hosts")
    .update({ verified })
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

export async function toggleCoopMembership(
  userId: string,
  isMember: boolean
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_coop_member: isMember })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

// ─── Team Management ────────────────────────────────────────────

const VALID_TEAM_ROLES = new Set([
  "host", "cohost", "venue", "chef", "staff", "other",
  "photographer", "yoga_instructor", "sound_healer", "massage",
]);
const VALID_FEE_TYPES = new Set([
  "flat", "per_person", "per_night", "per_person_per_night", "percentage",
]);
const MAX_FEE_AMOUNT = 1_000_000;

export async function addTeamCost(
  retreatId: string,
  data: {
    role: string;
    userId?: string;
    name: string;
    feeType: string;
    feeAmount: number;
    description?: string;
  }
): Promise<{ error: string | null; id?: string }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  if (!VALID_TEAM_ROLES.has(data.role)) return { error: "Invalid team role." };
  if (!VALID_FEE_TYPES.has(data.feeType)) return { error: "Invalid fee type." };
  if (!Number.isFinite(data.feeAmount) || data.feeAmount < 0 || data.feeAmount > MAX_FEE_AMOUNT)
    return { error: "Fee amount must be between 0 and 1,000,000." };

  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("retreat_team")
    .insert({
      retreat_id: retreatId,
      user_id: data.userId || adminId,
      role: data.role,
      fee_type: data.feeType,
      fee_amount: data.feeAmount,
      description: data.description || data.name || null,
      agreed: true,
      agreed_at: new Date().toISOString(),
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null, id: (row as Record<string, unknown>).id as string };
}

export async function updateTeamCost(
  teamMemberId: string,
  data: {
    feeType?: string;
    feeAmount?: number;
    description?: string;
    agreed?: boolean;
  }
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  if (data.feeType !== undefined && !VALID_FEE_TYPES.has(data.feeType))
    return { error: "Invalid fee type." };
  if (data.feeAmount !== undefined && (!Number.isFinite(data.feeAmount) || data.feeAmount < 0 || data.feeAmount > MAX_FEE_AMOUNT))
    return { error: "Fee amount must be between 0 and 1,000,000." };

  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (data.feeType !== undefined) updates.fee_type = data.feeType;
  if (data.feeAmount !== undefined) updates.fee_amount = data.feeAmount;
  if (data.description !== undefined) updates.description = data.description;
  if (data.agreed !== undefined) {
    updates.agreed = data.agreed;
    if (data.agreed) updates.agreed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("retreat_team")
    .update(updates as never)
    .eq("id", teamMemberId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

export async function removeTeamCost(
  teamMemberId: string
): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("retreat_team")
    .delete()
    .eq("id", teamMemberId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}

// ─── CSV Export ──────────────────────────────────────────────────────

export async function exportMembersCSV(
  roleFilter?: string
): Promise<{ csv: string } | { error: string }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Not authorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_all_profiles_admin");

  if (error || !data) return { error: error?.message || "Failed to fetch members" };

  let members = (data as Record<string, unknown>[]).map((p) => ({
    id: p.id as string,
    name: (p.name as string) || "",
    email: (p.email as string) || "",
    created_at: (p.created_at as string) || "",
    roles: (p.roles as string[]) || [],
  }));

  if (roleFilter) {
    members = members.filter((m) => m.roles.includes(roleFilter));
  }

  const headers = ["email", "full_name", "roles", "signup_date", "user_id"];
  const rows = members.map((m) => [
    m.email,
    m.name,
    m.roles.join(";"),
    m.created_at ? new Date(m.created_at).toISOString().split("T")[0] : "",
    m.id,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","))].join("\n");

  await supabase.from("admin_audit_log").insert({
    admin_user_id: adminId,
    action: "csv_export",
    resource_type: roleFilter ? `members:${roleFilter}` : "members:all",
    resource_count: members.length,
  });

  return { csv };
}
