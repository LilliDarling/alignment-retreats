"use client";

import { useState } from "react";
import {
  Download,
  Users,
  Handshake,
  Home,
  Briefcase,
  Heart,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { exportMembersCSV } from "@/lib/actions/admin";

const EXPORT_GROUPS = [
  {
    title: "Collaborators",
    items: [
      { role: "host", label: "Hosts", icon: Users },
      { role: "cohost", label: "Co-Hosts", icon: Handshake },
      { role: "landowner", label: "Venue Partners", icon: Home },
      { role: "staff", label: "Staff", icon: Briefcase },
    ],
  },
  {
    title: "Attendees",
    items: [{ role: "attendee", label: "Attendees", icon: Heart }],
  },
];

export default function ExportsTab() {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (role?: string) => {
    const key = role || "all";
    setLoadingRole(key);
    setError(null);

    const result = await exportMembersCSV(role);

    if ("error" in result) {
      setError(result.error);
    } else {
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `members-${role || "all"}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setLoadingRole(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-semibold mb-1">
          Export Members
        </h2>
        <p className="text-sm text-muted-foreground">
          Download CSV exports segmented by role for CRM import.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {EXPORT_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardContent>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {group.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.role}
                    onClick={() => handleExport(item.role)}
                    disabled={loadingRole !== null}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Export as CSV
                      </p>
                    </div>
                    {loadingRole === item.role ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Download className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Export All */}
      <button
        onClick={() => handleExport()}
        disabled={loadingRole !== null}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer disabled:opacity-50"
      >
        {loadingRole === "all" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export All Members
      </button>
    </div>
  );
}
