"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  FileText,
  Home,
  Users,
  Download,
  CheckCircle,
  Globe,
  Inbox,
} from "lucide-react";
import type { AdminDashboardData } from "@/lib/queries/admin";
import SubmissionsTab from "@/components/admin/SubmissionsTab";
import PropertiesTab from "@/components/admin/PropertiesTab";
import MembersTab from "@/components/admin/MembersTab";
import MetricsBar from "@/components/admin/MetricsBar";
import ExportsTab from "@/components/admin/ExportsTab";
import ApprovedTab from "@/components/admin/ApprovedTab";
import PublishedTab from "@/components/admin/PublishedTab";
import ContactSubmissionsTab from "@/components/admin/ContactSubmissionsTab";

interface AdminDashboardProps {
  data: AdminDashboardData;
}

const TABS = [
  { key: "submissions", label: "Submissions", icon: FileText },
  { key: "approved", label: "Approved", icon: CheckCircle },
  { key: "published", label: "Published", icon: Globe },
  { key: "properties", label: "Properties", icon: Home },
  { key: "contact", label: "Contact", icon: Inbox },
  { key: "members", label: "Members", icon: Users },
  { key: "exports", label: "Exports", icon: Download },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminDashboard({ data }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("submissions");

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/dashboard"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="sm:hidden">Admin</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Manage members, submissions, and analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Revenue Metrics Bar */}
        <MetricsBar metrics={data.metrics} />

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.key === "submissions"
                ? data.metrics.pendingSubmissions
                : tab.key === "approved"
                  ? data.metrics.approvedRetreats
                  : tab.key === "published"
                    ? data.metrics.publishedRetreats
                    : tab.key === "properties"
                      ? data.metrics.pendingProperties + data.metrics.publishedProperties
                      : tab.key === "contact"
                        ? data.metrics.contactSubmissions
                        : 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 sm:static sm:ml-1 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 ${
                    tab.key === "approved" ? "bg-primary" : tab.key === "published" ? "bg-green-500" : tab.key === "contact" ? "bg-amber-500" : "bg-red-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "submissions" && (
          <SubmissionsTab retreats={data.pendingRetreats} />
        )}
        {activeTab === "approved" && (
          <ApprovedTab retreats={data.approvedRetreats} members={data.members} />
        )}
        {activeTab === "published" && (
          <PublishedTab retreats={data.publishedRetreats} />
        )}
        {activeTab === "properties" && (
          <PropertiesTab properties={data.pendingProperties} publishedProperties={data.publishedProperties} />
        )}
        {activeTab === "contact" && (
          <ContactSubmissionsTab submissions={data.contactSubmissions} />
        )}
        {activeTab === "members" && <MembersTab members={data.members} />}
        {activeTab === "exports" && <ExportsTab />}
      </main>
    </>
  );
}
