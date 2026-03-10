import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Alignment Retreats",
  description: "Admin dashboard for managing retreats, properties, and members.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {children}
    </div>
  );
}
