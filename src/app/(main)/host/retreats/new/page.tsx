import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RetreatForm from "@/components/retreats/RetreatForm";

export const metadata = {
  title: "Create New Retreat | Alignment Retreats",
};

export default async function NewRetreatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify user has host role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "host");

  if (!roles || roles.length === 0) redirect("/dashboard");

  return <RetreatForm mode="create" />;
}
