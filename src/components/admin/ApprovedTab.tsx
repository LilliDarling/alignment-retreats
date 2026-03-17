"use client";

import { useState } from "react";
import { parseLocalDate } from "@/lib/utils/format";
import {
  Check,
  Circle,
  Loader2,
  Send,
  Calendar,
  MapPin,
  Users,
  Handshake,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Undo2,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  publishRetreat,
  sendBackToPending,
  addTeamCost,
  updateTeamCost,
  removeTeamCost,
} from "@/lib/actions/admin";
import type { ApprovedRetreat, TeamMemberInfo, AdminMember } from "@/lib/queries/admin";

const ROLE_LABELS: Record<string, string> = {
  host: "Host",
  venue: "Venue / Location",
  cohost: "Co-Host",
  chef: "Chef / Catering",
  photographer: "Photographer / Videographer",
  yoga_instructor: "Yoga Instructor",
  sound_healer: "Sound Healer",
  massage: "Massage Therapist",
  staff: "Staff",
  other: "Other",
};

const FEE_TYPES = [
  { value: "per_person", label: "Per Person" },
] as const;

const PLATFORM_FEE_RATE = 0.25;

interface ApprovedTabProps {
  retreats: ApprovedRetreat[];
  members: AdminMember[];
}

export default function ApprovedTab({ retreats: initial, members }: ApprovedTabProps) {
  const [retreats, setRetreats] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    msg: string;
    type: "success" | "error";
  } | null>(null);

  if (retreats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Handshake className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No approved retreats</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Retreats will appear here once approved and ready for team building.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handlePublish = async (
    retreat: ApprovedRetreat,
    pricing: { ticketPrice: number; expectedAttendees: number }
  ) => {
    const unfilledRoles = (retreat.looking_for?.needs || []).filter(
      (need) =>
        !retreat.team_members.some((tm) => tm.role === need && tm.agreed)
    );

    if (unfilledRoles.length > 0) {
      const roleNames = unfilledRoles
        .map((r) => ROLE_LABELS[r] || r)
        .join(", ");
      if (
        !confirm(
          `This retreat still has unfilled roles: ${roleNames}.\n\nPublish anyway?`
        )
      ) {
        return;
      }
    }

    setLoading(retreat.id);
    setFeedback(null);
    const result = await publishRetreat(retreat.id, pricing);
    if (result.error) {
      setFeedback({ id: retreat.id, msg: result.error, type: "error" });
    } else {
      setRetreats((prev) => prev.filter((r) => r.id !== retreat.id));
      setFeedback({
        id: retreat.id,
        msg: "Retreat published successfully!",
        type: "success",
      });
    }
    setLoading(null);
  };

  const handleBackToPending = async (retreatId: string) => {
    if (!confirm("Send this retreat back to pending review?")) return;
    setLoading(retreatId);
    setFeedback(null);
    const result = await sendBackToPending(retreatId);
    if (result.error) {
      setFeedback({ id: retreatId, msg: result.error, type: "error" });
    } else {
      setRetreats((prev) => prev.filter((r) => r.id !== retreatId));
      setFeedback({
        id: retreatId,
        msg: "Retreat sent back to pending review.",
        type: "success",
      });
    }
    setLoading(null);
  };

  const handleTeamUpdate = (retreatId: string, newMembers: TeamMemberInfo[]) => {
    setRetreats((prev) =>
      prev.map((r) =>
        r.id === retreatId ? { ...r, team_members: newMembers } : r
      )
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {retreats.length} approved retreat{retreats.length !== 1 ? "s" : ""} in
        team building phase
      </p>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-sm ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {retreats.map((retreat) => (
        <ApprovedRetreatCard
          key={retreat.id}
          retreat={retreat}
          members={members}
          loading={loading}
          onPublish={handlePublish}
          onBackToPending={handleBackToPending}
          onTeamUpdate={handleTeamUpdate}
        />
      ))}
    </div>
  );
}

// ─── Add Cost Form ──────────────────────────────────────────────

interface CostFormData {
  role: string;
  userId: string;
  description: string;
  feeType: string;
  feeAmount: string;
}

function AddCostForm({
  retreatId,
  defaultRole,
  members,
  onAdded,
  onCancel,
}: {
  retreatId: string;
  defaultRole?: string;
  members: AdminMember[];
  onAdded: (member: TeamMemberInfo) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CostFormData>({
    role: defaultRole || "",
    userId: "",
    description: "",
    feeType: "flat",
    feeAmount: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMember = members.find((m) => m.id === form.userId);

  const handleSubmit = async () => {
    if (!form.role) return setError("Select a role");
    const amount = parseFloat(form.feeAmount);
    if (isNaN(amount) || amount < 0) return setError("Enter a valid amount");

    setSaving(true);
    setError(null);
    const result = await addTeamCost(retreatId, {
      role: form.role,
      userId: form.userId || undefined,
      name: selectedMember?.name || form.description || "",
      feeType: form.feeType,
      feeAmount: amount,
      description: form.description || undefined,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    onAdded({
      id: result.id!,
      user_id: form.userId || "",
      role: form.role,
      fee_type: form.feeType,
      fee_amount: amount,
      description: form.description || null,
      agreed: true,
      member_name: selectedMember?.name || null,
    });
    setSaving(false);
  };

  const inputClass =
    "rounded-lg border border-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="p-3 rounded-xl bg-muted/50 border border-primary/20 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Role */}
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className={inputClass}
          disabled={!!defaultRole}
        >
          <option value="">Role...</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Person (optional for venue/flat costs) */}
        <select
          value={form.userId}
          onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
          className={inputClass}
        >
          <option value="">No person (e.g. venue cost)</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.email}
              {m.roles.length > 0 ? ` (${m.roles.join(", ")})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Fee type */}
        <select
          value={form.feeType}
          onChange={(e) => setForm((f) => ({ ...f, feeType: e.target.value }))}
          className={inputClass}
        >
          {FEE_TYPES.map((ft) => (
            <option key={ft.value} value={ft.value}>
              {ft.label}
            </option>
          ))}
        </select>

        {/* Amount */}
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Amount ($)"
          value={form.feeAmount}
          onChange={(e) =>
            setForm((f) => ({ ...f, feeAmount: e.target.value }))
          }
          className={inputClass}
        />

        {/* Description */}
        <input
          type="text"
          placeholder="Notes (optional)"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          Add Cost
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Retreat Card ───────────────────────────────────────────────

function ApprovedRetreatCard({
  retreat,
  members,
  loading,
  onPublish,
  onBackToPending,
  onTeamUpdate,
}: {
  retreat: ApprovedRetreat;
  members: AdminMember[];
  loading: string | null;
  onPublish: (r: ApprovedRetreat, pricing: { ticketPrice: number; expectedAttendees: number }) => void;
  onBackToPending: (id: string) => void;
  onTeamUpdate: (retreatId: string, members: TeamMemberInfo[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState<string | null>(null); // role or "custom"
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const needs = retreat.looking_for?.needs || [];
  const filledCount = needs.filter((need) =>
    retreat.team_members.some((tm) => tm.role === need && tm.agreed)
  ).length;

  const maxAttendees = retreat.max_attendees || 20;
  const hostRate = retreat.price_per_person || 0;

  // All charges are per person — sum them up, add 25% platform fee
  const agreedMembers = retreat.team_members.filter((tm) => tm.agreed);
  const actualTeamCosts = agreedMembers.map((tm) => ({
    ...tm,
    cost: tm.fee_amount, // Everything is per person
  }));

  const unfilledNeeds = needs.filter(
    (need) => !retreat.team_members.some((tm) => tm.role === need && tm.agreed)
  );

  const totalTeamPerPerson = actualTeamCosts.reduce((sum, tc) => sum + tc.cost, 0);
  const subtotalPerPerson = hostRate + totalTeamPerPerson;
  const platformFee = Math.ceil(subtotalPerPerson * PLATFORM_FEE_RATE);
  const calculatedTicketPrice = subtotalPerPerson + platformFee;
  const allRolesFilled = unfilledNeeds.length === 0;

  // Extra team costs not tied to a looking_for need
  const extraTeamCosts = retreat.team_members.filter(
    (tm) => !needs.includes(tm.role) && tm.role !== "host"
  );

  const handleAddCost = (member: TeamMemberInfo) => {
    onTeamUpdate(retreat.id, [...retreat.team_members, member]);
    setShowAddForm(null);
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this cost?")) return;
    setActionLoading(memberId);
    const result = await removeTeamCost(memberId);
    if (!result.error) {
      onTeamUpdate(
        retreat.id,
        retreat.team_members.filter((tm) => tm.id !== memberId)
      );
    }
    setActionLoading(null);
  };

  const handleToggleAgreed = async (member: TeamMemberInfo) => {
    setActionLoading(member.id);
    const result = await updateTeamCost(member.id, { agreed: !member.agreed });
    if (!result.error) {
      onTeamUpdate(
        retreat.id,
        retreat.team_members.map((tm) =>
          tm.id === member.id ? { ...tm, agreed: !tm.agreed } : tm
        )
      );
    }
    setActionLoading(null);
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-4 p-4 sm:p-5 text-left cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {retreat.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              by {retreat.host_name || "Unknown Host"} · {retreat.retreat_type}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {needs.length > 0 && (
              <span
                className={`text-[11px] font-semibold ${
                  filledCount === needs.length
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {filledCount}/{needs.length} roles
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
              Approved
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-border px-5 py-5 space-y-5">
            {/* Key Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <DetailItem
                icon={Calendar}
                label="Dates"
                value={`${formatDate(retreat.start_date)} – ${formatDate(retreat.end_date)}`}
              />
              <DetailItem
                icon={MapPin}
                label="Location"
                value={retreat.custom_venue_name || "No venue"}
              />
              <DetailItem
                icon={Users}
                label="Max Capacity"
                value={maxAttendees.toString()}
              />
              <DetailItem
                icon={DollarSign}
                label="Host Rate"
                value={
                  hostRate > 0
                    ? `$${hostRate.toLocaleString()}/person`
                    : "Not set"
                }
              />
            </div>

            {/* Team Roles — with management */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Team & Costs</h4>
                <button
                  onClick={() =>
                    setShowAddForm(showAddForm === "custom" ? null : "custom")
                  }
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Cost
                </button>
              </div>

              <div className="space-y-2">
                {/* Roles from looking_for */}
                {needs.map((need) => {
                  const member = retreat.team_members.find(
                    (tm) => tm.role === need && tm.agreed
                  );
                  const pendingMember = !member
                    ? retreat.team_members.find(
                        (tm) => tm.role === need && !tm.agreed
                      )
                    : null;
                  const note = retreat.looking_for?.notes?.[need];

                  return (
                    <div key={need} className="space-y-2">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                        {member ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                            <Circle className="w-3 h-3 text-amber-500 fill-amber-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {ROLE_LABELS[need] || need}
                          </p>
                          {member && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {member.description || member.member_name || "—"} ·{" "}
                              ${member.fee_amount.toLocaleString()}/person
                            </p>
                          )}
                          {pendingMember && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              Pending: {pendingMember.member_name || "Unknown"}{" "}
                              (awaiting agreement)
                            </p>
                          )}
                          {!member && !pendingMember && (
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                              Unfilled
                            </p>
                          )}
                          {note && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Note: {note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {member && (
                            <>
                              <span className="text-xs font-medium text-muted-foreground mr-1">
                                ${member.fee_amount.toLocaleString()}/person
                              </span>
                              <button
                                onClick={() => handleRemove(member.id)}
                                disabled={actionLoading === member.id}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                {actionLoading === member.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </>
                          )}
                          {pendingMember && (
                            <button
                              onClick={() => handleToggleAgreed(pendingMember)}
                              disabled={actionLoading === pendingMember.id}
                              className="px-2 py-1 rounded-md text-[10px] font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {actionLoading === pendingMember.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Confirm"
                              )}
                            </button>
                          )}
                          {!member && !pendingMember && (
                            <button
                              onClick={() =>
                                setShowAddForm(
                                  showAddForm === need ? null : need
                                )
                              }
                              className="px-2 py-1 rounded-md text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              Set Cost
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline add form for this role */}
                      {showAddForm === need && (
                        <AddCostForm
                          retreatId={retreat.id}
                          defaultRole={need}
                          members={members}
                          onAdded={handleAddCost}
                          onCancel={() => setShowAddForm(null)}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Extra costs not from looking_for */}
                {extraTeamCosts.map((tm) => (
                  <div
                    key={tm.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <DollarSign className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {ROLE_LABELS[tm.role] || tm.role}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tm.description || tm.member_name || "—"} ·{" "}
                        ${tm.fee_amount.toLocaleString()}/person
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-medium text-muted-foreground mr-1">
                        ${tm.fee_amount.toLocaleString()}/person
                      </span>
                      {!tm.agreed && (
                        <button
                          onClick={() => handleToggleAgreed(tm)}
                          disabled={actionLoading === tm.id}
                          className="px-2 py-1 rounded-md text-[10px] font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === tm.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Confirm"
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(tm.id)}
                        disabled={actionLoading === tm.id}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        {actionLoading === tm.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Custom add form (not for a specific role) */}
                {showAddForm === "custom" && (
                  <AddCostForm
                    retreatId={retreat.id}
                    members={members}
                    onAdded={handleAddCost}
                    onCancel={() => setShowAddForm(null)}
                  />
                )}
              </div>
            </div>

            {/* Cost Calculator */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Pricing Calculator</h4>
              </div>

              {/* Calculated Ticket Price */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Ticket Price
                  {!allRolesFilled && (
                    <span className="text-amber-600 ml-1">
                      (estimate — unfilled roles)
                    </span>
                  )}
                </p>
                <p className="text-2xl font-bold text-primary">
                  ${calculatedTicketPrice.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    per person
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  ${subtotalPerPerson.toLocaleString()} subtotal + ${platformFee.toLocaleString()} platform fee (25%)
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Host</span>
                  <span className="font-medium">
                    ${hostRate.toLocaleString()}/person
                  </span>
                </div>

                {actualTeamCosts.map((tc) => (
                  <div
                    key={tc.id}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span>
                      {ROLE_LABELS[tc.role] || tc.role}
                      {tc.description ? ` — ${tc.description}` : tc.member_name ? ` — ${tc.member_name}` : ""}
                    </span>
                    <span>${tc.cost.toLocaleString()}/person</span>
                  </div>
                ))}

                {unfilledNeeds.map((need) => (
                  <div
                    key={need}
                    className="flex justify-between text-muted-foreground/50 italic"
                  >
                    <span>
                      {ROLE_LABELS[need] || need}
                      <span className="text-xs ml-1">(unfilled)</span>
                    </span>
                    <span>TBD</span>
                  </div>
                ))}

                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-medium">${subtotalPerPerson.toLocaleString()}/person</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Fee (25%)</span>
                  <span>${platformFee.toLocaleString()}/person</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-border font-semibold text-primary">
                  <span>Ticket Price</span>
                  <span>${calculatedTicketPrice.toLocaleString()}/person</span>
                </div>
              </div>

              {/* Warnings */}
              {hostRate === 0 && (
                <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Host has not set their rate. Ticket price only covers
                    team/venue costs + platform fee.
                  </p>
                </div>
              )}

              {!allRolesFilled && (
                <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    {unfilledNeeds.length} unfilled role
                    {unfilledNeeds.length !== 1 ? "s" : ""} — final ticket price
                    will change as costs are confirmed.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <button
                onClick={() => onPublish(retreat, { ticketPrice: calculatedTicketPrice, expectedAttendees: maxAttendees })}
                disabled={loading === retreat.id}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading === retreat.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Publish
              </button>
              <button
                onClick={() => onBackToPending(retreat.id)}
                disabled={loading === retreat.id}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
                Back to Pending
              </button>
              {needs.length > 0 && filledCount < needs.length && (
                <p className="text-xs text-amber-600 ml-auto">
                  {needs.length - filledCount} role
                  {needs.length - filledCount !== 1 ? "s" : ""} unfilled
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

