"use client";

import { useState } from "react";
import {
  Search,
  Users,
  UserPlus,
  TrendingUp,
  Calendar,
  Shield,
  Home,
  Briefcase,
  Heart,
  Handshake,
  Mail,
  Crown,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toggleCoopMembership } from "@/lib/actions/admin";
import type { AdminMember } from "@/lib/queries/admin";

interface MembersTabProps {
  members: AdminMember[];
}

const roleColors: Record<string, string> = {
  host: "bg-primary/10 text-primary border-primary/20",
  cohost: "bg-primary/8 text-primary/80 border-primary/15",
  landowner: "bg-muted text-foreground border-border",
  staff: "bg-muted text-muted-foreground border-border",
  attendee: "bg-muted text-muted-foreground border-border",
  admin: "bg-red-50 text-red-600 border-red-200",
};

const roleIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  host: Users,
  cohost: Handshake,
  landowner: Home,
  staff: Briefcase,
  attendee: Heart,
  admin: Shield,
};

export default function MembersTab({ members }: MembersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(
    null
  );

  const filtered = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.roles.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: members.length,
    thisWeek: members.filter(
      (m) => m.created_at && new Date(m.created_at) > weekAgo
    ).length,
    thisMonth: members.filter(
      (m) => m.created_at && new Date(m.created_at) > monthAgo
    ).length,
    byRole: {
      host: members.filter((m) => m.roles.includes("host")).length,
      cohost: members.filter((m) => m.roles.includes("cohost")).length,
      landowner: members.filter((m) => m.roles.includes("landowner")).length,
      staff: members.filter((m) => m.roles.includes("staff")).length,
      attendee: members.filter((m) => m.roles.includes("attendee")).length,
    },
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={stats.total} />
        <StatCard
          icon={UserPlus}
          label="New This Week"
          value={stats.thisWeek}
          highlight
        />
        <StatCard
          icon={TrendingUp}
          label="New This Month"
          value={stats.thisMonth}
        />
        <StatCard
          icon={Calendar}
          label="Retreat Hosts"
          value={stats.byRole.host}
        />
      </div>

      {/* Role Breakdown */}
      <Card>
        <CardContent>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Members by Role
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(stats.byRole).map(([role, count]) => {
              const Icon = roleIcons[role] || Users;
              return (
                <button
                  key={role}
                  onClick={() => setSearchTerm(role)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${roleColors[role] || ""}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {role}s
                    </p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>All Members</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No members match your search."
                : "No members found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <td className="py-3 px-2 font-medium">
                        {member.name || "Unnamed"}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {member.email}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1">
                          {member.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${roleColors[role] || "bg-muted text-muted-foreground border-border"}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {member.created_at
                          ? new Date(member.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 100 && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  Showing first 100 of {filtered.length} members. Use search to
                  narrow results.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Detail Drawer */}
      {selectedMember && (
        <MemberDrawer
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p
          className={`text-2xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function MemberDrawer({
  member,
  onClose,
}: {
  member: AdminMember;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-border overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-semibold">
              Member Details
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {member.name
                ? member.name.charAt(0).toUpperCase()
                : member.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">
                {member.name || "Unnamed"}
              </h3>
              <a
                href={`mailto:${member.email}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                {member.email}
              </a>
            </div>
          </div>

          {/* Roles */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Roles
            </h4>
            <div className="flex flex-wrap gap-2">
              {member.roles.map((role) => {
                const Icon = roleIcons[role] || Users;
                return (
                  <span
                    key={role}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${roleColors[role] || ""}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="capitalize">{role}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Joined */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Joined
            </h4>
            <p className="text-sm">
              {member.created_at
                ? new Date(member.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unknown"}
            </p>
          </div>

          {/* User ID */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              User ID
            </h4>
            <p className="text-xs text-muted-foreground font-mono break-all">
              {member.id}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
