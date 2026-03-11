"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function sendMessage(
  recipientId: string,
  subject: string,
  body: string,
  messageType: "general" | "booking_inquiry" | "collaboration" = "general",
  retreatId?: string | null
): Promise<{ id: string } | { error: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  if (!recipientId) return { error: "Recipient required" };
  if (!body.trim()) return { error: "Message body required" };
  if (!subject.trim()) return { error: "Subject required" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: userId,
      recipient_id: recipientId,
      subject: subject.trim(),
      body: body.trim(),
      message_type: messageType,
      retreat_id: retreatId || null,
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/account/messages");
  return { id: (data as { id: string }).id };
}

export async function markMessagesRead(
  messageIds: string[]
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  if (!messageIds.length) return { error: null };

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .update({ read: true } as never)
    .in("id", messageIds)
    .eq("recipient_id", userId);

  if (error) return { error: error.message };
  revalidatePath("/account/messages");
  return { error: null };
}

export async function deleteMessage(
  messageId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

  if (error) return { error: error.message };
  revalidatePath("/account/messages");
  return { error: null };
}

export async function deleteConversationForMe(
  otherUserId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const supabase = await createClient();

  const [r1, r2] = await Promise.all([
    supabase
      .from("messages")
      .update({ deleted_for_sender: true } as never)
      .eq("sender_id", userId)
      .eq("recipient_id", otherUserId),
    supabase
      .from("messages")
      .update({ deleted_for_recipient: true } as never)
      .eq("sender_id", otherUserId)
      .eq("recipient_id", userId),
  ]);

  if (r1.error) return { error: r1.error.message };
  if (r2.error) return { error: r2.error.message };
  revalidatePath("/account/messages");
  return { error: null };
}

export async function deleteConversationForEveryone(
  otherUserId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const supabase = await createClient();

  const [r1, r2] = await Promise.all([
    supabase
      .from("messages")
      .delete()
      .eq("sender_id", userId)
      .eq("recipient_id", otherUserId),
    supabase
      .from("messages")
      .delete()
      .eq("sender_id", otherUserId)
      .eq("recipient_id", userId),
  ]);

  if (r1.error) return { error: r1.error.message };
  if (r2.error) return { error: r2.error.message };
  revalidatePath("/account/messages");
  return { error: null };
}
