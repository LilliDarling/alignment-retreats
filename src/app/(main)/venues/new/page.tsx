import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VenueForm from "@/components/venues/VenueForm";

export const metadata = {
  title: "List Your Property | Alignment Retreats",
};

export default async function NewVenuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify user has landowner role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "landowner");

  if (!roles || roles.length === 0) redirect("/dashboard");

  return <VenueForm mode="create" />;
}
