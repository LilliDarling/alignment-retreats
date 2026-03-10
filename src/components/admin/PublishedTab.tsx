"use client";

import { useState } from "react";
import { Globe, Calendar, Users, DollarSign, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { unpublishRetreat } from "@/lib/actions/admin";
import type { PublishedRetreat } from "@/lib/queries/admin";

interface PublishedTabProps {
  retreats: PublishedRetreat[];
}

export default function PublishedTab({ retreats }: PublishedTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUnpublish(retreatId: string) {
    setLoading(true);
    const result = await unpublishRetreat(retreatId);
    setLoading(false);
    if (result.error) {
      alert(result.error);
    }
    setConfirmUnpublish(null);
  }

  if (retreats.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No published retreats</p>
        <p className="text-sm mt-1">Retreats will appear here once they are published from the Approved tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {retreats.map((retreat) => {
        const isExpanded = expandedId === retreat.id;
        const isConfirming = confirmUnpublish === retreat.id;

        return (
          <div
            key={retreat.id}
            className="bg-white rounded-[16px] border border-border overflow-hidden"
          >
            {/* Header row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : retreat.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-foreground truncate">
                    {retreat.title}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                    retreat.status === "full"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {retreat.status === "full" ? "Full" : "Live"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {retreat.host_name && (
                    <span>by {retreat.host_name}</span>
                  )}
                  {retreat.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(retreat.start_date).toLocaleDateString()} – {new Date(retreat.end_date).toLocaleDateString()}
                    </span>
                  )}
                  {retreat.custom_venue_name && (
                    <span>{retreat.custom_venue_name}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {retreat.ticket_price && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {retreat.ticket_price.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">per ticket</p>
                  </div>
                )}
                {retreat.expected_attendees && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {retreat.expected_attendees}
                    </p>
                    <p className="text-[10px] text-muted-foreground">expected</p>
                  </div>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-border px-5 py-4">
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider block mb-1">Type</span>
                    <span className="capitalize">{retreat.retreat_type.replace(/_/g, " ")}</span>
                  </div>
                  {retreat.max_attendees && (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider block mb-1">Max Capacity</span>
                      {retreat.max_attendees}
                    </div>
                  )}
                  {retreat.ticket_price && retreat.expected_attendees && (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider block mb-1">Projected Revenue</span>
                      ${(retreat.ticket_price * retreat.expected_attendees).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Unpublish */}
                {!isConfirming ? (
                  <button
                    onClick={() => setConfirmUnpublish(retreat.id)}
                    className="px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-[10px] hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    Unpublish Retreat
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-[10px]">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800 flex-1">
                      This will remove the retreat from public listings and send it back to pending review.
                    </p>
                    <button
                      onClick={() => handleUnpublish(retreat.id)}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm font-semibold text-white bg-amber-600 rounded-[8px] hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {loading ? "..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmUnpublish(null)}
                      className="px-3 py-1.5 text-sm font-semibold text-amber-700 border border-amber-300 rounded-[8px] hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
