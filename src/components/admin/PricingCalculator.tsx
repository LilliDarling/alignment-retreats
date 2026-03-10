"use client";

import { useState, useMemo } from "react";
import { DollarSign, Plus, X, Calculator, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

type FeeType =
  | "flat"
  | "per_person"
  | "per_night"
  | "per_person_per_night"
  | "percentage";

type TeamRole = "venue" | "cohost" | "chef" | "staff" | "other";

interface TeamCostRow {
  id: string;
  role: TeamRole;
  name: string;
  feeType: FeeType;
  amount: number;
}

interface PricingCalculatorProps {
  maxAttendees?: number | null;
  pricePerPerson?: number | null;
  nights?: number | null;
}

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  flat: "Flat",
  per_person: "Per Person",
  per_night: "Per Night",
  per_person_per_night: "Per Person/Night",
  percentage: "Percentage",
};

const ROLE_LABELS: Record<TeamRole, string> = {
  venue: "Venue",
  cohost: "Co-Host",
  chef: "Chef",
  staff: "Staff",
  other: "Other",
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function calculateFeeCost(
  row: TeamCostRow,
  attendees: number,
  nights: number,
  revenue: number
): number {
  switch (row.feeType) {
    case "flat":
      return row.amount;
    case "per_person":
      return row.amount * attendees;
    case "per_night":
      return row.amount * nights;
    case "per_person_per_night":
      return row.amount * attendees * nights;
    case "percentage":
      return (row.amount / 100) * revenue;
    default:
      return 0;
  }
}

export default function PricingCalculator({
  maxAttendees,
  pricePerPerson,
  nights: defaultNights,
}: PricingCalculatorProps) {
  const [attendees, setAttendees] = useState(maxAttendees ?? 10);
  const [nights, setNights] = useState(defaultNights ?? 3);
  const [price, setPrice] = useState(pricePerPerson ?? 0);
  const [teamCosts, setTeamCosts] = useState<TeamCostRow[]>([
    { id: generateId(), role: "venue", name: "", feeType: "flat", amount: 0 },
  ]);

  const revenue = price * attendees;

  const calculations = useMemo(() => {
    const costBreakdown = teamCosts.map((row) => ({
      ...row,
      cost: calculateFeeCost(row, attendees, nights, revenue),
    }));

    const totalCosts = costBreakdown.reduce((sum, r) => sum + r.cost, 0);
    const suggestedPrice =
      attendees > 0 ? Math.ceil((totalCosts * 1.3) / attendees) : 0;
    const breakevenAttendees =
      price > 0 ? Math.ceil(totalCosts / price) : Infinity;
    const profitLoss = revenue - totalCosts;

    return {
      costBreakdown,
      totalCosts,
      suggestedPrice,
      breakevenAttendees,
      profitLoss,
    };
  }, [teamCosts, attendees, nights, revenue, price]);

  function addRow() {
    setTeamCosts((prev) => [
      ...prev,
      { id: generateId(), role: "staff", name: "", feeType: "flat", amount: 0 },
    ]);
  }

  function removeRow(id: string) {
    setTeamCosts((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: string, updates: Partial<TeamCostRow>) {
    setTeamCosts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-display font-semibold">
            Pricing Calculator
          </h2>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Attendees
            </label>
            <input
              type="number"
              min={1}
              value={attendees}
              onChange={(e) => setAttendees(Number(e.target.value) || 1)}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Nights
            </label>
            <input
              type="number"
              min={1}
              value={nights}
              onChange={(e) => setNights(Number(e.target.value) || 1)}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Price per Person ($)
            </label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Team Costs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Team Costs</h3>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Member
            </button>
          </div>

          <div className="space-y-2">
            {teamCosts.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[100px_1fr_130px_100px_32px] gap-2 items-center"
              >
                <select
                  value={row.role}
                  onChange={(e) =>
                    updateRow(row.id, { role: e.target.value as TeamRole })
                  }
                  className="rounded-xl border border-border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Name"
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  className="rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                <select
                  value={row.feeType}
                  onChange={(e) =>
                    updateRow(row.id, { feeType: e.target.value as FeeType })
                  }
                  className="rounded-xl border border-border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(FEE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={0}
                  placeholder="$"
                  value={row.amount || ""}
                  onChange={(e) =>
                    updateRow(row.id, { amount: Number(e.target.value) || 0 })
                  }
                  className="rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {teamCosts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No team costs added yet.
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <ResultCard
            label="Total Costs"
            value={`$${calculations.totalCosts.toLocaleString()}`}
            variant="neutral"
          />
          <ResultCard
            label="Revenue"
            value={`$${revenue.toLocaleString()}`}
            variant="neutral"
          />
          <ResultCard
            label="Profit / Loss"
            value={`${calculations.profitLoss >= 0 ? "+" : ""}$${calculations.profitLoss.toLocaleString()}`}
            variant={calculations.profitLoss >= 0 ? "positive" : "negative"}
          />
          <ResultCard
            label="Breakeven"
            value={
              calculations.breakevenAttendees === Infinity
                ? "N/A"
                : `${calculations.breakevenAttendees} ppl`
            }
            variant="neutral"
          />
        </div>

        {/* Suggested Pricing */}
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Suggested Pricing</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            With a 30% margin over costs:
          </p>
          <p className="text-2xl font-bold text-primary">
            ${calculations.suggestedPrice.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              per person
            </span>
          </p>
        </div>

        {/* Breakdown */}
        {calculations.costBreakdown.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Cost Breakdown</h3>
            <div className="space-y-1.5">
              {calculations.costBreakdown.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {ROLE_LABELS[row.role]}
                    {row.name ? ` — ${row.name}` : ""}
                    <span className="text-xs ml-1 text-muted-foreground/70">
                      ({FEE_TYPE_LABELS[row.feeType]})
                    </span>
                  </span>
                  <span className="font-medium">
                    ${row.cost.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-border">
                <span>Total</span>
                <span>${calculations.totalCosts.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "positive" | "negative" | "neutral";
}) {
  const colorClasses = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-primary",
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <DollarSign className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className={`text-lg font-bold ${colorClasses[variant]}`}>
        {value}
      </div>
    </div>
  );
}
