import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminDashboardData } from "@/lib/queries/admin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin");

  // Verify admin role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const userRoles = (roles || []).map(
    (r) => (r as Record<string, unknown>).role as string
  );
  if (!userRoles.includes("admin")) redirect("/");

  const data = await getAdminDashboardData();

  return <AdminDashboard data={data} />;
}
