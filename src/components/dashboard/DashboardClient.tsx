"use client";

import { useState } from "react";
import {
  Crown,
  Handshake,
  Home,
  Briefcase,
  Heart,
} from "lucide-react";
import { TabsList, TabPanel } from "@/components/ui/Tabs";
import SharedProfileSection from "./SharedProfileSection";
import SupportButton from "@/components/ui/SupportButton";
import HostTab from "./HostTab";
import CohostTab from "./CohostTab";
import VenueTab from "./VenueTab";
import StaffTab from "./StaffTab";
import AttendeeTab from "./AttendeeTab";
import type { getDashboardData } from "@/lib/queries/dashboard";
import type { AppRole } from "@/types/auth";

const roleLabels: Record<string, string> = {
  host: "Host",
  cohost: "Co-Host",
  landowner: "Venue",
  staff: "Staff",
  attendee: "Attendee",
};

const roleIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  host: Crown,
  cohost: Handshake,
  landowner: Home,
  staff: Briefcase,
  attendee: Heart,
};

const roleOrder: AppRole[] = ["host", "cohost", "staff", "landowner", "attendee"];

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

interface DashboardClientProps {
  data: DashboardData;
  userEmail: string;
}

export default function DashboardClient({
  data,
  userEmail,
}: DashboardClientProps) {
  const displayRoles = roleOrder.filter((r) => data.roles.includes(r));
  const [activeTab, setActiveTab] = useState(displayRoles[0] || "host");

  const tabs = displayRoles.map((role) => ({
    value: role,
    label: roleLabels[role] || role,
    icon: roleIcons[role],
  }));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      <SharedProfileSection
        profile={data.profile}
        roles={data.roles}
        userEmail={userEmail}
      />

      <div className="flex justify-end mb-4 -mt-2">
        <SupportButton variant="ghost" label="Get Support" />
      </div>

      {displayRoles.length > 0 && (
        <div className="space-y-6">
          <TabsList
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(v) => setActiveTab(v as AppRole)}
          />

          <TabPanel value="host" activeTab={activeTab}>
            <HostTab retreats={data.hostRetreats} />
          </TabPanel>

          <TabPanel value="cohost" activeTab={activeTab}>
            <CohostTab collaborations={data.cohostCollaborations} />
          </TabPanel>

          <TabPanel value="landowner" activeTab={activeTab}>
            <VenueTab properties={data.properties} />
          </TabPanel>

          <TabPanel value="staff" activeTab={activeTab}>
            <StaffTab />
          </TabPanel>

          <TabPanel value="attendee" activeTab={activeTab}>
            <AttendeeTab bookings={data.bookings} />
          </TabPanel>
        </div>
      )}
    </main>
  );
}
