import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessagesClient from "@/components/messages/MessagesClient";
import type { Message, UserProfile } from "@/types/message";

export const metadata = { title: "Messages | Alignment Retreats" };

interface MessagesPageProps {
  searchParams: Promise<{ to?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { to } = await searchParams;

  // Fetch all messages for this user
  const { data: rawMessages } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  const msgs = (rawMessages || []) as Record<string, unknown>[];

  // Collect all unique user IDs
  const userIds = [...new Set(msgs.flatMap((m) => [m.sender_id as string, m.recipient_id as string]))];
  if (to && !userIds.includes(to)) userIds.push(to);

  // Fetch profiles
  const profileMap = new Map<string, UserProfile>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.rpc("get_public_profiles", {
      profile_ids: userIds,
    });
    if (profiles) {
      for (const p of profiles as Record<string, unknown>[]) {
        profileMap.set(p.id as string, {
          id: p.id as string,
          name: (p.name as string) || null,
          profile_photo: (p.profile_photo as string) || null,
        });
      }
    }
  }

  // Enrich messages with profile info
  const initialMessages: Message[] = msgs.map((m) => {
    const sender = profileMap.get(m.sender_id as string);
    const recipient = profileMap.get(m.recipient_id as string);
    return {
      id: m.id as string,
      sender_id: m.sender_id as string,
      recipient_id: m.recipient_id as string,
      retreat_id: (m.retreat_id as string) || null,
      subject: (m.subject as string) || "",
      body: (m.body as string) || "",
      message_type: (m.message_type as string) || "general",
      read: (m.read as boolean) || false,
      created_at: m.created_at as string,
      sender_name: sender?.name || null,
      sender_photo: sender?.profile_photo || null,
      recipient_name: recipient?.name || null,
      recipient_photo: recipient?.profile_photo || null,
    };
  });

  const toUser = to ? (profileMap.get(to) ?? null) : null;

  return (
    <MessagesClient
      initialMessages={initialMessages}
      currentUserId={user.id}
      toUser={toUser}
    />
  );
}
