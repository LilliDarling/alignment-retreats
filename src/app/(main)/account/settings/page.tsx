import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "@/components/account/SettingsClient";

export const metadata = {
  title: "Settings | Alignment Retreats",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account/settings");

  const [profileResult, rolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("show_in_directory, newsletter_opt_in")
      .eq("id", user.id)
      .single() as Promise<{ data: { show_in_directory: boolean; newsletter_opt_in: boolean } | null; error: unknown }>,
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roles = (rolesResult.data || []).map((r) => r.role as string);

  return (
    <SettingsClient
      user={{
        email: user.email!,
        createdAt: user.created_at,
        roles,
      }}
      initialSettings={{
        showInDirectory: profileResult.data?.show_in_directory ?? true,
        newsletterOptIn: profileResult.data?.newsletter_opt_in ?? false,
      }}
    />
  );
}
