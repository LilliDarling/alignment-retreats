"use client";

import { useState, useMemo } from "react";
import { Plus, X, Calculator, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

type TeamRole = "venue" | "cohost" | "chef" | "staff" | "other";

interface TeamCostRow {
  id: string;
  role: TeamRole;
  name: string;
  amount: number;
}

interface PricingCalculatorProps {
  pricePerPerson?: number | null;
}

const ROLE_LABELS: Record<TeamRole, string> = {
  venue: "Venue",
  cohost: "Co-Host",
  chef: "Chef",
  staff: "Staff",
  other: "Other",
};

const PLATFORM_FEE_RATE = 0.25;

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PricingCalculator({
  pricePerPerson,
}: PricingCalculatorProps) {
  const [hostRate, setHostRate] = useState(pricePerPerson ?? 0);
  const [teamCosts, setTeamCosts] = useState<TeamCostRow[]>([
    { id: generateId(), role: "venue", name: "", amount: 0 },
  ]);

  const calculations = useMemo(() => {
    const teamTotal = teamCosts.reduce((sum, r) => sum + r.amount, 0);
    const subtotal = hostRate + teamTotal;
    const platformFee = Math.ceil(subtotal * PLATFORM_FEE_RATE);
    const ticketPrice = subtotal + platformFee;

    return { hostRate, teamTotal, subtotal, platformFee, ticketPrice };
  }, [teamCosts, hostRate]);

  function addRow() {
    setTeamCosts((prev) => [
      ...prev,
      { id: generateId(), role: "staff", name: "", amount: 0 },
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

        <p className="text-sm text-muted-foreground mb-4">
          All charges are per person. The platform adds a 25% fee on top of the total.
        </p>

        {/* Host Rate */}
        <div className="mb-6">
          <label className="block text-sm text-muted-foreground mb-1">
            Host Rate (per person)
          </label>
          <input
            type="number"
            min={0}
            value={hostRate}
            onChange={(e) => setHostRate(Number(e.target.value) || 0)}
            className="w-full max-w-[200px] rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="$0"
          />
        </div>

        {/* Team Costs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Team Rates (per person)</h3>
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
                className="grid grid-cols-[100px_1fr_100px_32px] gap-2 items-center"
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

                <input
                  type="number"
                  min={0}
                  placeholder="$/person"
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

        {/* Breakdown */}
        <div className="space-y-1.5 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Host</span>
            <span className="font-medium">${calculations.hostRate.toLocaleString()}/person</span>
          </div>
          {teamCosts.filter(r => r.amount > 0).map((row) => (
            <div key={row.id} className="flex justify-between text-muted-foreground">
              <span>
                {ROLE_LABELS[row.role]}
                {row.name ? ` — ${row.name}` : ""}
              </span>
              <span>${row.amount.toLocaleString()}/person</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-medium">Subtotal</span>
            <span className="font-medium">${calculations.subtotal.toLocaleString()}/person</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Platform Fee (25%)</span>
            <span>${calculations.platformFee.toLocaleString()}/person</span>
          </div>
        </div>

        {/* Ticket Price */}
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Ticket Price</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            ${calculations.ticketPrice.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              per person
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
